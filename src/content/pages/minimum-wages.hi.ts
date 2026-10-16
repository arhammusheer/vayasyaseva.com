/**
 * The worker-first Hindi wage hub (/hi-in/minimum-wages, PLAN §5.5): the
 * rate for your work in your state, what to do if you are paid less, and a
 * job door. It is not a translation of the English pages (those are for
 * plant HR), so it has no state pages of its own. A draft in review: built
 * and noindex, unlinked, out of the sitemap and llms.txt until a native
 * Hindi reviewer signs it off and WAGE_HI_STATUS in
 * src/content/registry/pages.ts becomes "published".
 *
 * Figures are never typed here: they come from the same datasets as the
 * English pages (src/content/wages). content:check (C13) keeps WAGE_HUB_HI in
 * step with them: every published state has an entry, and each entry names
 * a table, every zone of it, and skills that have a rate in every zone. The
 * key lines name places by hand, so C13 also pins each state's tables and
 * zones by hash (HUB_HI_SOURCE_HASH).
 *
 * Voice: short, plain Hindi a worker reads on a phone. आप with -इए forms,
 * acronyms in Latin, Western digits, no agency words, no phone.
 */
import type { WageStateSlug } from "@/content/registry/identifiers";
import { formatRupees, wageStates, type Skill, type WageState } from "@/content/wages";
import { rate } from "./minimum-wages";

const parse = (iso: string) => new Date(`${iso}T00:00:00Z`);
const longDate = new Intl.DateTimeFormat("hi-IN-u-nu-latn", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const monthYear = new Intl.DateTimeFormat("hi-IN-u-nu-latn", { month: "long", year: "numeric", timeZone: "UTC" });
/** "16 अक्टूबर 2026": Hindi month names, Western digits (PLAN §6.2). */
export const formatDateHi = (iso: string) => longDate.format(parse(iso));
/** "अक्टूबर 2026": the month in full, not the abbreviated "अक्टू॰". */
const formatMonthHi = (iso: string) => monthYear.format(parse(iso));

export const SKILLS_HI: Partial<Record<Skill, string>> = {
  unskilled: "अकुशल",
  "semi-skilled": "अर्ध-कुशल",
  skilled: "कुशल",
  "highly-skilled": "अति कुशल",
};

export type WageHubStateHi = {
  name: string;
  /** The dataset table the compact table shows. */
  table: string;
  /** Every zone of that table, in order, with its Hindi name (one zone: a monthly and a daily column). */
  zones: { id: string; name: string }[];
  skills: Skill[];
  /** One line under the table: which places or units it covers. */
  key: (s: WageState) => string;
  department: { href: string; label: string };
};

/** One entry per published state, Uttarakhand first. */
export const WAGE_HUB_HI: Partial<Record<WageStateSlug, WageHubStateHi>> = {
  uttarakhand: {
    name: "उत्तराखंड",
    table: "factories-and-industries",
    zones: [{ id: "uttarakhand", name: "पूरा उत्तराखंड" }],
    skills: ["unskilled", "semi-skilled", "skilled", "highly-skilled"],
    key: (s) =>
      `ज़्यादातर फ़ैक्टरियों की दर, पूरे राज्य में एक जैसी: सिडकुल हरिद्वार, रुड़की, देहरादून सब जगह। 50 या ज़्यादा कामगारों वाली इंजीनियरिंग इकाई में अकुशल को कम से कम ${formatRupees(rate(s, "engineering-50-plus", "uttarakhand", "unskilled").monthly)} महीना।`,
    department: { href: "https://labour.uk.gov.in/", label: "श्रम विभाग, उत्तराखंड" },
  },
  "uttar-pradesh": {
    name: "उत्तर प्रदेश",
    table: "scheduled-employments",
    zones: [
      { id: "category-1", name: "श्रेणी I" },
      { id: "category-2", name: "श्रेणी II" },
      { id: "category-3", name: "श्रेणी III" },
    ],
    skills: ["unskilled", "semi-skilled", "skilled"],
    key: () => "महीने की दर। श्रेणी I: नोएडा, ग्रेटर नोएडा और गाज़ियाबाद। श्रेणी II: नगर निगम वाले ज़िले, जैसे लखनऊ, कानपुर, आगरा, मेरठ। श्रेणी III: बाकी ज़िले।",
    department: { href: "https://uplabour.gov.in/", label: "श्रम विभाग, उत्तर प्रदेश" },
  },
  delhi: {
    name: "दिल्ली",
    table: "all-scheduled-employments",
    zones: [{ id: "delhi", name: "पूरी दिल्ली" }],
    skills: ["unskilled", "semi-skilled", "skilled"],
    key: () => "पूरी दिल्ली में एक ही दर।",
    department: { href: "https://labour.delhi.gov.in/labour/current-minimum-wage-rate", label: "श्रम विभाग, दिल्ली" },
  },
};

/**
 * The tables and zones each key line was written against (content:check C13).
 * When a state's district lists or categories change, C13 fails with the new
 * hash: check that state's key line, then update the hash here.
 */
export const HUB_HI_SOURCE_HASH: Partial<Record<WageStateSlug, string>> = {
  uttarakhand: "1e8a34bc9e69",
  "uttar-pradesh": "8838af018981",
  delhi: "df9742b2be7d",
};

export const wageHubHi = {
  title: (year: string | null) => `न्यूनतम मजदूरी${year ? ` ${year}` : ""}: उत्तराखंड, UP और दिल्ली`,
  description: () =>
    `उत्तराखंड, UP और दिल्ली में आपके काम की सबसे कम मजदूरी, महीने और रोज़ की। कम मिले तो शिकायत कहाँ करें। जाँच: ${formatMonthHi(wageStates.map((s) => s.checked.on).sort()[0])}।`,
  heading: (year: string | null) => `न्यूनतम मजदूरी${year ? ` ${year}` : ""}`,
  lede: "आपको कम से कम कितना मिलना चाहिए: अपना राज्य और अपना काम देखिए। इससे कम देने की इजाज़त नहीं है।",
  /** A quiet job line under the lede; the full door is at the foot. */
  jobsLine: { before: "नौकरी चाहिए?", label: "हरिद्वार में नौकरियाँ" },
  table: { skill: "काम", month: "महीना", day: "रोज़", notSet: "तय नहीं" },
  inForce: (date: string) => `${date} से लागू।`,
  /** Said once, under the lede, when any state's revision is overdue. */
  overdue: "कुछ राज्यों में नई दर आनी थी, जो अभी नहीं आई। नीचे सबसे नई प्रकाशित दरें हैं।",
  stale: "ये दरें बदल चुकी हो सकती हैं। राज्य के श्रम विभाग की साइट देखिए।",
  paidLess: {
    heading: "इससे कम मिल रहा है?",
    rows: [
      { title: "पर्ची संभालिए", text: "अपनी वेतन पर्ची और हाज़िरी का रिकॉर्ड रखिए। इनसे पता चलता है कि आपको कितना मिला।" },
      { title: "शिकायत कीजिए", text: "आप जिस राज्य में काम करते हैं, उसके श्रम विभाग में शिकायत कर सकते हैं। कॉन्ट्रैक्ट पर काम करने वालों पर भी यही दरें लागू हैं।" },
    ],
  },
  jobs: {
    eyebrow: "नौकरी चाहिए?",
    heading: "हरिद्वार में फ़ैक्टरी और वेयरहाउस की नौकरी।",
    text: "पूरी 8 घंटे की शिफ्ट। आवेदन की कोई फ़ीस नहीं।",
    link: { href: "/jobs/haridwar", label: "हरिद्वार में नौकरियाँ" },
  },
  checked: (date: string) => `${date} को राज्य के अपने दस्तावेज़ों से भरा गया।`,
  howWeCheck: "हमने कैसे जाँचा (अंग्रेज़ी में)",
};
