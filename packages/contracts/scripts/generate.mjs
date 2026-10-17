/**
 * Writes the contracts' JSON Schemas and the OpenAPI components into
 * generated/, from the Zod sources (z.toJSONSchema):
 *
 *   <contract>.canonical.schema.json   what Windmill receives (ajv validates it there)
 *   <contract>.requests.schema.json    the wire schemas, under $defs by OpenAPI name
 *   openapi.components.json            components.schemas of src/openapi/v1.json
 *
 *   node packages/contracts/scripts/generate.mjs           write
 *   node packages/contracts/scripts/generate.mjs --check   fail if generated/ is stale (CI)
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod/v4";
import { CONTRACTS, openApiComponents } from "../src/index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "../generated");
const DIALECT = "https://json-schema.org/draft/2020-12/schema";

/** Without the per-schema $schema key (the documents carry one at the top). */
function strip(schema) {
  if (Array.isArray(schema)) return schema.map(strip);
  if (!schema || typeof schema !== "object") return schema;
  return Object.fromEntries(Object.entries(schema).filter(([k]) => k !== "$schema").map(([k, v]) => [k, strip(v)]));
}

const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

/**
 * Limits the routes enforce that the published spec has never listed.
 * Leaving them out keeps src/openapi/v1.json as it was (roadmap 1D: the
 * published contract does not change); publishing them is a separate,
 * owner-approved spec change.
 */
const UNPUBLISHED = {
  "AgentJobsRequest.properties.phone": ["minLength", "maxLength"],
  "AgentJobsSubmitRequest.properties.phone": ["minLength", "maxLength"],
  "AgentJobsSubmitRequest.properties.ticket": ["minLength", "maxLength"],
  "AgentJobsStartRequest.properties.files.items.properties.mime": ["minLength"],
};

/**
 * The published spec's own spelling of what Zod emits. Each rewrite says the
 * same thing in JSON Schema: a nullable `anyOf` as a type list, integer
 * bounds of ±2^53 dropped, `exclusiveMinimum: 0` on an integer as
 * `minimum: 1`, `additionalProperties: {}` as `true`, a pattern that only
 * spells out `format: email`, and maxItems equal to the size of a
 * uniqueItems enum.
 */
function publish(schema, path = "") {
  if (Array.isArray(schema)) return schema.map((s) => publish(s, path));
  if (!schema || typeof schema !== "object") return schema;
  let s = { ...schema };
  delete s.$id;
  const nullable = Array.isArray(s.anyOf) && s.anyOf.length === 2 && s.anyOf.findIndex((b) => b.type === "null" && Object.keys(b).length === 1);
  if (typeof nullable === "number" && nullable >= 0) {
    const other = s.anyOf[1 - nullable];
    if (typeof other.type === "string") {
      const rest = { ...s };
      delete rest.anyOf;
      s = { ...rest, ...other, type: [other.type, "null"], ...(other.enum ? { enum: [...other.enum, null] } : {}) };
    }
  }
  if (s.type === "integer") {
    if (s.maximum === Number.MAX_SAFE_INTEGER) delete s.maximum;
    if (s.minimum === -Number.MAX_SAFE_INTEGER) delete s.minimum;
    if (s.exclusiveMinimum === 0 && s.minimum === undefined) {
      delete s.exclusiveMinimum;
      s.minimum = 1;
    }
  }
  if (s.additionalProperties && typeof s.additionalProperties === "object" && !Object.keys(s.additionalProperties).length) s.additionalProperties = true;
  if (s.properties && !Object.keys(s.properties).length) delete s.properties;
  if (s.propertyNames && JSON.stringify(s.propertyNames) === '{"type":"string"}') delete s.propertyNames;
  if (s.format === "email") delete s.pattern;
  if (s.uniqueItems && Array.isArray(s.items?.enum) && s.maxItems === s.items.enum.length) delete s.maxItems;
  for (const key of UNPUBLISHED[path] ?? []) delete s[key];
  return Object.fromEntries(Object.entries(s).map(([k, v]) => [k, publish(v, path ? `${path}.${k}` : k)]));
}

export function generated() {
  const files = {};
  for (const [name, contract] of Object.entries(CONTRACTS)) {
    files[`${name}.canonical.schema.json`] = json({
      $schema: DIALECT,
      $id: `https://www.vayasyaseva.com/contracts/${name}.canonical.schema.json`,
      ...strip(z.toJSONSchema(contract.canonical, { io: "output", target: "draft-2020-12" })),
    });
    const requests = Object.entries(contract.requests);
    if (requests.length) {
      files[`${name}.requests.schema.json`] = json({
        $schema: DIALECT,
        $id: `https://www.vayasyaseva.com/contracts/${name}.requests.schema.json`,
        title: `${name} (wire requests)`,
        $defs: Object.fromEntries(
          requests.map(([id, schema]) => [id, strip(z.toJSONSchema(schema, { io: "input", unrepresentable: "any", target: "draft-2020-12" }))]),
        ),
      });
    }
  }
  const components = z.toJSONSchema(openApiComponents(), {
    io: "input",
    unrepresentable: "any",
    target: "draft-2020-12",
    uri: (id) => `#/components/schemas/${id}`,
  });
  const schemas = strip(components.schemas);
  files["openapi.components.json"] = json({ schemas: Object.fromEntries(Object.entries(schemas).map(([id, s]) => [id, publish(s, id)])) });
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const check = process.argv.includes("--check");
  const files = generated();
  let stale = 0;
  mkdirSync(out, { recursive: true });
  for (const [file, content] of Object.entries(files)) {
    const path = join(out, file);
    if (check) {
      let current = "";
      try {
        current = readFileSync(path, "utf8");
      } catch {}
      if (current !== content) {
        console.error(`out of date: ${relative(process.cwd(), path)} (run pnpm contracts:generate)`);
        stale++;
      }
    } else {
      writeFileSync(path, content);
      console.log(`wrote ${relative(process.cwd(), path)}`);
    }
  }
  for (const file of readdirSync(out)) {
    if (!(file in files)) {
      console.error(`not generated any more: ${relative(process.cwd(), join(out, file))} (delete it)`);
      stale++;
    }
  }
  if (stale) process.exit(1);
  if (check) console.log("packages/contracts/generated is up to date.");
}
