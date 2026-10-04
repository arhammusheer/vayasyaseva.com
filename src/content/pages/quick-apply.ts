import type { Locale } from "@/lib/i18n";
import { QUICK_ANSWERS, type JobRole, type QuickQuestion } from "@/lib/talent-intake/rules";

/**
 * The guided jobs page (/jobs/apply): tap answers, with follow-up questions
 * that depend on the work chosen, then name and number. An experiment against
 * the long form on /jobs, used as a Google Ads landing page; not in the
 * sitemap and noindex. Option ids are fixed values sent to analytics and to
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
];
export const AREA_OPTIONS = ids("area");

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
    area: string;
    /** Marks the photos and documents step as one that can be skipped. */
    optional: string;
    send: string;
  };
  errors: { name: string };
  noFee: string;
}

const MULTI_HINT = { "en-IN": "Choose all that apply.", "hi-IN": "जो भी लागू हों, सब चुनिए।", "hi-Latn-IN": "Jo bhi laagu hon, sab chuniye." };

export const quickApplyCopy: Record<Locale, QuickApplyCopy> = {
  "en-IN": {
    title: "Apply for Work in SIDCUL Haridwar: Quick Form",
    description: "Tap a few answers, then leave your name and number. Factory, packing, warehouse and ITI work in SIDCUL Haridwar. No fee.",
    eyebrow: "JOBS",
    breadcrumb: "Quick application",
    heading: "Looking for work in SIDCUL Haridwar?",
    lede: "Tap a few answers, then just your name and number. We call you about suitable work.",
    next: "Next",
    questions: {
      work: { question: "What work are you looking for?", hint: MULTI_HINT["en-IN"] },
      trade: { question: "Which ITI trade?", hint: MULTI_HINT["en-IN"] },
      iti: { question: "Your ITI?" },
      machines: { question: "Which machines have you run?", hint: MULTI_HINT["en-IN"] },
      forklift: { question: "Do you have a licence?" },
      computer: { question: "What can you do on a computer?", hint: MULTI_HINT["en-IN"] },
      experience: { question: "How much work experience do you have?" },
      education: { question: "How far have you studied?" },
      shift: { question: "Which shifts can you do?", hint: MULTI_HINT["en-IN"] },
      start: { question: "When can you start?" },
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
      area: "Where do you live?",
      optional: "Optional",
      send: "Send",
    },
    errors: { name: "Please write your name." },
    noFee: "No fee for a job. If anyone asks you for money in our name, tell us.",
  },
  "hi-IN": {
    title: "सिडकुल हरिद्वार में काम के लिए अप्लाई करें: छोटा फ़ॉर्म",
    description: "कुछ जवाब चुनिए, फिर बस नाम और नंबर। सिडकुल हरिद्वार में फ़ैक्टरी, पैकिंग, वेयरहाउस और ITI का काम। कोई फ़ीस नहीं।",
    eyebrow: "नौकरी",
    breadcrumb: "जल्दी आवेदन",
    heading: "सिडकुल हरिद्वार में काम चाहिए?",
    lede: "कुछ जवाब चुनिए, फिर बस अपना नाम और नंबर। सही काम होने पर हम आपको फ़ोन करेंगे।",
    next: "आगे",
    questions: {
      work: { question: "आपको कौन-सा काम चाहिए?", hint: MULTI_HINT["hi-IN"] },
      trade: { question: "कौन-सा ITI ट्रेड?", hint: MULTI_HINT["hi-IN"] },
      iti: { question: "आपका ITI?" },
      machines: { question: "आपने कौन-सी मशीनें चलाई हैं?", hint: MULTI_HINT["hi-IN"] },
      forklift: { question: "क्या आपके पास लाइसेंस है?" },
      computer: { question: "आप कंप्यूटर पर क्या कर लेते हैं?", hint: MULTI_HINT["hi-IN"] },
      experience: { question: "आपके पास काम का कितना अनुभव है?" },
      education: { question: "आपने कहाँ तक पढ़ाई की है?" },
      shift: { question: "आप कौन-सी शिफ्ट कर सकते हैं?", hint: MULTI_HINT["hi-IN"] },
      start: { question: "आप कब से काम शुरू कर सकते हैं?" },
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
      area: "आप कहाँ रहते हैं?",
      optional: "ज़रूरी नहीं",
      send: "भेजें",
    },
    errors: { name: "कृपया अपना नाम लिखिए।" },
    noFee: "नौकरी के लिए कोई फ़ीस नहीं। हमारे नाम पर कोई पैसे माँगे तो हमें बताइए।",
  },
  "hi-Latn-IN": {
    title: "SIDCUL Haridwar Mein Kaam Ke Liye Apply Karein: Chhota Form",
    description: "Kuch jawab tap kijiye, phir bas naam aur number. SIDCUL Haridwar mein factory, packing, warehouse aur ITI ka kaam. Koi fee nahi.",
    eyebrow: "NAUKRI",
    breadcrumb: "Jaldi apply",
    heading: "SIDCUL Haridwar mein kaam chahiye?",
    lede: "Kuch jawab tap kijiye, phir bas apna naam aur number. Sahi kaam hone par hum aapko phone karenge.",
    next: "Aage",
    questions: {
      work: { question: "Aapko kaun-sa kaam chahiye?", hint: MULTI_HINT["hi-Latn-IN"] },
      trade: { question: "Kaun-sa ITI trade?", hint: MULTI_HINT["hi-Latn-IN"] },
      iti: { question: "Aapka ITI?" },
      machines: { question: "Aapne kaun-si machines chalayi hain?", hint: MULTI_HINT["hi-Latn-IN"] },
      forklift: { question: "Kya aapke paas licence hai?" },
      computer: { question: "Aap computer par kya kar lete hain?", hint: MULTI_HINT["hi-Latn-IN"] },
      experience: { question: "Aapke paas kaam ka kitna experience hai?" },
      education: { question: "Aapne kahan tak padhai ki hai?" },
      shift: { question: "Aap kaun-si shift kar sakte hain?", hint: MULTI_HINT["hi-Latn-IN"] },
      start: { question: "Aap kab se kaam shuru kar sakte hain?" },
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
      area: "Aap kahan rehte hain?",
      optional: "Zaroori nahi",
      send: "Bhejiye",
    },
    errors: { name: "Kripya apna naam likhiye." },
    noFee: "Naukri ke liye koi fee nahi. Hamare naam par koi paise maange to humein bataiye.",
  },
};
