// What the market tables decide today, as one table of inputs and outputs
// (tests/fixtures/market-behaviour.json, pinned by tests/markets.spec.mjs).
// A refactor must leave it unchanged; a change that means to move a decision
// (and bumps MODEL_VERSION in src/lib/intent/model.ts) rewrites it on purpose:
//   node scripts/write-behaviour-snapshots.mjs
import { join } from "node:path";
import { importTs, root } from "./register-ts.mjs";

export const MARKET_BEHAVIOUR_PATH = join(root, "tests/fixtures/market-behaviour.json");

const REGIONS = ["UK", "UT", "PB", "KA", "DL", "HR", "UP", "MH", null];
const PAGE_CLUSTERS = [null, "haridwar", "uttarakhand", "delhi-ncr", "bengaluru", "jalandhar", "punjab", "saharanpur", "other"];
const SOURCES = ["page", "link", "decision", "ask"];

/** A JSON-safe value: undefined becomes null, so the fixture keeps every key. */
const v = (x) => (x === undefined ? null : x);

export async function marketBehaviour() {
  const model = await importTs("src/lib/intent/model.ts");
  const rank = await importTs("src/lib/language-rank.ts");
  const { areaOptions } = await importTs("src/content/pages/quick-apply.ts");
  const { crewPrefill, KNOWN_PLACES } = await importTs("src/lib/crew-request.ts");
  const surfaces = await importTs("src/lib/intent/surfaces.ts");
  const { clusters } = await importTs("src/content/registry/index.ts");
  const markets = await importTs("src/markets/index.ts");
  const { MARKET_LABELS } = await importTs("src/markets/labels.ts");
  const { CLUSTER_IDS, LOCALE_TAGS } = await importTs("src/content/registry/identifiers.ts");

  const words = [...new Set(model.PLACES.flatMap((p) => p.words))].sort();
  // Ad-tag spellings: the words (one vocabulary for places and tags since
  // model v3), campaign-style variants, multi-word words written with `_`
  // and `-`, and tags that must name no market or several.
  const multiWord = words.filter((w) => w.includes(" "));
  const adTags = [
    ...words,
    ...words.map((w) => `jobs_${w.replace(/ /g, "_")}`),
    ...multiWord.flatMap((w) => [w.replace(/ /g, "_"), w.replace(/ /g, "-"), `jobs-${w.replace(/ /g, "-")}`]),
    "uttarakhand", "punjab", "delhi", "ncr", "blr", "search_jobs", "punjabi_jobs", "jobs_jalandhar_and_ludhiana",
    "jobs_saharanpur", "jobs_delhi_ncr", "Jobs-Haridwar-2026", "uttarakhand_haridwar_jobs", "noida_bangalore",
  ];

  const table = {
    tables: {
      MARKET_ORDER: model.MARKET_ORDER,
      REGION_CLUSTERS: model.REGION_CLUSTERS,
      SITE_STATE_CLUSTERS: model.SITE_STATE_CLUSTERS,
      CLUSTER_STATES: model.CLUSTER_STATES,
    },
    placeState: Object.fromEntries(words.map((w) => [w, v(model.placeState(w))])),
    geoCluster: Object.fromEntries(
      REGIONS.flatMap((r) => [[`${r}|`, v(model.geoCluster(r))], ...words.map((w) => [`${r}|${w}`, v(model.geoCluster(r, w))])]),
    ),
    siteCluster: Object.fromEntries([
      ...REGIONS.flatMap((s) => words.map((w) => [`${s}|${w}|`, v(model.siteCluster(s, w))])),
      ...REGIONS.flatMap((s) => PAGE_CLUSTERS.map((p) => [`${s}||${p}`, v(model.siteCluster(s, null, p))])),
    ]),
    clustersInUtm: Object.fromEntries(adTags.map((t) => [t, model.clustersInUtm([t])])),
    urlIntent: Object.fromEntries([
      ...[...CLUSTER_IDS, "mumbai"].map((c) => [`?cluster=${c}`, v(rank.urlIntent(new URLSearchParams({ cluster: c })))]),
      ...adTags.map((t) => [`?utm_campaign=${t}`, v(rank.urlIntent(new URLSearchParams({ utm_campaign: t })))]),
    ]),
    rankLocales: Object.fromEntries(
      [...CLUSTER_IDS, null].flatMap((cluster) =>
        REGIONS.flatMap((region) =>
          [null, "hi", "kn", "pa"].map((acceptLanguage) => [
            `cluster=${cluster}|region=${region}|accept=${acceptLanguage}`,
            rank.rankLocales(LOCALE_TAGS, { country: region ? "IN" : "US", region: region ?? undefined, acceptLanguage, cluster: cluster ?? undefined }),
          ]),
        ),
      ),
    ),
    rankLocalesByIntent: Object.fromEntries(
      CLUSTER_IDS.map((intent) => [intent, rank.rankLocales(LOCALE_TAGS, { country: "IN", region: "MH", intent })]),
    ),
    areaOptions: Object.fromEntries(
      [null, ...CLUSTER_IDS].flatMap((c) => SOURCES.map((s) => [`${c}|${s}`, areaOptions(c, s)])),
    ),
    crewPrefill: Object.fromEntries(Object.keys(KNOWN_PLACES).map((id) => [id, crewPrefill({ location: id }).fields])),
    labels: {
      businessLabel: Object.fromEntries(clusters.map((c) => [c.id, surfaces.businessLabel(c.id)])),
      JOBS_AREA_LABEL: surfaces.JOBS_AREA_LABEL,
      clusterNames: Object.fromEntries(clusters.map((c) => [c.id, MARKET_LABELS[c.id].name])),
      quickSwitch: Object.fromEntries(clusters.map((c) => [c.id, markets.quickSwitchFor(c.id)])),
    },
    orderedJobMarkets: surfaces.orderedJobMarkets(),
  };
  return JSON.parse(JSON.stringify(table));
}
