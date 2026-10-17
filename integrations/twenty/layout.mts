/**
 * How the CRM reads, as code. Applications are a log, not a pipeline: the
 * default list is every application newest first, with a calendar and a
 * time-series dashboard beside it. Also the record pages' field order and
 * the sidebar. Run by setup.mts.
 *
 * A view that does not exist is created; one that exists is left alone (staff
 * may have adjusted it) unless --reset-layout, which puts back its columns,
 * sort and filters. Columns are listed in order; every other field is hidden.
 * The dashboard is created once; --reset-layout rebuilds it. Views in
 * RETIRED (an earlier, pipeline-style layout) are removed.
 */
import { randomUUID } from "node:crypto";
import type { Gql, MetaObject } from "./lib.mts";

type Step = (message: string) => void;
interface Options {
  dryRun: boolean;
  reset: boolean;
  step: Step;
}

// --- views --------------------------------------------------------------------

type Column = string | [string, number];
type Filter = { field: string; operand: "IS" | "IS_NOT" | "IS_RELATIVE" | "IS_NOT_EMPTY"; values?: string[]; value?: string };
type ViewSpec = {
  object: string;
  /** The object's default list (key INDEX), whatever it is called. */
  index?: true;
  name: string;
  /** Earlier names: such a view is renamed rather than duplicated. */
  was?: string[];
  type: "TABLE" | "KANBAN" | "CALENDAR" | "FIELDS_WIDGET";
  icon?: string;
  groupBy?: string;
  /** CALENDAR: the date field records sit on (month layout). */
  calendarBy?: string;
  columns: Column[];
  sort?: [string, "ASC" | "DESC"];
  filters?: Filter[];
};

/** Twenty's relative date filter: last N days, in India time, weeks from Monday. */
const pastDays = (n: number) => `PAST_${n}_DAY;;Asia/Kolkata;;MONDAY;;`;
/** The log's columns: when, who, what work, where, and the screening answers. */
const LOG_COLUMNS: Column[] = [
  ["name", 130], ["submittedAt", 160], ["person", 170], ["phone", 150], ["jobRole", 150], ["area", 190], "experience", "canStart",
  ["workWanted", 220], ["shifts", 150], "education", ["skills", 220], "source", ["message", 300],
];
const WORKER_COLUMNS: Column[] = [
  ["name", 180], ["phones", 150], ["lastAppliedAt", 160], ["workRoles", 220], ["clusters", 160], ["homeArea", 170], "language", ["applications", 180],
];

/** Views of the earlier pipeline layout (17 Oct 2026), removed: the owner wants a log, not recruitment management. */
const RETIRED: [string, string][] = [
  ["application", "To call"], ["application", "Pipeline"], ["application", "By status"], ["application", "Callable pool"],
  ["application", "By role"], ["application", "By area"], ["person", "Callable workers"], ["person", "Workers by status"],
];

export const VIEWS: ViewSpec[] = [
  // Applications: a log, newest first.
  {
    object: "application",
    index: true,
    name: "Applications log",
    type: "TABLE",
    icon: "IconFileText",
    columns: LOG_COLUMNS,
    sort: ["submittedAt", "DESC"],
  },
  {
    object: "application",
    name: "Last 7 days",
    type: "TABLE",
    icon: "IconCalendarWeek",
    columns: LOG_COLUMNS,
    sort: ["submittedAt", "DESC"],
    filters: [{ field: "submittedAt", operand: "IS_RELATIVE", value: pastDays(7) }],
  },
  {
    object: "application",
    name: "Calendar",
    type: "CALENDAR",
    icon: "IconCalendar",
    calendarBy: "submittedAt",
    columns: ["name", "person", "jobRole", "area"],
  },
  {
    object: "application",
    name: "Application Record Page Fields",
    type: "FIELDS_WIDGET",
    columns: [
      "submittedAt", "person", "phone", "jobRole", "workWanted", "area", "experience", "education", "canStart", "shifts", "skills", "message",
      "source", "cluster", "pagePath", "communications",
    ],
  },

  // People: workers and client contacts.
  {
    object: "person",
    name: "Workers",
    type: "TABLE",
    icon: "IconUsers",
    columns: WORKER_COLUMNS,
    sort: ["lastAppliedAt", "DESC"],
    filters: [{ field: "personType", operand: "IS", values: ["WORKER"] }],
  },
  {
    object: "person",
    name: "Client contacts",
    type: "TABLE",
    icon: "IconBuildingSkyscraper",
    columns: [["name", 180], ["company", 180], ["phones", 150], ["emails", 220], ["jobTitle", 160], ["pointOfContactForOpportunities", 220], ["createdAt", 150]],
    sort: ["createdAt", "DESC"],
    filters: [{ field: "personType", operand: "IS", values: ["CLIENT_CONTACT"] }],
  },
  {
    object: "person",
    index: true,
    name: "All People",
    type: "TABLE",
    columns: [["name", 180], ["phones", 150], "personType", ["workRoles", 200], ["clusters", 160], ["company", 170], ["emails", 200], ["lastContactAt", 150]],
    sort: ["createdAt", "DESC"],
  },
  {
    object: "person",
    name: "Person Record Page Fields",
    type: "FIELDS_WIDGET",
    columns: [
      "phones", "personType", "lastAppliedAt", "applications", "workRoles", "clusters", "homeArea", "language", "lastContactAt",
      "communications", "company", "jobTitle", "emails", "pointOfContactForOpportunities", "consentVersion", "consentedAt",
    ],
  },

  // Communications: the log, newest first.
  {
    object: "communication",
    index: true,
    name: "All Communications",
    type: "TABLE",
    columns: [["name", 260], ["person", 170], ["application", 130], "channel", "direction", "deliveryStatus", ["statusAt", 150], ["error", 240]],
    sort: ["statusAt", "DESC"],
  },
  {
    object: "communication",
    name: "Needs attention",
    type: "TABLE",
    icon: "IconAlertTriangle",
    columns: [["name", 260], ["person", 170], ["application", 130], "channel", "deliveryStatus", ["statusAt", 150], ["error", 300]],
    sort: ["statusAt", "DESC"],
    filters: [{ field: "deliveryStatus", operand: "IS", values: ["FAILED", "UNKNOWN"] }],
  },
  {
    object: "communication",
    name: "Communication Record Page Fields",
    type: "FIELDS_WIDGET",
    columns: ["person", "application", "opportunity", "channel", "direction", "deliveryStatus", "statusAt", "error", "body", "template", "provider", "providerId"],
  },

  // Crew requests (opportunities) and companies.
  {
    object: "opportunity",
    index: true,
    name: "All Crew requests",
    was: ["All Opportunities"],
    type: "TABLE",
    columns: [
      ["name", 220], ["company", 170], "stage", "crewSize", ["services", 220], "cluster", ["siteLocation", 180], "startDate", ["pointOfContact", 170], "leadSource", ["createdAt", 150],
    ],
    sort: ["createdAt", "DESC"],
  },
  {
    object: "opportunity",
    name: "By Stage",
    type: "KANBAN",
    groupBy: "stage",
    columns: ["name", "company", "crewSize", "cluster", "siteLocation", "startDate", "pointOfContact"],
    sort: ["createdAt", "DESC"],
  },
  {
    object: "opportunity",
    name: "Opportunity Record Page Fields",
    type: "FIELDS_WIDGET",
    columns: ["stage", "company", "pointOfContact", "crewSize", "services", "cluster", "siteLocation", "startDate", "leadSource", "enquiry", "communications", "caseId", "createdAt"],
  },
  {
    object: "company",
    index: true,
    name: "All Companies",
    type: "TABLE",
    columns: [["name", 200], ["people", 200], ["opportunities", 220], ["domainName", 180], ["address", 220], ["createdAt", 150]],
    sort: ["createdAt", "DESC"],
  },
];

type ViewRow = {
  id: string;
  name: string;
  key: string | null;
  type: string;
  viewFields: { id: string; fieldMetadataId: string; isVisible: boolean; position: number; size: number }[];
  viewSorts: { id: string }[];
  viewFilters: { id: string }[];
};

const VIEW_QUERY = `query($id: String!) { getViews(objectMetadataId: $id) { id name key type
  viewFields { id fieldMetadataId isVisible position size } viewSorts { id } viewFilters { id } } }`;

function fieldIdIn(obj: MetaObject) {
  return (name: string) => {
    const id = obj.fields.edges.find((e) => e.node.name === name)?.node.id;
    if (!id) throw new Error(`${obj.nameSingular} has no field ${name}`);
    return id;
  };
}

/** A filter's value as Twenty's UI stores it: selects as a JSON array string. */
const filterValue = (f: Filter) => (f.values ? JSON.stringify(f.values) : (f.value ?? ""));

async function ensureView(gql: Gql, objects: MetaObject[], spec: ViewSpec, o: Options) {
  const obj = objects.find((x) => x.nameSingular === spec.object);
  if (!obj) return;
  const fieldId = fieldIdIn(obj);
  const views = (await gql<{ getViews: ViewRow[] }>("/metadata", VIEW_QUERY, { id: obj.id })).getViews;
  let view = spec.index
    ? views.find((v) => v.key === "INDEX")
    : (views.find((v) => v.name === spec.name) ?? views.find((v) => spec.was?.includes(v.name)));
  let apply = o.reset;

  if (!view) {
    if (spec.type === "FIELDS_WIDGET") return o.step(`(no "${spec.name}" on ${spec.object}: skipped)`);
    o.step(`creating view ${spec.object} "${spec.name}"`);
    if (o.dryRun) return;
    const { createView } = await gql<{ createView: { id: string } }>(
      "/metadata",
      `mutation($input: CreateViewInput!) { createView(input: $input) { id } }`,
      {
        input: {
          name: spec.name,
          objectMetadataId: obj.id,
          type: spec.type,
          icon: spec.icon ?? "IconList",
          position: views.length,
          visibility: "WORKSPACE",
          ...(spec.groupBy ? { mainGroupByFieldMetadataId: fieldId(spec.groupBy) } : {}),
          ...(spec.calendarBy ? { calendarFieldMetadataId: fieldId(spec.calendarBy), calendarLayout: "MONTH" } : {}),
        },
      },
    );
    view = { id: createView.id, name: spec.name, key: null, type: spec.type, viewFields: [], viewSorts: [], viewFilters: [] };
    apply = true;
  } else if (view.name !== spec.name) {
    o.step(`renaming view ${spec.object} "${view.name}" to "${spec.name}"`);
    if (!o.dryRun) await gql("/metadata", `mutation($id: String!, $input: UpdateViewInput!) { updateView(id: $id, input: $input) { id } }`, { id: view.id, input: { name: spec.name } });
  }
  if (!apply) return;
  o.step(`laying out view ${spec.object} "${spec.name}"`);
  if (o.dryRun) return;

  if (spec.icon && view.type !== "FIELDS_WIDGET") {
    await gql("/metadata", `mutation($id: String!, $input: UpdateViewInput!) { updateView(id: $id, input: $input) { id } }`, { id: view.id, input: { icon: spec.icon } });
  }

  // Columns: the listed ones in order, everything else hidden.
  const wanted = spec.columns.map((c, position) => {
    const [name, size] = typeof c === "string" ? [c, 150] : c;
    return { fieldMetadataId: fieldId(name), position, size };
  });
  const wantedIds = new Set(wanted.map((w) => w.fieldMetadataId));
  const toCreate = [];
  for (const w of wanted) {
    const have = view.viewFields.find((f) => f.fieldMetadataId === w.fieldMetadataId);
    if (!have) toCreate.push({ viewId: view.id, fieldMetadataId: w.fieldMetadataId, isVisible: true, position: w.position, size: w.size });
    else if (!have.isVisible || have.position !== w.position || have.size !== w.size) {
      await gql("/metadata", `mutation($input: UpdateViewFieldInput!) { updateViewField(input: $input) { id } }`, {
        input: { id: have.id, update: { isVisible: true, position: w.position, size: w.size } },
      });
    }
  }
  if (toCreate.length) await gql("/metadata", `mutation($inputs: [CreateViewFieldInput!]!) { createManyViewFields(inputs: $inputs) { id } }`, { inputs: toCreate });
  for (const f of view.viewFields.filter((f) => f.isVisible && !wantedIds.has(f.fieldMetadataId))) {
    await gql("/metadata", `mutation($input: UpdateViewFieldInput!) { updateViewField(input: $input) { id } }`, {
      input: { id: f.id, update: { isVisible: false, position: 100 + f.position } },
    });
  }
  if (view.type === "FIELDS_WIDGET") return;

  // Sort and filters: replaced.
  for (const s of view.viewSorts) await gql("/metadata", `mutation($input: DestroyViewSortInput!) { destroyViewSort(input: $input) }`, { input: { id: s.id } });
  if (spec.sort) {
    await gql("/metadata", `mutation($input: CreateViewSortInput!) { createViewSort(input: $input) { id } }`, {
      input: { viewId: view.id, fieldMetadataId: fieldId(spec.sort[0]), direction: spec.sort[1] },
    });
  }
  for (const f of view.viewFilters) await gql("/metadata", `mutation($input: DestroyViewFilterInput!) { destroyViewFilter(input: $input) { id } }`, { input: { id: f.id } });
  for (const f of spec.filters ?? []) {
    await gql("/metadata", `mutation($input: CreateViewFilterInput!) { createViewFilter(input: $input) { id } }`, {
      input: { viewId: view.id, fieldMetadataId: fieldId(f.field), operand: f.operand, value: filterValue(f) },
    });
  }
}

// --- the Jobs dashboard ---------------------------------------------------------

const DASHBOARD_TITLE = "Job applications";
/** Earlier titles, rebuilt under the new one. */
const DASHBOARD_WAS = ["Jobs"];
const TIMEZONE = "Asia/Kolkata";
const MONDAY = 1;

type Grid = { row: number; column: number; rowSpan: number; columnSpan: number };
type WidgetSpec = {
  title: string;
  object: string;
  grid: Grid;
  chart:
    | { kind: "count"; filters?: Filter[] }
    | { kind: "sum"; field: string; filters?: Filter[] }
    | { kind: "pie"; by: string; filters?: Filter[]; color: string }
    | { kind: "bar"; by: string; filters?: Filter[]; color: string; horizontal?: boolean; byDay?: boolean; byWeek?: boolean; stackBy?: string; sumOf?: string }
    | { kind: "line"; by: string; filters?: Filter[]; color: string; cumulative?: boolean; byWeek?: boolean }
    | { kind: "table"; view: string; columns: Column[]; sort: [string, "ASC" | "DESC"]; filters?: Filter[] };
};
type TabSpec = { title: string; widgets: WidgetSpec[] };

const g = (row: number, column: number, rowSpan: number, columnSpan: number): Grid => ({ row, column, rowSpan, columnSpan });
const days = (n: number): Filter[] => [{ field: "submittedAt", operand: "IS_RELATIVE", value: pastDays(n) }];

/** One tab: counts, then the time series, then what came in, then the log itself. */
export const DASHBOARD: TabSpec[] = [
  {
    title: "Applications",
    widgets: [
      { title: "Today", object: "application", grid: g(0, 0, 2, 3), chart: { kind: "count", filters: days(1) } },
      { title: "Last 7 days", object: "application", grid: g(0, 3, 2, 3), chart: { kind: "count", filters: days(7) } },
      { title: "Last 30 days", object: "application", grid: g(0, 6, 2, 3), chart: { kind: "count", filters: days(30) } },
      { title: "All time", object: "application", grid: g(0, 9, 2, 3), chart: { kind: "count" } },
      {
        title: "Applications per day, by role (last 30 days)",
        object: "application",
        grid: g(2, 0, 7, 12),
        chart: { kind: "bar", by: "submittedAt", byDay: true, stackBy: "jobRole", color: "blue", filters: days(30) },
      },
      { title: "Applications per week", object: "application", grid: g(9, 0, 6, 6), chart: { kind: "bar", by: "submittedAt", byWeek: true, color: "sky" } },
      { title: "All applications over time", object: "application", grid: g(9, 6, 6, 6), chart: { kind: "line", by: "submittedAt", byWeek: true, cumulative: true, color: "green" } },
      { title: "Role, last 30 days", object: "application", grid: g(15, 0, 7, 6), chart: { kind: "bar", by: "jobRole", horizontal: true, color: "orange", filters: days(30) } },
      { title: "Area, last 30 days", object: "application", grid: g(15, 6, 7, 6), chart: { kind: "bar", by: "area", horizontal: true, color: "turquoise", filters: days(30) } },
      {
        title: "Latest applications",
        object: "application",
        grid: g(22, 0, 10, 12),
        chart: {
          kind: "table",
          view: "Dashboard · latest applications",
          columns: [["name", 130], ["submittedAt", 160], ["person", 170], ["phone", 150], ["jobRole", 150], ["area", 190], "experience", "canStart", ["message", 280]],
          sort: ["submittedAt", "DESC"],
        },
      },
    ],
  },
];

/** Dashboard-backing views of earlier dashboards, removed with them. */
const RETIRED_WIDGET_VIEWS = ["Dashboard · to call"];

function chartFilter(obj: MetaObject, filters: Filter[] | undefined) {
  if (!filters?.length) return undefined;
  const groupId = randomUUID();
  return {
    recordFilterGroups: [{ id: groupId, logicalOperator: "AND" }],
    recordFilters: filters.map((f) => {
      const field = obj.fields.edges.find((e) => e.node.name === f.field)!.node;
      const value = filterValue(f);
      return { id: randomUUID(), fieldMetadataId: field.id, type: field.type, label: field.name, operand: f.operand, value, displayValue: value, recordFilterGroupId: groupId };
    }),
  };
}

async function widgetInput(gql: Gql, objects: MetaObject[], w: WidgetSpec) {
  const obj = objects.find((o) => o.nameSingular === w.object)!;
  const fieldId = fieldIdIn(obj);
  const position = { layoutMode: "GRID", ...w.grid };
  const common = { timezone: TIMEZONE, firstDayOfTheWeek: MONDAY };
  const c = w.chart;
  if (c.kind === "table") {
    // A dedicated TABLE_WIDGET view backs the table (it stays out of the view pickers).
    const views = (await gql<{ getViews: ViewRow[] }>("/metadata", VIEW_QUERY, { id: obj.id })).getViews;
    for (const old of views.filter((v) => v.name === c.view)) await gql("/metadata", `mutation($id: String!) { destroyView(id: $id) }`, { id: old.id });
    const { createView } = await gql<{ createView: { id: string } }>("/metadata", `mutation($input: CreateViewInput!) { createView(input: $input) { id } }`, {
      input: { name: c.view, objectMetadataId: obj.id, type: "TABLE_WIDGET", icon: "IconTable", visibility: "WORKSPACE" },
    });
    const viewId = createView.id;
    await gql("/metadata", `mutation($inputs: [CreateViewFieldInput!]!) { createManyViewFields(inputs: $inputs) { id } }`, {
      inputs: c.columns.map((col, i) => {
        const [name, size] = typeof col === "string" ? [col, 150] : col;
        return { viewId, fieldMetadataId: fieldId(name), isVisible: true, position: i, size };
      }),
    });
    await gql("/metadata", `mutation($input: CreateViewSortInput!) { createViewSort(input: $input) { id } }`, { input: { viewId, fieldMetadataId: fieldId(c.sort[0]), direction: c.sort[1] } });
    for (const f of c.filters ?? []) {
      await gql("/metadata", `mutation($input: CreateViewFilterInput!) { createViewFilter(input: $input) { id } }`, {
        input: { viewId, fieldMetadataId: fieldId(f.field), operand: f.operand, value: filterValue(f) },
      });
    }
    return { title: w.title, type: "RECORD_TABLE", objectMetadataId: obj.id, position, configuration: { configurationType: "RECORD_TABLE", viewId } };
  }
  const count = { aggregateFieldMetadataId: fieldId("id"), aggregateOperation: "COUNT" };
  const filter = chartFilter(obj, c.filters);
  let configuration: Record<string, unknown>;
  if (c.kind === "count" || c.kind === "sum") {
    configuration = {
      configurationType: "AGGREGATE_CHART",
      ...(c.kind === "sum" ? { aggregateFieldMetadataId: fieldId(c.field), aggregateOperation: "SUM" } : count),
      displayDataLabel: false,
      prefix: "",
      ...common,
    };
  } else if (c.kind === "pie") {
    configuration = {
      configurationType: "PIE_CHART",
      ...count,
      groupByFieldMetadataId: fieldId(c.by),
      orderBy: "FIELD_POSITION_ASC",
      displayDataLabel: true,
      showCenterMetric: true,
      displayLegend: true,
      color: c.color,
      ...common,
    };
  } else if (c.kind === "line") {
    configuration = {
      configurationType: "LINE_CHART",
      ...count,
      primaryAxisGroupByFieldMetadataId: fieldId(c.by),
      primaryAxisDateGranularity: c.byWeek ? "WEEK" : "DAY",
      primaryAxisOrderBy: "FIELD_ASC",
      axisNameDisplay: "NONE",
      displayDataLabel: false,
      displayLegend: false,
      color: c.color,
      isCumulative: Boolean(c.cumulative),
      ...common,
    };
  } else {
    configuration = {
      configurationType: "BAR_CHART",
      ...(c.sumOf ? { aggregateFieldMetadataId: fieldId(c.sumOf), aggregateOperation: "SUM" } : count),
      primaryAxisGroupByFieldMetadataId: fieldId(c.by),
      primaryAxisOrderBy: c.byDay || c.byWeek ? "FIELD_ASC" : c.horizontal ? "VALUE_DESC" : "FIELD_POSITION_ASC",
      ...(c.byDay || c.byWeek ? { primaryAxisDateGranularity: c.byWeek ? "WEEK" : "DAY" } : {}),
      ...(c.stackBy ? { secondaryAxisGroupByFieldMetadataId: fieldId(c.stackBy), secondaryAxisOrderBy: "FIELD_POSITION_ASC" } : {}),
      axisNameDisplay: "NONE",
      displayDataLabel: !c.stackBy,
      displayLegend: Boolean(c.stackBy),
      color: c.color,
      layout: c.horizontal ? "HORIZONTAL" : "VERTICAL",
      isCumulative: false,
      ...common,
    };
  }
  if (filter) configuration.filter = filter;
  return { title: w.title, type: "GRAPH", objectMetadataId: obj.id, position, configuration };
}

type DashboardRow = { id: string; title: string; pageLayoutId: string | null };

async function ensureDashboard(gql: Gql, objects: MetaObject[], o: Options): Promise<string | null> {
  const existing = (
    await gql<{ dashboards: { edges: { node: DashboardRow }[] } }>("/graphql", `{ dashboards(first: 50) { edges { node { id title pageLayoutId } } } }`)
  ).dashboards.edges.map((e) => e.node).filter((d) => d.title === DASHBOARD_TITLE || DASHBOARD_WAS.includes(d.title));
  if (existing.length && !o.reset && existing.every((d) => d.title === DASHBOARD_TITLE)) return existing[0].id;
  o.step(`${existing.length ? "rebuilding" : "creating"} the "${DASHBOARD_TITLE}" dashboard (${DASHBOARD.map((t) => t.title).join(", ")})`);
  if (o.dryRun) return existing[0]?.id ?? null;
  const appViews = (await gql<{ getViews: ViewRow[] }>("/metadata", VIEW_QUERY, { id: objects.find((x) => x.nameSingular === "application")!.id })).getViews;
  for (const v of appViews.filter((v) => RETIRED_WIDGET_VIEWS.includes(v.name))) await gql("/metadata", `mutation($id: String!) { destroyView(id: $id) }`, { id: v.id });
  for (const d of existing) {
    await gql("/graphql", `mutation($id: UUID!) { deleteDashboard(id: $id) { id } }`, { id: d.id });
    await gql("/graphql", `mutation($id: UUID!) { destroyDashboard(id: $id) { id } }`, { id: d.id });
    if (d.pageLayoutId) await gql("/metadata", `mutation($id: String!) { destroyPageLayout(id: $id) }`, { id: d.pageLayoutId }).catch(() => undefined);
  }
  const { createPageLayout } = await gql<{ createPageLayout: { id: string } }>(
    "/metadata",
    `mutation($input: CreatePageLayoutInput!) { createPageLayout(input: $input) { id } }`,
    { input: { name: DASHBOARD_TITLE, type: "DASHBOARD" } },
  );
  const pageLayoutId = createPageLayout.id;
  for (const [position, tab] of DASHBOARD.entries()) {
    const { createPageLayoutTab } = await gql<{ createPageLayoutTab: { id: string } }>(
      "/metadata",
      `mutation($input: CreatePageLayoutTabInput!) { createPageLayoutTab(input: $input) { id } }`,
      { input: { title: tab.title, pageLayoutId, position, layoutMode: "GRID" } },
    );
    for (const w of tab.widgets) {
      try {
        const input = { ...(await widgetInput(gql, objects, w)), pageLayoutTabId: createPageLayoutTab.id };
        await gql("/metadata", `mutation($input: CreatePageLayoutWidgetInput!) { createPageLayoutWidget(input: $input) { id } }`, { input });
      } catch (err) {
        o.step(`  widget "${w.title}" failed: ${err instanceof Error ? err.message.slice(0, 300) : err}`);
      }
    }
  }
  const { createDashboard } = await gql<{ createDashboard: { id: string } }>(
    "/graphql",
    `mutation($data: DashboardCreateInput!) { createDashboard(data: $data) { id } }`,
    { data: { title: DASHBOARD_TITLE, pageLayoutId, position: 0 } },
  );
  return createDashboard.id;
}

// --- object labels and the sidebar ---------------------------------------------------

/** Twenty's Opportunity is VSPL's crew request. */
const LABELS: Record<string, { labelSingular: string; labelPlural: string; icon?: string }> = {
  opportunity: { labelSingular: "Crew request", labelPlural: "Crew requests", icon: "IconUsersGroup" },
};

async function ensureLabels(gql: Gql, o: Options) {
  const objects = (
    await gql<{ objects: { edges: { node: { id: string; nameSingular: string; labelSingular: string; labelPlural: string } }[] } }>(
      "/metadata",
      `{ objects(paging:{first:500}) { edges { node { id nameSingular labelSingular labelPlural } } } }`,
    )
  ).objects.edges.map((e) => e.node);
  for (const [name, want] of Object.entries(LABELS)) {
    const obj = objects.find((x) => x.nameSingular === name);
    if (!obj || (obj.labelSingular === want.labelSingular && obj.labelPlural === want.labelPlural)) continue;
    o.step(`labelling ${name} as "${want.labelPlural}"`);
    if (o.dryRun) continue;
    await gql("/metadata", `mutation($input: UpdateOneObjectInput!) { updateOneObject(input: $input) { id } }`, {
      input: { id: obj.id, update: want },
    });
  }
}

type NavItem = { id: string; type: string; name: string | null; viewId: string | null; targetObjectMetadataId: string | null; targetRecordId: string | null; folderId: string | null; position: number; userWorkspaceId: string | null };

/**
 * The workspace sidebar, top to bottom: the Job applications dashboard,
 * then the objects in the order they are used. Items not listed
 * (Workflows, staff's own favourites) keep their place after these.
 */
const SIDEBAR: ({ dashboard: true } | { view: [string, string] } | { object: string })[] = [
  { dashboard: true },
  { object: "application" },
  { object: "person" },
  { object: "communication" },
  { object: "opportunity" },
  { object: "company" },
  { object: "task" },
  { object: "note" },
  { object: "dashboard" },
];

async function ensureSidebar(gql: Gql, dashboardId: string | null, o: Options) {
  const objects = (
    await gql<{ objects: { edges: { node: { id: string; nameSingular: string } }[] } }>("/metadata", `{ objects(paging:{first:500}) { edges { node { id nameSingular } } } }`)
  ).objects.edges.map((e) => e.node);
  const objectId = (name: string) => objects.find((x) => x.nameSingular === name)?.id;
  const items = (
    await gql<{ navigationMenuItems: NavItem[] }>(
      "/metadata",
      `{ navigationMenuItems { id type name viewId targetObjectMetadataId targetRecordId folderId position userWorkspaceId } }`,
    )
  ).navigationMenuItems.filter((i) => !i.userWorkspaceId && !i.folderId);
  const order: string[] = [];
  for (const entry of SIDEBAR) {
    let item: NavItem | undefined;
    let create: Record<string, unknown> | null = null;
    if ("dashboard" in entry) {
      if (!dashboardId) continue;
      item = items.find((i) => i.type === "RECORD" && i.targetRecordId === dashboardId);
      create = { type: "RECORD", targetRecordId: dashboardId, targetObjectMetadataId: objectId("dashboard"), name: DASHBOARD_TITLE, icon: "IconLayoutDashboard" };
    } else if ("view" in entry) {
      const [object, name] = entry.view;
      const views = (await gql<{ getViews: ViewRow[] }>("/metadata", VIEW_QUERY, { id: objectId(object) })).getViews;
      const view = views.find((v) => v.name === name);
      if (!view) continue;
      item = items.find((i) => i.type === "VIEW" && i.viewId === view.id);
      create = { type: "VIEW", viewId: view.id, name, icon: "IconPhoneCall" };
    } else {
      item = items.find((i) => i.type === "OBJECT" && i.targetObjectMetadataId === objectId(entry.object));
      if (!item) continue;
    }
    if (!item && create) {
      o.step(`adding ${String(create.name)} to the sidebar`);
      if (o.dryRun) continue;
      const { createNavigationMenuItem } = await gql<{ createNavigationMenuItem: { id: string } }>(
        "/metadata",
        `mutation($input: CreateNavigationMenuItemInput!) { createNavigationMenuItem(input: $input) { id } }`,
        { input: { ...create, position: order.length } },
      );
      order.push(createNavigationMenuItem.id);
    } else if (item) order.push(item.id);
  }
  const rest = items.filter((i) => !order.includes(i.id)).sort((a, b) => a.position - b.position);
  const all = [...order, ...rest.map((i) => i.id)];
  const moves = all.map((id, position) => ({ id, position })).filter(({ id, position }) => items.find((i) => i.id === id)?.position !== position);
  if (!moves.length) return;
  o.step(`ordering the sidebar (${moves.length} items)`);
  if (o.dryRun) return;
  for (const m of moves) {
    await gql("/metadata", `mutation($input: UpdateOneNavigationMenuItemInput!) { updateNavigationMenuItem(input: $input) { id } }`, {
      input: { id: m.id, update: { position: m.position } },
    });
  }
}

async function retireViews(gql: Gql, objects: MetaObject[], o: Options) {
  const nav = (await gql<{ navigationMenuItems: NavItem[] }>("/metadata", `{ navigationMenuItems { id type name viewId targetObjectMetadataId targetRecordId folderId position userWorkspaceId } }`)).navigationMenuItems;
  for (const object of new Set(RETIRED.map(([obj]) => obj))) {
    const obj = objects.find((x) => x.nameSingular === object);
    if (!obj) continue;
    const views = (await gql<{ getViews: ViewRow[] }>("/metadata", VIEW_QUERY, { id: obj.id })).getViews;
    for (const v of views.filter((v) => v.key !== "INDEX" && RETIRED.some(([ob, name]) => ob === object && name === v.name))) {
      o.step(`removing view ${object} "${v.name}"`);
      if (o.dryRun) continue;
      for (const item of nav.filter((i) => i.viewId === v.id)) await gql("/metadata", `mutation($id: UUID!) { deleteNavigationMenuItem(id: $id) { id } }`, { id: item.id });
      await gql("/metadata", `mutation($id: String!) { destroyView(id: $id) }`, { id: v.id });
    }
  }
}

export async function applyLayout(gql: Gql, objects: MetaObject[], o: Options) {
  await ensureLabels(gql, o);
  await retireViews(gql, objects, o);
  for (const spec of VIEWS) await ensureView(gql, objects, spec, o);
  const dashboardId = await ensureDashboard(gql, objects, o);
  await ensureSidebar(gql, dashboardId, o);
}
