import type { Locale } from "@/lib/i18n";
import { QUICK_ANSWERS, type JobRole, type QuickQuestion } from "@/lib/talent-intake/rules";
import { areaFilesUnder, formAreas, marketAreaAnswers, type JobsMarketId } from "@/markets/index";
import { NO_FEE, SHIFTS_LINE } from "@/content/pages/jobs";

/**
 * The guided jobs page (/jobs/apply): tap answers, with follow-up questions
 * that depend on the work chosen, then name and number. The same form is
 * embedded on /jobs/haridwar, the role and hub pages. /jobs/apply is noindex
 * and out of the sitemap (a form, not a search landing), and stays the
 * Google Ads and SMS landing (docs/seo-checklist.md). Option ids are fixed values sent to analytics and to
 * staff, the same in every language. hi-IN and hi-Latn-IN are drafts pending
 * native review, like the other jobs pages.
 */
/** Answer ids per question, from the shared rules (also read by the Windmill intake). */
const ids = (q: QuickQuestion) => Object.keys(QUICK_ANSWERS[q]);
export const WORK_OPTIONS = Object.keys(QUICK_ANSWERS.work) as (keyof typeof QUICK_ANSWERS.work)[];
export type WorkOption = keyof typeof QUICK_ANSWERS.work;

export type Answers = Record<string, string[]>;

export interface StepDef {
  id: QuickQuestion;
  kind: "single" | "multi";
  options: readonly string[];
  /** Shown only when this returns true for the answers so far. */
  when?: (a: Answers) => boolean;
}

const picked = (a: Answers, step: string, value: string) => a[step]?.includes(value) ?? false;

/**
 * "Where do you live?" answers (no market is the default, owner direction
 * 17 Oct 2026), by where the form's market came from (AreaSource):
 * - "page" or "link": the market's own areas, ending with the rest of its
 *   state where that is another market, and "outside", which files under
 *   the page's market (rules.ts submissionCluster).
 * - "decision": the decided market's areas, then every other market in
 *   place of "outside", so a wrong guess never files the person as "other".
 * - "ask": which market, in MARKET_ORDER, "Somewhere else" last.
 * `first`: markets to list first among the market answers, in order (the
 * visitor context's markets when torn between two, then nearby markets).
 */
export type AreaSource = "page" | "link" | "decision" | "ask";
// The answers and their order: src/markets/areas.ts (from rules' AREA_CLUSTERS).
const MARKET_AREAS = marketAreaAnswers();

/** Market answers with `first`'s markets moved to the front, in its order. */
const marketsFirst = (ids: readonly string[], first: readonly string[]) => {
  const rank = (id: string) => {
    const i = first.indexOf(areaFilesUnder(id) ?? "");
    return i < 0 ? first.length : i;
  };
  return [...ids].sort((a, b) => rank(a) - rank(b));
};

export function areaOptions(cluster: string | null | undefined, source: AreaSource = cluster ? "page" : "ask", first: readonly string[] = []): readonly string[] {
  const own = formAreas(cluster);
  if (!own || source === "ask") return marketsFirst(MARKET_AREAS, first);
  if (source !== "decision") return own;
  // Every answer but "outside" (one that files under no market).
  const local = own.filter((id) => areaFilesUnder(id) !== null);
  const covered = new Set(local.map(areaFilesUnder));
  const others = MARKET_AREAS.filter((id) => {
    const market = areaFilesUnder(id);
    return market === null || !covered.has(market);
  });
  return [...local, ...marketsFirst(others, first)];
}

/** The questions, in order. Follow-ups appear only for the work chosen. */
export const STEP_DEFS: StepDef[] = [
  { id: "work", kind: "multi", options: ids("work") },
  { id: "trade", kind: "multi", options: ids("trade"), when: (a) => picked(a, "work", "iti-trades") },
  { id: "iti", kind: "single", options: ids("iti"), when: (a) => picked(a, "work", "iti-trades") },
  { id: "machines", kind: "multi", options: ids("machines"), when: (a) => picked(a, "work", "machine-operator") },
  { id: "forklift", kind: "single", options: ids("forklift"), when: (a) => picked(a, "work", "forklift-operator") },
  { id: "computer", kind: "multi", options: ids("computer"), when: (a) => picked(a, "work", "data-entry-operator") },
  { id: "experience", kind: "single", options: ids("experience") },
  { id: "education", kind: "single", options: ids("education") },
  { id: "shift", kind: "multi", options: ids("shift") },
  { id: "start", kind: "single", options: ids("start") },
  // Last of the taps, so the final step is only name and number. The
  // options depend on the page's cluster (areaOptions).
  { id: "area", kind: "single", options: MARKET_AREAS },
];

/** The role a submission is tagged with: the first work chosen, or the ITI trade when only one. */
export function roleFor(a: Answers): JobRole | null {
  const first = a.work?.find((w) => w !== "any") as WorkOption | undefined;
  if (!first) return null;
  if (first === "iti-trades") {
    const trades = (a.trade ?? []).filter((t) => t === "electrician" || t === "welder" || t === "fitter");
    return trades.length === 1 ? (trades[0] as JobRole) : "iti-trades";
  }
  return first as JobRole;
}

export interface QuickApplyCopy {
  title: string;
  description: string;
  /** The share image's label only: the page itself has no eyebrow. */
  eyebrow: string;
  /** Last breadcrumb, after Home and Jobs. */
  breadcrumb: string;
  heading: string;
  lede: string;
  /**
   * The H1 and title when ?cluster=<id> names a market (ads landing on
   * /jobs/apply for it); the defaults name no market.
   */
  inCluster: Record<JobsMarketId, { title: string; heading: string }>;
  next: string;
  /**
   * An answer the link or page gave (?work=packing, a role page) shows as one
   * confirmed line, "Work: Packing ✓ · change": `short` names the question,
   * `change` reopens its answers.
   */
  answered: { change: string; short: Record<QuickQuestion, string> };
  questions: Record<string, { question: string; hint?: string }>;
  labels: Record<string, string>;
  details: {
    question: string;
    name: string;
    namePlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    /** Marks the photos and documents button as one that can be skipped. */
    optional: string;
    send: string;
  };
  errors: { name: string };
  /** The form's footer: the page's one no-fee line. */
  noFee: string;
  /** One calm line above the form: full 8-hour shifts, no part-time work. */
  shifts: string;
}


export const quickApplyCopy: Record<Locale, QuickApplyCopy> = {
  "en-IN": {
    title: "Apply for Factory and Warehouse Work: Quick Form",
    description: "Apply for factory, packing, warehouse and ITI work. No fee to apply. Full 8-hour shifts. Tap a few answers, then your name and number.",
    eyebrow: "JOBS",
    breadcrumb: "Quick application",
    heading: "Looking for factory or warehouse work?",
    lede: "Tap a few answers, then your name and number.",
    inCluster: {
      haridwar: { title: "Apply for Work in SIDCUL Haridwar: Quick Form", heading: "Looking for work in SIDCUL Haridwar?" },
      uttarakhand: { title: "Apply for Work in Uttarakhand: Quick Form", heading: "Looking for work in Uttarakhand?" },
      dehradun: { title: "Apply for Work in Dehradun and Selaqui: Quick Form", heading: "Looking for work in Dehradun or Selaqui?" },
      punjab: { title: "Apply for Work in Punjab: Quick Form", heading: "Looking for work in Punjab?" },
      bengaluru: { title: "Apply for Work in Bengaluru: Quick Form", heading: "Looking for work in Bengaluru?" },
      jalandhar: { title: "Apply for Work in Jalandhar: Quick Form", heading: "Looking for work in Jalandhar?" },
      kapurthala: { title: "Apply for Work in Kapurthala and Phagwara: Quick Form", heading: "Looking for work in Kapurthala or Phagwara?" },
      visakhapatnam: { title: "Apply for Work in Visakhapatnam (Vizag): Quick Form", heading: "Looking for work in Visakhapatnam?" },
      "andhra-pradesh": { title: "Apply for Work in Andhra Pradesh: Quick Form", heading: "Looking for work in Andhra Pradesh?" },
    },
    next: "Next",
    answered: {
      change: "change",
      short: { work: "Work", trade: "Trade", iti: "ITI", machines: "Machines", forklift: "Licence", computer: "Computer", experience: "Experience", education: "Studied", shift: "Shift", start: "Start", area: "Area" },
    },
    questions: {
      work: { question: "What work are you looking for?" },
      trade: { question: "Which ITI trade?" },
      iti: { question: "Your ITI?" },
      machines: { question: "Which machines have you run?" },
      forklift: { question: "Do you have a licence?" },
      computer: { question: "What can you do on a computer?" },
      experience: { question: "How much work experience do you have?" },
      education: { question: "How far have you studied?" },
      shift: { question: "Which shifts can you do?" },
      start: { question: "When can you start?" },
      area: { question: "Where do you live?" },
    },
    labels: {
      "factory-helper": "Factory helper", packing: "Packing", warehouse: "Warehouse / loading", "machine-operator": "Machine operator",
      "iti-trades": "ITI trade", housekeeping: "Housekeeping", "data-entry-operator": "Data entry", "forklift-operator": "Forklift operator",
      any: "Any work", electrician: "Electrician", welder: "Welder", fitter: "Fitter", machinist: "Machinist / turner", "other-trade": "Other trade",
      "iti-pass": "ITI passed", "iti-pursuing": "Studying or apprentice", "no-iti": "No ITI, but experienced",
      "packing-machine": "Packing machines", moulding: "Injection moulding", press: "Press / sheet metal", "cnc-vmc": "CNC / VMC",
      "other-machine": "Other machines", "licence-experience": "Licence and experience", "experience-only": "Experience, no licence",
      "want-to-learn": "No, I want to learn", typing: "Typing", excel: "Excel", tally: "Tally", "sap-erp": "SAP / ERP",
      fresher: "None, I'm a fresher", "under-1": "Less than 1 year", "1-3": "1 to 3 years", "3-plus": "More than 3 years",
      "below-10th": "Below 10th", "10th": "10th pass", "12th": "12th pass", "iti-diploma": "ITI / diploma", graduate: "Graduate",
      day: "Day", night: "Night", rotating: "Rotating, any shift", now: "Right away", week: "Within a week", month: "Within a month",
      "sidcul-bahadrabad": "SIDCUL / Bahadrabad", "haridwar-jwalapur": "Haridwar city / Jwalapur", "roorkee-bhagwanpur": "Roorkee / Bhagwanpur",
      laksar: "Laksar", outside: "Outside Haridwar",
      "bengaluru:north": "North / Peenya", "bengaluru:south": "South / Electronic City", "bengaluru:east": "East / Whitefield", "bengaluru:west": "West / Kengeri",
      "bengaluru:outside": "Outside Bengaluru",
      "jalandhar:kapurthala": "Kapurthala / Phagwara", "jalandhar:city": "Jalandhar city", "jalandhar:phagwara-goraya": "Phagwara / Goraya",
      "jalandhar:outside": "Somewhere else", "jalandhar:goraya-phillaur": "Goraya / Phillaur",
      "uttarakhand:haridwar": "Haridwar / Roorkee", "uttarakhand:dehradun-selaqui": "Dehradun / Selaqui",
      "uttarakhand:udham-singh-nagar": "Rudrapur / Kashipur / Sitarganj", "uttarakhand:other": "Elsewhere in Uttarakhand",
      "uttarakhand:outside": "Outside Uttarakhand",
      "punjab:jalandhar-kapurthala": "Jalandhar / Kapurthala", "punjab:ludhiana": "Ludhiana", "punjab:mohali": "Mohali / Kharar",
      "punjab:amritsar": "Amritsar", "punjab:other": "Elsewhere in Punjab", "punjab:outside": "Outside Punjab",
      "punjab:jalandhar": "Jalandhar", "punjab:kapurthala": "Kapurthala / Phagwara",
      "market:haridwar": "Haridwar / Roorkee", "market:uttarakhand": "Elsewhere in Uttarakhand", "market:jalandhar": "Jalandhar",
      "market:punjab": "Elsewhere in Punjab", "market:bengaluru": "Bengaluru", "market:other": "Somewhere else",
      "haridwar:rest-of-uttarakhand": "Elsewhere in Uttarakhand", "jalandhar:rest-of-punjab": "Elsewhere in Punjab",
      "dehradun:selaqui-sahaspur": "Selaqui / Sahaspur", "dehradun:city": "Dehradun city", "dehradun:rishikesh-doiwala": "Rishikesh / Doiwala",
      "dehradun:vikasnagar": "Vikasnagar / Herbertpur", "dehradun:outside": "Somewhere else", "market:dehradun": "Dehradun / Selaqui",
      "dehradun:rest-of-uttarakhand": "Elsewhere in Uttarakhand",
      "kapurthala:city": "Kapurthala city", "kapurthala:phagwara": "Phagwara", "kapurthala:sultanpur-lodhi": "Sultanpur Lodhi / Bholath",
      "kapurthala:outside": "Somewhere else", "kapurthala:jalandhar": "Jalandhar", "market:kapurthala": "Kapurthala / Phagwara",
      "kapurthala:rest-of-punjab": "Elsewhere in Punjab",
      "visakhapatnam:city": "Visakhapatnam city", "visakhapatnam:gajuwaka": "Gajuwaka / Steel Plant / Duvvada",
      "visakhapatnam:pendurthi": "Pendurthi / Sabbavaram", "visakhapatnam:anakapalli": "Anakapalli / Parawada / Atchutapuram",
      "visakhapatnam:outside": "Somewhere else", "visakhapatnam:rest-of-andhra-pradesh": "Elsewhere in Andhra Pradesh",
      "andhra-pradesh:visakhapatnam": "Visakhapatnam / Anakapalli", "andhra-pradesh:vijayawada-guntur": "Vijayawada / Guntur",
      "andhra-pradesh:kakinada-rajahmundry": "Kakinada / Rajahmundry", "andhra-pradesh:nellore-tirupati": "Nellore / Tirupati / Sri City",
      "andhra-pradesh:other": "Elsewhere in Andhra Pradesh", "andhra-pradesh:outside": "Outside Andhra Pradesh",
      "market:visakhapatnam": "Visakhapatnam (Vizag)", "market:andhra-pradesh": "Elsewhere in Andhra Pradesh",
    },
    details: {
      question: "Last step: how do we reach you?",
      name: "Your name",
      namePlaceholder: "Name",
      phone: "Mobile number",
      phonePlaceholder: "10-digit mobile number",
      optional: "Optional",
      send: "Send",
    },
    errors: { name: "Write your full name (at least 2 letters)." },
    noFee: NO_FEE["en-IN"],
    shifts: SHIFTS_LINE["en-IN"],
  },
  "hi-IN": {
    title: "फ़ैक्टरी और वेयरहाउस के काम के लिए अप्लाई करें: छोटा फ़ॉर्म",
    description: "फ़ैक्टरी, पैकिंग, वेयरहाउस और ITI के काम के लिए आवेदन करें। कोई फ़ीस नहीं। पूरी 8 घंटे की शिफ्ट। कुछ जवाब चुनिए, फिर नाम और नंबर।",
    eyebrow: "नौकरी",
    breadcrumb: "जल्दी आवेदन",
    heading: "फ़ैक्टरी या वेयरहाउस का काम चाहिए?",
    lede: "कुछ जवाब चुनिए, फिर अपना नाम और नंबर।",
    inCluster: {
      haridwar: { title: "सिडकुल हरिद्वार में काम के लिए अप्लाई करें: छोटा फ़ॉर्म", heading: "सिडकुल हरिद्वार में काम चाहिए?" },
      uttarakhand: { title: "उत्तराखंड में काम के लिए अप्लाई करें: छोटा फ़ॉर्म", heading: "उत्तराखंड में काम चाहिए?" },
      dehradun: { title: "देहरादून और सेलाकुई में काम के लिए अप्लाई करें: छोटा फ़ॉर्म", heading: "देहरादून या सेलाकुई में काम चाहिए?" },
      punjab: { title: "पंजाब में काम के लिए अप्लाई करें: छोटा फ़ॉर्म", heading: "पंजाब में काम चाहिए?" },
      bengaluru: { title: "बेंगलुरु में काम के लिए अप्लाई करें: छोटा फ़ॉर्म", heading: "बेंगलुरु में काम चाहिए?" },
      jalandhar: { title: "जालंधर में काम के लिए अप्लाई करें: छोटा फ़ॉर्म", heading: "जालंधर में काम चाहिए?" },
      kapurthala: { title: "कपूरथला और फगवाड़ा में काम के लिए अप्लाई करें: छोटा फ़ॉर्म", heading: "कपूरथला या फगवाड़ा में काम चाहिए?" },
      visakhapatnam: { title: "विशाखापत्तनम (वाइज़ैग) में काम के लिए अप्लाई करें: छोटा फ़ॉर्म", heading: "विशाखापत्तनम में काम चाहिए?" },
      "andhra-pradesh": { title: "आंध्र प्रदेश में काम के लिए अप्लाई करें: छोटा फ़ॉर्म", heading: "आंध्र प्रदेश में काम चाहिए?" },
    },
    next: "आगे",
    answered: {
      change: "बदलें",
      short: { work: "काम", trade: "ट्रेड", iti: "ITI", machines: "मशीनें", forklift: "लाइसेंस", computer: "कंप्यूटर", experience: "अनुभव", education: "पढ़ाई", shift: "शिफ्ट", start: "शुरुआत", area: "इलाका" },
    },
    questions: {
      work: { question: "आपको कौन-सा काम चाहिए?" },
      trade: { question: "कौन-सा ITI ट्रेड?" },
      iti: { question: "आपका ITI?" },
      machines: { question: "आपने कौन-सी मशीनें चलाई हैं?" },
      forklift: { question: "क्या आपके पास लाइसेंस है?" },
      computer: { question: "आप कंप्यूटर पर क्या कर लेते हैं?" },
      experience: { question: "आपके पास काम का कितना अनुभव है?" },
      education: { question: "आपने कहाँ तक पढ़ाई की है?" },
      shift: { question: "आप कौन-सी शिफ्ट कर सकते हैं?" },
      start: { question: "आप कब से काम शुरू कर सकते हैं?" },
      area: { question: "आप कहाँ रहते हैं?" },
    },
    labels: {
      "factory-helper": "फ़ैक्टरी हेल्पर", packing: "पैकिंग", warehouse: "वेयरहाउस / लोडिंग", "machine-operator": "मशीन ऑपरेटर",
      "iti-trades": "ITI ट्रेड", housekeeping: "हाउसकीपिंग", "data-entry-operator": "डेटा एंट्री", "forklift-operator": "फ़ोर्कलिफ़्ट ऑपरेटर",
      any: "कोई भी काम", electrician: "इलेक्ट्रीशियन", welder: "वेल्डर", fitter: "फ़िटर", machinist: "मशीनिस्ट / टर्नर", "other-trade": "दूसरा ट्रेड",
      "iti-pass": "ITI पास", "iti-pursuing": "पढ़ाई या अप्रेंटिस चल रही है", "no-iti": "ITI नहीं, पर अनुभव है",
      "packing-machine": "पैकिंग मशीनें", moulding: "इंजेक्शन मोल्डिंग", press: "प्रेस / शीट मेटल", "cnc-vmc": "CNC / VMC",
      "other-machine": "दूसरी मशीनें", "licence-experience": "लाइसेंस और अनुभव दोनों", "experience-only": "अनुभव है, लाइसेंस नहीं",
      "want-to-learn": "नहीं, सीखना चाहता/चाहती हूँ", typing: "टाइपिंग", excel: "Excel", tally: "Tally", "sap-erp": "SAP / ERP",
      fresher: "नहीं, मैं फ़्रेशर हूँ", "under-1": "1 साल से कम", "1-3": "1 से 3 साल", "3-plus": "3 साल से ज़्यादा",
      "below-10th": "10वीं से कम", "10th": "10वीं पास", "12th": "12वीं पास", "iti-diploma": "ITI / डिप्लोमा", graduate: "ग्रेजुएट",
      day: "दिन", night: "रात", rotating: "बदलती शिफ्ट, कोई भी", now: "तुरंत", week: "एक हफ़्ते में", month: "एक महीने में",
      "sidcul-bahadrabad": "सिडकुल / बहादराबाद", "haridwar-jwalapur": "हरिद्वार शहर / ज्वालापुर", "roorkee-bhagwanpur": "रुड़की / भगवानपुर",
      laksar: "लक्सर", outside: "हरिद्वार से बाहर",
      "bengaluru:north": "नॉर्थ / पीन्या", "bengaluru:south": "साउथ / इलेक्ट्रॉनिक सिटी", "bengaluru:east": "ईस्ट / व्हाइटफ़ील्ड", "bengaluru:west": "वेस्ट / केंगेरी",
      "bengaluru:outside": "बेंगलुरु से बाहर",
      "jalandhar:kapurthala": "कपूरथला / फगवाड़ा", "jalandhar:city": "जालंधर शहर", "jalandhar:phagwara-goraya": "फगवाड़ा / गुराया",
      "jalandhar:outside": "कहीं और", "jalandhar:goraya-phillaur": "गुराया / फिल्लौर",
      "uttarakhand:haridwar": "हरिद्वार / रुड़की", "uttarakhand:dehradun-selaqui": "देहरादून / सेलाकुई",
      "uttarakhand:udham-singh-nagar": "रुद्रपुर / काशीपुर / सितारगंज", "uttarakhand:other": "उत्तराखंड में कहीं और",
      "uttarakhand:outside": "उत्तराखंड से बाहर",
      "punjab:jalandhar-kapurthala": "जालंधर / कपूरथला", "punjab:ludhiana": "लुधियाना", "punjab:mohali": "मोहाली / खरड़",
      "punjab:amritsar": "अमृतसर", "punjab:other": "पंजाब में कहीं और", "punjab:outside": "पंजाब से बाहर",
      "punjab:jalandhar": "जालंधर", "punjab:kapurthala": "कपूरथला / फगवाड़ा",
      "market:haridwar": "हरिद्वार / रुड़की", "market:uttarakhand": "उत्तराखंड में कहीं और", "market:jalandhar": "जालंधर",
      "market:punjab": "पंजाब में कहीं और", "market:bengaluru": "बेंगलुरु", "market:other": "कहीं और",
      "haridwar:rest-of-uttarakhand": "उत्तराखंड में कहीं और", "jalandhar:rest-of-punjab": "पंजाब में कहीं और",
      "dehradun:selaqui-sahaspur": "सेलाकुई / सहसपुर", "dehradun:city": "देहरादून शहर", "dehradun:rishikesh-doiwala": "ऋषिकेश / डोईवाला",
      "dehradun:vikasnagar": "विकासनगर / हरबर्टपुर", "dehradun:outside": "कहीं और", "market:dehradun": "देहरादून / सेलाकुई",
      "dehradun:rest-of-uttarakhand": "उत्तराखंड में कहीं और",
      "kapurthala:city": "कपूरथला शहर", "kapurthala:phagwara": "फगवाड़ा", "kapurthala:sultanpur-lodhi": "सुल्तानपुर लोधी / भुलत्थ",
      "kapurthala:outside": "कहीं और", "kapurthala:jalandhar": "जालंधर", "market:kapurthala": "कपूरथला / फगवाड़ा",
      "kapurthala:rest-of-punjab": "पंजाब में कहीं और",
      "visakhapatnam:city": "विशाखापत्तनम शहर", "visakhapatnam:gajuwaka": "गाजुवाका / स्टील प्लांट / दुव्वाडा",
      "visakhapatnam:pendurthi": "पेंडुर्ती / सब्बवरम", "visakhapatnam:anakapalli": "अनकापल्ली / परवाड़ा / अच्युतापुरम",
      "visakhapatnam:outside": "कहीं और", "visakhapatnam:rest-of-andhra-pradesh": "आंध्र प्रदेश में कहीं और",
      "andhra-pradesh:visakhapatnam": "विशाखापत्तनम / अनकापल्ली", "andhra-pradesh:vijayawada-guntur": "विजयवाड़ा / गुंटूर",
      "andhra-pradesh:kakinada-rajahmundry": "काकीनाडा / राजमुंदरी", "andhra-pradesh:nellore-tirupati": "नेल्लोर / तिरुपति / श्री सिटी",
      "andhra-pradesh:other": "आंध्र प्रदेश में कहीं और", "andhra-pradesh:outside": "आंध्र प्रदेश से बाहर",
      "market:visakhapatnam": "विशाखापत्तनम (वाइज़ैग)", "market:andhra-pradesh": "आंध्र प्रदेश में कहीं और",
    },
    details: {
      question: "आख़िरी कदम: आपसे संपर्क कैसे करें?",
      name: "आपका नाम",
      namePlaceholder: "नाम",
      phone: "मोबाइल नंबर",
      phonePlaceholder: "10 अंकों का मोबाइल नंबर",
      optional: "ज़रूरी नहीं",
      send: "भेजें",
    },
    errors: { name: "पूरा नाम लिखिए (कम से कम 2 अक्षर)।" },
    noFee: NO_FEE["hi-IN"],
    shifts: SHIFTS_LINE["hi-IN"],
  },
  "hi-Latn-IN": {
    title: "Factory, Warehouse Job: Apply Karein, Chhota Form",
    description: "Factory, packing, warehouse aur ITI ke kaam ke liye apply karein. Koi fee nahi. Poori 8 ghante ki shift. Kuch jawab tap kijiye, phir naam aur number.",
    eyebrow: "Jobs",
    breadcrumb: "Jaldi apply",
    heading: "Factory ya warehouse ka kaam chahiye?",
    lede: "Kuch jawab tap kijiye, phir apna naam aur number.",
    inCluster: {
      haridwar: { title: "SIDCUL Haridwar Job: Apply Karein, Chhota Form", heading: "SIDCUL Haridwar mein kaam chahiye?" },
      uttarakhand: { title: "Uttarakhand Job: Apply Karein, Chhota Form", heading: "Uttarakhand mein kaam chahiye?" },
      dehradun: { title: "Dehradun, Selaqui Job: Apply Karein, Chhota Form", heading: "Dehradun ya Selaqui mein kaam chahiye?" },
      punjab: { title: "Punjab Job: Apply Karein, Chhota Form", heading: "Punjab mein kaam chahiye?" },
      bengaluru: { title: "Bengaluru Job: Apply Karein, Chhota Form", heading: "Bengaluru mein kaam chahiye?" },
      jalandhar: { title: "Jalandhar Job: Apply Karein, Chhota Form", heading: "Jalandhar mein kaam chahiye?" },
      kapurthala: { title: "Kapurthala, Phagwara Job: Apply Karein, Chhota Form", heading: "Kapurthala ya Phagwara mein kaam chahiye?" },
      visakhapatnam: { title: "Visakhapatnam (Vizag) Job: Apply Karein, Chhota Form", heading: "Visakhapatnam mein kaam chahiye?" },
      "andhra-pradesh": { title: "Andhra Pradesh Job: Apply Karein, Chhota Form", heading: "Andhra Pradesh mein kaam chahiye?" },
    },
    next: "Aage",
    answered: {
      change: "badlein",
      short: { work: "Kaam", trade: "Trade", iti: "ITI", machines: "Machines", forklift: "Licence", computer: "Computer", experience: "Anubhav", education: "Padhai", shift: "Shift", start: "Shuruaat", area: "Ilaka" },
    },
    questions: {
      work: { question: "Aapko kaun-sa kaam chahiye?" },
      trade: { question: "Kaun-sa ITI trade?" },
      iti: { question: "Aapka ITI?" },
      machines: { question: "Aapne kaun-si machines chalayi hain?" },
      forklift: { question: "Kya aapke paas licence hai?" },
      computer: { question: "Aap computer par kya kar lete hain?" },
      experience: { question: "Aapke paas kaam ka kitna experience hai?" },
      education: { question: "Aapne kahan tak padhai ki hai?" },
      shift: { question: "Aap kaun-si shift kar sakte hain?" },
      start: { question: "Aap kab se kaam shuru kar sakte hain?" },
      area: { question: "Aap kahan rehte hain?" },
    },
    labels: {
      "factory-helper": "Factory helper", packing: "Packing", warehouse: "Warehouse / loading", "machine-operator": "Machine operator",
      "iti-trades": "ITI trade", housekeeping: "Housekeeping", "data-entry-operator": "Data entry", "forklift-operator": "Forklift operator",
      any: "Koi bhi kaam", electrician: "Electrician", welder: "Welder", fitter: "Fitter", machinist: "Machinist / turner", "other-trade": "Dusra trade",
      "iti-pass": "ITI pass", "iti-pursuing": "Padhai ya apprentice chal rahi hai", "no-iti": "ITI nahi, par experience hai",
      "packing-machine": "Packing machines", moulding: "Injection moulding", press: "Press / sheet metal", "cnc-vmc": "CNC / VMC",
      "other-machine": "Dusri machines", "licence-experience": "Licence aur experience dono", "experience-only": "Experience hai, licence nahi",
      "want-to-learn": "Nahi, seekhna chahte hain", typing: "Typing", excel: "Excel", tally: "Tally", "sap-erp": "SAP / ERP",
      fresher: "Nahi, main fresher hoon", "under-1": "1 saal se kam", "1-3": "1 se 3 saal", "3-plus": "3 saal se zyada",
      "below-10th": "10th se kam", "10th": "10th pass", "12th": "12th pass", "iti-diploma": "ITI / diploma", graduate: "Graduate",
      day: "Din", night: "Raat", rotating: "Badalti shift, koi bhi", now: "Turant", week: "Ek hafte mein", month: "Ek mahine mein",
      "sidcul-bahadrabad": "SIDCUL / Bahadrabad", "haridwar-jwalapur": "Haridwar shehar / Jwalapur", "roorkee-bhagwanpur": "Roorkee / Bhagwanpur",
      laksar: "Laksar", outside: "Haridwar se bahar",
      "bengaluru:north": "North / Peenya", "bengaluru:south": "South / Electronic City", "bengaluru:east": "East / Whitefield", "bengaluru:west": "West / Kengeri",
      "bengaluru:outside": "Bengaluru se bahar",
      "jalandhar:kapurthala": "Kapurthala / Phagwara", "jalandhar:city": "Jalandhar shehar", "jalandhar:phagwara-goraya": "Phagwara / Goraya",
      "jalandhar:outside": "Kahin aur", "jalandhar:goraya-phillaur": "Goraya / Phillaur",
      "uttarakhand:haridwar": "Haridwar / Roorkee", "uttarakhand:dehradun-selaqui": "Dehradun / Selaqui",
      "uttarakhand:udham-singh-nagar": "Rudrapur / Kashipur / Sitarganj", "uttarakhand:other": "Uttarakhand mein kahin aur",
      "uttarakhand:outside": "Uttarakhand se bahar",
      "punjab:jalandhar-kapurthala": "Jalandhar / Kapurthala", "punjab:ludhiana": "Ludhiana", "punjab:mohali": "Mohali / Kharar",
      "punjab:amritsar": "Amritsar", "punjab:other": "Punjab mein kahin aur", "punjab:outside": "Punjab se bahar",
      "punjab:jalandhar": "Jalandhar", "punjab:kapurthala": "Kapurthala / Phagwara",
      "market:haridwar": "Haridwar / Roorkee", "market:uttarakhand": "Uttarakhand mein kahin aur", "market:jalandhar": "Jalandhar",
      "market:punjab": "Punjab mein kahin aur", "market:bengaluru": "Bengaluru", "market:other": "Kahin aur",
      "haridwar:rest-of-uttarakhand": "Uttarakhand mein kahin aur", "jalandhar:rest-of-punjab": "Punjab mein kahin aur",
      "dehradun:selaqui-sahaspur": "Selaqui / Sahaspur", "dehradun:city": "Dehradun shehar", "dehradun:rishikesh-doiwala": "Rishikesh / Doiwala",
      "dehradun:vikasnagar": "Vikasnagar / Herbertpur", "dehradun:outside": "Kahin aur", "market:dehradun": "Dehradun / Selaqui",
      "dehradun:rest-of-uttarakhand": "Uttarakhand mein kahin aur",
      "kapurthala:city": "Kapurthala shehar", "kapurthala:phagwara": "Phagwara", "kapurthala:sultanpur-lodhi": "Sultanpur Lodhi / Bholath",
      "kapurthala:outside": "Kahin aur", "kapurthala:jalandhar": "Jalandhar", "market:kapurthala": "Kapurthala / Phagwara",
      "kapurthala:rest-of-punjab": "Punjab mein kahin aur",
      "visakhapatnam:city": "Visakhapatnam shehar", "visakhapatnam:gajuwaka": "Gajuwaka / Steel Plant / Duvvada",
      "visakhapatnam:pendurthi": "Pendurthi / Sabbavaram", "visakhapatnam:anakapalli": "Anakapalli / Parawada / Atchutapuram",
      "visakhapatnam:outside": "Kahin aur", "visakhapatnam:rest-of-andhra-pradesh": "Andhra Pradesh mein kahin aur",
      "andhra-pradesh:visakhapatnam": "Visakhapatnam / Anakapalli", "andhra-pradesh:vijayawada-guntur": "Vijayawada / Guntur",
      "andhra-pradesh:kakinada-rajahmundry": "Kakinada / Rajahmundry", "andhra-pradesh:nellore-tirupati": "Nellore / Tirupati / Sri City",
      "andhra-pradesh:other": "Andhra Pradesh mein kahin aur", "andhra-pradesh:outside": "Andhra Pradesh se bahar",
      "market:visakhapatnam": "Visakhapatnam (Vizag)", "market:andhra-pradesh": "Andhra Pradesh mein kahin aur",
    },
    details: {
      question: "Aakhri step: aapse sampark kaise karein?",
      name: "Aapka naam",
      namePlaceholder: "Naam",
      phone: "Mobile number",
      phonePlaceholder: "10 digit ka mobile number",
      optional: "Zaroori nahi",
      send: "Bhejein",
    },
    errors: { name: "Poora naam likhiye (kam se kam 2 akshar)." },
    noFee: NO_FEE["hi-Latn-IN"],
    shifts: SHIFTS_LINE["hi-Latn-IN"],
  },
  "pa-IN": {
    title: "ਫ਼ੈਕਟਰੀ ਅਤੇ ਵੇਅਰਹਾਊਸ ਦੇ ਕੰਮ ਲਈ ਅਪਲਾਈ ਕਰੋ: ਛੋਟਾ ਫ਼ਾਰਮ",
    description: "ਫ਼ੈਕਟਰੀ, ਪੈਕਿੰਗ, ਵੇਅਰਹਾਊਸ ਅਤੇ ITI ਦੇ ਕੰਮ ਲਈ ਅਪਲਾਈ ਕਰੋ। ਕੋਈ ਫ਼ੀਸ ਨਹੀਂ। ਪੂਰੀ 8 ਘੰਟੇ ਦੀ ਸ਼ਿਫ਼ਟ। ਕੁਝ ਜਵਾਬ ਚੁਣੋ, ਫਿਰ ਨਾਮ ਅਤੇ ਨੰਬਰ।",
    eyebrow: "ਨੌਕਰੀ",
    breadcrumb: "ਜਲਦੀ ਅਪਲਾਈ",
    heading: "ਫ਼ੈਕਟਰੀ ਜਾਂ ਵੇਅਰਹਾਊਸ ਦਾ ਕੰਮ ਚਾਹੀਦਾ ਹੈ?",
    lede: "ਕੁਝ ਜਵਾਬ ਚੁਣੋ, ਫਿਰ ਆਪਣਾ ਨਾਮ ਅਤੇ ਨੰਬਰ।",
    inCluster: {
      haridwar: { title: "ਸਿਡਕੁਲ ਹਰਿਦੁਆਰ ਵਿੱਚ ਕੰਮ ਲਈ ਅਪਲਾਈ ਕਰੋ: ਛੋਟਾ ਫ਼ਾਰਮ", heading: "ਸਿਡਕੁਲ ਹਰਿਦੁਆਰ ਵਿੱਚ ਕੰਮ ਚਾਹੀਦਾ ਹੈ?" },
      uttarakhand: { title: "ਉੱਤਰਾਖੰਡ ਵਿੱਚ ਕੰਮ ਲਈ ਅਪਲਾਈ ਕਰੋ: ਛੋਟਾ ਫ਼ਾਰਮ", heading: "ਉੱਤਰਾਖੰਡ ਵਿੱਚ ਕੰਮ ਚਾਹੀਦਾ ਹੈ?" },
      dehradun: { title: "ਦੇਹਰਾਦੂਨ ਅਤੇ ਸੇਲਾਕੁਈ ਵਿੱਚ ਕੰਮ ਲਈ ਅਪਲਾਈ ਕਰੋ: ਛੋਟਾ ਫ਼ਾਰਮ", heading: "ਦੇਹਰਾਦੂਨ ਜਾਂ ਸੇਲਾਕੁਈ ਵਿੱਚ ਕੰਮ ਚਾਹੀਦਾ ਹੈ?" },
      punjab: { title: "ਪੰਜਾਬ ਵਿੱਚ ਕੰਮ ਲਈ ਅਪਲਾਈ ਕਰੋ: ਛੋਟਾ ਫ਼ਾਰਮ", heading: "ਪੰਜਾਬ ਵਿੱਚ ਕੰਮ ਚਾਹੀਦਾ ਹੈ?" },
      bengaluru: { title: "ਬੈਂਗਲੁਰੂ ਵਿੱਚ ਕੰਮ ਲਈ ਅਪਲਾਈ ਕਰੋ: ਛੋਟਾ ਫ਼ਾਰਮ", heading: "ਬੈਂਗਲੁਰੂ ਵਿੱਚ ਕੰਮ ਚਾਹੀਦਾ ਹੈ?" },
      jalandhar: { title: "ਜਲੰਧਰ ਵਿੱਚ ਕੰਮ ਲਈ ਅਪਲਾਈ ਕਰੋ: ਛੋਟਾ ਫ਼ਾਰਮ", heading: "ਜਲੰਧਰ ਵਿੱਚ ਕੰਮ ਚਾਹੀਦਾ ਹੈ?" },
      kapurthala: { title: "ਕਪੂਰਥਲਾ ਅਤੇ ਫਗਵਾੜਾ ਵਿੱਚ ਕੰਮ ਲਈ ਅਪਲਾਈ ਕਰੋ: ਛੋਟਾ ਫ਼ਾਰਮ", heading: "ਕਪੂਰਥਲਾ ਜਾਂ ਫਗਵਾੜਾ ਵਿੱਚ ਕੰਮ ਚਾਹੀਦਾ ਹੈ?" },
      visakhapatnam: { title: "ਵਿਸ਼ਾਖਾਪਟਨਮ (ਵਾਈਜ਼ੈਗ) ਵਿੱਚ ਕੰਮ ਲਈ ਅਪਲਾਈ ਕਰੋ: ਛੋਟਾ ਫ਼ਾਰਮ", heading: "ਵਿਸ਼ਾਖਾਪਟਨਮ ਵਿੱਚ ਕੰਮ ਚਾਹੀਦਾ ਹੈ?" },
      "andhra-pradesh": { title: "ਆਂਧਰਾ ਪ੍ਰਦੇਸ਼ ਵਿੱਚ ਕੰਮ ਲਈ ਅਪਲਾਈ ਕਰੋ: ਛੋਟਾ ਫ਼ਾਰਮ", heading: "ਆਂਧਰਾ ਪ੍ਰਦੇਸ਼ ਵਿੱਚ ਕੰਮ ਚਾਹੀਦਾ ਹੈ?" },
    },
    next: "ਅੱਗੇ",
    answered: {
      change: "ਬਦਲੋ",
      short: { work: "ਕੰਮ", trade: "ਟ੍ਰੇਡ", iti: "ITI", machines: "ਮਸ਼ੀਨਾਂ", forklift: "ਲਾਇਸੈਂਸ", computer: "ਕੰਪਿਊਟਰ", experience: "ਤਜਰਬਾ", education: "ਪੜ੍ਹਾਈ", shift: "ਸ਼ਿਫ਼ਟ", start: "ਸ਼ੁਰੂਆਤ", area: "ਇਲਾਕਾ" },
    },
    questions: {
      work: { question: "ਤੁਹਾਨੂੰ ਕਿਹੜਾ ਕੰਮ ਚਾਹੀਦਾ ਹੈ?" },
      trade: { question: "ਕਿਹੜਾ ITI ਟ੍ਰੇਡ?" },
      iti: { question: "ਤੁਹਾਡਾ ITI?" },
      machines: { question: "ਤੁਸੀਂ ਕਿਹੜੀਆਂ ਮਸ਼ੀਨਾਂ ਚਲਾਈਆਂ ਹਨ?" },
      forklift: { question: "ਕੀ ਤੁਹਾਡੇ ਕੋਲ ਲਾਇਸੈਂਸ ਹੈ?" },
      computer: { question: "ਤੁਸੀਂ ਕੰਪਿਊਟਰ 'ਤੇ ਕੀ ਕਰ ਲੈਂਦੇ ਹੋ?" },
      experience: { question: "ਤੁਹਾਡੇ ਕੋਲ ਕੰਮ ਦਾ ਕਿੰਨਾ ਤਜਰਬਾ ਹੈ?" },
      education: { question: "ਤੁਸੀਂ ਕਿੱਥੋਂ ਤੱਕ ਪੜ੍ਹਾਈ ਕੀਤੀ ਹੈ?" },
      shift: { question: "ਤੁਸੀਂ ਕਿਹੜੀ ਸ਼ਿਫ਼ਟ ਕਰ ਸਕਦੇ ਹੋ?" },
      start: { question: "ਤੁਸੀਂ ਕਦੋਂ ਤੋਂ ਕੰਮ ਸ਼ੁਰੂ ਕਰ ਸਕਦੇ ਹੋ?" },
      area: { question: "ਤੁਸੀਂ ਕਿੱਥੇ ਰਹਿੰਦੇ ਹੋ?" },
    },
    labels: {
      "factory-helper": "ਫ਼ੈਕਟਰੀ ਹੈਲਪਰ", packing: "ਪੈਕਿੰਗ", warehouse: "ਵੇਅਰਹਾਊਸ / ਲੋਡਿੰਗ", "machine-operator": "ਮਸ਼ੀਨ ਆਪਰੇਟਰ",
      "iti-trades": "ITI ਟ੍ਰੇਡ", housekeeping: "ਹਾਊਸਕੀਪਿੰਗ", "data-entry-operator": "ਡਾਟਾ ਐਂਟਰੀ", "forklift-operator": "ਫ਼ੋਰਕਲਿਫ਼ਟ ਆਪਰੇਟਰ",
      any: "ਕੋਈ ਵੀ ਕੰਮ", electrician: "ਇਲੈਕਟ੍ਰੀਸ਼ੀਅਨ", welder: "ਵੈਲਡਰ", fitter: "ਫ਼ਿਟਰ", machinist: "ਮਸ਼ੀਨਿਸਟ / ਟਰਨਰ", "other-trade": "ਹੋਰ ਟ੍ਰੇਡ",
      "iti-pass": "ITI ਪਾਸ", "iti-pursuing": "ਪੜ੍ਹਾਈ ਜਾਂ ਅਪ੍ਰੈਂਟਿਸ ਚੱਲ ਰਹੀ ਹੈ", "no-iti": "ITI ਨਹੀਂ, ਪਰ ਤਜਰਬਾ ਹੈ",
      "packing-machine": "ਪੈਕਿੰਗ ਮਸ਼ੀਨਾਂ", moulding: "ਇੰਜੈਕਸ਼ਨ ਮੋਲਡਿੰਗ", press: "ਪ੍ਰੈੱਸ / ਸ਼ੀਟ ਮੈਟਲ", "cnc-vmc": "CNC / VMC",
      "other-machine": "ਹੋਰ ਮਸ਼ੀਨਾਂ", "licence-experience": "ਲਾਇਸੈਂਸ ਅਤੇ ਤਜਰਬਾ ਦੋਵੇਂ", "experience-only": "ਤਜਰਬਾ ਹੈ, ਲਾਇਸੈਂਸ ਨਹੀਂ",
      "want-to-learn": "ਨਹੀਂ, ਸਿੱਖਣਾ ਚਾਹੁੰਦਾ/ਚਾਹੁੰਦੀ ਹਾਂ", typing: "ਟਾਈਪਿੰਗ", excel: "Excel", tally: "Tally", "sap-erp": "SAP / ERP",
      fresher: "ਨਹੀਂ, ਮੈਂ ਫ਼ਰੈਸ਼ਰ ਹਾਂ", "under-1": "1 ਸਾਲ ਤੋਂ ਘੱਟ", "1-3": "1 ਤੋਂ 3 ਸਾਲ", "3-plus": "3 ਸਾਲ ਤੋਂ ਵੱਧ",
      "below-10th": "10ਵੀਂ ਤੋਂ ਘੱਟ", "10th": "10ਵੀਂ ਪਾਸ", "12th": "12ਵੀਂ ਪਾਸ", "iti-diploma": "ITI / ਡਿਪਲੋਮਾ", graduate: "ਗ੍ਰੈਜੂਏਟ",
      day: "ਦਿਨ", night: "ਰਾਤ", rotating: "ਬਦਲਦੀ ਸ਼ਿਫ਼ਟ, ਕੋਈ ਵੀ", now: "ਤੁਰੰਤ", week: "ਇੱਕ ਹਫ਼ਤੇ ਵਿੱਚ", month: "ਇੱਕ ਮਹੀਨੇ ਵਿੱਚ",
      "sidcul-bahadrabad": "ਸਿਡਕੁਲ / ਬਹਾਦਰਾਬਾਦ", "haridwar-jwalapur": "ਹਰਿਦੁਆਰ ਸ਼ਹਿਰ / ਜਵਾਲਾਪੁਰ", "roorkee-bhagwanpur": "ਰੁੜਕੀ / ਭਗਵਾਨਪੁਰ",
      laksar: "ਲਕਸਰ", outside: "ਹਰਿਦੁਆਰ ਤੋਂ ਬਾਹਰ",
      "bengaluru:north": "ਨੌਰਥ / ਪੀਨਿਆ", "bengaluru:south": "ਸਾਊਥ / ਇਲੈਕਟ੍ਰਾਨਿਕ ਸਿਟੀ", "bengaluru:east": "ਈਸਟ / ਵ੍ਹਾਈਟਫ਼ੀਲਡ", "bengaluru:west": "ਵੈਸਟ / ਕੇਂਗੇਰੀ",
      "bengaluru:outside": "ਬੈਂਗਲੁਰੂ ਤੋਂ ਬਾਹਰ",
      "jalandhar:kapurthala": "ਕਪੂਰਥਲਾ / ਫਗਵਾੜਾ", "jalandhar:city": "ਜਲੰਧਰ ਸ਼ਹਿਰ", "jalandhar:phagwara-goraya": "ਫਗਵਾੜਾ / ਗੁਰਾਇਆ",
      "jalandhar:outside": "ਕਿਤੇ ਹੋਰ", "jalandhar:goraya-phillaur": "ਗੁਰਾਇਆ / ਫਿਲੌਰ",
      "uttarakhand:haridwar": "ਹਰਿਦੁਆਰ / ਰੁੜਕੀ", "uttarakhand:dehradun-selaqui": "ਦੇਹਰਾਦੂਨ / ਸੇਲਾਕੁਈ",
      "uttarakhand:udham-singh-nagar": "ਰੁਦਰਪੁਰ / ਕਾਸ਼ੀਪੁਰ / ਸਿਤਾਰਗੰਜ", "uttarakhand:other": "ਉੱਤਰਾਖੰਡ ਵਿੱਚ ਕਿਤੇ ਹੋਰ",
      "uttarakhand:outside": "ਉੱਤਰਾਖੰਡ ਤੋਂ ਬਾਹਰ",
      "punjab:jalandhar-kapurthala": "ਜਲੰਧਰ / ਕਪੂਰਥਲਾ", "punjab:ludhiana": "ਲੁਧਿਆਣਾ", "punjab:mohali": "ਮੋਹਾਲੀ / ਖਰੜ",
      "punjab:amritsar": "ਅੰਮ੍ਰਿਤਸਰ", "punjab:other": "ਪੰਜਾਬ ਵਿੱਚ ਕਿਤੇ ਹੋਰ", "punjab:outside": "ਪੰਜਾਬ ਤੋਂ ਬਾਹਰ",
      "punjab:jalandhar": "ਜਲੰਧਰ", "punjab:kapurthala": "ਕਪੂਰਥਲਾ / ਫਗਵਾੜਾ",
      "market:haridwar": "ਹਰਿਦੁਆਰ / ਰੁੜਕੀ", "market:uttarakhand": "ਉੱਤਰਾਖੰਡ ਵਿੱਚ ਕਿਤੇ ਹੋਰ", "market:jalandhar": "ਜਲੰਧਰ",
      "market:punjab": "ਪੰਜਾਬ ਵਿੱਚ ਕਿਤੇ ਹੋਰ", "market:bengaluru": "ਬੈਂਗਲੁਰੂ", "market:other": "ਕਿਤੇ ਹੋਰ",
      "haridwar:rest-of-uttarakhand": "ਉੱਤਰਾਖੰਡ ਵਿੱਚ ਕਿਤੇ ਹੋਰ", "jalandhar:rest-of-punjab": "ਪੰਜਾਬ ਵਿੱਚ ਕਿਤੇ ਹੋਰ",
      "dehradun:selaqui-sahaspur": "ਸੇਲਾਕੁਈ / ਸਹਸਪੁਰ", "dehradun:city": "ਦੇਹਰਾਦੂਨ ਸ਼ਹਿਰ", "dehradun:rishikesh-doiwala": "ਰਿਸ਼ੀਕੇਸ਼ / ਡੋਈਵਾਲਾ",
      "dehradun:vikasnagar": "ਵਿਕਾਸਨਗਰ / ਹਰਬਰਟਪੁਰ", "dehradun:outside": "ਕਿਤੇ ਹੋਰ", "market:dehradun": "ਦੇਹਰਾਦੂਨ / ਸੇਲਾਕੁਈ",
      "dehradun:rest-of-uttarakhand": "ਉੱਤਰਾਖੰਡ ਵਿੱਚ ਕਿਤੇ ਹੋਰ",
      "kapurthala:city": "ਕਪੂਰਥਲਾ ਸ਼ਹਿਰ", "kapurthala:phagwara": "ਫਗਵਾੜਾ", "kapurthala:sultanpur-lodhi": "ਸੁਲਤਾਨਪੁਰ ਲੋਧੀ / ਭੁਲੱਥ",
      "kapurthala:outside": "ਕਿਤੇ ਹੋਰ", "kapurthala:jalandhar": "ਜਲੰਧਰ", "market:kapurthala": "ਕਪੂਰਥਲਾ / ਫਗਵਾੜਾ",
      "kapurthala:rest-of-punjab": "ਪੰਜਾਬ ਵਿੱਚ ਕਿਤੇ ਹੋਰ",
      "visakhapatnam:city": "ਵਿਸ਼ਾਖਾਪਟਨਮ ਸ਼ਹਿਰ", "visakhapatnam:gajuwaka": "ਗਾਜੁਵਾਕਾ / ਸਟੀਲ ਪਲਾਂਟ / ਦੁੱਵਾਡਾ",
      "visakhapatnam:pendurthi": "ਪੇਂਦੁਰਤੀ / ਸੱਬਵਰਮ", "visakhapatnam:anakapalli": "ਅਨਕਾਪੱਲੀ / ਪਰਵਾੜਾ / ਅੱਚੁਤਾਪੁਰਮ",
      "visakhapatnam:outside": "ਕਿਤੇ ਹੋਰ", "visakhapatnam:rest-of-andhra-pradesh": "ਆਂਧਰਾ ਪ੍ਰਦੇਸ਼ ਵਿੱਚ ਕਿਤੇ ਹੋਰ",
      "andhra-pradesh:visakhapatnam": "ਵਿਸ਼ਾਖਾਪਟਨਮ / ਅਨਕਾਪੱਲੀ", "andhra-pradesh:vijayawada-guntur": "ਵਿਜੇਵਾੜਾ / ਗੁੰਟੂਰ",
      "andhra-pradesh:kakinada-rajahmundry": "ਕਾਕੀਨਾਡਾ / ਰਾਜਮੁੰਦਰੀ", "andhra-pradesh:nellore-tirupati": "ਨੈਲੋਰ / ਤਿਰੂਪਤੀ / ਸ੍ਰੀ ਸਿਟੀ",
      "andhra-pradesh:other": "ਆਂਧਰਾ ਪ੍ਰਦੇਸ਼ ਵਿੱਚ ਕਿਤੇ ਹੋਰ", "andhra-pradesh:outside": "ਆਂਧਰਾ ਪ੍ਰਦੇਸ਼ ਤੋਂ ਬਾਹਰ",
      "market:visakhapatnam": "ਵਿਸ਼ਾਖਾਪਟਨਮ (ਵਾਈਜ਼ੈਗ)", "market:andhra-pradesh": "ਆਂਧਰਾ ਪ੍ਰਦੇਸ਼ ਵਿੱਚ ਕਿਤੇ ਹੋਰ",
    },
    details: {
      question: "ਆਖ਼ਰੀ ਕਦਮ: ਤੁਹਾਡੇ ਨਾਲ ਸੰਪਰਕ ਕਿਵੇਂ ਕਰੀਏ?",
      name: "ਤੁਹਾਡਾ ਨਾਮ",
      namePlaceholder: "ਨਾਮ",
      phone: "ਮੋਬਾਈਲ ਨੰਬਰ",
      phonePlaceholder: "10 ਅੰਕਾਂ ਦਾ ਮੋਬਾਈਲ ਨੰਬਰ",
      optional: "ਜ਼ਰੂਰੀ ਨਹੀਂ",
      send: "ਭੇਜੋ",
    },
    errors: { name: "ਪੂਰਾ ਨਾਮ ਲਿਖੋ (ਘੱਟੋ-ਘੱਟ 2 ਅੱਖਰ)।" },
    noFee: NO_FEE["pa-IN"],
    shifts: SHIFTS_LINE["pa-IN"],
  },
  "kn-IN": {
    title: "ಫ್ಯಾಕ್ಟರಿ ಮತ್ತು ವೇರ್‌ಹೌಸ್ ಕೆಲಸಕ್ಕೆ ಅರ್ಜಿ: ಚಿಕ್ಕ ಫಾರ್ಮ್",
    description: "ಫ್ಯಾಕ್ಟರಿ, ಪ್ಯಾಕಿಂಗ್, ವೇರ್‌ಹೌಸ್ ಮತ್ತು ITI ಕೆಲಸಕ್ಕೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ. ಯಾವುದೇ ಶುಲ್ಕವಿಲ್ಲ. ಪೂರ್ಣ 8 ಗಂಟೆಗಳ ಶಿಫ್ಟ್. ಕೆಲವು ಉತ್ತರಗಳನ್ನು ಆರಿಸಿ, ನಂತರ ಹೆಸರು ಮತ್ತು ಸಂಖ್ಯೆ.",
    eyebrow: "ಉದ್ಯೋಗಗಳು",
    breadcrumb: "ತ್ವರಿತ ಅರ್ಜಿ",
    heading: "ಫ್ಯಾಕ್ಟರಿ ಅಥವಾ ವೇರ್‌ಹೌಸ್ ಕೆಲಸ ಬೇಕೇ?",
    lede: "ಕೆಲವು ಉತ್ತರಗಳನ್ನು ಆರಿಸಿ, ನಂತರ ನಿಮ್ಮ ಹೆಸರು ಮತ್ತು ಸಂಖ್ಯೆ.",
    inCluster: {
      haridwar: { title: "ಸಿಡ್ಕುಲ್ ಹರಿದ್ವಾರದಲ್ಲಿ ಕೆಲಸಕ್ಕೆ ಅರ್ಜಿ: ಚಿಕ್ಕ ಫಾರ್ಮ್", heading: "ಸಿಡ್ಕುಲ್ ಹರಿದ್ವಾರದಲ್ಲಿ ಕೆಲಸ ಬೇಕೇ?" },
      uttarakhand: { title: "ಉತ್ತರಾಖಂಡದಲ್ಲಿ ಕೆಲಸಕ್ಕೆ ಅರ್ಜಿ: ಚಿಕ್ಕ ಫಾರ್ಮ್", heading: "ಉತ್ತರಾಖಂಡದಲ್ಲಿ ಕೆಲಸ ಬೇಕೇ?" },
      dehradun: { title: "ಡೆಹ್ರಾಡೂನ್ ಮತ್ತು ಸೆಲಾಕುಯಿಯಲ್ಲಿ ಕೆಲಸಕ್ಕೆ ಅರ್ಜಿ: ಚಿಕ್ಕ ಫಾರ್ಮ್", heading: "ಡೆಹ್ರಾಡೂನ್ ಅಥವಾ ಸೆಲಾಕುಯಿಯಲ್ಲಿ ಕೆಲಸ ಬೇಕೇ?" },
      jalandhar: { title: "ಜಲಂಧರ್‌ನಲ್ಲಿ ಕೆಲಸಕ್ಕೆ ಅರ್ಜಿ: ಚಿಕ್ಕ ಫಾರ್ಮ್", heading: "ಜಲಂಧರ್‌ನಲ್ಲಿ ಕೆಲಸ ಬೇಕೇ?" },
      kapurthala: { title: "ಕಪೂರ್ಥಲಾ ಮತ್ತು ಫಗ್ವಾರಾದಲ್ಲಿ ಕೆಲಸಕ್ಕೆ ಅರ್ಜಿ: ಚಿಕ್ಕ ಫಾರ್ಮ್", heading: "ಕಪೂರ್ಥಲಾ ಅಥವಾ ಫಗ್ವಾರಾದಲ್ಲಿ ಕೆಲಸ ಬೇಕೇ?" },
      punjab: { title: "ಪಂಜಾಬ್‌ನಲ್ಲಿ ಕೆಲಸಕ್ಕೆ ಅರ್ಜಿ: ಚಿಕ್ಕ ಫಾರ್ಮ್", heading: "ಪಂಜಾಬ್‌ನಲ್ಲಿ ಕೆಲಸ ಬೇಕೇ?" },
      bengaluru: { title: "ಬೆಂಗಳೂರಿನಲ್ಲಿ ಕೆಲಸಕ್ಕೆ ಅರ್ಜಿ: ಚಿಕ್ಕ ಫಾರ್ಮ್", heading: "ಬೆಂಗಳೂರಿನಲ್ಲಿ ಕೆಲಸ ಬೇಕೇ?" },
      visakhapatnam: { title: "ವಿಶಾಖಪಟ್ಟಣದಲ್ಲಿ ಕೆಲಸಕ್ಕೆ ಅರ್ಜಿ: ಚಿಕ್ಕ ಫಾರ್ಮ್", heading: "ವಿಶಾಖಪಟ್ಟಣದಲ್ಲಿ ಕೆಲಸ ಬೇಕೇ?" },
      "andhra-pradesh": { title: "ಆಂಧ್ರ ಪ್ರದೇಶದಲ್ಲಿ ಕೆಲಸಕ್ಕೆ ಅರ್ಜಿ: ಚಿಕ್ಕ ಫಾರ್ಮ್", heading: "ಆಂಧ್ರ ಪ್ರದೇಶದಲ್ಲಿ ಕೆಲಸ ಬೇಕೇ?" },
    },
    next: "ಮುಂದೆ",
    answered: {
      change: "ಬದಲಾಯಿಸಿ",
      short: { work: "ಕೆಲಸ", trade: "ಟ್ರೇಡ್", iti: "ITI", machines: "ಯಂತ್ರಗಳು", forklift: "ಲೈಸೆನ್ಸ್", computer: "ಕಂಪ್ಯೂಟರ್", experience: "ಅನುಭವ", education: "ಓದು", shift: "ಶಿಫ್ಟ್", start: "ಆರಂಭ", area: "ಪ್ರದೇಶ" },
    },
    questions: {
      work: { question: "ನಿಮಗೆ ಯಾವ ಕೆಲಸ ಬೇಕು?" },
      trade: { question: "ಯಾವ ITI ಟ್ರೇಡ್?" },
      iti: { question: "ನಿಮ್ಮ ITI?" },
      machines: { question: "ನೀವು ಯಾವ ಮೆಷಿನ್‌ಗಳನ್ನು ಚಲಾಯಿಸಿದ್ದೀರಿ?" },
      forklift: { question: "ನಿಮ್ಮ ಬಳಿ ಲೈಸೆನ್ಸ್ ಇದೆಯೇ?" },
      computer: { question: "ಕಂಪ್ಯೂಟರ್‌ನಲ್ಲಿ ನೀವು ಏನು ಮಾಡಬಲ್ಲಿರಿ?" },
      experience: { question: "ನಿಮಗೆ ಎಷ್ಟು ಕೆಲಸದ ಅನುಭವವಿದೆ?" },
      education: { question: "ನೀವು ಎಲ್ಲಿಯವರೆಗೆ ಓದಿದ್ದೀರಿ?" },
      shift: { question: "ನೀವು ಯಾವ ಶಿಫ್ಟ್ ಮಾಡಬಹುದು?" },
      start: { question: "ನೀವು ಯಾವಾಗ ಕೆಲಸ ಶುರು ಮಾಡಬಹುದು?" },
      area: { question: "ನೀವು ಎಲ್ಲಿ ವಾಸಿಸುತ್ತೀರಿ?" },
    },
    labels: {
      "factory-helper": "ಫ್ಯಾಕ್ಟರಿ ಹೆಲ್ಪರ್", packing: "ಪ್ಯಾಕಿಂಗ್", warehouse: "ವೇರ್‌ಹೌಸ್ / ಲೋಡಿಂಗ್", "machine-operator": "ಮೆಷಿನ್ ಆಪರೇಟರ್",
      "iti-trades": "ITI ಟ್ರೇಡ್", housekeeping: "ಹೌಸ್‌ಕೀಪಿಂಗ್", "data-entry-operator": "ಡೇಟಾ ಎಂಟ್ರಿ", "forklift-operator": "ಫೋರ್ಕ್‌ಲಿಫ್ಟ್ ಆಪರೇಟರ್",
      any: "ಯಾವುದೇ ಕೆಲಸ", electrician: "ಎಲೆಕ್ಟ್ರಿಷಿಯನ್", welder: "ವೆಲ್ಡರ್", fitter: "ಫಿಟ್ಟರ್", machinist: "ಮೆಷಿನಿಸ್ಟ್ / ಟರ್ನರ್", "other-trade": "ಇತರ ಟ್ರೇಡ್",
      "iti-pass": "ITI ಪಾಸ್", "iti-pursuing": "ಓದುತ್ತಿದ್ದೇನೆ ಅಥವಾ ಅಪ್ರೆಂಟಿಸ್", "no-iti": "ITI ಇಲ್ಲ, ಆದರೆ ಅನುಭವವಿದೆ",
      "packing-machine": "ಪ್ಯಾಕಿಂಗ್ ಮೆಷಿನ್‌ಗಳು", moulding: "ಇಂಜೆಕ್ಷನ್ ಮೋಲ್ಡಿಂಗ್", press: "ಪ್ರೆಸ್ / ಶೀಟ್ ಮೆಟಲ್", "cnc-vmc": "CNC / VMC",
      "other-machine": "ಇತರ ಮೆಷಿನ್‌ಗಳು", "licence-experience": "ಲೈಸೆನ್ಸ್ ಮತ್ತು ಅನುಭವ ಎರಡೂ", "experience-only": "ಅನುಭವವಿದೆ, ಲೈಸೆನ್ಸ್ ಇಲ್ಲ",
      "want-to-learn": "ಇಲ್ಲ, ಕಲಿಯಲು ಬಯಸುತ್ತೇನೆ", typing: "ಟೈಪಿಂಗ್", excel: "Excel", tally: "Tally", "sap-erp": "SAP / ERP",
      fresher: "ಇಲ್ಲ, ನಾನು ಫ್ರೆಷರ್", "under-1": "1 ವರ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ", "1-3": "1 ರಿಂದ 3 ವರ್ಷ", "3-plus": "3 ವರ್ಷಕ್ಕಿಂತ ಹೆಚ್ಚು",
      "below-10th": "10ನೇ ತರಗತಿಗಿಂತ ಕಡಿಮೆ", "10th": "10ನೇ ತರಗತಿ ಪಾಸ್", "12th": "12ನೇ ತರಗತಿ / PUC ಪಾಸ್", "iti-diploma": "ITI / ಡಿಪ್ಲೊಮಾ", graduate: "ಪದವೀಧರ",
      day: "ಹಗಲು", night: "ರಾತ್ರಿ", rotating: "ಬದಲಾಗುವ ಶಿಫ್ಟ್, ಯಾವುದಾದರೂ", now: "ತಕ್ಷಣ", week: "ಒಂದು ವಾರದಲ್ಲಿ", month: "ಒಂದು ತಿಂಗಳಲ್ಲಿ",
      "sidcul-bahadrabad": "ಸಿಡ್ಕುಲ್ / ಬಹಾದ್ರಾಬಾದ್", "haridwar-jwalapur": "ಹರಿದ್ವಾರ ನಗರ / ಜ್ವಾಲಾಪುರ", "roorkee-bhagwanpur": "ರೂರ್ಕಿ / ಭಗವಾನ್‌ಪುರ",
      laksar: "ಲಕ್ಸರ್", outside: "ಹರಿದ್ವಾರದ ಹೊರಗೆ",
      "bengaluru:north": "ಉತ್ತರ / ಪೀಣ್ಯ", "bengaluru:south": "ದಕ್ಷಿಣ / ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಸಿಟಿ", "bengaluru:east": "ಪೂರ್ವ / ವೈಟ್‌ಫೀಲ್ಡ್", "bengaluru:west": "ಪಶ್ಚಿಮ / ಕೆಂಗೇರಿ",
      "bengaluru:outside": "ಬೆಂಗಳೂರಿನ ಹೊರಗೆ",
      "jalandhar:kapurthala": "ಕಪೂರ್ಥಲಾ / ಫಗ್ವಾರಾ", "jalandhar:city": "ಜಲಂಧರ್ ನಗರ", "jalandhar:phagwara-goraya": "ಫಗ್ವಾರಾ / ಗೋರಾಯಾ",
      "jalandhar:outside": "ಬೇರೆಲ್ಲೋ", "jalandhar:goraya-phillaur": "ಗೋರಾಯಾ / ಫಿಲ್ಲೌರ್",
      "uttarakhand:haridwar": "ಹರಿದ್ವಾರ / ರೂರ್ಕಿ", "uttarakhand:dehradun-selaqui": "ಡೆಹ್ರಾಡೂನ್ / ಸೆಲಾಕುಯಿ",
      "uttarakhand:udham-singh-nagar": "ರುದ್ರಪುರ / ಕಾಶಿಪುರ / ಸಿತಾರ್‌ಗಂಜ್", "uttarakhand:other": "ಉತ್ತರಾಖಂಡದಲ್ಲಿ ಬೇರೆಡೆ",
      "uttarakhand:outside": "ಉತ್ತರಾಖಂಡದ ಹೊರಗೆ",
      "punjab:jalandhar-kapurthala": "ಜಲಂಧರ್ / ಕಪೂರ್ಥಲಾ", "punjab:ludhiana": "ಲುಧಿಯಾನಾ", "punjab:mohali": "ಮೊಹಾಲಿ / ಖರಾರ್",
      "punjab:amritsar": "ಅಮೃತಸರ", "punjab:other": "ಪಂಜಾಬ್‌ನಲ್ಲಿ ಬೇರೆಡೆ", "punjab:outside": "ಪಂಜಾಬ್‌ನ ಹೊರಗೆ",
      "punjab:jalandhar": "ಜಲಂಧರ್", "punjab:kapurthala": "ಕಪೂರ್ಥಲಾ / ಫಗ್ವಾರಾ",
      "market:haridwar": "ಹರಿದ್ವಾರ / ರೂರ್ಕಿ", "market:uttarakhand": "ಉತ್ತರಾಖಂಡದಲ್ಲಿ ಬೇರೆಡೆ", "market:jalandhar": "ಜಲಂಧರ್",
      "market:punjab": "ಪಂಜಾಬ್‌ನಲ್ಲಿ ಬೇರೆಡೆ", "market:bengaluru": "ಬೆಂಗಳೂರು", "market:other": "ಬೇರೆಲ್ಲೋ",
      "haridwar:rest-of-uttarakhand": "ಉತ್ತರಾಖಂಡದಲ್ಲಿ ಬೇರೆಡೆ", "jalandhar:rest-of-punjab": "ಪಂಜಾಬ್‌ನಲ್ಲಿ ಬೇರೆಡೆ",
      "dehradun:selaqui-sahaspur": "ಸೆಲಾಕುಯಿ / ಸಹಸ್‌ಪುರ", "dehradun:city": "ಡೆಹ್ರಾಡೂನ್ ನಗರ", "dehradun:rishikesh-doiwala": "ಋಷಿಕೇಶ / ಡೋಯಿವಾಲಾ",
      "dehradun:vikasnagar": "ವಿಕಾಸ್‌ನಗರ / ಹರ್ಬರ್ಟ್‌ಪುರ", "dehradun:outside": "ಬೇರೆಲ್ಲೋ", "market:dehradun": "ಡೆಹ್ರಾಡೂನ್ / ಸೆಲಾಕುಯಿ",
      "dehradun:rest-of-uttarakhand": "ಉತ್ತರಾಖಂಡದಲ್ಲಿ ಬೇರೆಡೆ",
      "kapurthala:city": "ಕಪೂರ್ಥಲಾ ನಗರ", "kapurthala:phagwara": "ಫಗ್ವಾರಾ", "kapurthala:sultanpur-lodhi": "ಸುಲ್ತಾನ್‌ಪುರ ಲೋಧಿ / ಭುಲತ್",
      "kapurthala:outside": "ಬೇರೆಲ್ಲೋ", "kapurthala:jalandhar": "ಜಲಂಧರ್", "market:kapurthala": "ಕಪೂರ್ಥಲಾ / ಫಗ್ವಾರಾ",
      "kapurthala:rest-of-punjab": "ಪಂಜಾಬ್‌ನಲ್ಲಿ ಬೇರೆಡೆ",
      "visakhapatnam:city": "ವಿಶಾಖಪಟ್ಟಣ ನಗರ", "visakhapatnam:gajuwaka": "ಗಾಜುವಾಕ / ಸ್ಟೀಲ್ ಪ್ಲಾಂಟ್ / ದುವ್ವಾಡ",
      "visakhapatnam:pendurthi": "ಪೆಂದುರ್ತಿ / ಸಬ್ಬವರಂ", "visakhapatnam:anakapalli": "ಅನಕಾಪಲ್ಲಿ / ಪರವಾಡ / ಅಚ್ಯುತಾಪುರಂ",
      "visakhapatnam:outside": "ಬೇರೆಲ್ಲೋ", "visakhapatnam:rest-of-andhra-pradesh": "ಆಂಧ್ರ ಪ್ರದೇಶದಲ್ಲಿ ಬೇರೆಡೆ",
      "andhra-pradesh:visakhapatnam": "ವಿಶಾಖಪಟ್ಟಣ / ಅನಕಾಪಲ್ಲಿ", "andhra-pradesh:vijayawada-guntur": "ವಿಜಯವಾಡ / ಗುಂಟೂರು",
      "andhra-pradesh:kakinada-rajahmundry": "ಕಾಕಿನಾಡ / ರಾಜಮಂಡ್ರಿ", "andhra-pradesh:nellore-tirupati": "ನೆಲ್ಲೂರು / ತಿರುಪತಿ / ಶ್ರೀ ಸಿಟಿ",
      "andhra-pradesh:other": "ಆಂಧ್ರ ಪ್ರದೇಶದಲ್ಲಿ ಬೇರೆಡೆ", "andhra-pradesh:outside": "ಆಂಧ್ರ ಪ್ರದೇಶದ ಹೊರಗೆ",
      "market:visakhapatnam": "ವಿಶಾಖಪಟ್ಟಣ (ವೈಜಾಗ್)", "market:andhra-pradesh": "ಆಂಧ್ರ ಪ್ರದೇಶದಲ್ಲಿ ಬೇರೆಡೆ",
    },
    details: {
      question: "ಕೊನೆಯ ಹಂತ: ನಿಮ್ಮನ್ನು ಹೇಗೆ ಸಂಪರ್ಕಿಸುವುದು?",
      name: "ನಿಮ್ಮ ಹೆಸರು",
      namePlaceholder: "ಹೆಸರು",
      phone: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
      phonePlaceholder: "10 ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
      optional: "ಐಚ್ಛಿಕ",
      send: "ಕಳುಹಿಸಿ",
    },
    errors: { name: "ಪೂರ್ಣ ಹೆಸರು ಬರೆಯಿರಿ (ಕನಿಷ್ಠ 2 ಅಕ್ಷರಗಳು)." },
    noFee: NO_FEE["kn-IN"],
    shifts: SHIFTS_LINE["kn-IN"],
  },
};
