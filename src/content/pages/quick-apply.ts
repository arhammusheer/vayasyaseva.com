import type { Locale } from "@/lib/i18n";
import type { JobRole } from "@/lib/talent-intake/rules";

/**
 * The guided jobs page (/jobs/apply): tap answers first, then name and number.
 * An experiment against the long form on /jobs, used as a Google Ads landing
 * page; not in the sitemap and noindex. Option ids are fixed values sent to
 * analytics and to staff, the same in every language. hi-IN and hi-Latn-IN
 * are drafts pending native review, like the other jobs pages.
 */
export const WORK_OPTIONS = [
  "factory-helper",
  "packing",
  "warehouse",
  "machine-operator",
  "iti-trades",
  "housekeeping",
  "data-entry-operator",
  "forklift-operator",
  "any",
] as const;
export type WorkOption = (typeof WORK_OPTIONS)[number];
export const EXPERIENCE_OPTIONS = ["fresher", "under-1", "1-3", "3-plus"] as const;
export const SHIFT_OPTIONS = ["day", "night", "rotating"] as const;
export const AREA_OPTIONS = ["sidcul-bahadrabad", "haridwar-jwalapur", "roorkee-bhagwanpur", "laksar", "outside"] as const;

/** Role pages a work answer maps to; "any" is no particular role. */
export const WORK_ROLE: Record<WorkOption, JobRole | null> = {
  "factory-helper": "factory-helper",
  packing: "packing",
  warehouse: "warehouse",
  "machine-operator": "machine-operator",
  "iti-trades": "iti-trades",
  housekeeping: "housekeeping",
  "data-entry-operator": "data-entry-operator",
  "forklift-operator": "forklift-operator",
  any: null,
};

/** English labels for the note staff read in Chatwoot, whatever the page language. */
export const STAFF_LABELS: Record<string, string> = {
  "factory-helper": "Factory helper", packing: "Packing", warehouse: "Warehouse / loading", "machine-operator": "Machine operator",
  "iti-trades": "ITI trade", housekeeping: "Housekeeping", "data-entry-operator": "Data entry", "forklift-operator": "Forklift operator",
  any: "Any work", fresher: "Fresher", "under-1": "Under 1 year", "1-3": "1 to 3 years", "3-plus": "3+ years",
  day: "Day", night: "Night", rotating: "Rotating / any", "sidcul-bahadrabad": "SIDCUL / Bahadrabad",
  "haridwar-jwalapur": "Haridwar city / Jwalapur", "roorkee-bhagwanpur": "Roorkee / Bhagwanpur", laksar: "Laksar",
  outside: "Outside Haridwar",
};

export interface QuickApplyCopy {
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  lede: string;
  next: string;
  work: { question: string; options: Record<WorkOption, string> };
  experience: { question: string; options: Record<(typeof EXPERIENCE_OPTIONS)[number], string> };
  shift: { question: string; hint: string; options: Record<(typeof SHIFT_OPTIONS)[number], string> };
  details: {
    question: string;
    name: string;
    namePlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    area: string;
    areaOptions: Record<(typeof AREA_OPTIONS)[number], string>;
    send: string;
  };
  errors: { name: string };
  noFee: string;
}

export const quickApplyCopy: Record<Locale, QuickApplyCopy> = {
  "en-IN": {
    title: "Apply for Work in SIDCUL Haridwar: Quick Form",
    description: "Tap a few answers, then leave your name and number. Factory, packing, warehouse and ITI work in SIDCUL Haridwar. No fee.",
    eyebrow: "JOBS",
    heading: "Looking for work in SIDCUL Haridwar?",
    lede: "Tap a few answers, then just your name and number. We call you about suitable work.",
    next: "Next",
    work: {
      question: "What work do you want?",
      options: {
        "factory-helper": "Factory helper", packing: "Packing", warehouse: "Warehouse / loading", "machine-operator": "Machine operator",
        "iti-trades": "ITI: electrician, welder, fitter", housekeeping: "Housekeeping", "data-entry-operator": "Data entry",
        "forklift-operator": "Forklift operator", any: "Any work",
      },
    },
    experience: {
      question: "How much experience do you have?",
      options: { fresher: "None, I'm a fresher", "under-1": "Less than 1 year", "1-3": "1 to 3 years", "3-plus": "More than 3 years" },
    },
    shift: {
      question: "Which shifts can you do?",
      hint: "Choose all that suit you.",
      options: { day: "Day", night: "Night", rotating: "Rotating, any shift" },
    },
    details: {
      question: "Last step: how do we reach you?",
      name: "Your name",
      namePlaceholder: "Name",
      phone: "Mobile number",
      phonePlaceholder: "10-digit mobile number",
      area: "Where do you live?",
      areaOptions: {
        "sidcul-bahadrabad": "SIDCUL / Bahadrabad", "haridwar-jwalapur": "Haridwar city / Jwalapur",
        "roorkee-bhagwanpur": "Roorkee / Bhagwanpur", laksar: "Laksar", outside: "Outside Haridwar",
      },
      send: "Send",
    },
    errors: { name: "Please write your name." },
    noFee: "No fee for a job. If anyone asks you for money in our name, tell us.",
  },
  "hi-IN": {
    title: "सिडकुल हरिद्वार में काम के लिए अप्लाई करें: छोटा फ़ॉर्म",
    description: "कुछ जवाब चुनिए, फिर बस नाम और नंबर। सिडकुल हरिद्वार में फ़ैक्टरी, पैकिंग, वेयरहाउस और ITI का काम। कोई फ़ीस नहीं।",
    eyebrow: "नौकरी",
    heading: "सिडकुल हरिद्वार में काम चाहिए?",
    lede: "कुछ जवाब चुनिए, फिर बस अपना नाम और नंबर। सही काम होने पर हम आपको फ़ोन करेंगे।",
    next: "आगे",
    work: {
      question: "आपको कौन-सा काम चाहिए?",
      options: {
        "factory-helper": "फ़ैक्टरी हेल्पर", packing: "पैकिंग", warehouse: "वेयरहाउस / लोडिंग", "machine-operator": "मशीन ऑपरेटर",
        "iti-trades": "ITI: इलेक्ट्रीशियन, वेल्डर, फ़िटर", housekeeping: "हाउसकीपिंग", "data-entry-operator": "डेटा एंट्री",
        "forklift-operator": "फ़ोर्कलिफ़्ट ऑपरेटर", any: "कोई भी काम",
      },
    },
    experience: {
      question: "आपके पास कितना अनुभव है?",
      options: { fresher: "नहीं, मैं फ़्रेशर हूँ", "under-1": "1 साल से कम", "1-3": "1 से 3 साल", "3-plus": "3 साल से ज़्यादा" },
    },
    shift: {
      question: "आप कौन-सी शिफ्ट कर सकते हैं?",
      hint: "जो भी ठीक हों, सब चुनिए।",
      options: { day: "दिन", night: "रात", rotating: "बदलती शिफ्ट, कोई भी" },
    },
    details: {
      question: "आख़िरी कदम: आपसे संपर्क कैसे करें?",
      name: "आपका नाम",
      namePlaceholder: "नाम",
      phone: "मोबाइल नंबर",
      phonePlaceholder: "10 अंकों का मोबाइल नंबर",
      area: "आप कहाँ रहते हैं?",
      areaOptions: {
        "sidcul-bahadrabad": "सिडकुल / बहादराबाद", "haridwar-jwalapur": "हरिद्वार शहर / ज्वालापुर",
        "roorkee-bhagwanpur": "रुड़की / भगवानपुर", laksar: "लक्सर", outside: "हरिद्वार से बाहर",
      },
      send: "भेजें",
    },
    errors: { name: "कृपया अपना नाम लिखिए।" },
    noFee: "नौकरी के लिए कोई फ़ीस नहीं। हमारे नाम पर कोई पैसे माँगे तो हमें बताइए।",
  },
  "hi-Latn-IN": {
    title: "SIDCUL Haridwar Mein Kaam Ke Liye Apply Karein: Chhota Form",
    description: "Kuch jawab tap kijiye, phir bas naam aur number. SIDCUL Haridwar mein factory, packing, warehouse aur ITI ka kaam. Koi fee nahi.",
    eyebrow: "NAUKRI",
    heading: "SIDCUL Haridwar mein kaam chahiye?",
    lede: "Kuch jawab tap kijiye, phir bas apna naam aur number. Sahi kaam hone par hum aapko phone karenge.",
    next: "Aage",
    work: {
      question: "Aapko kaun-sa kaam chahiye?",
      options: {
        "factory-helper": "Factory helper", packing: "Packing", warehouse: "Warehouse / loading", "machine-operator": "Machine operator",
        "iti-trades": "ITI: electrician, welder, fitter", housekeeping: "Housekeeping", "data-entry-operator": "Data entry",
        "forklift-operator": "Forklift operator", any: "Koi bhi kaam",
      },
    },
    experience: {
      question: "Aapke paas kitna experience hai?",
      options: { fresher: "Nahi, main fresher hoon", "under-1": "1 saal se kam", "1-3": "1 se 3 saal", "3-plus": "3 saal se zyada" },
    },
    shift: {
      question: "Aap kaun-si shift kar sakte hain?",
      hint: "Jo bhi theek hon, sab chuniye.",
      options: { day: "Din", night: "Raat", rotating: "Badalti shift, koi bhi" },
    },
    details: {
      question: "Aakhri step: aapse sampark kaise karein?",
      name: "Aapka naam",
      namePlaceholder: "Naam",
      phone: "Mobile number",
      phonePlaceholder: "10 digit ka mobile number",
      area: "Aap kahan rehte hain?",
      areaOptions: {
        "sidcul-bahadrabad": "SIDCUL / Bahadrabad", "haridwar-jwalapur": "Haridwar shehar / Jwalapur",
        "roorkee-bhagwanpur": "Roorkee / Bhagwanpur", laksar: "Laksar", outside: "Haridwar se bahar",
      },
      send: "Bhejiye",
    },
    errors: { name: "Kripya apna naam likhiye." },
    noFee: "Naukri ke liye koi fee nahi. Hamare naam par koi paise maange to humein bataiye.",
  },
};
