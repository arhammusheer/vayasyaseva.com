/**
 * The worker-first Hindi wage hub (/hi-in/minimum-wages, PLAN §5.5): the
 * rate for your work in your state, the state labour department as the
 * official source (neutral, never "complain": owner direction 17 Oct 2026), and a
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
  unskilled: "अकुशल (अनस्किल्ड)",
  "semi-skilled": "अर्ध-कुशल (सेमी-स्किल्ड)",
  skilled: "कुशल (स्किल्ड)",
  "highly-skilled": "अति-कुशल (हाईली स्किल्ड)",
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
      { id: "category-1", name: "कैटेगरी I" },
      { id: "category-2", name: "कैटेगरी II" },
      { id: "category-3", name: "कैटेगरी III" },
    ],
    skills: ["unskilled", "semi-skilled", "skilled"],
    key: () => "महीने की दर। कैटेगरी I: नोएडा, ग्रेटर नोएडा और गाज़ियाबाद। कैटेगरी II: नगर निगम वाले ज़िले, जैसे लखनऊ, कानपुर, आगरा, मेरठ। कैटेगरी III: बाकी ज़िले।",
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
  haryana: {
    name: "हरियाणा",
    table: "all-employments",
    zones: [{ id: "haryana", name: "पूरा हरियाणा" }],
    skills: ["unskilled", "semi-skilled", "skilled", "highly-skilled"],
    key: () => "पूरे हरियाणा में एक ही दर: गुरुग्राम, मानेसर, फ़रीदाबाद, कुंडली सब जगह।",
    department: { href: "https://hrylabour.gov.in/", label: "श्रम विभाग, हरियाणा" },
  },
  punjab: {
    name: "पंजाब",
    table: "all-employments",
    zones: [{ id: "punjab", name: "पूरा पंजाब" }],
    skills: ["unskilled", "semi-skilled", "skilled", "highly-skilled"],
    key: () => "पूरे पंजाब में एक ही दर। दफ़्तर के स्टाफ़ (चपरासी, क्लर्क) की दरें अलग हैं।",
    department: { href: "https://pblabour.gov.in/", label: "श्रम विभाग, पंजाब" },
  },
  "andhra-pradesh": {
    name: "आंध्र प्रदेश",
    table: "any-manufacturing",
    zones: [{ id: "andhra-pradesh", name: "पूरा आंध्र प्रदेश" }],
    skills: ["unskilled", "semi-skilled", "skilled", "highly-skilled"],
    key: (s) =>
      `फ़ैक्टरियों की दर, पूरे राज्य में एक जैसी: विशाखापत्तनम, अनकापल्ली, विजयवाड़ा सब जगह। जिस काम की अपनी अलग दर है, जैसे दुकान, होटल, सिक्योरिटी या कंस्ट्रक्शन, उसमें वही दर लागू है। कॉन्ट्रैक्ट पर काम करने वालों के लिए लेबर कमिश्नर की अपनी दर भी है: अकुशल को कम से कम ${formatRupees(rate(s, "contract-labour", "andhra-pradesh", "unskilled").monthly)} महीना।`,
    department: { href: "https://labour.ap.gov.in/", label: "श्रम विभाग, आंध्र प्रदेश" },
  },
  karnataka: {
    name: "कर्नाटक",
    table: "single-notification",
    zones: [
      { id: "zone-1", name: "ज़ोन 1" },
      { id: "zone-2", name: "ज़ोन 2" },
      { id: "zone-3", name: "ज़ोन 3" },
    ],
    skills: ["unskilled", "semi-skilled", "skilled", "highly-skilled"],
    key: () =>
      "22 मई 2026 के नोटिफ़िकेशन में 79 कामों की दर: इंजीनियरिंग, कंस्ट्रक्शन, दुकानें, होटल, सिक्योरिटी और दूसरे। महीने की दर, बेसिक और VDA मिलाकर। ज़ोन 1: बेंगलुरु शहर। ज़ोन 2: दूसरे नगर निगम और ज़िला मुख्यालय। ज़ोन 3: बाकी इलाके। फ़ाउंड्री, बिजलीघर और सफ़ाई के काम की दर ज़्यादा है। गारमेंट (सिलाई), खेती, बागान, बीड़ी, काजू और लोडिंग जैसे 19 कामों की अपनी अलग दरें हैं।",
    department: { href: "https://karmikaspandana.karnataka.gov.in/en", label: "श्रम विभाग, कर्नाटक" },
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
  haryana: "983ea0b50882",
  punjab: "2196ab5cd3f7",
  "andhra-pradesh": "c13c14de10cf",
  karnataka: "1373b905d51d",
};

export const wageHubHi = {
  title: (year: string | null) => `न्यूनतम मजदूरी${year ? ` ${year}` : ""}: उत्तराखंड, UP, दिल्ली, हरियाणा, पंजाब, आंध्र प्रदेश`,
  description: () =>
    `उत्तराखंड, UP, दिल्ली, हरियाणा, पंजाब और आंध्र प्रदेश में आपके काम की सबसे कम मज़दूरी, महीने की और रोज़ की, और हर राज्य के श्रम विभाग की सरकारी साइट। आख़िरी जाँच: ${formatMonthHi(wageStates.map((s) => s.checked.on).sort()[0])}।`,
  heading: (year: string | null) => `न्यूनतम मजदूरी${year ? ` ${year}` : ""}`,
  lede: "आपको कम से कम कितना मिलना चाहिए: अपना राज्य और अपना काम देखिए। इससे कम देने की इजाज़त नहीं है।",
  /** The page's one jobs door: a quiet line under the lede. */
  jobsLine: { before: "नौकरी चाहिए?", label: "नौकरियाँ देखें", href: "/jobs" },
  table: { skill: "स्किल", month: "महीना", day: "रोज़", notSet: "तय नहीं" },
  inForce: (date: string) => `${date} से लागू।`,
  /** Said once, under the lede, when any state's revision is overdue. */
  overdue: "कुछ राज्यों में नई दर आनी थी, जो अभी नहीं आई। नीचे अभी तक की सबसे नई सरकारी दरें हैं।",
  stale: "हो सकता है ये दरें बदल गई हों। राज्य के श्रम विभाग की साइट देखिए।",
  paidLess: {
    heading: "मज़दूरी पर सवाल है?",
    rows: [
      { title: "सैलरी स्लिप संभालकर रखिए", text: "अपनी सैलरी स्लिप और हाज़िरी का रिकॉर्ड रखिए। इनसे पता चलता है कि आपको कितना मिला।" },
      { title: "श्रम विभाग से पूछिए", text: "आप जिस राज्य में काम करते हैं, उसके श्रम विभाग से दरों और नियमों की पक्की जानकारी मिलती है। कॉन्ट्रैक्ट पर काम करने वालों पर भी यही दरें लागू हैं।" },
    ],
  },

  checked: (date: string) => `${date} को हर राज्य के अपने नोटिफ़िकेशन से अपडेट किया गया।`,
  howWeCheck: "हमने कैसे जाँचा (अंग्रेज़ी में)",
};
