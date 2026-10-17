// The contracts package's fixture corpus through Windmill's validators: the
// ajv check of the generated canonical schemas (contracts/validate.ts) and,
// side by side until they are retired, the hand-written ports
// (talent/lib/validate.ts, leads/lib/lead.ts validateLead). Each must give
// the fixture's verdict; where a fixture records that the hand port judged
// it differently (`handPort`), the hand port must still do exactly that.
import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error plain JS helper shared with the package's own tests
import { loadFixtures } from "../../packages/contracts/fixtures/load.mjs";
import { checkSubmission } from "./talent/lib/intake-payload.ts";
import { validateSubmission } from "./talent/lib/validate.ts";
import { checkLead, validateLead } from "./leads/lib/lead.ts";
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

const windmill: Record<string, { ajv: (body: unknown) => boolean; handPort?: (body: unknown) => boolean }> = {
  "job_application.v1": { ajv: (b) => checkSubmission(b).ok, handPort: (b) => validateSubmission(b).ok },
  "business_enquiry.v1": { ajv: (b) => checkLead(b).ok, handPort: (b) => validateLead(b).ok },
  "compliance_help.v1": { ajv: (b) => checkLead(b).ok && (b as { requestType?: string }).requestType === "compliance-help" },
  "envelope.v1": { ajv: (b) => check(SCHEMAS["envelope.v1"], b).ok },
};

for (const fixture of canonical.filter((f) => windmill[f.contract])) {
  const { ajv, handPort } = windmill[fixture.contract];
  test(`${fixture.id}: ajv ${fixture.valid ? "accepts" : "rejects"}`, () => {
    assert.equal(ajv(structuredClone(fixture.data)), fixture.valid);
  });
  if (handPort) {
    const expected = fixture.handPort ? fixture.handPort.verdict === "accepts" : fixture.valid;
    test(`${fixture.id}: the hand port ${expected ? "accepts" : "rejects"}${fixture.handPort ? ` (${fixture.handPort.why})` : ""}`, () => {
      assert.equal(handPort(structuredClone(fixture.data)), expected);
    });
  }
}

test("ajv and the hand ports agree on every fixture the site can send", () => {
  const disagree = canonical
    .filter((f) => windmill[f.contract]?.handPort && !f.handPort)
    .filter((f) => windmill[f.contract].ajv(structuredClone(f.data)) !== windmill[f.contract].handPort!(structuredClone(f.data)))
    .map((f) => f.id);
  assert.deepEqual(disagree, []);
});

test("an accepted application keeps what SAVE_SUBMISSION stores, the same as the hand port made it", () => {
  for (const f of canonical.filter((x) => x.contract === "job_application.v1" && x.valid)) {
    const a = checkSubmission(structuredClone(f.data));
    const b = validateSubmission(structuredClone(f.data));
    assert.ok(a.ok && b.ok, f.id);
    assert.deepEqual(a.value, b.value, f.id);
  }
});

test("an accepted lead is the lead the hand port made", () => {
  for (const f of canonical.filter((x) => x.contract === "business_enquiry.v1" && x.valid)) {
    const a = checkLead(structuredClone(f.data));
    const b = validateLead(structuredClone(f.data));
    assert.ok(a.ok && b.ok, f.id);
    assert.deepEqual(a.lead, b.lead, f.id);
  }
});
