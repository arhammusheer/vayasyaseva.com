/**
 * Twenty CRM (crm.vayasyaseva.com) set up for VSPL, as code. Idempotent:
 * creates what is missing, updates select options, never deletes data
 * except the demo records with --remove-demo.
 *
 *   node integrations/twenty/setup.mts [--dry-run] [--remove-demo] [--reset-layout]
 *
 * Reaches Twenty through `kubectl port-forward svc/twenty` (it has no public
 * API route; the UI is behind Access) with the workspace API key in
 * Secret growth/twenty-api (vayasya-infra apps/twenty). Never prints it.
 *
 * The model (README.md):
 *   person         workers and client contacts, one per phone number
 *                  (+ personType, workerStatus, clusters, roles, language,
 *                  consent and contact dates)
 *   application    a job application, linked to its person (VS-J-XXXXXX)
 *   communication  every SMS, WhatsApp, call or email, linked to a person and
 *                  optionally an application or opportunity, with delivery status
 *   company + opportunity  leads: the client and its crew request pipeline
 */
import { ANSWER_OPTIONS } from "../windmill/talent/lib/crm.ts";
import { applyLayout } from "./layout.mts";
import { client, loadObjects, portForward, secret, type Gql, type MetaField, type Option } from "./lib.mts";

const DRY_RUN = process.argv.includes("--dry-run");
const REMOVE_DEMO = process.argv.includes("--remove-demo");
const RESET_LAYOUT = process.argv.includes("--reset-layout");

// --- the model ----------------------------------------------------------------

const COLORS = ["blue", "green", "orange", "purple", "turquoise", "sky", "yellow", "pink", "red", "gray"];
const options = (pairs: [string, string][], colors?: string[]): Option[] =>
  pairs.map(([value, label], i) => ({ value, label, color: colors?.[i] ?? COLORS[i % COLORS.length] }));

const CLUSTERS = options([
  ["HARIDWAR", "Haridwar"],
  ["UTTARAKHAND", "Uttarakhand"],
  ["DELHI_NCR", "Delhi NCR"],
  ["BENGALURU", "Bengaluru"],
  ["JALANDHAR", "Jalandhar"],
  ["SAHARANPUR", "Saharanpur"],
  ["OTHER", "Other"],
  ["PUNJAB", "Punjab (outside Jalandhar–Kapurthala)"],
  ["DEHRADUN", "Dehradun"],
]);
// src/lib/talent-intake/rules.ts JOB_ROLES, plus the work answers' "any".
const ROLES = options([
  ["FACTORY_HELPER", "Factory helper"],
  ["PACKING", "Packing"],
  ["MACHINE_OPERATOR", "Machine operator"],
  ["WAREHOUSE", "Warehouse / loading"],
  ["FORKLIFT_OPERATOR", "Forklift operator"],
  ["DATA_ENTRY_OPERATOR", "Data entry"],
  ["HOUSEKEEPING", "Housekeeping"],
  ["ITI_TRADES", "ITI trades"],
  ["ELECTRICIAN", "Electrician"],
  ["WELDER", "Welder"],
  ["FITTER", "Fitter"],
  ["ANY", "Any work"],
]);

/** A select built from the quick form's answers (ANSWER_OPTIONS in the sync's crm.ts), in the form's order. */
function answerOptions(question: keyof typeof ANSWER_OPTIONS, colors?: string[]): Option[] {
  return options(Object.values(ANSWER_OPTIONS[question] as Record<string, readonly [string, string]>).map(([v, l]) => [v, l]), colors);
}

type Field = {
  name: string;
  label: string;
  type: "TEXT" | "SELECT" | "MULTI_SELECT" | "DATE_TIME" | "DATE" | "NUMBER" | "RAW_JSON" | "BOOLEAN" | "PHONES";
  icon?: string;
  description?: string;
  options?: Option[];
  isUnique?: boolean;
};
type Relation = { name: string; label: string; target: string; inverseName: string; inverseLabel: string; icon?: string; inverseIcon?: string };
type ObjectSpec = {
  nameSingular: string;
  namePlural: string;
  labelSingular: string;
  labelPlural: string;
  icon: string;
  description: string;
  custom: boolean;
  fields: Field[];
  relations?: Relation[];
};

const MODEL: ObjectSpec[] = [
  {
    nameSingular: "person",
    namePlural: "people",
    labelSingular: "Person",
    labelPlural: "People",
    icon: "IconUser",
    description: "",
    custom: false,
    fields: [
      { name: "personType", label: "Type", type: "SELECT", icon: "IconTag", options: options([["WORKER", "Worker"], ["CLIENT_CONTACT", "Client contact"]], ["green", "blue"]) },
      {
        name: "workerStatus",
        label: "Worker status",
        type: "SELECT",
        icon: "IconProgressCheck",
        description: "Where this worker is: new, callable, placed. Do not contact = never call or message.",
        options: options(
          [["NEW", "New"], ["CALLABLE", "Callable"], ["PLACED", "Placed"], ["NOT_AVAILABLE", "Not available"], ["DO_NOT_CONTACT", "Do not contact"]],
          ["sky", "green", "purple", "gray", "red"],
        ),
      },
      { name: "clusters", label: "Clusters", type: "MULTI_SELECT", icon: "IconMapPin", options: CLUSTERS },
      { name: "workRoles", label: "Roles", type: "MULTI_SELECT", icon: "IconTool", options: ROLES },
      { name: "homeArea", label: "Home area", type: "TEXT", icon: "IconHome" },
      { name: "language", label: "Language", type: "SELECT", icon: "IconLanguage", options: options([["EN", "English"], ["HI", "Hindi"], ["HI_LATN", "Hinglish"], ["PA", "Punjabi"], ["KN", "Kannada"]]) },
      { name: "consentVersion", label: "Consent version", type: "TEXT", icon: "IconShieldCheck" },
      { name: "consentedAt", label: "Consented at", type: "DATE_TIME", icon: "IconShieldCheck" },
      { name: "lastAppliedAt", label: "Last applied", type: "DATE_TIME", icon: "IconCalendar" },
      {
        name: "lastContactAt",
        label: "Last contact",
        type: "DATE_TIME",
        icon: "IconCalendar",
        description: "The retention clock: only something the person does renews it (an application, a reply, a confirmation on a call).",
      },
    ],
  },
  {
    nameSingular: "application",
    namePlural: "applications",
    labelSingular: "Application",
    labelPlural: "Applications",
    icon: "IconFileText",
    description: "A job application from the website, an agent or a call. Name = the reference (VS-J-XXXXXX).",
    custom: true,
    fields: [
      {
        name: "status",
        label: "Status",
        type: "SELECT",
        icon: "IconProgressCheck",
        options: options([["NEW", "New"], ["SCREENED", "Screened"], ["CALLABLE", "Callable"], ["PLACED", "Placed"], ["ARCHIVED", "Archived"]], ["sky", "yellow", "green", "purple", "gray"]),
      },
      { name: "phone", label: "Phone", type: "PHONES", icon: "IconPhone", description: "The applicant's mobile, to call from the list or board." },
      { name: "workWanted", label: "Work wanted", type: "MULTI_SELECT", icon: "IconTool", options: ROLES, description: "Every kind of work the quick form ticked." },
      { name: "area", label: "Area", type: "SELECT", icon: "IconMapPin", options: answerOptions("area") },
      { name: "experience", label: "Experience", type: "SELECT", icon: "IconBriefcase", options: answerOptions("experience", ["gray", "sky", "blue", "green"]) },
      { name: "education", label: "Education", type: "SELECT", icon: "IconSchool", options: answerOptions("education", ["gray", "sky", "blue", "purple", "green"]) },
      { name: "canStart", label: "Can start", type: "SELECT", icon: "IconCalendarEvent", options: answerOptions("start", ["green", "yellow", "orange"]) },
      { name: "shifts", label: "Shifts", type: "MULTI_SELECT", icon: "IconClock", options: answerOptions("shift", ["yellow", "purple", "sky"]) },
      { name: "skills", label: "Skills", type: "TEXT", icon: "IconCertificate", description: "ITI, trade, machines, forklift and computer answers, in words." },
      { name: "source", label: "Source", type: "SELECT", icon: "IconWorld", options: options([["WEBSITE", "Website"], ["AGENT", "AI agent"], ["WHATSAPP", "WhatsApp"], ["PHONE", "Phone"], ["WALK_IN", "Walk-in"], ["OTHER", "Other"]]) },
      { name: "jobRole", label: "Role", type: "SELECT", icon: "IconTool", options: ROLES },
      { name: "cluster", label: "Cluster", type: "SELECT", icon: "IconMapPin", options: CLUSTERS },
      { name: "message", label: "Message", type: "TEXT", icon: "IconMessage", description: "What the person wrote." },
      { name: "answers", label: "Answers", type: "RAW_JSON", icon: "IconList", description: "The quick-form answers (work, experience, area...)." },
      { name: "submittedAt", label: "Submitted", type: "DATE_TIME", icon: "IconCalendar" },
      { name: "consentVersion", label: "Consent version", type: "TEXT", icon: "IconShieldCheck" },
      { name: "pagePath", label: "Page", type: "TEXT", icon: "IconLink" },
      { name: "talentSubmissionId", label: "Talent DB id", type: "TEXT", icon: "IconDatabase", isUnique: true, description: "submissions.id in the talent database (the sync key)." },
    ],
    relations: [{ name: "person", label: "Person", target: "person", inverseName: "applications", inverseLabel: "Applications", icon: "IconUser", inverseIcon: "IconFileText" }],
  },
  {
    nameSingular: "communication",
    namePlural: "communications",
    labelSingular: "Communication",
    labelPlural: "Communications",
    icon: "IconMessages",
    description: "Every SMS, WhatsApp, call or email with a person, and whether it was delivered.",
    custom: true,
    fields: [
      { name: "channel", label: "Channel", type: "SELECT", icon: "IconBroadcast", options: options([["SMS", "SMS"], ["WHATSAPP", "WhatsApp"], ["CALL", "Call"], ["EMAIL", "Email"]], ["blue", "green", "orange", "purple"]) },
      { name: "direction", label: "Direction", type: "SELECT", icon: "IconArrowsExchange", options: options([["OUTBOUND", "Outbound"], ["INBOUND", "Inbound"]], ["sky", "turquoise"]) },
      {
        name: "deliveryStatus",
        label: "Delivery",
        type: "SELECT",
        icon: "IconChecks",
        options: options(
          [["QUEUED", "Queued"], ["SENT", "Sent"], ["DELIVERED", "Delivered"], ["READ", "Read"], ["FAILED", "Failed"], ["UNKNOWN", "Unknown"]],
          ["gray", "sky", "green", "turquoise", "red", "yellow"],
        ),
      },
      { name: "template", label: "Template", type: "TEXT", icon: "IconTemplate" },
      { name: "body", label: "Message", type: "TEXT", icon: "IconMessage" },
      { name: "provider", label: "Provider", type: "TEXT", icon: "IconBuilding", description: "Fast2SMS, Resend..." },
      { name: "providerId", label: "Provider ID", type: "TEXT", icon: "IconHash" },
      { name: "statusAt", label: "Status at", type: "DATE_TIME", icon: "IconClock" },
      { name: "error", label: "Error", type: "TEXT", icon: "IconAlertTriangle" },
      { name: "externalKey", label: "Sync key", type: "TEXT", icon: "IconKey", isUnique: true, description: "Where it came from, e.g. sms-ack:<submission id>." },
    ],
    relations: [
      { name: "person", label: "Person", target: "person", inverseName: "communications", inverseLabel: "Communications", icon: "IconUser", inverseIcon: "IconMessages" },
      { name: "application", label: "Application", target: "application", inverseName: "communications", inverseLabel: "Communications", icon: "IconFileText", inverseIcon: "IconMessages" },
      { name: "opportunity", label: "Crew request", target: "opportunity", inverseName: "communications", inverseLabel: "Communications", icon: "IconTargetArrow", inverseIcon: "IconMessages" },
    ],
  },
  {
    nameSingular: "opportunity",
    namePlural: "opportunities",
    labelSingular: "Opportunity",
    labelPlural: "Opportunities",
    icon: "IconTargetArrow",
    description: "",
    custom: false,
    fields: [
      { name: "crewSize", label: "Crew size", type: "NUMBER", icon: "IconUsers" },
      { name: "services", label: "Services", type: "MULTI_SELECT", icon: "IconBriefcase", options: options([["FACTORY_LABOUR", "Factory labour"], ["LOADING_UNLOADING", "Loading and unloading"], ["HOUSEKEEPING", "Housekeeping and grounds"], ["OTHER", "Other"]]) },
      { name: "siteLocation", label: "Site", type: "TEXT", icon: "IconMapPin" },
      { name: "cluster", label: "Cluster", type: "SELECT", icon: "IconMapPin", options: CLUSTERS },
      { name: "startDate", label: "Start", type: "DATE", icon: "IconCalendar" },
      { name: "leadSource", label: "Lead source", type: "SELECT", icon: "IconWorld", options: options([["WEBSITE_FORM", "Website form"], ["PHONE", "Phone"], ["EMAIL", "Email"], ["WHATSAPP", "WhatsApp"], ["REFERRAL", "Referral"], ["OTHER", "Other"]]) },
      { name: "enquiry", label: "Enquiry", type: "TEXT", icon: "IconMessage", description: "What the client asked for, as sent." },
      { name: "caseId", label: "Case ID", type: "TEXT", icon: "IconHash", isUnique: true, description: "The contact form's case ID (the sync key)." },
    ],
  },
];

/** The crew request pipeline, replacing Twenty's demo stages. */
const OPPORTUNITY_STAGES = options(
  [["NEW", "New"], ["CONTACTED", "Contacted"], ["SITE_VISIT", "Site visit"], ["QUOTED", "Quoted"], ["WON", "Won"], ["LOST", "Lost"]],
  ["sky", "blue", "purple", "orange", "green", "red"],
);

const step = (s: string) => console.log(`${DRY_RUN ? "[dry run] " : ""}- ${s}`);

async function main() {
  const { base, stop } = await portForward();
  try {
    const gql = client(base, secret());
    const load = () => loadObjects(gql);
    let objects = await load();
    const byName = (n: string) => objects.find((o) => o.nameSingular === n);

    // 1. Custom objects
    for (const spec of MODEL.filter((m) => m.custom)) {
      if (byName(spec.nameSingular)) continue;
      step(`creating object ${spec.nameSingular}`);
      if (!DRY_RUN) {
        await gql("/metadata", `mutation($input: CreateOneObjectInput!) { createOneObject(input: $input) { id } }`, {
          input: {
            object: {
              nameSingular: spec.nameSingular,
              namePlural: spec.namePlural,
              labelSingular: spec.labelSingular,
              labelPlural: spec.labelPlural,
              icon: spec.icon,
              description: spec.description,
              isLabelSyncedWithName: false,
            },
          },
        });
      }
    }
    if (!DRY_RUN) objects = await load();

    // 2. Fields and select options
    for (const spec of MODEL) {
      const obj = byName(spec.nameSingular);
      if (!obj) {
        step(`(${spec.nameSingular} would exist: skipping its fields in the dry run)`);
        continue;
      }
      const existing = new Map(obj.fields.edges.map((e) => [e.node.name, e.node]));
      for (const f of spec.fields) {
        const have = existing.get(f.name);
        if (!have) {
          step(`creating field ${spec.nameSingular}.${f.name} (${f.type})`);
          if (!DRY_RUN) {
            await gql("/metadata", `mutation($input: CreateOneFieldMetadataInput!) { createOneField(input: $input) { id } }`, {
              input: {
                field: {
                  objectMetadataId: obj.id,
                  type: f.type,
                  name: f.name,
                  label: f.label,
                  icon: f.icon,
                  description: f.description,
                  isNullable: true,
                  ...(f.options ? { options: f.options.map((o, position) => ({ ...o, position })) } : {}),
                  ...(f.isUnique ? { isUnique: true } : {}),
                  isLabelSyncedWithName: false,
                },
              },
            });
          }
        } else if (f.options && JSON.stringify((have.options ?? []).map((o) => o.value)) !== JSON.stringify(f.options.map((o) => o.value))) {
          step(`updating options of ${spec.nameSingular}.${f.name}`);
          if (!DRY_RUN) await updateOptions(gql, have, f.options);
        }
      }
      for (const r of spec.relations ?? []) {
        if (existing.has(r.name)) continue;
        const target = byName(r.target);
        step(`creating relation ${spec.nameSingular}.${r.name} -> ${r.target}.${r.inverseName}`);
        if (DRY_RUN || !target) continue;
        await gql("/metadata", `mutation($input: CreateOneFieldMetadataInput!) { createOneField(input: $input) { id } }`, {
          input: {
            field: {
              objectMetadataId: obj.id,
              type: "RELATION",
              name: r.name,
              label: r.label,
              icon: r.icon,
              isNullable: true,
              isLabelSyncedWithName: false,
              relationCreationPayload: { type: "MANY_TO_ONE", targetObjectMetadataId: target.id, targetFieldLabel: r.inverseLabel, targetFieldIcon: r.inverseIcon ?? spec.icon },
            },
          },
        });
      }
    }

    // 3. The crew request pipeline
    const stage = byName("opportunity")?.fields.edges.map((e) => e.node).find((f) => f.name === "stage");
    if (stage && JSON.stringify((stage.options ?? []).map((o) => o.value)) !== JSON.stringify(OPPORTUNITY_STAGES.map((o) => o.value))) {
      step("setting the opportunity stages (crew request pipeline)");
      if (!DRY_RUN) await updateOptions(gql, stage, OPPORTUNITY_STAGES, "NEW");
    }

    // 4. Views, record pages, the Jobs dashboard and the sidebar (layout.mts)
    if (!DRY_RUN) objects = await load();
    await applyLayout(gql, objects, { dryRun: DRY_RUN, reset: RESET_LAYOUT, step });

    // 5. Demo records (Twenty's seed for a new workspace)
    if (REMOVE_DEMO) await removeDemo(gql);
    console.log(DRY_RUN ? "dry run: nothing changed" : "done");
  } finally {
    stop();
  }
}


/** Replaces a select's options. Records holding a dropped value are moved to `fallback` first. */
async function updateOptions(gql: Gql, field: MetaField, wanted: Option[], fallback?: string) {
  const kept = new Set(wanted.map((o) => o.value));
  const dropped = (field.options ?? []).map((o) => o.value).filter((v) => !kept.has(v));
  if (dropped.length && fallback) {
    // Opportunities are the only select we narrow; move their records first.
    await gql("/graphql", `mutation($filter: OpportunityFilterInput!, $data: OpportunityUpdateInput!) { updateOpportunities(filter: $filter, data: $data) { id } }`, {
      filter: { stage: { in: dropped } },
      data: { stage: fallback },
    });
  }
  await gql("/metadata", `mutation($input: UpdateOneFieldMetadataInput!) { updateOneField(input: $input) { id } }`, {
    input: { id: field.id, update: { options: wanted.map((o, position) => ({ ...o, position })), ...(fallback ? { defaultValue: `'${fallback}'` } : {}) } },
  });
}

/** Twenty's sample data: the seeded people, companies, opportunities, dashboard and workflows. */
async function removeDemo(gql: Gql) {
  const demoCompanies = ["Notion", "Stripe", "Figma", "Airbnb", "Anthropic"];
  const demoPeople = ["Brian", "Dario", "Patrick", "Dylan", "Ivan"];
  const demoDeals = ["Platform Migration", "AI Model Training", "Workspace Expansion", "API Integration Deal", "Enterprise Plan Upgrade", "Design Partnership"];
  const demoWorkflows = ["Quick Lead", "Create company when adding a new person"];
  const demoDashboards = ["My First Dashboard"];
  const targets: [string, string, string, Record<string, unknown>][] = [
    ["opportunities", "Opportunity", "name", { name: { in: demoDeals } }],
    ["people", "Person", "name", { name: { firstName: { in: demoPeople } } }],
    ["companies", "Company", "name", { name: { in: demoCompanies } }],
  ];
  for (const [plural, type, , filter] of targets) {
    const Plural = plural[0].toUpperCase() + plural.slice(1);
    step(`removing demo ${plural}`);
    if (DRY_RUN) continue;
    // Soft delete, then destroy: the records leave the trash too.
    await gql("/graphql", `mutation($filter: ${type}FilterInput!) { delete${Plural}(filter: $filter) { id } }`, { filter });
    await gql("/graphql", `mutation($filter: ${type}FilterInput!) { destroy${Plural}(filter: { and: [$filter, { deletedAt: { is: NOT_NULL } }] }) { id } }`, { filter });
  }
  // Workflows and dashboards don't take a name filter in mutations: find their ids first.
  for (const [plural, label, names] of [
    ["workflows", "name", demoWorkflows],
    ["dashboards", "title", demoDashboards],
  ] as const) {
    const Plural = plural[0].toUpperCase() + plural.slice(1);
    const found = await gql<Record<string, { edges: { node: { id: string } & Record<string, string> }[] }>>(
      "/graphql",
      `{ ${plural}(first: 100) { edges { node { id ${label} } } } }`,
    );
    const ids = found[plural].edges.map((e) => e.node).filter((n) => (names as readonly string[]).includes(n[label])).map((n) => n.id);
    if (!ids.length) continue;
    step(`removing demo ${plural} (${ids.length})`);
    if (DRY_RUN) continue;
    await gql("/graphql", `mutation($ids: [UUID!]!) { delete${Plural}(filter: { id: { in: $ids } }) { id } }`, { ids });
    await gql("/graphql", `mutation($ids: [UUID!]!) { destroy${Plural}(filter: { id: { in: $ids }, deletedAt: { is: NOT_NULL } }) { id } }`, { ids });
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
