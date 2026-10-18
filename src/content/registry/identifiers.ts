/**
 * Canonical identifiers. Each value here is stored somewhere else too
 * (quick-form answers, the talent database, Twenty, Chatwoot labels, Umami events, search rankings),
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
export const LOCALE_TAGS = ["en-IN", "hi-IN", "hi-Latn-IN", "pa-IN", "kn-IN"] as const;
export type LocaleTag = (typeof LOCALE_TAGS)[number];

/**
 * Cluster ids. Also the URL slug wherever a cluster has a page
 * (/jobs/<cluster>, /locations/<cluster>), with no state suffix. A cluster
 * gets pages only once it is in clusters.ts.
 */
export const CLUSTER_IDS = ["haridwar", "uttarakhand", "delhi-ncr", "bengaluru", "jalandhar", "saharanpur", "other", "punjab", "dehradun"] as const;
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

/**
 * Location pages (owner direction, 16 Oct 2026): a business page per region
 * and one per industrial area, under /locations. Every market's buyer page
 * lives here, Haridwar's included (17 Oct 2026: /haridwar-sidcul 308s to
 * /locations/haridwar); a region with no estate pages yet has an empty list.
 */
export const LOCATIONS_PATH = "/locations";
export const LOCATION_ESTATES = {
  // Selaqui stays listed (a stored slug) but moved to Dehradun's hub: MOVED_ESTATES.
  uttarakhand: ["selaqui"],
  bengaluru: ["peenya", "bommasandra-jigani-attibele", "electronic-city-whitefield", "hoskote-narasapura"],
  "delhi-ncr": ["gurugram-manesar", "noida-greater-noida", "faridabad-ghaziabad", "delhi-industrial-areas"],
  jalandhar: ["kapurthala", "jalandhar-focal-point", "phagwara-goraya"],
  haridwar: [],
  dehradun: ["selaqui"],
} as const satisfies Partial<Record<ClusterId, readonly string[]>>;
export type LocationCluster = keyof typeof LOCATION_ESTATES;
/**
 * Estates that moved to another region's hub, old path to new. The old URL
 * is retired and 308s to the new one (src/content/registry/pages.ts); its
 * slug stays in LOCATION_ESTATES, as stored ids never go.
 */
export const MOVED_ESTATES: Readonly<Record<string, string>> = {
  // Dehradun became a market of its own (18 Oct 2026).
  "/locations/uttarakhand/selaqui": "/locations/dehradun/selaqui",
};
export const LOCATION_CLUSTERS = Object.keys(LOCATION_ESTATES) as LocationCluster[];
export const locationPath = (cluster: LocationCluster) => `${LOCATIONS_PATH}/${cluster}`;
export const estatePath = (cluster: LocationCluster, estate: string) => `${LOCATIONS_PATH}/${cluster}/${estate}`;

/** The business form keeps its URL; its page heading is "Request a crew". */
export const BUSINESS_FORM_PATH = "/contact";

/** A cluster's buyer hub. */
export const locationHubPath = (cluster: Exclude<ClusterId, "other">) => `/locations/${cluster}`;

/** Jobs hubs share the /jobs/<slug> namespace with roles and hubs; see content:check. */
export const jobsHubPath = (cluster: Exclude<ClusterId, "other">) => `/jobs/${cluster}`;

/** Wage pages use full state slugs; short codes 308 to them. */
export const WAGE_STATE_SLUGS = ["uttarakhand", "uttar-pradesh", "delhi", "haryana", "punjab", "karnataka"] as const;
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
/** Labour Welfare Fund by state (18 Oct 2026), from the employer dues in src/content/statutory.ts. */
export const LWF_PATH = "/labour-welfare-fund";
/** The VDA and DA revision tracker (18 Oct 2026), built from the same wage dataset. */
export const WAGE_VDA_PATH = `${WAGE_HUB_PATH}/vda`;

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
/** Jalandhar–Kapurthala's (jobs hub published 17 Oct 2026). Append-only too. */
export const JALANDHAR_AREA_IDS = ["jalandhar:kapurthala", "jalandhar:city", "jalandhar:phagwara-goraya", "jalandhar:outside"] as const;
/**
 * Uttarakhand outside Haridwar and Punjab outside Jalandhar–Kapurthala (jobs
 * hubs published 17 Oct 2026), each with an answer that files under the
 * nearer market (uttarakhand:haridwar → haridwar). Append-only too.
 */
export const UTTARAKHAND_AREA_IDS = ["uttarakhand:haridwar", "uttarakhand:dehradun-selaqui", "uttarakhand:udham-singh-nagar", "uttarakhand:other", "uttarakhand:outside"] as const;
export const PUNJAB_AREA_IDS = ["punjab:jalandhar-kapurthala", "punjab:ludhiana", "punjab:mohali", "punjab:amritsar", "punjab:other", "punjab:outside"] as const;
/** Dehradun's (jobs hub published 18 Oct 2026): Selaqui–Sahaspur, the city, Rishikesh–Doiwala, Vikasnagar, outside. Append-only too. */
export const DEHRADUN_AREA_IDS = ["dehradun:selaqui-sahaspur", "dehradun:city", "dehradun:rishikesh-doiwala", "dehradun:vikasnagar", "dehradun:outside"] as const;
/** The form with no market of its own (no signal yet): which market the person lives in. Append-only too. */
export const MARKET_AREA_IDS = ["market:haridwar", "market:uttarakhand", "market:jalandhar", "market:punjab", "market:bengaluru", "market:other", "market:dehradun"] as const;
/** The rest of the state on the Haridwar and Jalandhar forms, filed under the state's market (17 Oct 2026). Append-only too. */
export const REST_OF_STATE_AREA_IDS = ["haridwar:rest-of-uttarakhand", "jalandhar:rest-of-punjab", "dehradun:rest-of-uttarakhand"] as const;
