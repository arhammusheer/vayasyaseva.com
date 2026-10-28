/**
 * Every event the site sends today, read from its call sites (1C): wire
 * names and properties exactly as sent. Layer 1 (pure). The gateway does not
 * route by this table; in development and test it checks each call against
 * it (catalogue/index.ts observe), and tests check it against the docs.
 *
 * Data classes:
 *   - anonymous: fixed labels, known paths, counts and model output;
 *   - pseudonymous: says something about the visit that could narrow down a
 *     person with other data (coarse IP location, referring host, campaign
 *     tags, which carry whatever the link's author put in them);
 *   - personal: what a person typed or an identifier of them.
 * No personal property goes to an analytics sink, with one documented
 * exception: form_abandon_draft (see its `exception`).
 */
import { MARKET_IDS, eventKey } from "@/markets/index";
import { CLUSTER_IDS } from "@/content/registry/identifiers";
import type { AdsConversion } from "../config";
import type { PurposeId } from "../purposes";

export type DataClass = "anonymous" | "pseudonymous" | "personal";
export type Sink = "umami" | "ga4" | "meta" | "google-ads" | "umami-server";
/** Who reads an event: an Umami board or funnel, a GA4 key event, bidding, a doc's metric. */
export type Consumer =
  | "area-intent-board"
  | "area-intent-metrics"
  | "form-funnel"
  | "jobs-ads-board"
  | "consent-funnel"
  | "ga4-key-event"
  | "ads-bidding"
  | "site-health";

export type EventSpec = {
  purpose: PurposeId;
  sinks: readonly Sink[];
  /** Every property it may carry ("*" for any key), with its data class. */
  props: Readonly<Record<string, DataClass>>;
  consumers: readonly Consumer[];
  /** For a family of wire names (market_shown_<market>): the pattern and its values. */
  wireName?: { pattern: string; values: readonly string[] };
  /** The Meta standard event it maps to (routes.ts META_EVENTS). */
  meta?: string;
  /** The Google Ads conversion sent beside it (gateway trackConversion). */
  adsConversion?: AdsConversion;
  /** The tracked form it completes (routes.ts FORM_DONE). */
  completesForm?: string;
  /** Why a personal property is allowed to this sink. */
  exception?: string;
  /** Where it is sent from. */
  source: string;
};

const A = "anonymous" as const;
const P = "pseudonymous" as const;
const X = "personal" as const;
/** "a b c" → { a: anonymous, b: anonymous, c: anonymous }. */
const anon = (names: string): Record<string, DataClass> => Object.fromEntries(names.split(" ").map((n) => [n, A]));

const TRACKED: readonly Sink[] = ["umami", "ga4"];
const UMAMI: readonly Sink[] = ["umami"];
const TRACKER = "src/components/analytics-tracker.tsx";
const QUICK = "src/components/jobs/quick-apply.tsx";
const CONTACT = "src/app/[locale]/(marketing)/contact/contact-form.tsx";
const REPORT = "src/context/report.ts";
const CONSENT = "src/components/measurement/consent-banner.tsx";

const FORM_TIMING = anon("form_seconds field_seconds corrections pastes");
const JOB_SUMMARY = anon("locale variant work experience questions files cluster area_source band holdout");
const BOARD_CHOICE = anon("market decided surface band v");

export const EVENTS = {
  // Links, clicks, reading (AnalyticsTracker): every visitor, GA4 with Allow All.
  contact_click: { purpose: "basic-counts", sinks: [...TRACKED, "meta"], props: anon("contact_method zone page"), consumers: ["ga4-key-event", "jobs-ads-board"], meta: "Contact", source: TRACKER },
  outbound_click: { purpose: "basic-counts", sinks: TRACKED, props: { domain: P, zone: A, page: A }, consumers: [], source: TRACKER },
  file_download: { purpose: "basic-counts", sinks: TRACKED, props: anon("file zone page"), consumers: [], source: TRACKER },
  language_switch: { purpose: "basic-counts", sinks: TRACKED, props: anon("to page"), consumers: [], source: TRACKER },
  contact_intent: { purpose: "basic-counts", sinks: TRACKED, props: anon("intent_type zone page"), consumers: [], source: TRACKER },
  jobs_intent: { purpose: "basic-counts", sinks: TRACKED, props: anon("target zone page"), consumers: ["jobs-ads-board"], source: TRACKER },
  anchor_click: { purpose: "basic-counts", sinks: TRACKED, props: anon("anchor zone page"), consumers: [], source: TRACKER },
  nav_click: { purpose: "basic-counts", sinks: TRACKED, props: anon("target zone page"), consumers: [], source: TRACKER },
  button_click: { purpose: "basic-counts", sinks: TRACKED, props: anon("button page"), consumers: [], source: TRACKER },
  rage_click: { purpose: "basic-counts", sinks: TRACKED, props: anon("target zone page"), consumers: ["site-health"], source: TRACKER },
  dead_click: { purpose: "basic-counts", sinks: TRACKED, props: anon("target zone page"), consumers: ["site-health"], source: TRACKER },
  scroll_depth: { purpose: "basic-counts", sinks: TRACKED, props: anon("percent page"), consumers: [], source: TRACKER },
  engaged_time: { purpose: "basic-counts", sinks: TRACKED, props: anon("seconds page"), consumers: [], source: TRACKER },
  faq_open: { purpose: "basic-counts", sinks: TRACKED, props: anon("question page"), consumers: [], source: TRACKER },
  text_copy: { purpose: "basic-counts", sinks: TRACKED, props: anon("zone page"), consumers: [], source: TRACKER },
  js_error: { purpose: "basic-counts", sinks: TRACKED, props: anon("kind name page"), consumers: ["site-health"], source: TRACKER },
  not_found: { purpose: "basic-counts", sinks: TRACKED, props: { path: A, from: A, source: P }, consumers: ["site-health"], source: "src/components/not-found-event.tsx" },
  language_choice: { purpose: "basic-counts", sinks: TRACKED, props: anon("locale page position order_key"), consumers: [], source: "src/app/(picker)/select-language/[rank]/[[...path]]/language-choices.tsx" },

  // The consent prompt and choices (sent before the choice is stored).
  consent_prompt: { purpose: "basic-counts", sinks: TRACKED, props: anon("page"), consumers: ["consent-funnel"], source: CONSENT },
  consent_choice: { purpose: "basic-counts", sinks: TRACKED, props: anon("choice from"), consumers: ["consent-funnel"], source: CONSENT },
  consent_allow_all: { purpose: "basic-counts", sinks: TRACKED, props: anon("from"), consumers: ["consent-funnel"], source: CONSENT },
  consent_required_only: { purpose: "basic-counts", sinks: TRACKED, props: anon("from"), consumers: ["consent-funnel"], source: CONSENT },
  privacy_choices_open: { purpose: "basic-counts", sinks: TRACKED, props: anon("page"), consumers: ["consent-funnel"], source: "src/components/measurement/preferences-button.tsx" },

  // Tracked forms (data-analytics-form): names, flags and counts, never values.
  form_field: { purpose: "form-behaviour", sinks: TRACKED, props: anon("form field page"), consumers: ["form-funnel"], source: TRACKER },
  form_complete: { purpose: "form-behaviour", sinks: TRACKED, props: { ...anon("form page"), ...FORM_TIMING }, consumers: ["form-funnel"], source: TRACKER },
  form_abandon: {
    purpose: "form-behaviour",
    sinks: TRACKED,
    props: { ...anon("form last_field page phone_digits chars focused_field filled empty errors tried_send"), ...FORM_TIMING },
    consumers: ["form-funnel"],
    source: TRACKER,
  },
  form_abandon_draft: {
    purpose: "form-drafts",
    sinks: UMAMI,
    props: { ...anon("form last_field page"), "*": X },
    consumers: ["form-funnel"],
    exception:
      "The one personal event: what an unsent form held, by field name. Allow All only, Umami on our own servers only (never GA4 or Meta), deleted after 30 days by the nightly job in vayasya-infra apps/umami, used only to fix the forms (privacy §2 Unfinished forms).",
    source: TRACKER,
  },
  form_prefilled: { purpose: "form-behaviour", sinks: TRACKED, props: anon("form fields"), consumers: [], source: CONTACT },
  verification_shown: { purpose: "form-behaviour", sinks: TRACKED, props: anon("form page"), consumers: ["form-funnel"], source: "src/lib/use-turnstile.ts" },
  upload_error: { purpose: "form-behaviour", sinks: TRACKED, props: anon("locale kind size_mb reason"), consumers: ["site-health"], source: "src/components/jobs/job-files.tsx" },
  file_rejected: { purpose: "form-behaviour", sinks: TRACKED, props: anon("locale reason"), consumers: [], source: "src/components/jobs/job-files.tsx" },
  file_added: { purpose: "form-behaviour", sinks: TRACKED, props: anon("locale kind"), consumers: [], source: "src/components/jobs/job-files.tsx" },

  // The job application (quick form).
  job_form_start: { purpose: "form-behaviour", sinks: TRACKED, props: anon("locale variant page"), consumers: ["form-funnel", "jobs-ads-board"], source: QUICK },
  quick_apply_start: { purpose: "form-behaviour", sinks: TRACKED, props: anon("locale entry"), consumers: ["form-funnel"], source: QUICK },
  quick_step: { purpose: "form-behaviour", sinks: TRACKED, props: { ...anon("locale step answer changed area_source decided band v pick position guesses"), home_state: P }, consumers: ["form-funnel", "area-intent-metrics"], source: QUICK },
  job_form_error: { purpose: "form-behaviour", sinks: TRACKED, props: anon("locale variant page reason checks"), consumers: ["form-funnel"], source: QUICK },
  job_form_submit: {
    purpose: "form-behaviour",
    sinks: [...TRACKED, "meta"],
    props: { ...JOB_SUMMARY, page: A },
    consumers: ["form-funnel", "jobs-ads-board", "ga4-key-event", "area-intent-metrics"],
    meta: "SubmitApplication",
    adsConversion: "jobApplication",
    completesForm: "jobs",
    source: QUICK,
  },
  quick_apply_submit: { purpose: "form-behaviour", sinks: TRACKED, props: { ...JOB_SUMMARY, home_state: P }, consumers: ["form-funnel", "area-intent-metrics"], completesForm: "quick", source: QUICK },

  // The business enquiry.
  contact_form_start: { purpose: "form-behaviour", sinks: TRACKED, props: anon("form_type"), consumers: ["form-funnel"], source: CONTACT },
  contact_form_step: { purpose: "form-behaviour", sinks: TRACKED, props: anon("form_type step headcount_band needs start_window duration_band roles"), consumers: ["form-funnel"], source: CONTACT },
  contact_form_error: { purpose: "form-behaviour", sinks: TRACKED, props: anon("form_type reason step checks"), consumers: ["form-funnel"], source: CONTACT },
  generate_lead: {
    purpose: "form-behaviour",
    sinks: [...TRACKED, "meta"],
    props: anon("form_type form cluster headcount_band site_state needs duration_band start_window qualified"),
    consumers: ["form-funnel", "ga4-key-event"],
    meta: "Lead",
    adsConversion: "businessEnquiry",
    completesForm: "contact",
    source: CONTACT,
  },

  // Visitor context (docs/visitor-context.md): the detailed events, also to GA4 with Allow All.
  area_intent: {
    purpose: "area-intent",
    sinks: TRACKED,
    props: {
      ...anon("v mode band aud aud_stated intent second geo basis arrival business jobs nearby confidence pts_stated pts_arrival pts_browsing pts_ambient lang lang_basis holdout"),
      country: P,
      region: P,
    },
    consumers: ["area-intent-metrics"],
    source: REPORT,
  },
  area_nav_click: {
    purpose: "area-intent",
    sinks: TRACKED,
    props: anon("cluster surface mode band decided is_decided position explicit v"),
    consumers: ["area-intent-metrics"],
    source: "src/components/layout/header.tsx, src/components/sections/market-list.tsx, src/components/jobs/jobs-in-row.tsx",
  },

  // The "Area intent" board's outcome events: Umami only.
  intent_by: {
    purpose: "area-intent",
    sinks: UMAMI,
    props: anon("markets mode band holdout v"),
    consumers: ["area-intent-board"],
    wireName: { pattern: "intent_by_<basis>", values: ["pick", "arrival", "page", "location"] },
    source: REPORT,
  },
  intent_none: { purpose: "area-intent", sinks: UMAMI, props: anon("markets mode band holdout v"), consumers: ["area-intent-board"], source: REPORT },
  market_shown: {
    purpose: "area-intent",
    sinks: UMAMI,
    props: anon("mode v"),
    consumers: ["area-intent-board"],
    wireName: { pattern: "market_shown_<market>", values: MARKET_IDS.map(eventKey) },
    source: REPORT,
  },
  market_chosen: {
    purpose: "area-intent",
    sinks: UMAMI,
    props: BOARD_CHOICE,
    consumers: ["area-intent-board"],
    // Any cluster a market link or area answer can name, "other" ("Somewhere else") included.
    wireName: { pattern: "market_chosen_<market>", values: [...new Set([...MARKET_IDS, ...CLUSTER_IDS].map(eventKey))] },
    source: `${REPORT} (reportChoice)`,
  },
  intent_confirmed: { purpose: "area-intent", sinks: UMAMI, props: BOARD_CHOICE, consumers: ["area-intent-board"], source: REPORT },
  intent_corrected: { purpose: "area-intent", sinks: UMAMI, props: BOARD_CHOICE, consumers: ["area-intent-board"], source: REPORT },
  intent_self_chosen: { purpose: "area-intent", sinks: UMAMI, props: BOARD_CHOICE, consumers: ["area-intent-board"], source: REPORT },

  // The Google tag's Ads conversion (gateway trackConversion), Allow All only.
  conversion: { purpose: "ads-measurement", sinks: ["google-ads"], props: anon("send_to"), consumers: ["ads-bidding"], source: `${QUICK}, ${CONTACT}` },

  // Server counts (src/lib/measurement/server.ts), whatever the visitor chose.
  application_received: {
    purpose: "server-counts",
    sinks: ["umami-server"],
    props: anon("channel form role hub source locale cluster page_cluster area files"),
    consumers: ["jobs-ads-board", "area-intent-metrics"],
    source: "src/lib/talent-intake/submit.ts",
  },
  enquiry_received: {
    purpose: "server-counts",
    sinks: ["umami-server"],
    props: anon("channel cluster qualified request_type"),
    consumers: [],
    source: "src/app/api/contact/route.ts, src/app/api/agent/contact/route.ts",
  },
} as const satisfies Record<string, EventSpec>;

export type EventId = keyof typeof EVENTS;

/** Umami session properties (gateway setSession), not events. */
export const SESSION_PROPS: Readonly<Record<string, DataClass>> = {
  locale: A,
  consent: A,
  utm_source: P,
  utm_medium: P,
  utm_campaign: P,
  utm_content: P,
  utm_term: P,
  cluster: A,
  holdout: A,
};

/** Umami page views (gateway trackPage): a known path plus campaign tags and ?cluster=. */
export const PAGE_VIEW_PROPS: Readonly<Record<string, DataClass>> = { url: P };
