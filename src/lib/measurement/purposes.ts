/**
 * The purpose registry: every reason the site measures something, what
 * consent it rests on, which tools carry it and where the privacy notice
 * describes it. Layer 1 of src/lib/measurement (pure: no window, no
 * server-only, no enums; node tests import it through register-ts).
 *
 * It records the site as it behaves; it does not add per-purpose choices.
 * The banner still offers two answers ("Allow All", "Required Only"), and
 * policy.ts maps them onto these bases:
 *   - always: runs on every visit, whatever the choice;
 *   - unless-refused: runs unless "Required Only" was chosen (under any
 *     consent version: the legacy any-version rule, see policy.ts);
 *   - opt-in: runs only with a current, valid "Allow All".
 *
 * Changing a basis, vendor, data description, storage key or Consent Mode
 * signal changes the consent fingerprint (fingerprint.ts), and the ledger
 * test fails until ledger.ts has a new entry: decide with the owner whether
 * it needs a consent version bump.
 */
import type { MeasurementEnv } from "./config";

export type Basis = "always" | "unless-refused" | "opt-in";
export type Vendor = "vercel" | "umami" | "umami-server" | "ga4" | "google-ads" | "google-ads-server" | "meta";
export type PurposeSide = "client" | "server" | "both";
/** Google Consent Mode v2 signals, in the order the default command lists them. */
export const CONSENT_MODE_SIGNALS = ["ad_storage", "analytics_storage", "ad_user_data", "ad_personalization"] as const;
export type ConsentModeSignal = (typeof CONSENT_MODE_SIGNALS)[number];

export type NoticeRow = { what: string; gets: string };
export type PurposeNotice = {
  /** Section of /privacy (src/content/privacy.ts) that describes it in full. */
  section: string;
  /** The bold lead-in of that paragraph, exactly as privacyContent has it. */
  lead: string;
  /** Its row in the §3 table (noticeRows), if it has one; "when" follows from the basis. */
  row?: NoticeRow;
};

export type Purpose = {
  id: PurposeId;
  basis: Basis;
  vendors: readonly Vendor[];
  side: PurposeSide;
  /** The consent version whose wording covers it as it runs now (ledger.ts). */
  since: number;
  /** Whether this build or server can run it at all (a tool id is set, production…). */
  enabled: (env: MeasurementEnv) => boolean;
  /** What it collects, in a sentence. */
  data: string;
  /** Browser storage and cookies it reads or writes ("where:key"). */
  storage: readonly string[];
  /** null only for a purpose that is off (meta-pixel). */
  notice: PurposeNotice | null;
  /** Consent Mode signals it needs granted. ad_personalization belongs to none, so it stays denied. */
  consentModeSignals: readonly ConsentModeSignal[];
};

export const PURPOSE_IDS = [
  "basic-counts",
  "form-behaviour",
  "area-intent",
  "server-counts",
  "ads-click-report",
  "ga4",
  "replays",
  "form-drafts",
  "ads-measurement",
  "meta-pixel",
  "language-preference",
] as const;
export type PurposeId = (typeof PURPOSE_IDS)[number];

/** The client tags mount only when a GA4 id is set (the <Analytics> tree in the layouts). */
const tagsMounted = (env: MeasurementEnv) => Boolean(env.gaId);
const umamiLoads = (env: MeasurementEnv) => tagsMounted(env) && Boolean(env.umamiWebsiteId);

const COUNTS_LEAD = "**Cookie-free site counts.**";

export const PURPOSES: readonly Purpose[] = [
  {
    id: "basic-counts",
    basis: "always",
    vendors: ["vercel", "umami"],
    side: "client",
    since: 1,
    enabled: tagsMounted,
    data: "Page views with a known path (unknown paths as /other), referrer, device and browser category, approximate location; Umami session properties (locale, consent state, campaign tags) and fixed-label usage events: links, buttons, FAQ answers, scroll depth, engaged time, copies, script errors, 404s and the consent prompt and choices.",
    storage: [],
    notice: {
      section: "2",
      lead: COUNTS_LEAD,
      row: {
        what: "Cookie-free page counts (Vercel Web Analytics, and Umami on our own servers)",
        gets: "Pages viewed, referring site, device type, approximate location, and which links and form steps are used. Not what you type.",
      },
    },
    consentModeSignals: [],
  },
  {
    id: "form-behaviour",
    basis: "always",
    vendors: ["umami"],
    side: "client",
    since: 1,
    enabled: umamiLoads,
    data: "Fixed-label form events: fields used (by name), time per field, corrections, pastes, digit and character counts, failed checks, files added, starts, steps, errors, completions and abandonment; never typed values.",
    storage: [],
    notice: { section: "2", lead: COUNTS_LEAD },
    consentModeSignals: [],
  },
  {
    id: "area-intent",
    basis: "always",
    vendors: ["umami"],
    side: "client",
    since: 1,
    enabled: umamiLoads,
    // area_intent is also sent to GA4 when ga4 is allowed, like every
    // tracked event (the catalogue lists its sinks); the board events are Umami only.
    data: "How the header decided the visitor's market (basis, markets, confidence, country and Indian region from the IP) and which market links and form areas were picked (docs/area-intent.md).",
    storage: ["sessionStorage:vs-area-reported-v1", "sessionStorage:vs-area-board-v1"],
    notice: { section: "2", lead: COUNTS_LEAD },
    consentModeSignals: [],
  },
  {
    id: "server-counts",
    basis: "always",
    vendors: ["umami-server"],
    side: "server",
    since: 1,
    enabled: (env) => env.production,
    data: "One event per application or enquiry the server accepts (application_received, enquiry_received) with fixed labels and list answers; never name, phone, email or free text.",
    storage: [],
    notice: { section: "2", lead: COUNTS_LEAD },
    consentModeSignals: [],
  },
  {
    id: "ads-click-report",
    basis: "unless-refused",
    vendors: ["google-ads-server"],
    side: "both",
    since: 6,
    // The browser keeps the click in every build; the server upload also
    // needs its key, action id and VERCEL_ENV=production (google-ads-conversions.ts).
    enabled: () => true,
    data: "The Google Ads click id (gclid, gbraid or wbraid) from the landing URL, kept for the tab and sent with a job application; the server reports the click, the time and the application reference to Google Ads.",
    storage: ["sessionStorage:vayasya-ad-click"],
    notice: {
      section: "2",
      lead: "**Job applications from our ads.**",
      row: {
        what: "Ad-click report for job applications (Google Ads)",
        gets: "That one of our ad clicks led to an application: the click identifier, time and our reference. Nothing about you.",
      },
    },
    consentModeSignals: [],
  },
  {
    id: "ga4",
    basis: "opt-in",
    vendors: ["ga4"],
    side: "client",
    since: 1,
    enabled: tagsMounted,
    data: "Google Analytics page views and the same fixed-label events, with Google signals and ad personalisation off.",
    storage: ["cookie:_ga", "cookie:_ga_<stream>"],
    notice: {
      section: "2",
      lead: "**Additional site measurement.**",
      row: {
        what: "Google Analytics",
        gets: "Pages, traffic sources, approximate location, device details and site actions. It may set cookies.",
      },
    },
    consentModeSignals: ["analytics_storage"],
  },
  {
    id: "replays",
    basis: "opt-in",
    vendors: ["umami"],
    side: "client",
    since: 8,
    enabled: umamiLoads,
    data: "Umami session recordings and heatmaps, unmasked (forms and typed values included, file contents never), kept one year.",
    storage: [],
    notice: {
      section: "2",
      lead: "**Usage recordings and heatmaps.**",
      row: {
        what: "Recordings and heatmaps (Umami, on our own servers)",
        gets: "Your visit as you saw it, including what you type into forms, not file contents. Kept one year unless saved to fix a problem.",
      },
    },
    consentModeSignals: [],
  },
  {
    id: "form-drafts",
    basis: "opt-in",
    vendors: ["umami"],
    side: "client",
    since: 4,
    enabled: umamiLoads,
    data: "What an unsent form held, by field name (form_abandon_draft), deleted after 30 days.",
    storage: [],
    notice: {
      section: "2",
      lead: "**Unfinished forms.**",
      row: {
        what: "Unfinished forms (Umami, on our own servers)",
        gets: "What you typed in a form you left unsent, used only to fix the forms. Deleted after 30 days.",
      },
    },
    consentModeSignals: [],
  },
  {
    id: "ads-measurement",
    basis: "opt-in",
    vendors: ["google-ads"],
    side: "client",
    since: 3,
    enabled: (env) => tagsMounted(env) && Boolean(env.googleAdsId),
    data: "The Google tag's Ads destination and its conversions (job application, business enquiry); no enhanced conversions, no remarketing.",
    storage: ["cookie:_gcl_au", "cookie:_gcl_aw"],
    notice: {
      section: "2",
      lead: "**Advertising measurement.**",
      row: {
        what: "Ad measurement for enquiries and applications (Google Ads)",
        gets: "That a visit from one of our ads ended in an enquiry or application. No form details, no ad targeting and no remarketing.",
      },
    },
    consentModeSignals: ["ad_storage", "ad_user_data"],
  },
  {
    id: "meta-pixel",
    basis: "opt-in",
    vendors: ["meta"],
    side: "client",
    since: 3,
    // Dormant: turning it on needs the notice and a consent version bump first (docs/marketing-stack.md).
    enabled: (env) => tagsMounted(env) && Boolean(env.metaPixelId),
    data: "Meta Pixel page views and three standard events (SubmitApplication, Lead, Contact) without parameters; automatic configuration and advanced matching off.",
    storage: ["cookie:_fbp"],
    notice: null,
    consentModeSignals: [],
  },
  {
    id: "language-preference",
    basis: "always",
    vendors: [],
    side: "both",
    since: 1,
    enabled: () => true,
    data: "The language picked on a language-select page, so that page lists it first next time; not measurement.",
    storage: ["cookie:vspl_lang"],
    notice: { section: "2", lead: "**Language choice.**" },
    consentModeSignals: [],
  },
];

const BY_ID = new Map(PURPOSES.map((p) => [p.id, p]));

export function purpose(id: PurposeId): Purpose {
  const found = BY_ID.get(id);
  if (!found) throw new Error(`unknown measurement purpose ${id}`);
  return found;
}
