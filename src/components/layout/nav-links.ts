import { linkable } from "@/content/registry";
import { WAGE_HUB_PATH, WAGE_METHOD_PATH, LWF_PATH, guidePath, jobsHubPath, type ClusterId } from "@/content/registry/identifiers";
import { JOBS_AREA_LABEL, orderedJobMarkets } from "@/context/surfaces";
import { localePath, nearestLocalePath, type Locale } from "@/lib/i18n";
import type { JobGroupId } from "@/content/pages/jobs";

/**
 * Links shared by the header and footer (one place for each label). Kept
 * small and free of page content, since the header ships to the browser.
 * Hindi and Hinglish labels are drafts for native review.
 */

export type NavLink = { href: string; label: string; lang?: string };

/** The four business pages in the business bar and menu. */
export const BUSINESS_LINKS: NavLink[] = [
  { href: "/services", label: "Services" },
  // The area slot: the decided market's buyer page replaces it (header.tsx).
  { href: "/locations", label: "Locations" },
  { href: "/compliance", label: "Compliance" },
  { href: "/about", label: "About" },
];

export const SETU_LOGIN = "https://setu.vayasyaseva.com";

/**
 * The jobs door when no market is decided: /jobs, which lists every market
 * (no market is the default, owner direction 17 Oct 2026), in `locale`.
 * Never the neutral URL: that is the language picker, outside the site's
 * root layout, so the client router could not enter it (a full reload, and
 * sometimes a click that did nothing). On English pages, pass the reader's
 * saved language (useJobsLocale, components/i18n/jobs-link.tsx).
 * A decided market's door is jobsAreaHref instead.
 */
export const jobsDoorHref = (locale: Locale) => nearestLocalePath("/jobs", locale);

/** "Looking for work? Jobs": the business menu and footer line. */
export const WORK_DOOR: Record<Locale, { lead: string; label: string }> = {
  "en-IN": { lead: "Looking for work?", label: "Jobs" },
  "hi-IN": { lead: "काम चाहिए?", label: "नौकरी" },
  "hi-Latn-IN": { lead: "Kaam chahiye?", label: "Jobs" },
  "pa-IN": { lead: "ਕੰਮ ਚਾਹੀਦਾ ਹੈ?", label: "ਨੌਕਰੀਆਂ" },
  "kn-IN": { lead: "ಕೆಲಸ ಬೇಕೇ?", label: "ಉದ್ಯೋಗಗಳು" },
};

/**
 * Reference pages, listed once published. `long` is the footer's label
 * where the menu's would be unclear out of context.
 */
const REFERENCE: (NavLink & { long?: string; bar?: true })[] = [
  // One link per topic (owner, 18 Oct 2026: the footer had grown to 13).
  // State pages and the VDA tracker are one click away on their hub, their one home.
  { href: WAGE_HUB_PATH, label: "Minimum wages", bar: true },
  { href: LWF_PATH, label: "Labour Welfare Fund", bar: true },
  { href: "/epf", label: "EPF", long: "EPF for employers", bar: true },
  { href: "/esic", label: "ESIC", long: "ESIC for employers", bar: true },
  { href: "/professional-tax", label: "Professional Tax", bar: true },
  { href: "/bonus", label: "Bonus", long: "Statutory bonus", bar: true },
  { href: "/gratuity", label: "Gratuity", long: "Gratuity", bar: true },
  { href: guidePath("new-labour-codes"), label: "Labour codes guide" },
  { href: WAGE_METHOD_PATH, label: "How we check", long: "How we check minimum wages" },
];
export const referenceLinks = (long = false): NavLink[] =>
  REFERENCE.filter((l) => linkable(l.href, "en-IN")).map((l) => ({ href: l.href, label: long ? (l.long ?? l.label) : l.label }));
/**
 * The reference header's bar: every topic hub, so a reader on one topic can
 * reach the others (owner, 18 Oct 2026: it showed only Minimum wages). The
 * method page and guides stay in the menu and footer.
 */
export const referenceBarLinks = (): NavLink[] => REFERENCE.filter((l) => l.bar && linkable(l.href, "en-IN")).map((l) => ({ href: l.href, label: l.label }));

/** The jobs header, menu and footer, in the page's language. */
export const JOBS_NAV: Record<
  Locale,
  {
    business: string; enquiries: string; apply: string; menu: string; sections: string; more: string; openMenu: string; language: string;
    logo: string; haridwar: string; details: string; privacy: string; terms: string; english: string;
  }
> = {
  "en-IN": {
    business: "For businesses", enquiries: "Business enquiries", apply: "Apply", menu: "Jobs", sections: "Site sections", more: "More",
    openMenu: "Open navigation", language: "Language", logo: "Vayasya Seva jobs",
    haridwar: "Jobs in Haridwar", details: "Your details", privacy: "Privacy", terms: "Terms", english: "",
  },
  "hi-IN": {
    business: "कंपनियों के लिए", enquiries: "पूछताछ", apply: "आवेदन करें", menu: "नौकरी", sections: "साइट के हिस्से", more: "और",
    openMenu: "मेन्यू खोलें", language: "भाषा", logo: "Vayasya Seva नौकरी",
    haridwar: "हरिद्वार में नौकरी", details: "आपकी जानकारी", privacy: "गोपनीयता", terms: "नियम", english: " (English)",
  },
  "hi-Latn-IN": {
    business: "Companies ke liye", enquiries: "Enquiry", apply: "Apply karein", menu: "Jobs", sections: "Site ke hisse", more: "Aur",
    openMenu: "Menu kholein", language: "Bhasha", logo: "Vayasya Seva jobs",
    haridwar: "Haridwar mein job", details: "Aapki jaankari", privacy: "Privacy", terms: "Terms", english: " (English)",
  },
  "pa-IN": {
    business: "ਕੰਪਨੀਆਂ ਲਈ", enquiries: "ਪੁੱਛਗਿੱਛ", apply: "ਅਪਲਾਈ ਕਰੋ", menu: "ਨੌਕਰੀਆਂ", sections: "ਸਾਈਟ ਦੇ ਹਿੱਸੇ", more: "ਹੋਰ",
    openMenu: "ਮੀਨੂ ਖੋਲ੍ਹੋ", language: "ਭਾਸ਼ਾ", logo: "Vayasya Seva ਨੌਕਰੀਆਂ",
    haridwar: "ਹਰਿਦੁਆਰ ਵਿੱਚ ਨੌਕਰੀ", details: "ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ", privacy: "ਨਿੱਜਤਾ", terms: "ਨਿਯਮ", english: " (English)",
  },
  "kn-IN": {
    business: "ಕಂಪನಿಗಳಿಗೆ", enquiries: "ವಿಚಾರಣೆಗಳು", apply: "ಅರ್ಜಿ ಸಲ್ಲಿಸಿ", menu: "ಉದ್ಯೋಗಗಳು", sections: "ಸೈಟ್‌ನ ವಿಭಾಗಗಳು", more: "ಇನ್ನಷ್ಟು",
    openMenu: "ಮೆನು ತೆರೆಯಿರಿ", language: "ಭಾಷೆ", logo: "Vayasya Seva ಉದ್ಯೋಗಗಳು",
    haridwar: "ಹರಿದ್ವಾರದಲ್ಲಿ ಉದ್ಯೋಗ", details: "ನಿಮ್ಮ ಮಾಹಿತಿ", privacy: "ಗೌಪ್ಯತೆ", terms: "ನಿಯಮಗಳು", english: " (English)",
  },
};

/**
 * The four work groups on /jobs (each a #id on that page, listing the roles
 * in JOB_GROUP_ROLES) and the qualification hubs, in the jobs menu.
 */
export const JOB_GROUPS: Record<Locale, { id: JobGroupId; label: string }[]> = {
  "en-IN": [
    { id: "helper", label: "Helper, packing and warehouse" },
    { id: "machine", label: "Machine and forklift" },
    { id: "iti", label: "ITI trades" },
    { id: "office", label: "Office and data entry" },
  ],
  "hi-IN": [
    { id: "helper", label: "हेल्पर, पैकिंग और वेयरहाउस" },
    { id: "machine", label: "मशीन और फ़ोर्कलिफ़्ट" },
    { id: "iti", label: "ITI ट्रेड" },
    { id: "office", label: "ऑफ़िस और डेटा एंट्री" },
  ],
  "hi-Latn-IN": [
    { id: "helper", label: "Helper, packing aur warehouse" },
    { id: "machine", label: "Machine aur forklift" },
    { id: "iti", label: "ITI trade" },
    { id: "office", label: "Office aur data entry" },
  ],
  "pa-IN": [
    { id: "helper", label: "ਹੈਲਪਰ, ਪੈਕਿੰਗ ਅਤੇ ਵੇਅਰਹਾਊਸ" },
    { id: "machine", label: "ਮਸ਼ੀਨ ਅਤੇ ਫ਼ੋਰਕਲਿਫ਼ਟ" },
    { id: "iti", label: "ITI ਟ੍ਰੇਡ" },
    { id: "office", label: "ਦਫ਼ਤਰ ਅਤੇ ਡਾਟਾ ਐਂਟਰੀ" },
  ],
  "kn-IN": [
    { id: "helper", label: "ಹೆಲ್ಪರ್, ಪ್ಯಾಕಿಂಗ್ ಮತ್ತು ವೇರ್‌ಹೌಸ್" },
    { id: "machine", label: "ಮೆಷಿನ್ ಮತ್ತು ಫೋರ್ಕ್‌ಲಿಫ್ಟ್" },
    { id: "iti", label: "ITI ಟ್ರೇಡ್‌ಗಳು" },
    { id: "office", label: "ಆಫೀಸ್ ಮತ್ತು ಡೇಟಾ ಎಂಟ್ರಿ" },
  ],
};

/** The jobs menu's group links; seo:check fails if a group's #id is missing from /jobs. */
export const jobGroupLinks = (locale: Locale): NavLink[] =>
  JOB_GROUPS[locale].map((g) => ({ href: `${nearestLocalePath("/jobs", locale)}#${g.id}`, label: g.label }));

export const JOB_HUB_LINKS: Record<Locale, { slug: string; label: string }[]> = {
  "en-IN": [
    { slug: "freshers", label: "Freshers" },
    { slug: "10th-pass", label: "10th pass" },
    { slug: "12th-pass", label: "12th pass" },
  ],
  "hi-IN": [
    { slug: "freshers", label: "फ़्रेशर" },
    { slug: "10th-pass", label: "10वीं पास" },
    { slug: "12th-pass", label: "12वीं पास" },
  ],
  "hi-Latn-IN": [
    { slug: "freshers", label: "Fresher" },
    { slug: "10th-pass", label: "10th pass" },
    { slug: "12th-pass", label: "12th pass" },
  ],
  "pa-IN": [
    { slug: "freshers", label: "ਫ਼ਰੈਸ਼ਰ" },
    { slug: "10th-pass", label: "10ਵੀਂ ਪਾਸ" },
    { slug: "12th-pass", label: "12ਵੀਂ ਪਾਸ" },
  ],
  "kn-IN": [
    { slug: "freshers", label: "ಫ್ರೆಷರ್ಸ್" },
    { slug: "10th-pass", label: "10ನೇ ತರಗತಿ ಪಾಸ್" },
    { slug: "12th-pass", label: "12ನೇ ತರಗತಿ / PUC ಪಾಸ್" },
  ],
};

/** The jobs footer's links: every market's hub (MARKET_ORDER), the qualification hubs and the applicant notice once published. */
export function jobsFooterLinks(locale: Locale): NavLink[] {
  const t = JOBS_NAV[locale];
  return [
    ...orderedJobMarkets().map((id) => ({ href: nearestLocalePath(jobsHubPath(id as Exclude<ClusterId, "other">), locale), label: JOBS_AREA_LABEL[locale][id] ?? id })),
    ...JOB_HUB_LINKS[locale].map((h) => ({ href: nearestLocalePath(`/jobs/${h.slug}`, locale), label: h.label })),
    ...(linkable("/jobs/privacy", locale) ? [{ href: localePath("/jobs/privacy", locale), label: t.details }] : []),
  ];
}
