/**
 * Where measurement and form data is kept, for how long, what deletes it and
 * where the privacy notice says so. Layer 1 (pure).
 * scripts/check-privacy-retention.mjs (run by content-check) asserts that
 * every day and month count in src/content/privacy.ts is one of these
 * `notice` phrases and that each phrase is still in the notice.
 *
 * `enforcedBy` names what actually deletes the data. Several stores are
 * enforced outside this repo (vayasya-infra, vendor settings) and are not
 * verified from here; they are marked so.
 */
export type RetentionStore = {
  id: string;
  what: string;
  /** Days, or null when a vendor setting or "until changed" decides. */
  days: number | null;
  /** The period as the privacy notice words it ("30 days", "12 months"), if it states one. */
  notice: string | null;
  /** Where the privacy notice describes it. */
  noticeRef: string;
  enforcedBy: string;
  /** false when what deletes it lives outside this repo. */
  enforcedInRepo: boolean;
};

export const RETENTION: readonly RetentionStore[] = [
  {
    id: "umami-events",
    what: "Umami page views, usage events and session properties (cookie-free counts)",
    days: null,
    notice: null,
    noticeRef: "/privacy §2 Cookie-free site counts (no period stated)",
    enforcedBy: "None configured in this repo: Umami keeps events until deleted (owner follow-up)",
    enforcedInRepo: false,
  },
  {
    id: "umami-server-events",
    what: "Server counts (application_received, enquiry_received) on the separate Umami website",
    days: null,
    notice: null,
    noticeRef: "/privacy §2 Cookie-free site counts (no period stated)",
    enforcedBy: "None configured in this repo (owner follow-up)",
    enforcedInRepo: false,
  },
  {
    id: "form-drafts",
    what: "Unsent-form contents (form_abandon_draft events in Umami)",
    days: 30,
    notice: "30 days",
    noticeRef: "/privacy §2 Unfinished forms, §3 table, §6; consent banner",
    enforcedBy: "Nightly purge job in vayasya-infra apps/umami",
    enforcedInRepo: false,
  },
  {
    id: "replays",
    what: "Umami recordings and heatmaps",
    days: 365,
    notice: "one year",
    noticeRef: "/privacy §2 Usage recordings and heatmaps, §3 table, §6",
    enforcedBy: "Nightly purge job in vayasya-infra apps/umami (saved recordings kept while a problem is investigated)",
    enforcedInRepo: false,
  },
  {
    id: "ga4",
    what: "Google Analytics event data (property 556021189)",
    days: null,
    notice: null,
    noticeRef: "/privacy §6 (the property's configured retention settings)",
    enforcedBy: "GA4 property setting: event data retention 14 months (docs/marketing-stack.md)",
    enforcedInRepo: false,
  },
  {
    id: "google-ads",
    what: "Google Ads conversions (browser tag and server click import)",
    days: null,
    notice: null,
    noticeRef: "/privacy §6 (the periods Google sets)",
    enforcedBy: "Google",
    enforcedInRepo: false,
  },
  {
    id: "clarity-legacy",
    what: "Microsoft Clarity recordings made until 3 October 2026",
    days: 30,
    notice: "30 days",
    noticeRef: "/privacy §6 (about 30 days, up to 13 months for heatmaps and saved recordings)",
    enforcedBy: "Microsoft",
    enforcedInRepo: false,
  },
  {
    id: "clarity-legacy-heatmaps",
    what: "Microsoft Clarity heatmaps and saved recordings made until 3 October 2026",
    days: 395,
    notice: "13 months",
    noticeRef: "/privacy §6",
    enforcedBy: "Microsoft",
    enforcedInRepo: false,
  },
  {
    id: "talent-db",
    what: "Job applications: the talent database and Twenty records",
    days: 365,
    notice: "12 months",
    noticeRef: "/privacy §10 In short, How long we keep it",
    enforcedBy: "Windmill f/talent/retention, hourly (integrations/windmill, OPERATIONS.md)",
    enforcedInRepo: true,
  },
  {
    id: "leads",
    what: "Business enquiries and their correspondence (email, Twenty CRM)",
    days: 730,
    notice: "24 months",
    noticeRef: "/privacy §6",
    enforcedBy: "Not automated in this repo (owner follow-up)",
    enforcedInRepo: false,
  },
  {
    id: "r2-uploads",
    what: "Files uploaded through the jobs pages (R2 upload storage)",
    days: 90,
    notice: "90 days",
    noticeRef: "/privacy §10 How long we keep it",
    enforcedBy: "R2 bucket lifecycle rule (vayasya-infra; not verified from this repo)",
    enforcedInRepo: false,
  },
  {
    id: "consent-choice",
    what: "localStorage vayasya-site-measurement-v8 and -v8-at (the banner choice); an Allow All counts for 180 days",
    days: 180,
    notice: "180 days",
    noticeRef: "/privacy §3, §6",
    enforcedBy: "policy.ts hasValidAcceptance (the entry itself stays until changed or cleared)",
    enforcedInRepo: true,
  },
  {
    id: "ad-click",
    what: "sessionStorage vayasya-ad-click (the Google Ads click id)",
    days: null,
    notice: null,
    noticeRef: "/privacy §2 Job applications from our ads (for that visit only)",
    enforcedBy: "The browser: session storage ends with the tab",
    enforcedInRepo: true,
  },
  {
    id: "area-reporting",
    what: "sessionStorage vs-ctx-reported-v1 (which visitor-context events this tab has sent)",
    days: null,
    notice: null,
    noticeRef: "none (no personal data; session only)",
    enforcedBy: "The browser: session storage ends with the tab",
    enforcedInRepo: true,
  },
  {
    id: "form-session-drafts",
    what: "sessionStorage form drafts (vayasya-contact-draft, vayasya-assessment-draft, vayasya-compliance-draft, vayasya-quick-apply, vayasya-quick-submission)",
    days: null,
    notice: null,
    noticeRef: "none (stays in the visitor's tab, never sent until submitted)",
    enforcedBy: "The browser: session storage ends with the tab; cleared on send",
    enforcedInRepo: true,
  },
  {
    id: "area-signals",
    what: "Cookie vs_ctx (picked markets and audience: links and the crew form's site 90 days, the jobs form's area 30 days), cookie vs_geo (the IP's country, state and market, browser session), sessionStorage vs-ctx-session-v1 and vs-ctx-geo-v1 (this visit's signals)",
    days: 90,
    notice: "90 days",
    noticeRef: "/privacy §2 Where you want to work or hire",
    enforcedBy: "Cookie max-age and src/context/weights.ts PICK_DAYS (read time); vs_geo has no max-age (session cookie, src/proxy.ts)",
    enforcedInRepo: true,
  },
  {
    id: "language-cookie",
    what: "Cookie vspl_lang (the picked language)",
    days: 365,
    notice: "one year",
    noticeRef: "/privacy §2 Language choice",
    enforcedBy: "Cookie max-age (src/lib/language-cookie.ts)",
    enforcedInRepo: true,
  },
];
