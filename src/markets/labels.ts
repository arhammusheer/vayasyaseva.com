/**
 * Market names and link labels, per language. Layer 1b: a separate entry
 * point from ./index.ts (which must not re-export it), so the proxy and the
 * bundles that only need a decision carry none of these strings.
 *
 * Two names where they differ today: `name` is the market's name ("Jalandhar",
 * also its jobs chip), `short` the business header's label for the region's
 * buyer page ("Jalandhar–Kapurthala", which covers Kapurthala's buyers too).
 */
import type { LocaleTag } from "@/content/registry/identifiers";
import type { JobsMarketId, MarketId } from "./data";

type MarketLabel = {
  /** The market's name per language; English is required and is the fallback. */
  name: Partial<Record<LocaleTag, string>> & { "en-IN": string };
  /** The business header's label for the buyer page, when it differs from the English name. */
  short?: string;
};

export const MARKET_LABELS = {
  "andhra-pradesh": { name: { "en-IN": "Andhra Pradesh", "hi-IN": "आंध्र प्रदेश", "hi-Latn-IN": "Andhra Pradesh" } },
  bengaluru: { name: { "en-IN": "Bengaluru", "hi-IN": "बेंगलुरु", "hi-Latn-IN": "Bengaluru" } },
  dehradun: { name: { "en-IN": "Dehradun", "hi-IN": "देहरादून", "hi-Latn-IN": "Dehradun" } },
  "delhi-ncr": { name: { "en-IN": "Delhi NCR", "hi-IN": "दिल्ली NCR", "hi-Latn-IN": "Delhi NCR" } },
  haridwar: { name: { "en-IN": "Haridwar", "hi-IN": "हरिद्वार", "hi-Latn-IN": "Haridwar" } },
  hyderabad: { name: { "en-IN": "Hyderabad", "hi-IN": "हैदराबाद", "hi-Latn-IN": "Hyderabad" } },
  jalandhar: {
    name: { "en-IN": "Jalandhar", "hi-IN": "जालंधर", "hi-Latn-IN": "Jalandhar", "pa-IN": "ਜਲੰਧਰ" },
    short: "Jalandhar–Kapurthala",
  },
  kapurthala: { name: { "en-IN": "Kapurthala", "hi-IN": "कपूरथला", "hi-Latn-IN": "Kapurthala", "pa-IN": "ਕਪੂਰਥਲਾ" } },
  punjab: { name: { "en-IN": "Punjab", "hi-IN": "पंजाब", "hi-Latn-IN": "Punjab", "pa-IN": "ਪੰਜਾਬ" } },
  telangana: { name: { "en-IN": "Telangana", "hi-IN": "तेलंगाना", "hi-Latn-IN": "Telangana" } },
  uttarakhand: { name: { "en-IN": "Uttarakhand", "hi-IN": "उत्तराखंड", "hi-Latn-IN": "Uttarakhand" } },
  visakhapatnam: { name: { "en-IN": "Visakhapatnam", "hi-IN": "विशाखापत्तनम", "hi-Latn-IN": "Visakhapatnam" } },
} as const satisfies Record<MarketId, MarketLabel>;

/** The jobs door, menu and link label for a market's jobs hub, in every language. */
export const JOBS_LINK_LABELS = {
  "andhra-pradesh": {
    "en-IN": "Jobs across Andhra Pradesh",
    "hi-IN": "पूरे आंध्र प्रदेश में नौकरी",
    "hi-Latn-IN": "Poore Andhra Pradesh mein job",
    "kn-IN": "ಆಂಧ್ರ ಪ್ರದೇಶದಾದ್ಯಂತ ಉದ್ಯೋಗ",
    "pa-IN": "ਪੂਰੇ ਆਂਧਰਾ ਪ੍ਰਦੇਸ਼ ਵਿੱਚ ਨੌਕਰੀ",
  },
  bengaluru: {
    "en-IN": "Jobs in Bengaluru",
    "hi-IN": "बेंगलुरु में नौकरी",
    "hi-Latn-IN": "Bengaluru mein job",
    "kn-IN": "ಬೆಂಗಳೂರಿನಲ್ಲಿ ಉದ್ಯೋಗ",
    "pa-IN": "ਬੈਂਗਲੁਰੂ ਵਿੱਚ ਨੌਕਰੀ",
  },
  dehradun: {
    "en-IN": "Jobs in Dehradun",
    "hi-IN": "देहरादून में नौकरी",
    "hi-Latn-IN": "Dehradun mein job",
    "kn-IN": "ಡೆಹ್ರಾಡೂನ್‌ನಲ್ಲಿ ಉದ್ಯೋಗ",
    "pa-IN": "ਦੇਹਰਾਦੂਨ ਵਿੱਚ ਨੌਕਰੀ",
  },
  haridwar: {
    "en-IN": "Jobs in Haridwar",
    "hi-IN": "हरिद्वार में नौकरी",
    "hi-Latn-IN": "Haridwar mein job",
    "kn-IN": "ಹರಿದ್ವಾರದಲ್ಲಿ ಉದ್ಯೋಗ",
    "pa-IN": "ਹਰਿਦੁਆਰ ਵਿੱਚ ਨੌਕਰੀ",
  },
  hyderabad: {
    "en-IN": "Jobs in Hyderabad",
    "hi-IN": "हैदराबाद में नौकरी",
    "hi-Latn-IN": "Hyderabad mein job",
    "kn-IN": "ಹೈದರಾಬಾದ್‌ನಲ್ಲಿ ಉದ್ಯೋಗ",
    "pa-IN": "ਹੈਦਰਾਬਾਦ ਵਿੱਚ ਨੌਕਰੀ",
  },
  jalandhar: {
    "en-IN": "Jobs in Jalandhar",
    "hi-IN": "जालंधर में नौकरी",
    "hi-Latn-IN": "Jalandhar mein job",
    "kn-IN": "ಜಲಂಧರ್‌ನಲ್ಲಿ ಉದ್ಯೋಗ",
    "pa-IN": "ਜਲੰਧਰ ਵਿੱਚ ਨੌਕਰੀ",
  },
  kapurthala: {
    "en-IN": "Jobs in Kapurthala and Phagwara",
    "hi-IN": "कपूरथला और फगवाड़ा में नौकरी",
    "hi-Latn-IN": "Kapurthala aur Phagwara mein job",
    "kn-IN": "ಕಪೂರ್ಥಲಾ ಮತ್ತು ಫಗ್ವಾರಾದಲ್ಲಿ ಉದ್ಯೋಗ",
    "pa-IN": "ਕਪੂਰਥਲਾ ਅਤੇ ਫਗਵਾੜਾ ਵਿੱਚ ਨੌਕਰੀ",
  },
  punjab: {
    "en-IN": "Jobs across Punjab",
    "hi-IN": "पूरे पंजाब में नौकरी",
    "hi-Latn-IN": "Poore Punjab mein job",
    "kn-IN": "ಪಂಜಾಬ್‌ನಾದ್ಯಂತ ಉದ್ಯೋಗ",
    "pa-IN": "ਪੂਰੇ ਪੰਜਾਬ ਵਿੱਚ ਨੌਕਰੀ",
  },
  telangana: {
    "en-IN": "Jobs across Telangana",
    "hi-IN": "पूरे तेलंगाना में नौकरी",
    "hi-Latn-IN": "Poore Telangana mein job",
    "kn-IN": "ತೆಲಂಗಾಣದಾದ್ಯಂತ ಉದ್ಯೋಗ",
    "pa-IN": "ਪੂਰੇ ਤੇਲੰਗਾਨਾ ਵਿੱਚ ਨੌਕਰੀ",
  },
  uttarakhand: {
    "en-IN": "Jobs across Uttarakhand",
    "hi-IN": "पूरे उत्तराखंड में नौकरी",
    "hi-Latn-IN": "Poore Uttarakhand mein job",
    "kn-IN": "ಉತ್ತರಾಖಂಡದಾದ್ಯಂತ ಉದ್ಯೋಗ",
    "pa-IN": "ਪੂਰੇ ਉੱਤਰਾਖੰਡ ਵਿੱਚ ਨੌਕਰੀ",
  },
  visakhapatnam: {
    "en-IN": "Jobs in Visakhapatnam",
    "hi-IN": "विशाखापत्तनम में नौकरी",
    "hi-Latn-IN": "Visakhapatnam mein job",
    "kn-IN": "ವಿಶಾಖಪಟ್ಟಣದಲ್ಲಿ ಉದ್ಯೋಗ",
    "pa-IN": "ਵਿਸ਼ਾਖਾਪਟਨਮ ਵਿੱਚ ਨੌਕਰੀ",
  },
} as const satisfies Record<JobsMarketId, Record<LocaleTag, string>>;

const isLabelled = (id: string | null | undefined): id is MarketId => !!id && Object.hasOwn(MARKET_LABELS, id);
const hasJobsLink = (id: string | null | undefined): id is JobsMarketId => !!id && Object.hasOwn(JOBS_LINK_LABELS, id);

/** A market's name in a language, else its English name; undefined for a cluster that is not a market. */
export function marketName(id: string | null | undefined, locale: LocaleTag): string | undefined {
  if (!isLabelled(id)) return undefined;
  const name: MarketLabel["name"] = MARKET_LABELS[id].name;
  return name[locale] ?? name["en-IN"];
}

/** The business header's label for a market's buyer page: its short label, else its English name, else the id. */
export function businessLabel(id: string): string {
  if (!isLabelled(id)) return id;
  const label: MarketLabel = MARKET_LABELS[id];
  return label.short ?? label.name["en-IN"];
}

/** The label for a market's jobs hub in a language; undefined for a market without one. */
export const jobsLinkLabel = (id: string | null | undefined, locale: LocaleTag): string | undefined => (hasJobsLink(id) ? JOBS_LINK_LABELS[id][locale] : undefined);
