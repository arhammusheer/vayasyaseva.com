#!/usr/bin/env node
// One-time (idempotent) Google Cloud setup for the Search workflow's sitemap
// submission (.github/workflows/search.yml, docs/search-pipeline.md):
//
//   - in project vayasya-ads: the Search Console, IAM, STS and IAM Credentials APIs;
//   - service account search-console-submit (no project roles at all);
//   - workload identity pool "github" with an OIDC provider for GitHub
//     Actions, limited to this repository;
//   - roles/iam.workloadIdentityUser on the service account for this
//     repository's workflows only.
//
// Runs with your Application Default Credentials:
//   gcloud auth application-default print-access-token   (must work)
//   node scripts/search-console/setup-gcp.mjs
// It prints the two values the workflow needs (not secrets). Then add the
// service account as a user (Full) of the sc-domain:vayasyaseva.com property
// in Search Console: Settings -> Users and permissions -> Add user.
import { execFileSync } from "node:child_process";

const PROJECT = "vayasya-ads";
const REPO = "arhammusheer/vayasyaseva.com";
const POOL = "github";
const PROVIDER = "vayasyaseva-com";
const SA_ID = "search-console-submit";
const APIS = ["searchconsole.googleapis.com", "iam.googleapis.com", "iamcredentials.googleapis.com", "sts.googleapis.com"];

const token = execFileSync("gcloud", ["auth", "application-default", "print-access-token"], { encoding: "utf8" }).trim();
async function call(method, url, body, { allow404 = false, allow409 = false } = {}) {
  const res = await fetch(url, {
    method,
    headers: { authorization: `Bearer ${token}`, "x-goog-user-project": PROJECT, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if ((allow404 && res.status === 404) || (allow409 && res.status === 409)) return null;
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url}: HTTP ${res.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitOp(op, base) {
  for (let i = 0; op && !op.done && op.name && i < 60; i++) {
    await wait(3000);
    op = await call("GET", `${base}/${op.name}`);
  }
  return op;
}

const project = await call("GET", `https://cloudresourcemanager.googleapis.com/v1/projects/${PROJECT}`);
const number = project.projectNumber;
console.log(`- project ${PROJECT} (${number})`);

console.log(`- enabling ${APIS.join(", ")}`);
await waitOp(await call("POST", `https://serviceusage.googleapis.com/v1/projects/${PROJECT}/services:batchEnable`, { serviceIds: APIS }), "https://serviceusage.googleapis.com/v1");

const saEmail = `${SA_ID}@${PROJECT}.iam.gserviceaccount.com`;
const sa = await call("GET", `https://iam.googleapis.com/v1/projects/${PROJECT}/serviceAccounts/${saEmail}`, null, { allow404: true });
if (!sa) {
  console.log(`- creating service account ${saEmail}`);
  await call("POST", `https://iam.googleapis.com/v1/projects/${PROJECT}/serviceAccounts`, {
    accountId: SA_ID,
    serviceAccount: { displayName: "Search Console sitemap submit (GitHub Actions, vayasyaseva.com)", description: "Submits the sitemap after each production deploy. No project roles; Search Console access only." },
  });
} else console.log(`- service account ${saEmail} exists`);

const iamBase = `https://iam.googleapis.com/v1/projects/${number}/locations/global/workloadIdentityPools`;
if (!(await call("GET", `${iamBase}/${POOL}`, null, { allow404: true }))) {
  console.log(`- creating workload identity pool ${POOL}`);
  await waitOp(await call("POST", `${iamBase}?workloadIdentityPoolId=${POOL}`, { displayName: "GitHub Actions", description: "GitHub Actions workflows of arhammusheer repositories" }), "https://iam.googleapis.com/v1");
} else console.log(`- pool ${POOL} exists`);

const providerBody = {
  displayName: "vayasyaseva.com repository",
  attributeMapping: { "google.subject": "assertion.sub", "attribute.repository": "assertion.repository", "attribute.ref": "assertion.ref" },
  attributeCondition: `assertion.repository == "${REPO}"`,
  oidc: { issuerUri: "https://token.actions.githubusercontent.com" },
};
if (!(await call("GET", `${iamBase}/${POOL}/providers/${PROVIDER}`, null, { allow404: true }))) {
  console.log(`- creating provider ${PROVIDER} (only ${REPO})`);
  await waitOp(await call("POST", `${iamBase}/${POOL}/providers?workloadIdentityPoolProviderId=${PROVIDER}`, providerBody), "https://iam.googleapis.com/v1");
} else console.log(`- provider ${PROVIDER} exists`);

const member = `principalSet://iam.googleapis.com/projects/${number}/locations/global/workloadIdentityPools/${POOL}/attribute.repository/${REPO}`;
const saResource = `https://iam.googleapis.com/v1/projects/${PROJECT}/serviceAccounts/${saEmail}`;
for (let i = 0; i < 10; i++) {
  try {
    const policy = await call("POST", `${saResource}:getIamPolicy`, {});
    const bindings = policy.bindings ?? [];
    const role = "roles/iam.workloadIdentityUser";
    const b = bindings.find((x) => x.role === role) ?? (bindings.push({ role, members: [] }), bindings.at(-1));
    if (!b.members.includes(member)) {
      b.members.push(member);
      await call("POST", `${saResource}:setIamPolicy`, { policy: { ...policy, bindings } });
      console.log(`- granted ${role} to ${REPO}'s workflows`);
    } else console.log(`- ${REPO}'s workflows can already use the service account`);
    break;
  } catch (error) {
    if (i === 9) throw error;
    await wait(5000); // a new service account takes a moment to appear
  }
}

console.log(`\nWorkflow values (not secrets):`);
console.log(`  GCP_WORKLOAD_IDENTITY_PROVIDER = projects/${number}/locations/global/workloadIdentityPools/${POOL}/providers/${PROVIDER}`);
console.log(`  GCP_SEARCH_CONSOLE_SA          = ${saEmail}`);
console.log(`\nThen in Search Console (sc-domain:vayasyaseva.com): Settings -> Users and permissions -> Add user -> ${saEmail}, permission Full.`);
