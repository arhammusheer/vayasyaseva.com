import type { Locale } from "@/lib/i18n";
import { QUICK_ANSWERS, type JobRole, type QuickQuestion } from "@/lib/talent-intake/rules";
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
/** Answer ids per question, from the shared rules (also read by n8n). */
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
  // Last of the taps, so the final step is only name and number.
  { id: "area", kind: "single", options: ids("area") },
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
  next: string;
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
  /** The form's footer: the page's one no-fee line, linking /jobs/fees-and-fraud. */
  noFee: { text: string; link: string };
  /** One calm line above the form: full 8-hour shifts, no part-time work. */
  shifts: string;
}


export const quickApplyCopy: Record<Locale, QuickApplyCopy> = {
  "en-IN": {
    title: "Apply for Work in SIDCUL Haridwar: Quick Form",
    description: "Apply for SIDCUL Haridwar jobs. No fee to apply. Full 8-hour shifts. Tap a few answers, then your name and number. Factory, packing, warehouse and ITI work.",
    eyebrow: "JOBS",
    breadcrumb: "Quick application",
    heading: "Looking for work in SIDCUL Haridwar?",
    lede: "Tap a few answers, then your name and number.",
    next: "Next",
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
    title: "सिडकुल हरिद्वार में काम के लिए अप्लाई करें: छोटा फ़ॉर्म",
    description: "सिडकुल हरिद्वार में नौकरी के लिए आवेदन करें। कोई फ़ीस नहीं। पूरी 8 घंटे की शिफ्ट। कुछ जवाब चुनिए, फिर नाम और नंबर। फ़ैक्टरी, पैकिंग, वेयरहाउस और ITI का काम।",
    eyebrow: "नौकरी",
    breadcrumb: "जल्दी आवेदन",
    heading: "सिडकुल हरिद्वार में काम चाहिए?",
    lede: "कुछ जवाब चुनिए, फिर अपना नाम और नंबर।",
    next: "आगे",
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
    title: "SIDCUL Haridwar Job: Apply Karein, Chhota Form",
    description: "SIDCUL Haridwar job ke liye apply karein. Koi fee nahi. Poori 8 ghante ki shift. Kuch jawab tap kijiye, phir naam aur number. Factory, packing, warehouse, ITI.",
    eyebrow: "Jobs",
    breadcrumb: "Jaldi apply",
    heading: "SIDCUL Haridwar mein kaam chahiye?",
    lede: "Kuch jawab tap kijiye, phir apna naam aur number.",
    next: "Aage",
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
};
