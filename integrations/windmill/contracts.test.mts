// The contracts package's fixture corpus through Windmill's validators: the
// ajv check of the generated canonical schemas (contracts/validate.ts). Each
// must give the fixture's verdict. (The hand-written ports this replaced,
// talent/lib/validate.ts and leads/lib/lead.ts validateLead, ran side by side
// with it over this corpus and agreed before they were deleted; the fixtures
// marked `handPort` record where they had judged differently, and why.)
import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error plain JS helper shared with the package's own tests
import { loadFixtures } from "../../packages/contracts/fixtures/load.mjs";
import { checkSubmission } from "./talent/lib/intake-payload.ts";
import { checkLead } from "./leads/lib/lead.ts";
import { SCHEMAS, check } from "./contracts/validate.ts";

interface Fixture {
  id: string;
  contract: string;
  schema: string;
  valid: boolean;
  data: unknown;
  handPort?: { verdict: "accepts" | "rejects"; why: string };
}

const canonical = (loadFixtures() as Fixture[]).filter((f) => f.schema === "canonical");

const windmill: Record<string, { ajv: (body: unknown) => boolean }> = {
  "job_application.v1": { ajv: (b) => checkSubmission(b).ok },
  "business_enquiry.v1": { ajv: (b) => checkLead(b).ok },
  "compliance_help.v1": { ajv: (b) => checkLead(b).ok },
  "envelope.v1": { ajv: (b) => check(SCHEMAS["envelope.v1"], b).ok },
};

// Windmill takes a compliance-help lead as a lead: telling it from a crew
// request is the contract's own check (packages/contracts), not Windmill's.
const judged = (f: Fixture) => windmill[f.contract] && !(f.contract === "compliance_help.v1" && !f.valid);

for (const fixture of canonical.filter(judged)) {
  const { ajv } = windmill[fixture.contract];
  test(`${fixture.id}: ajv ${fixture.valid ? "accepts" : "rejects"}`, () => {
    assert.equal(ajv(structuredClone(fixture.data)), fixture.valid);
  });
}

test("an accepted application is stored as the contract says", () => {
  const f = canonical.find((x) => x.id === "valid/job_application.v1/web-long-form-with-photo.json")!;
  const out = checkSubmission(structuredClone(f.data));
  assert.ok(out.ok);
  assert.equal(out.value.phone, "+919876543210");
  assert.equal(out.value.attachments[0].position, 0);
});

test("an accepted lead keeps its ISO receivedAt", () => {
  const f = canonical.find((x) => x.id === "valid/business_enquiry.v1/web-crew-request.json")!;
  const out = checkLead(structuredClone(f.data));
  assert.ok(out.ok);
  assert.equal(out.lead.receivedAt, "2026-10-17T09:30:00.000Z");
});
