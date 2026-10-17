/**
 * Fills the screening fields (experience, education, can start, shifts,
 * area, work wanted, skills) and the phone on applications synced before
 * those fields existed, from each application's own Answers and its
 * person's phone. Safe to re-run: it only writes what differs.
 *
 *   node integrations/twenty/backfill-applications.mts [--dry-run]
 */
import { screeningFields } from "../windmill/talent/lib/crm.ts";
import { client, portForward, secret } from "./lib.mts";

const DRY_RUN = process.argv.includes("--dry-run");

type App = {
  id: string;
  name: string;
  answers: Record<string, unknown> | null;
  phone: { primaryPhoneNumber: string | null } | null;
  person: { phones: { primaryPhoneNumber: string; primaryPhoneCountryCode: string; primaryPhoneCallingCode: string } | null } | null;
} & Record<string, unknown>;

const { base, stop } = await portForward();
try {
  const gql = client(base, secret());
  const apps: App[] = [];
  let after: string | null = null;
  do {
    const page: { applications: { edges: { node: App }[]; pageInfo: { hasNextPage: boolean; endCursor: string } } } = await gql(
      "/graphql",
      `query($after: String) { applications(first: 60, after: $after) {
        edges { node { id name answers experience education canStart area shifts workWanted skills
          phone { primaryPhoneNumber } person { phones { primaryPhoneNumber primaryPhoneCountryCode primaryPhoneCallingCode } } } }
        pageInfo { hasNextPage endCursor } } }`,
      { after },
    );
    apps.push(...page.applications.edges.map((e) => e.node));
    after = page.applications.pageInfo.hasNextPage ? page.applications.pageInfo.endCursor : null;
  } while (after);

  let updated = 0;
  for (const app of apps) {
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(screeningFields(app.answers))) {
      if (JSON.stringify(app[k] ?? (Array.isArray(v) ? [] : null)) !== JSON.stringify(v ?? (Array.isArray(v) ? [] : null)) && !(v === "" && !app[k])) data[k] = v;
    }
    const personPhone = app.person?.phones;
    if (!app.phone?.primaryPhoneNumber && personPhone?.primaryPhoneNumber) {
      data.phone = { primaryPhoneNumber: personPhone.primaryPhoneNumber, primaryPhoneCountryCode: personPhone.primaryPhoneCountryCode || "IN", primaryPhoneCallingCode: personPhone.primaryPhoneCallingCode || "+91" };
    }
    if (!Object.keys(data).length) continue;
    updated++;
    // The reference only: the fields carry nothing to hide, but the phone does.
    console.log(`${DRY_RUN ? "[dry run] " : ""}- ${app.name}: ${Object.keys(data).join(", ")}`);
    if (!DRY_RUN) await gql("/graphql", `mutation($id: UUID!, $data: ApplicationUpdateInput!) { updateApplication(id: $id, data: $data) { id } }`, { id: app.id, data });
  }
  console.log(`${apps.length} applications, ${updated} ${DRY_RUN ? "to update" : "updated"}`);
} finally {
  stop();
}
