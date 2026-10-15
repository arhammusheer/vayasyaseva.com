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
 *   we're not taking applications or new work there. Set by a person, never
 *   automatically. Pages do not render that notice yet, so content:check
 *   rejects `paused` on a real page until the paused rendering lands.
 * - retired: not built; 308 to `retiredTo` when set, else 404.
 */
export const PAGE_STATUSES = ["draft", "review", "published", "paused", "retired"] as const;
export type PageStatus = (typeof PAGE_STATUSES)[number];

/** Who a page is for. It decides the layout and whether the phone may appear. */
export const AUDIENCES = ["business", "jobs", "mixed"] as const;
export type Audience = (typeof AUDIENCES)[number];

/** The Haridwar buyer hub keeps its URL; /locations/haridwar 308s to it. */
export const HARIDWAR_HUB_PATH = "/haridwar-sidcul";

/** Industrial areas of Haridwar district are sections of the hub, not pages. */
export const HARIDWAR_SECTION_ANCHORS = ["bhagwanpur", "bahadrabad", "roorkee"] as const;

/** The business form keeps its URL; its page heading is "Request a crew". */
export const BUSINESS_FORM_PATH = "/contact";

/** Buyer hubs for clusters other than Haridwar. */
export const locationHubPath = (cluster: Exclude<ClusterId, "haridwar" | "other">) => `/locations/${cluster}`;

/** Jobs hubs share the /jobs/<slug> namespace with roles and hubs; see content:check. */
export const jobsHubPath = (cluster: Exclude<ClusterId, "other">) => `/jobs/${cluster}`;

/** Wage pages use full state slugs; short codes 308 to them. */
export const WAGE_STATE_SLUGS = ["uttarakhand", "uttar-pradesh", "delhi", "haryana"] as const;
export type WageStateSlug = (typeof WAGE_STATE_SLUGS)[number];
export const WAGE_STATE_CODES = { up: "uttar-pradesh", dl: "delhi" } as const satisfies Record<
  string,
  WageStateSlug
>;
export const WAGE_HUB_PATH = "/minimum-wages";
export const wageStatePath = (state: WageStateSlug) => `${WAGE_HUB_PATH}/${state}`;

/** Guides. No agency word in any slug, title or H1. */
export const GUIDE_SLUGS = ["new-labour-codes", "what-is-contract-labour", "contract-labour-act"] as const;
export const guidePath = (slug: (typeof GUIDE_SLUGS)[number]) => `/guides/${slug}`;

/**
 * Haridwar's quick-form area answers (stored values). New clusters add
 * `<cluster>:<area>` ids, plus `relocate`, when their jobs hub publishes.
 */
export const HARIDWAR_AREA_IDS = ["sidcul-bahadrabad", "haridwar-jwalapur", "roorkee-bhagwanpur", "laksar", "outside"] as const;
