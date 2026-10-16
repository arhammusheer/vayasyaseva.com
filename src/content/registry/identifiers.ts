/**
 * Canonical identifiers. Each value here is stored somewhere else too
 * (quick-form answers, n8n, Chatwoot labels, Umami events, search rankings),
 * so changing one later breaks data or loses rankings. Add values; never
 * rename or remove one.
 *
 * Keep this file dependency-free: the proxy, scripts and tests import it.
 */

/**
 * Live locales (BCP 47). src/lib/i18n.ts holds their labels, URL segments
 * and publish flags. Latin-script variants exist only for Hindi, the one
 * language people often search in Latin letters.
 */
export const LOCALE_TAGS = ["en-IN", "hi-IN", "hi-Latn-IN"] as const;
export type LocaleTag = (typeof LOCALE_TAGS)[number];

/**
 * Cluster ids. Also the URL slug wherever a cluster has a page
 * (/jobs/<cluster>, /locations/<cluster>), with no state suffix. A cluster
 * gets pages only once it is in clusters.ts.
 */
export const CLUSTER_IDS = ["haridwar", "uttarakhand", "delhi-ncr", "bengaluru", "jalandhar", "saharanpur", "other"] as const;
export type ClusterId = (typeof CLUSTER_IDS)[number];

/**
 * Page status, one enum for every kind of page.
 * - draft: not built; the URL 404s (built only when VSPL_SHOW_DRAFTS=1 is
 *   set for the build; it is a build-time flag, inlined by next.config.ts).
 * - review: built, noindex, unlinked, not in the sitemap.
 * - published: indexed, in the sitemap, linkable.
 * - paused: built, noindex, not in the sitemap; the page says plainly that
 *   we're not taking applications or new work there, and links to it still
 *   work. Set by a person, never automatically. Only cluster jobs hubs and
 *   buyer hubs can show the notice (PAUSABLE_KINDS in ./index.ts);
 *   content:check rejects `paused` on any other kind of page.
 * - retired: not built; 308 to `retiredTo` when set, else 404. A page can
 *   retire some languages and keep others: `retiredTo` then names a target
 *   per retired language (pages.ts).
 *
 * A published page can also be `noindex` (pages.ts): built, linkable and
 * noindex, out of the sitemap, hreflang and llms.txt.
 */
export const PAGE_STATUSES = ["draft", "review", "published", "paused", "retired"] as const;
export type PageStatus = (typeof PAGE_STATUSES)[number];

/** Who a page is for. It decides the layout and whether the phone may appear. */
export const AUDIENCES = ["business", "jobs", "mixed"] as const;
export type Audience = (typeof AUDIENCES)[number];

/** The Haridwar buyer hub keeps its URL; /locations/haridwar 308s to it. */
export const HARIDWAR_HUB_PATH = "/haridwar-sidcul";

/**
 * Location pages (owner direction, 16 Oct 2026): a business page per region
 * and one per industrial area, under /locations. Haridwar keeps its own page
 * (/haridwar-sidcul), linked from the Uttarakhand page.
 */
export const LOCATIONS_PATH = "/locations";
export const LOCATION_ESTATES = {
  uttarakhand: ["selaqui"],
  bengaluru: ["peenya", "bommasandra-jigani-attibele", "electronic-city-whitefield", "hoskote-narasapura"],
  "delhi-ncr": ["gurugram-manesar", "noida-greater-noida", "faridabad-ghaziabad", "delhi-industrial-areas"],
} as const satisfies Partial<Record<ClusterId, readonly string[]>>;
export type LocationCluster = keyof typeof LOCATION_ESTATES;
export const LOCATION_CLUSTERS = Object.keys(LOCATION_ESTATES) as LocationCluster[];
export const locationPath = (cluster: LocationCluster) => `${LOCATIONS_PATH}/${cluster}`;
export const estatePath = (cluster: LocationCluster, estate: string) => `${LOCATIONS_PATH}/${cluster}/${estate}`;

/** Industrial areas of Haridwar district are sections of the hub, not pages. */
export const HARIDWAR_SECTION_ANCHORS = ["bhagwanpur", "bahadrabad", "roorkee"] as const;

/** The business form keeps its URL; its page heading is "Request a crew". */
export const BUSINESS_FORM_PATH = "/contact";

/** Buyer hubs for clusters other than Haridwar. */
export const locationHubPath = (cluster: Exclude<ClusterId, "haridwar" | "other">) => `/locations/${cluster}`;

/** Jobs hubs share the /jobs/<slug> namespace with roles and hubs; see content:check. */
export const jobsHubPath = (cluster: Exclude<ClusterId, "other">) => `/jobs/${cluster}`;

/** Wage pages use full state slugs; short codes 308 to them. */
export const WAGE_STATE_SLUGS = ["uttarakhand", "uttar-pradesh", "delhi", "haryana", "karnataka"] as const;
export type WageStateSlug = (typeof WAGE_STATE_SLUGS)[number];
export const WAGE_STATE_CODES = { up: "uttar-pradesh", dl: "delhi", uk: "uttarakhand" } as const satisfies Record<
  string,
  WageStateSlug
>;
export const WAGE_HUB_PATH = "/minimum-wages";
export const wageStatePath = (state: WageStateSlug) => `${WAGE_HUB_PATH}/${state}`;
/**
 * Static pages beside the state pages under /minimum-wages. Their slugs are
 * reserved: content:check fails a wage state slug or code that takes one.
 */
export const WAGE_METHOD_PATH = `${WAGE_HUB_PATH}/how-we-check`;

/** Guides. No agency word in any slug, title or H1. */
export const GUIDE_SLUGS = ["new-labour-codes", "what-is-contract-labour", "contract-labour-act"] as const;
export type GuideSlug = (typeof GUIDE_SLUGS)[number];
export const guidePath = (slug: GuideSlug) => `/guides/${slug}`;

/**
 * Haridwar's quick-form area answers (stored values). New clusters add
 * `<cluster>:<area>` ids, plus `relocate`, when their jobs hub publishes.
 */
export const HARIDWAR_AREA_IDS = ["sidcul-bahadrabad", "haridwar-jwalapur", "roorkee-bhagwanpur", "laksar", "outside"] as const;
/** Bengaluru's (jobs hub published 16 Oct 2026): the four directions and outside the city. Append-only too. */
export const BENGALURU_AREA_IDS = ["bengaluru:north", "bengaluru:south", "bengaluru:east", "bengaluru:west", "bengaluru:outside"] as const;
