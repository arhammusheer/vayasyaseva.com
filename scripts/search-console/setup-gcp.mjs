#!/usr/bin/env node
// One-time (idempotent) Google Cloud setup for the Search workflow's sitemap
// submission (.github/workflows/search.yml, docs/search-pipeline.md):
//
//   - in project vayasya-ads: the Search Console, IAM, STS and IAM Credentials APIs;
//   - service account search-console-submit (no project roles at all);
//   - workload identity pool "github" with an OIDC provider for GitHub
//     Actions, limited to this repository;
//   - roles/iam.workloadIdentityUser on the service account for this
//     repository's workflows only;
//   - workload identity pool "vayasya-cluster" with a provider for the
//     group cluster's service account tokens (issuer and keys as in
//     vayasya-infra google/cluster-jwks.json), admitting only the SEO watch
//     CronJob (growth/seo-watch), which may read Search Console as the same
//     service account. Pass the infra repo path as the first argument.
//
// Runs with your Application Default Credentials:
//   gcloud auth application-default print-access-token   (must work)
//   node scripts/search-console/setup-gcp.mjs
// It prints the two values the workflow needs (not secrets). Then add the
// service account as a user (Full) of the sc-domain:vayasyaseva.com property
// in Search Console: Settings -> Users and permissions -> Add user.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

// The cluster: SEO watch (scripts/seo-watch) reads Search Console from a CronJob.
const CLUSTER_POOL = "vayasya-cluster";
const CLUSTER_PROVIDER = "kubernetes";
const CLUSTER_SUBJECT = "system:serviceaccount:growth:seo-watch";
const infra = process.argv[2] ?? `${process.env.HOME}/Development/arhammusheer/vayasya-infra`;
const jwks = readFileSync(resolve(infra, "google/cluster-jwks.json"), "utf8");
if (!(await call("GET", `${iamBase}/${CLUSTER_POOL}`, null, { allow404: true }))) {
  console.log(`- creating workload identity pool ${CLUSTER_POOL}`);
  await waitOp(await call("POST", `${iamBase}?workloadIdentityPoolId=${CLUSTER_POOL}`, { displayName: "Group cluster", description: "Service accounts of the group Kubernetes cluster" }), "https://iam.googleapis.com/v1");
} else console.log(`- pool ${CLUSTER_POOL} exists`);
const clusterProvider = {
  displayName: "Kubernetes service accounts",
  attributeMapping: { "google.subject": "assertion.sub" },
  attributeCondition: `assertion.sub == '${CLUSTER_SUBJECT}'`,
  oidc: { issuerUri: "https://kubernetes.default.svc.cluster.local", jwksJson: jwks },
};
if (!(await call("GET", `${iamBase}/${CLUSTER_POOL}/providers/${CLUSTER_PROVIDER}`, null, { allow404: true }))) {
  console.log(`- creating provider ${CLUSTER_PROVIDER} (only ${CLUSTER_SUBJECT})`);
  await waitOp(await call("POST", `${iamBase}/${CLUSTER_POOL}/providers?workloadIdentityPoolProviderId=${CLUSTER_PROVIDER}`, clusterProvider), "https://iam.googleapis.com/v1");
} else {
  console.log(`- updating provider ${CLUSTER_PROVIDER} (keys and condition)`);
  await waitOp(await call("PATCH", `${iamBase}/${CLUSTER_POOL}/providers/${CLUSTER_PROVIDER}?updateMask=attributeCondition,oidc.jwksJson`, clusterProvider), "https://iam.googleapis.com/v1");
}
const clusterMember = `principal://iam.googleapis.com/projects/${number}/locations/global/workloadIdentityPools/${CLUSTER_POOL}/subject/${CLUSTER_SUBJECT}`;
{
  const policy = await call("POST", `${saResource}:getIamPolicy`, {});
  const bindings = policy.bindings ?? [];
  const role = "roles/iam.workloadIdentityUser";
  const b = bindings.find((x) => x.role === role) ?? (bindings.push({ role, members: [] }), bindings.at(-1));
  if (!b.members.includes(clusterMember)) {
    b.members.push(clusterMember);
    await call("POST", `${saResource}:setIamPolicy`, { policy: { ...policy, bindings } });
    console.log(`- granted ${role} to ${CLUSTER_SUBJECT}`);
  } else console.log(`- ${CLUSTER_SUBJECT} can already use the service account`);
}
console.log(`  cluster token audience = //iam.googleapis.com/projects/${number}/locations/global/workloadIdentityPools/${CLUSTER_POOL}/providers/${CLUSTER_PROVIDER}`);

console.log(`\nWorkflow values (not secrets):`);
console.log(`  GCP_WORKLOAD_IDENTITY_PROVIDER = projects/${number}/locations/global/workloadIdentityPools/${POOL}/providers/${PROVIDER}`);
console.log(`  GCP_SEARCH_CONSOLE_SA          = ${saEmail}`);
console.log(`\nThen in Search Console (sc-domain:vayasyaseva.com): Settings -> Users and permissions -> Add user -> ${saEmail}, permission Full.`);
