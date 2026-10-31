/**
 * Canonical identifiers. Each value here is stored somewhere else too
 * (quick-form answers, the talent database, Twenty, Umami events, search rankings),
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
export const CLUSTER_IDS = ["haridwar", "uttarakhand", "delhi-ncr", "bengaluru", "jalandhar", "saharanpur", "other", "punjab", "dehradun", "kapurthala", "visakhapatnam", "andhra-pradesh", "hyderabad", "telangana"] as const;
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
  // Visakhapatnam (22 Oct 2026): its four industrial belts, Anakapalli district's included.
  visakhapatnam: ["parawada-pharma-city", "atchutapuram-rambilli", "duvvada-vsez", "gajuwaka"],
  // Hyderabad (27 Oct 2026): its five industrial belts, from TGIIC's park list.
  hyderabad: ["patancheru-pashamylaram", "jeedimetla-medchal", "cherlapally-nacharam", "genome-valley", "shamshabad-kothur"],
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

/** Jobs hubs share the /jobs/<slug> namespace with roles and hubs; see content:check. */
export const jobsHubPath = (cluster: Exclude<ClusterId, "other">) => `/jobs/${cluster}`;

/** Wage pages use full state slugs; short codes 308 to them. */
export const WAGE_STATE_SLUGS = ["uttarakhand", "uttar-pradesh", "delhi", "haryana", "punjab", "karnataka", "andhra-pradesh", "telangana"] as const;
export type WageStateSlug = (typeof WAGE_STATE_SLUGS)[number];
/** A wage state's region code (ISO 3166-2:IN without "IN-"), the code src/markets uses. */
export const WAGE_STATE_REGIONS = {
  uttarakhand: "UK",
  "uttar-pradesh": "UP",
  delhi: "DL",
  haryana: "HR",
  punjab: "PB",
  karnataka: "KA",
  "andhra-pradesh": "AP",
  // ISO 3166-2:IN since November 2023 (IN-TG before); the crew form stores TS.
  telangana: "TS",
} as const satisfies Record<WageStateSlug, string>;
/**
 * Short codes (/minimum-wages/ka) that 308 to a state's page once it is
 * published. Every state has one (tests/wages.spec.mjs); Telangana answers to
 * both its codes, TS and TG (WAGE_STATE_REGIONS).
 */
export const WAGE_STATE_CODES = {
  up: "uttar-pradesh",
  dl: "delhi",
  uk: "uttarakhand",
  hr: "haryana",
  pb: "punjab",
  ka: "karnataka",
  ap: "andhra-pradesh",
  ts: "telangana",
  tg: "telangana",
} as const satisfies Record<string, WageStateSlug>;
export const WAGE_HUB_PATH = "/minimum-wages";
export const wageStatePath = (state: WageStateSlug) => `${WAGE_HUB_PATH}/${state}`;
/**
 * Static pages beside the state pages under /minimum-wages. Their slugs are
 * reserved: content:check fails a wage state slug or code that takes one.
 */
export const WAGE_METHOD_PATH = `${WAGE_HUB_PATH}/how-we-check`;
/** Labour Welfare Fund by state (18 Oct 2026), from the employer dues in src/content/statutory.ts. */
export const LWF_PATH = "/labour-welfare-fund";
/** States with a Labour Welfare Fund page of their own (18 Oct 2026: the two with real search demand). Append-only. */
export const LWF_STATE_SLUGS = ["haryana", "delhi"] as const;
export type LwfStateSlug = (typeof LWF_STATE_SLUGS)[number];
export const lwfStatePath = (state: LwfStateSlug) => `${LWF_PATH}/${state}`;
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
/**
 * Jalandhar's (jobs hub published 17 Oct 2026, as Jalandhar–Kapurthala).
 * Since Kapurthala's own jobs market (20 Oct 2026) jalandhar:kapurthala is
 * the Kapurthala answer on this form, filed there, and
 * jalandhar:phagwara-goraya is off the forms (Phagwara is in Kapurthala
 * district, Goraya in Jalandhar's): Goraya–Phillaur replaces it. Append-only too.
 */
export const JALANDHAR_AREA_IDS = ["jalandhar:kapurthala", "jalandhar:city", "jalandhar:phagwara-goraya", "jalandhar:outside", "jalandhar:goraya-phillaur"] as const;
/**
 * Uttarakhand outside Haridwar and Punjab outside Jalandhar and Kapurthala (jobs
 * hubs published 17 Oct 2026), each with an answer that files under the
 * nearer market (uttarakhand:haridwar → haridwar). Append-only too.
 */
export const UTTARAKHAND_AREA_IDS = ["uttarakhand:haridwar", "uttarakhand:dehradun-selaqui", "uttarakhand:udham-singh-nagar", "uttarakhand:other", "uttarakhand:outside"] as const;
export const PUNJAB_AREA_IDS = ["punjab:jalandhar-kapurthala", "punjab:ludhiana", "punjab:mohali", "punjab:amritsar", "punjab:other", "punjab:outside", "punjab:jalandhar", "punjab:kapurthala"] as const;
/** Dehradun's (jobs hub published 18 Oct 2026): Selaqui–Sahaspur, the city, Rishikesh–Doiwala, Vikasnagar, outside. Append-only too. */
export const DEHRADUN_AREA_IDS = ["dehradun:selaqui-sahaspur", "dehradun:city", "dehradun:rishikesh-doiwala", "dehradun:vikasnagar", "dehradun:outside"] as const;
/**
 * Kapurthala's (jobs hub published 20 Oct 2026, its own jobs market): the
 * city, Phagwara (Kapurthala district's other part), Sultanpur Lodhi and
 * Bholath, outside, and Jalandhar, filed under Jalandhar's market. Append-only too.
 */
export const KAPURTHALA_AREA_IDS = ["kapurthala:city", "kapurthala:phagwara", "kapurthala:sultanpur-lodhi", "kapurthala:outside", "kapurthala:jalandhar"] as const;
/**
 * Visakhapatnam's (jobs hub published 22 Oct 2026, a worker list): the city,
 * Gajuwaka and the Steel Plant–Duvvada side, Pendurthi–Sabbavaram,
 * Anakapalli district's belt (Anakapalli, Parawada, Atchutapuram), outside.
 * Append-only too.
 */
export const VISAKHAPATNAM_AREA_IDS = ["visakhapatnam:city", "visakhapatnam:gajuwaka", "visakhapatnam:pendurthi", "visakhapatnam:anakapalli", "visakhapatnam:outside"] as const;
/**
 * Andhra Pradesh outside Visakhapatnam (jobs hub published 22 Oct 2026, a
 * worker list like Punjab's), with Visakhapatnam's answer filed under its
 * own market. Append-only too.
 */
export const ANDHRA_PRADESH_AREA_IDS = ["andhra-pradesh:visakhapatnam", "andhra-pradesh:vijayawada-guntur", "andhra-pradesh:kakinada-rajahmundry", "andhra-pradesh:nellore-tirupati", "andhra-pradesh:other", "andhra-pradesh:outside"] as const;
/**
 * Hyderabad's (jobs hub published 27 Oct 2026, a worker list): the city,
 * Patancheru–Pashamylaram (Sangareddy side), Jeedimetla–Medchal and the
 * north, Uppal–Cherlapally and the east, Shamshabad–Kothur and the south,
 * outside. Append-only too.
 */
export const HYDERABAD_AREA_IDS = ["hyderabad:city", "hyderabad:patancheru", "hyderabad:jeedimetla-medchal", "hyderabad:uppal-cherlapally", "hyderabad:shamshabad-kothur", "hyderabad:outside"] as const;
/**
 * Telangana outside Hyderabad (jobs hub published 27 Oct 2026, a worker
 * list like Andhra Pradesh's), with Hyderabad's answer filed under its own
 * market. Append-only too.
 */
export const TELANGANA_AREA_IDS = ["telangana:hyderabad", "telangana:warangal", "telangana:karimnagar-ramagundam", "telangana:nalgonda-suryapet", "telangana:mahabubnagar-jadcherla", "telangana:other", "telangana:outside"] as const;
/** The form with no market of its own (no signal yet): which market the person lives in. Append-only too. */
export const MARKET_AREA_IDS = ["market:haridwar", "market:uttarakhand", "market:jalandhar", "market:punjab", "market:bengaluru", "market:other", "market:dehradun", "market:kapurthala", "market:visakhapatnam", "market:andhra-pradesh", "market:hyderabad", "market:telangana"] as const;
/** The rest of the state on the Haridwar, Jalandhar, Dehradun, Kapurthala, Visakhapatnam and Hyderabad forms, filed under the state's market (17 Oct 2026). Append-only too. */
export const REST_OF_STATE_AREA_IDS = ["haridwar:rest-of-uttarakhand", "jalandhar:rest-of-punjab", "dehradun:rest-of-uttarakhand", "kapurthala:rest-of-punjab", "visakhapatnam:rest-of-andhra-pradesh", "hyderabad:rest-of-telangana"] as const;
