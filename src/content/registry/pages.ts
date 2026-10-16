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
  WAGE_HUB_PATH,
  WAGE_STATE_CODES,
  guidePath,
  jobsHubPath,
  wageStatePath,
  type Audience,
  type ClusterId,
  type GuideSlug,
  type LocaleTag,
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
  /** Breadcrumb parent and internal-linking parent. */
  parent?: string;
  cluster?: ClusterId;
  /** ISO date of the last content change: the sitemap lastmod. */
  updated: string;
  changeFrequency: "monthly" | "yearly";
  priority: number;
  /** For status "retired": where the URL 308s to. Without it the URL 404s. */
  retiredTo?: string;
};

/** Dates of the content changes the current pages carry. */
const REDESIGN = "2026-09-13";
const CONTENT_UPDATE = "2026-10-01";
const JOBS_ADDED = "2026-10-02";
const PHONE_FREE_JOBS = "2026-10-16";
const HARIDWAR_DEPTH = "2026-10-16";
const HOME_NATIONAL = "2026-10-16";
const EDITORIAL_POLICY = "2026-10-16";
const CONTACT_CREW_FORM = "2026-10-16";
const TERMS_PHONE_FREE = PHONE_FREE_JOBS;

/**
 * The sitemap date of each state's wage page: the later of its check date and
 * its newest effective date in src/content/wages/<state>.json. Kept here by
 * hand so the registry (imported by the proxy and, through the i18n Link, by
 * every page's client JS) never pulls in the wage datasets. tests/wages.spec.mjs
 * fails when a dataset moves on and this map does not.
 */
export const WAGE_STATE_UPDATED: Readonly<Partial<Record<WageStateSlug, string>>> = {
  uttarakhand: "2026-10-16",
  "uttar-pradesh": "2026-10-16",
  delhi: "2026-10-16",
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
 * hi-IN (PR8) is in review on every wage page until a native Hindi reviewer
 * signs it off: built and noindex, unlinked, and out of the sitemap and
 * llms.txt. The figures come from the same datasets.
 */
const WAGE_STATE_STATUS: Partial<Record<WageStateSlug, PageStatus>> = {
  uttarakhand: "published",
  "uttar-pradesh": "published",
  delhi: "published",
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
  // Written for buyers (PLAN §5.2), but workers read it too (it has a jobs
  // door), so it is mixed: the phone-free reference layout, as routed.
  "what-is-contract-labour": { audience: "mixed", status: "review" },
};
/** Wage pages in Hindi: drafts in review (PR8). */
const WAGE_HI_STATUS: PageStatus = "review";

const ALL = Object.fromEntries(LOCALE_TAGS.map((l) => [l, "published"])) as Record<LocaleTag, PageStatus>;
const EN = { "en-IN": "published" } as const;
const EN_HINGLISH = { "en-IN": "published", "hi-Latn-IN": "published" } as const;

const jobsPage = (path: string, kind: PageKind, priority: number, changeFrequency: PageEntry["changeFrequency"] = "monthly") =>
  ({
    path,
    kind,
    audience: "jobs",
    locales: ALL,
    neutral: "prompt",
    parent: path === "/jobs" ? "/" : "/jobs",
    updated: PHONE_FREE_JOBS,
    changeFrequency,
    priority,
  }) satisfies PageEntry;

export const pageEntries: readonly PageEntry[] = [
  { path: "/", kind: "home", audience: "business", locales: EN, updated: HOME_NATIONAL, changeFrequency: "monthly", priority: 1 },
  { path: "/services", kind: "static", audience: "business", locales: EN, parent: "/", updated: CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.9 },
  { path: "/services/contract-labour", kind: "service", audience: "business", locales: ALL, parent: "/services", updated: CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.9 },
  { path: "/services/warehouse-labour", kind: "service", audience: "business", locales: EN_HINGLISH, parent: "/services", updated: CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.8 },
  { path: "/services/loading-unloading-labour", kind: "service", audience: "business", locales: EN_HINGLISH, parent: "/services", updated: JOBS_ADDED, changeFrequency: "monthly", priority: 0.8 },
  { path: "/services/factory-labour", kind: "service", audience: "business", locales: EN_HINGLISH, parent: "/services", updated: CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.8 },
  { path: "/services/housekeeping", kind: "service", audience: "business", locales: EN_HINGLISH, parent: "/services", updated: CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.8 },
  jobsPage("/jobs", "jobs-index", 0.8),
  // Focused guided application, also used by ads and direct application links.
  jobsPage("/jobs/apply", "jobs-apply", 0.8),
  // No fee, and how to report anyone who asks for money in our name.
  jobsPage("/jobs/fees-and-fraud", "static", 0.5, "yearly"),
  ...JOB_ROLE_SLUGS.map((slug) => jobsPage(`/jobs/${slug}`, "job-role", 0.8)),
  // Candidate categories (freshers, 10th, 12th pass), linked from the jobs overview.
  ...JOB_HUB_SLUGS.map((slug) => jobsPage(`/jobs/${slug}`, "job-hub", 0.7)),
  // Cluster jobs hubs (PLAN §5.3): /jobs/<cluster>, linked from /jobs and the cluster's buyer hub.
  { ...jobsPage(jobsHubPath("haridwar"), "jobs-city", 0.8), cluster: "haridwar", updated: HARIDWAR_DEPTH },
  { path: HARIDWAR_HUB_PATH, kind: "cluster-hub", audience: "business", locales: ALL, parent: "/", cluster: "haridwar", updated: HARIDWAR_DEPTH, changeFrequency: "monthly", priority: 0.9 },
  { path: "/industries", kind: "static", audience: "business", locales: EN, parent: "/", updated: REDESIGN, changeFrequency: "monthly", priority: 0.8 },
  { path: "/how-we-operate", kind: "static", audience: "business", locales: EN, parent: "/", updated: REDESIGN, changeFrequency: "monthly", priority: 0.8 },
  { path: "/compliance", kind: "static", audience: "business", locales: EN, parent: "/", updated: REDESIGN, changeFrequency: "monthly", priority: 0.8 },
  { path: "/vayasya-setu", kind: "static", audience: "business", locales: EN, parent: "/", updated: REDESIGN, changeFrequency: "monthly", priority: 0.7 },
  { path: "/about", kind: "static", audience: "business", locales: EN, parent: "/", updated: EDITORIAL_POLICY, changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", kind: "static", audience: "business", locales: EN, parent: "/", updated: CONTACT_CREW_FORM, changeFrequency: "yearly", priority: 0.9 },
  { path: WAGE_HUB_PATH, kind: "wage-hub", audience: "mixed", locales: { ...EN, "hi-IN": WAGE_HI_STATUS }, parent: "/", updated: WAGE_HUB_UPDATED(), changeFrequency: "monthly", priority: 0.7 },
  ...Object.entries(WAGE_STATE_STATUS).map(
    ([state, status]) =>
      ({
        path: wageStatePath(state as WageStateSlug),
        kind: "wage-state",
        audience: "mixed",
        locales: { "en-IN": status, "hi-IN": WAGE_HI_STATUS },
        parent: WAGE_HUB_PATH,
        updated: wageUpdated(state as WageStateSlug),
        changeFrequency: "monthly",
        priority: 0.7,
      }) satisfies PageEntry,
  ),
  ...Object.entries(GUIDE_STATUS).map(
    ([slug, guide]) =>
      ({
        path: guidePath(slug as GuideSlug),
        kind: "guide",
        audience: guide.audience,
        locales: { "en-IN": guide.status },
        parent: "/",
        updated: GUIDES_WRITTEN,
        changeFrequency: "monthly",
        priority: 0.6,
      }) satisfies PageEntry,
  ),
  { path: "/brand", kind: "static", audience: "business", locales: EN, parent: "/", updated: REDESIGN, changeFrequency: "yearly", priority: 0.3 },
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
