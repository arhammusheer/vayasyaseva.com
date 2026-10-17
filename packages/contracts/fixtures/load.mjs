/**
 * The shared fixture corpus: fixtures/{valid,invalid}/<contract>/<name>.json,
 * each `{ schema, note, data, handPort? }`. `schema` is "canonical" or the
 * name of a wire request schema (generated/<contract>.requests.schema.json
 * $defs). `handPort`, on a few invalid canonical fixtures, records how the
 * retired hand-written Windmill validators judged it, and why that changed.
 * Read by the package's Zod tests and by Windmill's ajv tests.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export function loadFixtures() {
  const out = [];
  for (const validity of ["valid", "invalid"]) {
    for (const contract of readdirSync(join(here, validity)).sort()) {
      for (const file of readdirSync(join(here, validity, contract)).filter((f) => f.endsWith(".json")).sort()) {
        const fixture = JSON.parse(readFileSync(join(here, validity, contract, file), "utf8"));
        out.push({ ...fixture, valid: validity === "valid", contract, name: file.replace(/\.json$/, ""), id: `${validity}/${contract}/${file}` });
      }
    }
  }
  return out;
}

/** The generated JSON Schema a fixture is checked against. */
export function generatedSchema(contract, schema) {
  const generated = join(here, "../generated");
  if (schema === "canonical") return JSON.parse(readFileSync(join(generated, `${contract}.canonical.schema.json`), "utf8"));
  const doc = JSON.parse(readFileSync(join(generated, `${contract}.requests.schema.json`), "utf8"));
  const def = doc.$defs[schema];
  if (!def) throw new Error(`${contract} has no request schema ${schema}`);
  return { $schema: doc.$schema, ...def };
}
