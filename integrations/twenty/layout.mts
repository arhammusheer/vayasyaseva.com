/**
 * How staff see the CRM, as code: the lists and boards (views), the record
 * pages' field order, the Jobs dashboard and the sidebar. Run by setup.mts.
 *
 * A view that does not exist is created; one that exists is left alone (staff
 * may have adjusted it) unless --reset-layout, which puts back its columns,
 * sort and filters. Columns are listed in order; every other field is hidden.
 * The dashboard is created once; --reset-layout rebuilds it.
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
  type: "TABLE" | "KANBAN" | "FIELDS_WIDGET";
  icon?: string;
  groupBy?: string;
  columns: Column[];
  sort?: [string, "ASC" | "DESC"];
  filters?: Filter[];
};

/** Twenty's relative date filter: last N days, in India time, weeks from Monday. */
const pastDays = (n: number) => `PAST_${n}_DAY;;Asia/Kolkata;;MONDAY;;`;
const ACTIVE = ["NEW", "NO_ANSWER", "SCREENED", "CALLABLE"];

const APPLICATION_CARD: Column[] = ["name", "person", "phone", "jobRole", "area", "experience", "canStart", "submittedAt"];
const WORKER_COLUMNS: Column[] = [
  ["name", 180], ["phones", 150], "workerStatus", ["workRoles", 220], ["clusters", 160], ["homeArea", 170], "language", ["lastAppliedAt", 150], ["applications", 180], ["lastContactAt", 150],
];

export const VIEWS: ViewSpec[] = [
  // Applications: the work queue first.
  {
    object: "application",
    name: "To call",
    type: "TABLE",
    icon: "IconPhoneCall",
    columns: [["name", 130], ["person", 170], ["phone", 150], "status", ["jobRole", 150], ["area", 190], "canStart", "experience", ["submittedAt", 150], ["message", 280]],
    sort: ["submittedAt", "ASC"],
    filters: [{ field: "status", operand: "IS", values: ["NEW", "NO_ANSWER"] }],
  },
  {
    object: "application",
    name: "Pipeline",
    was: ["By status"],
    type: "KANBAN",
    icon: "IconLayoutKanban",
    groupBy: "status",
    columns: APPLICATION_CARD,
    sort: ["submittedAt", "DESC"],
  },
  {
    object: "application",
    index: true,
    name: "All applications",
    type: "TABLE",
    icon: "IconFileText",
    columns: [
      ["name", 130], ["person", 170], ["phone", 150], "status", ["jobRole", 150], ["area", 190], "experience", "canStart", ["workWanted", 220],
      ["shifts", 150], "education", ["skills", 220], ["submittedAt", 150], "source", ["message", 280],
    ],
    sort: ["submittedAt", "DESC"],
  },
  {
    object: "application",
    name: "Callable pool",
    type: "TABLE",
    icon: "IconUserCheck",
    columns: [["name", 130], ["person", 170], ["phone", 150], ["jobRole", 150], ["workWanted", 220], ["area", 190], "experience", "education", ["shifts", 150], "canStart", ["skills", 220]],
    sort: ["submittedAt", "DESC"],
    filters: [{ field: "status", operand: "IS", values: ["CALLABLE"] }],
  },
  {
    object: "application",
    name: "By role",
    type: "KANBAN",
    icon: "IconTool",
    groupBy: "jobRole",
    columns: ["name", "person", "phone", "status", "area", "experience", "canStart"],
    sort: ["submittedAt", "DESC"],
    filters: [{ field: "status", operand: "IS", values: ACTIVE }],
  },
  {
    object: "application",
    name: "By area",
    type: "KANBAN",
    icon: "IconMapPin",
    groupBy: "area",
    columns: ["name", "person", "phone", "status", "jobRole", "experience", "canStart"],
    sort: ["submittedAt", "DESC"],
    filters: [{ field: "status", operand: "IS", values: ACTIVE }],
  },
  {
    object: "application",
    name: "Last 7 days",
    type: "TABLE",
    icon: "IconCalendarWeek",
    columns: [["name", 130], ["person", 170], ["phone", 150], "status", ["jobRole", 150], ["area", 190], "experience", "canStart", ["submittedAt", 150], "source"],
    sort: ["submittedAt", "DESC"],
    filters: [{ field: "submittedAt", operand: "IS_RELATIVE", value: pastDays(7) }],
  },
  {
    object: "application",
    name: "Application Record Page Fields",
    type: "FIELDS_WIDGET",
    columns: [
      "person", "phone", "status", "jobRole", "workWanted", "area", "experience", "education", "canStart", "shifts", "skills", "message",
      "submittedAt", "source", "cluster", "pagePath", "communications",
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
    name: "Callable workers",
    type: "TABLE",
    icon: "IconUserCheck",
    columns: WORKER_COLUMNS,
    sort: ["lastAppliedAt", "DESC"],
    filters: [
      { field: "personType", operand: "IS", values: ["WORKER"] },
      { field: "workerStatus", operand: "IS", values: ["CALLABLE"] },
    ],
  },
  {
    object: "person",
    name: "Workers by status",
    type: "KANBAN",
    icon: "IconLayoutKanban",
    groupBy: "workerStatus",
    columns: ["name", "phones", "workRoles", "clusters", "homeArea", "lastAppliedAt"],
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
    columns: [["name", 180], ["phones", 150], "personType", "workerStatus", ["workRoles", 200], ["clusters", 160], ["company", 170], ["emails", 200], ["lastContactAt", 150]],
    sort: ["createdAt", "DESC"],
  },
  {
    object: "person",
    name: "Person Record Page Fields",
    type: "FIELDS_WIDGET",
    columns: [
      "phones", "personType", "workerStatus", "workRoles", "clusters", "homeArea", "language", "lastAppliedAt", "lastContactAt", "applications",
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
        },
      },
    );
    view = { id: createView.id, name: spec.name, key: null, type: spec.type, viewFields: [], viewSorts: [], viewFilters: [] };
    apply = true;
  } else if (view.name !== spec.name && !spec.index) {
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

const DASHBOARD_TITLE = "Jobs";
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
    | { kind: "bar"; by: string; filters?: Filter[]; color: string; horizontal?: boolean; byDay?: boolean; sumOf?: string }
    | { kind: "table"; view: string; columns: Column[]; sort: [string, "ASC" | "DESC"]; filters?: Filter[] };
};
type TabSpec = { title: string; widgets: WidgetSpec[] };

const g = (row: number, column: number, rowSpan: number, columnSpan: number): Grid => ({ row, column, rowSpan, columnSpan });
const TO_CALL: Filter[] = [{ field: "status", operand: "IS", values: ["NEW", "NO_ANSWER"] }];
const WORKERS: Filter[] = [{ field: "personType", operand: "IS", values: ["WORKER"] }];

export const DASHBOARD: TabSpec[] = [
  {
    title: "Applications",
    widgets: [
      { title: "To call", object: "application", grid: g(0, 0, 2, 3), chart: { kind: "count", filters: TO_CALL } },
      { title: "Applied, last 7 days", object: "application", grid: g(0, 3, 2, 3), chart: { kind: "count", filters: [{ field: "submittedAt", operand: "IS_RELATIVE", value: pastDays(7) }] } },
      { title: "Callable pool", object: "application", grid: g(0, 6, 2, 3), chart: { kind: "count", filters: [{ field: "status", operand: "IS", values: ["CALLABLE"] }] } },
      { title: "Placed", object: "application", grid: g(0, 9, 2, 3), chart: { kind: "count", filters: [{ field: "status", operand: "IS", values: ["PLACED"] }] } },
      {
        title: "Applications per day, last 30 days",
        object: "application",
        grid: g(2, 0, 6, 8),
        chart: { kind: "bar", by: "submittedAt", byDay: true, color: "blue", filters: [{ field: "submittedAt", operand: "IS_RELATIVE", value: pastDays(30) }] },
      },
      { title: "Where applications are", object: "application", grid: g(2, 8, 6, 4), chart: { kind: "pie", by: "status", color: "sky" } },
      { title: "Open applications by role", object: "application", grid: g(8, 0, 7, 6), chart: { kind: "bar", by: "jobRole", horizontal: true, color: "orange", filters: [{ field: "status", operand: "IS", values: ACTIVE }] } },
      { title: "Open applications by area", object: "application", grid: g(8, 6, 7, 6), chart: { kind: "bar", by: "area", horizontal: true, color: "turquoise", filters: [{ field: "status", operand: "IS", values: ACTIVE }] } },
      { title: "Experience", object: "application", grid: g(15, 0, 6, 4), chart: { kind: "pie", by: "experience", color: "blue" } },
      { title: "Can start", object: "application", grid: g(15, 4, 6, 4), chart: { kind: "pie", by: "canStart", color: "green" } },
      { title: "Source", object: "application", grid: g(15, 8, 6, 4), chart: { kind: "pie", by: "source", color: "purple" } },
      {
        title: "To call, oldest first",
        object: "application",
        grid: g(21, 0, 9, 12),
        chart: {
          kind: "table",
          view: "Dashboard · to call",
          columns: [["name", 130], ["person", 170], ["phone", 150], "status", ["jobRole", 150], ["area", 190], "canStart", "experience", ["submittedAt", 150]],
          sort: ["submittedAt", "ASC"],
          filters: TO_CALL,
        },
      },
    ],
  },
  {
    title: "Workers and SMS",
    widgets: [
      { title: "Workers", object: "person", grid: g(0, 0, 2, 3), chart: { kind: "count", filters: WORKERS } },
      { title: "Callable workers", object: "person", grid: g(0, 3, 2, 3), chart: { kind: "count", filters: [...WORKERS, { field: "workerStatus", operand: "IS", values: ["CALLABLE"] }] } },
      {
        title: "SMS delivered, last 7 days",
        object: "communication",
        grid: g(0, 6, 2, 3),
        chart: { kind: "count", filters: [{ field: "deliveryStatus", operand: "IS", values: ["DELIVERED"] }, { field: "statusAt", operand: "IS_RELATIVE", value: pastDays(7) }] },
      },
      { title: "SMS needing attention", object: "communication", grid: g(0, 9, 2, 3), chart: { kind: "count", filters: [{ field: "deliveryStatus", operand: "IS", values: ["FAILED", "UNKNOWN"] }] } },
      { title: "Workers by status", object: "person", grid: g(2, 0, 6, 6), chart: { kind: "pie", by: "workerStatus", color: "green", filters: WORKERS } },
      { title: "SMS delivery", object: "communication", grid: g(2, 6, 6, 6), chart: { kind: "pie", by: "deliveryStatus", color: "sky", filters: [{ field: "channel", operand: "IS", values: ["SMS"] }] } },
    ],
  },
  {
    title: "Crew requests",
    widgets: [
      { title: "Open crew requests", object: "opportunity", grid: g(0, 0, 2, 4), chart: { kind: "count", filters: [{ field: "stage", operand: "IS", values: ["NEW", "CONTACTED", "SITE_VISIT", "QUOTED"] }] } },
      { title: "Workers asked for, open requests", object: "opportunity", grid: g(0, 4, 2, 4), chart: { kind: "sum", field: "crewSize", filters: [{ field: "stage", operand: "IS", values: ["NEW", "CONTACTED", "SITE_VISIT", "QUOTED"] }] } },
      { title: "Won", object: "opportunity", grid: g(0, 8, 2, 4), chart: { kind: "count", filters: [{ field: "stage", operand: "IS", values: ["WON"] }] } },
      { title: "Crew requests by stage", object: "opportunity", grid: g(2, 0, 6, 6), chart: { kind: "bar", by: "stage", color: "purple" } },
      { title: "Workers asked for, by cluster", object: "opportunity", grid: g(2, 6, 6, 6), chart: { kind: "bar", by: "cluster", sumOf: "crewSize", color: "orange" } },
    ],
  },
];

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
  } else {
    configuration = {
      configurationType: "BAR_CHART",
      ...(c.sumOf ? { aggregateFieldMetadataId: fieldId(c.sumOf), aggregateOperation: "SUM" } : count),
      primaryAxisGroupByFieldMetadataId: fieldId(c.by),
      primaryAxisOrderBy: c.byDay ? "FIELD_ASC" : c.horizontal ? "VALUE_DESC" : "FIELD_POSITION_ASC",
      ...(c.byDay ? { primaryAxisDateGranularity: "DAY" } : {}),
      axisNameDisplay: "NONE",
      displayDataLabel: true,
      displayLegend: false,
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
  ).dashboards.edges.map((e) => e.node).filter((d) => d.title === DASHBOARD_TITLE);
  if (existing.length && !o.reset) return existing[0].id;
  o.step(`${existing.length ? "rebuilding" : "creating"} the "${DASHBOARD_TITLE}" dashboard (${DASHBOARD.map((t) => t.title).join(", ")})`);
  if (o.dryRun) return existing[0]?.id ?? null;
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
 * The workspace sidebar, top to bottom: the Jobs dashboard, the To call
 * queue, then the objects in the order staff use them. Items not listed
 * (Workflows, staff's own favourites) keep their place after these.
 */
const SIDEBAR: ({ dashboard: true } | { view: [string, string] } | { object: string })[] = [
  { dashboard: true },
  { view: ["application", "To call"] },
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

export async function applyLayout(gql: Gql, objects: MetaObject[], o: Options) {
  await ensureLabels(gql, o);
  for (const spec of VIEWS) await ensureView(gql, objects, spec, o);
  const dashboardId = await ensureDashboard(gql, objects, o);
  await ensureSidebar(gql, dashboardId, o);
}
