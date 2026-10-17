/**
 * Every page on the site, by neutral path (no locale segment), with its
 * status in each language it has. Routes, the sitemap, hreflang, robots,
 * canonicals, the language picker, analytics paths and internal links all
 * read this list (src/content/registry/index.ts); there is no second list.
 *
 * Order is sitemap order. `updated` is the date of the page's last real
 * content change and becomes the sitemap lastmod: never set it to today by
 * default, because search engines ignore a lastmod that is always "now".
 *
 * Public repo: publishable facts only (content:check enforces part of this).
 */
import { JOB_HUB_SLUGS, JOB_ROLE_SLUGS } from "@/lib/talent-intake/rules";
import {
  HARIDWAR_HUB_PATH,
  LOCALE_TAGS,
  LOCATIONS_PATH,
  LOCATION_CLUSTERS,
  LOCATION_ESTATES,
  estatePath,
  locationPath,
  WAGE_HUB_PATH,
  WAGE_METHOD_PATH,
  WAGE_STATE_CODES,
  guidePath,
  jobsHubPath,
  wageStatePath,
  type Audience,
  type ClusterId,
  type GuideSlug,
  type LocaleTag,
  type LocationCluster,
  type PageStatus,
  type WageStateSlug,
} from "./identifiers";

export const PAGE_KINDS = [
  "home",
  "static",
  "service",
  "cluster-hub",
  "jobs-index",
  "jobs-apply",
  "job-role",
  "job-hub",
  "jobs-city",
  "estate",
  "wage-hub",
  "wage-state",
  "guide",
  "legal",
] as const;
export type PageKind = (typeof PAGE_KINDS)[number];

export type PageEntry = {
  path: string;
  kind: PageKind;
  audience: Audience;
  /** Status per language. A language that isn't listed doesn't exist for the page. */
  locales: Partial<Record<LocaleTag, PageStatus>>;
  /**
   * What the neutral URL does. Unset: English, or the page's first language
   * if it has no English. A locale: that one. "prompt": the language picker,
   * for links shared with people whose language we don't know.
   */
  neutral?: LocaleTag | "prompt";
  /**
   * Breadcrumb parent and internal-linking parent. The visible breadcrumb and
   * the BreadcrumbList JSON-LD both follow this chain up to the home page
   * (src/components/layout/breadcrumbs.tsx).
   */
  parent?: string;
  cluster?: ClusterId;
  /** ISO date of the last content change: the sitemap lastmod. */
  updated: string;
  changeFrequency: "monthly" | "yearly";
  priority: number;
  /**
   * Where a retired URL 308s to; without a target it 404s. A path (an
   * optional #anchor allowed) when every language is retired. A map when only
   * some are: { "hi-Latn-IN": "/services/factory-labour" } sends the retired
   * language to the target, in that language when the target is published in
   * it, else in the target's default language. A retired language left out
   * of the map 404s (for versions that were never public).
   */
  retiredTo?: string | Partial<Record<LocaleTag, string>>;
  /**
   * Published but kept out of search: built, linkable and noindex, and left
   * out of the sitemap, hreflang and llms.txt (a form endpoint, the brand kit).
   */
  noindex?: true;
};

/** Dates of the content changes the current pages carry. */
const PHONE_FREE_JOBS = "2026-10-16";
const EDITORIAL_POLICY = "2026-10-16";
const CONTACT_CREW_FORM = "2026-10-16";
/** The business pages rebuilt in the site restructure (fewer pages, fewer words). */
const RESTRUCTURE = "2026-10-16";
/** The jobs pages rebuilt in the restructure, and the new applicant notice. */
const JOBS_RESTRUCTURE = "2026-10-16";
const TERMS_PHONE_FREE = PHONE_FREE_JOBS;

/**
 * The sitemap date of each state's wage page: the later of its check date and
 * its newest effective date in src/content/wages/<state>.json. Kept here by
 * hand so the registry (imported by the proxy and, through the i18n Link, by
 * every page's client JS) never pulls in the wage datasets. tests/wages.spec.mjs
 * fails when a dataset moves on and this map does not.
 */
export const WAGE_STATE_UPDATED: Readonly<Partial<Record<WageStateSlug, string>>> = {
  uttarakhand: "2026-10-17",
  "uttar-pradesh": "2026-10-17",
  delhi: "2026-10-17",
  karnataka: "2026-10-16",
  haryana: "2026-10-17",
  punjab: "2026-10-17",
};
const wageUpdated = (state: WageStateSlug) => {
  const updated = WAGE_STATE_UPDATED[state];
  if (!updated) throw new Error(`No WAGE_STATE_UPDATED date for ${state}`);
  return updated;
};
const WAGE_HUB_UPDATED = () =>
  (Object.keys(WAGE_STATE_STATUS) as WageStateSlug[])
    .filter((state) => WAGE_STATE_STATUS[state] === "published")
    .map(wageUpdated)
    .sort()
    .at(-1)!;

/**
 * Minimum wage pages (PLAN §5.5), English first. A state is published only
 * when every figure on it was verified end to end against the state's own
 * notification (src/content/wages/<state>.json, `verification`); otherwise
 * it stays in review: built, noindex, unlinked and out of the sitemap.
 * Haryana is not built yet (PLAN §5.5).
 *
 * hi-IN has one wage page, the worker-first hub, in review until a native
 * Hindi reviewer signs it off: built and noindex, unlinked, and out of the
 * sitemap and llms.txt. The Hindi state pages (translations of the employer
 * pages, never public) are retired with no target, so they 404.
 */
const WAGE_STATE_STATUS: Partial<Record<WageStateSlug, PageStatus>> = {
  uttarakhand: "published",
  "uttar-pradesh": "published",
  delhi: "published",
  // Built and in review (16 Oct 2026): the 22 May 2026 single notification
  // is in force but challenged in court, and whether its VDA is paid on top
  // of the basic rates needs a reviewer's sign-off (karnataka.json,
  // verification) before publishing.
  karnataka: "review",
  // Published 17 Oct 2026 (owner): one statewide rate each, from the
  // official Gazette copies. Still open: a named checker, and Punjab's July
  // 2025 LWF bill (shown on the page as pending).
  haryana: "published",
  punjab: "published",
};

/**
 * Guides (PLAN §5.6, decision 9): written and checked against the Gazette,
 * but in review until the owner names a legal reviewer and the guide's
 * `review` is filled in (src/content/guides). content:check fails a
 * published guide without a reviewer. The CLRA guide is Phase 3.
 */
const GUIDES_WRITTEN = "2026-10-16";
const GUIDE_STATUS: Partial<Record<GuideSlug, { audience: Audience; status: PageStatus }>> = {
  "new-labour-codes": { audience: "mixed", status: "review" },
  // Never public (review, noindex): retired with no redirect, so it 404s. It
  // competed with /services for "contract labour"; a future CLRA explainer
  // takes /guides/contract-labour-act.
  "what-is-contract-labour": { audience: "mixed", status: "retired" },
};
/** The Hindi wage hub: a draft in review. */
const WAGE_HI_STATUS: PageStatus = "review";

/**
 * Location pages (owner direction, 16 Oct 2026, publish as normal): drafts
 * until their copy in src/content/locations is written and checked; then
 * published, English only like the other business pages.
 */
const LOCATIONS_STATUS: PageStatus = "published";
const LOCATIONS_UPDATED = "2026-10-16";
/** Regions added after the first set, by the day they went up. */
const LOCATION_ADDED: Partial<Record<LocationCluster, string>> = { jalandhar: "2026-10-17" };

const ALL = Object.fromEntries(LOCALE_TAGS.map((l) => [l, "published"])) as Record<LocaleTag, PageStatus>;
const EN = { "en-IN": "published" } as const;
const RETIRED_ALL = Object.fromEntries(LOCALE_TAGS.map((l) => [l, "retired"])) as Record<LocaleTag, PageStatus>;
const RETIRED_EN = { "en-IN": "retired" } as const;
const RETIRED_EN_HINGLISH = { "en-IN": "retired", "hi-Latn-IN": "retired" } as const;

const jobsPage = (path: string, kind: PageKind, priority: number, changeFrequency: PageEntry["changeFrequency"] = "monthly"): PageEntry =>
  ({
    path,
    kind,
    audience: "jobs",
    locales: ALL,
    neutral: "prompt",
    parent: path === "/jobs" ? "/" : "/jobs",
    updated: JOBS_RESTRUCTURE,
    changeFrequency,
    priority,
  }) satisfies PageEntry;

export const pageEntries: readonly PageEntry[] = [
  { path: "/", kind: "home", audience: "business", locales: EN, updated: RESTRUCTURE, changeFrequency: "monthly", priority: 1 },
  // The one services hub: crews, sectors (#sectors) and how an engagement runs.
  { path: "/services", kind: "static", audience: "business", locales: EN, parent: "/", updated: RESTRUCTURE, changeFrequency: "monthly", priority: 0.9 },
  // Merged into /services; the old /hi and /hinglish URLs take the same single hop.
  { path: "/services/contract-labour", kind: "service", audience: "business", locales: RETIRED_ALL, parent: "/services", retiredTo: "/services", updated: RESTRUCTURE, changeFrequency: "monthly", priority: 0.9 },
  // Merged into loading and unloading (its roles moved there).
  { path: "/services/warehouse-labour", kind: "service", audience: "business", locales: RETIRED_EN_HINGLISH, parent: "/services", retiredTo: "/services/loading-unloading-labour", updated: RESTRUCTURE, changeFrequency: "monthly", priority: 0.8 },
  // Service landings are English only: each Hinglish version 308s to the English page.
  ...["factory-labour", "loading-unloading-labour", "housekeeping"].map(
    (slug) =>
      ({
        path: `/services/${slug}`,
        kind: "service",
        audience: "business",
        locales: { "en-IN": "published", "hi-Latn-IN": "retired" },
        parent: "/services",
        retiredTo: { "hi-Latn-IN": `/services/${slug}` },
        updated: RESTRUCTURE,
        changeFrequency: "monthly",
        priority: 0.8,
      }) satisfies PageEntry,
  ),
  jobsPage("/jobs", "jobs-index", 0.8),
  // Focused guided application, also used by ads and direct application links.
  // A form, not a search landing page: the role and cluster pages rank instead.
  { ...jobsPage("/jobs/apply", "jobs-apply", 0.8), noindex: true },
  // No fee, and how to report anyone who asks for money in our name.
  jobsPage("/jobs/fees-and-fraud", "static", 0.5, "yearly"),
  // What happens to an applicant's details, in plain words; the form's checkbox links here.
  jobsPage("/jobs/privacy", "static", 0.4, "yearly"),
  ...JOB_ROLE_SLUGS.map((slug) => jobsPage(`/jobs/${slug}`, "job-role", 0.8)),
  // Candidate categories (freshers, 10th, 12th pass), linked from the jobs overview.
  ...JOB_HUB_SLUGS.map((slug) => jobsPage(`/jobs/${slug}`, "job-hub", 0.7)),
  // Cluster jobs hubs (PLAN §5.3): /jobs/<cluster>, linked from /jobs and the cluster's buyer hub.
  { ...jobsPage(jobsHubPath("haridwar"), "jobs-city", 0.8), cluster: "haridwar" },
  // Jobs only: a worker list, no buyer hub yet (clusters.ts).
  { ...jobsPage(jobsHubPath("bengaluru"), "jobs-city", 0.7), cluster: "bengaluru" },
  // Open work (Kapurthala packing), so priced like Haridwar's.
  { ...jobsPage(jobsHubPath("jalandhar"), "jobs-city", 0.8), cluster: "jalandhar" },
  { path: HARIDWAR_HUB_PATH, kind: "cluster-hub", audience: "business", locales: ALL, parent: "/", cluster: "haridwar", updated: RESTRUCTURE, changeFrequency: "monthly", priority: 0.9 },
  // Location pages: the index, a hub per region, a page per industrial area.
  // Mixed audience: buyers and job seekers both search estate names, so the
  // (locations) layout has no phone.
  { path: LOCATIONS_PATH, kind: "static", audience: "mixed", locales: { "en-IN": LOCATIONS_STATUS }, parent: "/", updated: LOCATIONS_UPDATED, changeFrequency: "monthly", priority: 0.6 },
  ...LOCATION_CLUSTERS.flatMap((cluster) => [
    { path: locationPath(cluster), kind: "cluster-hub", audience: "mixed", locales: { "en-IN": LOCATIONS_STATUS }, parent: LOCATIONS_PATH, cluster, updated: LOCATION_ADDED[cluster] ?? LOCATIONS_UPDATED, changeFrequency: "monthly", priority: 0.8 } satisfies PageEntry,
    ...LOCATION_ESTATES[cluster].map(
      (estate) =>
        ({ path: estatePath(cluster, estate), kind: "estate", audience: "mixed", locales: { "en-IN": LOCATIONS_STATUS }, parent: locationPath(cluster), cluster, updated: LOCATION_ADDED[cluster] ?? LOCATIONS_UPDATED, changeFrequency: "monthly", priority: 0.7 }) satisfies PageEntry,
    ),
  ]),
  // Sectors and engagement steps now live on /services.
  { path: "/industries", kind: "static", audience: "business", locales: RETIRED_EN, parent: "/", retiredTo: "/services#sectors", updated: RESTRUCTURE, changeFrequency: "monthly", priority: 0.8 },
  { path: "/how-we-operate", kind: "static", audience: "business", locales: RETIRED_EN, parent: "/", retiredTo: "/services", updated: RESTRUCTURE, changeFrequency: "monthly", priority: 0.8 },
  { path: "/compliance", kind: "static", audience: "business", locales: EN, parent: "/", updated: RESTRUCTURE, changeFrequency: "monthly", priority: 0.8 },
  { path: "/vayasya-setu", kind: "static", audience: "business", locales: EN, parent: "/about", updated: RESTRUCTURE, changeFrequency: "monthly", priority: 0.7 },
  { path: "/about", kind: "static", audience: "business", locales: EN, parent: "/", updated: RESTRUCTURE, changeFrequency: "monthly", priority: 0.7 },
  // Every buyer question, grouped; home, the service landings and the
  // Haridwar hub show their own few and link to /faq#<group>.
  { path: "/faq", kind: "static", audience: "business", locales: EN, parent: "/", updated: RESTRUCTURE, changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", kind: "static", audience: "business", locales: EN, parent: "/", updated: CONTACT_CREW_FORM, changeFrequency: "yearly", priority: 0.9 },
  { path: WAGE_HUB_PATH, kind: "wage-hub", audience: "mixed", locales: { ...EN, "hi-IN": WAGE_HI_STATUS }, parent: "/", updated: WAGE_HUB_UPDATED(), changeFrequency: "monthly", priority: 0.7 },
  ...Object.entries(WAGE_STATE_STATUS).map(
    ([state, status]) =>
      ({
        path: wageStatePath(state as WageStateSlug),
        kind: "wage-state",
        audience: "mixed",
        locales: { "en-IN": status, "hi-IN": "retired" },
        parent: WAGE_HUB_PATH,
        updated: wageUpdated(state as WageStateSlug),
        changeFrequency: "monthly",
        priority: 0.7,
      }) satisfies PageEntry,
  ),
  // Sources, method, checks and corrections for the wage pages and guides:
  // a static page beside the dynamic /minimum-wages/[state] route. The
  // editorial policy moved here from /about.
  { path: WAGE_METHOD_PATH, kind: "static", audience: "mixed", locales: { "en-IN": "published" }, parent: WAGE_HUB_PATH, updated: EDITORIAL_POLICY, changeFrequency: "yearly", priority: 0.5 },
  // Guides sit in the reference section beside the wage pages (its header,
  // no phone), so their trail runs through the wage hub, not /compliance.
  ...Object.entries(GUIDE_STATUS).map(
    ([slug, guide]) =>
      ({
        path: guidePath(slug as GuideSlug),
        kind: "guide",
        audience: guide.audience,
        locales: { "en-IN": guide.status },
        parent: WAGE_HUB_PATH,
        updated: GUIDES_WRITTEN,
        changeFrequency: "monthly",
        priority: 0.6,
      }) satisfies PageEntry,
  ),
  // For press and printers: linked from About and the footer, kept out of search.
  { path: "/brand", kind: "static", audience: "business", locales: EN, parent: "/about", noindex: true, updated: RESTRUCTURE, changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", kind: "legal", audience: "mixed", locales: EN, parent: "/", updated: PHONE_FREE_JOBS, changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", kind: "legal", audience: "mixed", locales: EN, parent: "/", updated: TERMS_PHONE_FREE, changeFrequency: "yearly", priority: 0.3 },
];

/**
 * Old or alternative URLs that 308 to a page and are never linked. Each one
 * keeps the locale it was asked in when the target has it.
 */
export const pathAliases: Readonly<Record<string, string>> = {
  "/locations/haridwar": HARIDWAR_HUB_PATH,
  // Short state codes (/minimum-wages/up) for the published state pages.
  ...Object.fromEntries(
    Object.entries(WAGE_STATE_CODES)
      .filter(([, state]) => WAGE_STATE_STATUS[state] === "published")
      .map(([code, state]) => [`${WAGE_HUB_PATH}/${code}`, wageStatePath(state)]),
  ),
};
