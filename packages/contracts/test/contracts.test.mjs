// The contracts against the shared fixture corpus: each fixture through its
// Zod schema and, independently, through ajv with the generated JSON Schema.
// Both must give the fixture's verdict (its folder: valid or invalid).
import assert from "node:assert/strict";
import test from "node:test";
import { Ajv2020 } from "ajv/dist/2020.js";
import { CONTRACTS, talentIntakeSchema, jobApplicationCanonicalSchema, parseContactRequest } from "../src/index.ts";
import { generated } from "../scripts/generate.mjs";
import { generatedSchema, loadFixtures } from "../fixtures/load.mjs";
import { readFileSync } from "node:fs";

const fixtures = loadFixtures();
const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });

/** One compiled validator per generated schema. */
const compiled = new Map();
function validatorFor(contract, schema) {
  const key = `${contract}#${schema}`;
  if (!compiled.has(key)) compiled.set(key, ajv.compile(generatedSchema(contract, schema)));
  return compiled.get(key);
}

const zodSchema = (contract, schema) => (schema === "canonical" ? CONTRACTS[contract].canonical : CONTRACTS[contract].requests[schema]);

test("the corpus covers every contract, valid and invalid", () => {
  for (const contract of Object.keys(CONTRACTS)) {
    assert.ok(fixtures.some((f) => f.contract === contract && f.valid), `${contract}: no valid fixture`);
    assert.ok(fixtures.some((f) => f.contract === contract && !f.valid), `${contract}: no invalid fixture`);
  }
});

for (const fixture of fixtures) {
  test(`${fixture.id}: Zod and ajv agree (${fixture.valid ? "valid" : "invalid"})`, () => {
    const schema = zodSchema(fixture.contract, fixture.schema);
    assert.ok(schema, `${fixture.id}: unknown schema ${fixture.schema}`);
    const zod = schema.safeParse(fixture.data);
    assert.equal(zod.success, fixture.valid, `Zod: ${zod.success ? "accepted" : JSON.stringify(zod.error.issues)}`);
    // JSON Schema cannot compare an attachment key with the ref: Zod and Windmill's intake check that by hand.
    if (fixture.name === "attachment-of-another-submission") return;
    const validate = validatorFor(fixture.contract, fixture.schema);
    assert.equal(validate(structuredClone(fixture.data)), fixture.valid, `ajv: ${JSON.stringify(validate.errors)}`);
  });
}

test("what talentIntakeSchema builds satisfies the canonical schema", () => {
  const raw = {
    ref: "VS-J-7K2M9Q",
    source: "web",
    locale: "en-IN",
    cluster: undefined,
    pageCluster: "haridwar",
    pagePath: "/jobs/haridwar",
    role: null,
    hub: null,
    channel: "web",
    agentName: null,
    phone: "098765 43210",
    adult: true,
    consent: { version: "2026-10-16-v7", at: "2026-10-17T09:30:00.000Z" },
    text: "  hello  ",
    attachments: [],
    form: "quick",
    applicantName: "Ravi",
    answers: { work: ["packing", "packing", "unknown"], nope: ["x"] },
  };
  const built = talentIntakeSchema.parse(raw);
  assert.equal(built.phone, "+919876543210");
  assert.deepEqual(built.answers, { work: ["packing"] });
  assert.ok(jobApplicationCanonicalSchema.safeParse(built).success);
  const validate = validatorFor("job_application.v1", "canonical");
  assert.ok(validate(JSON.parse(JSON.stringify(built))), JSON.stringify(validate.errors));
});

test("the contact contract still parses as before: an unknown page cluster is dropped", () => {
  const parsed = parseContactRequest({ name: "Asha", phone: "9876543210", details: "Need 30 packers.", pageCluster: "atlantis" });
  assert.ok(parsed.success);
  assert.equal(parsed.data.pageCluster, undefined);
});

test("generated/ is up to date", () => {
  for (const [file, content] of Object.entries(generated())) {
    assert.equal(readFileSync(new URL(`../generated/${file}`, import.meta.url), "utf8"), content, `${file} is stale: pnpm contracts:generate`);
  }
});
