/**
 * The WhatsApp templates of crew offers (talent/lib/run-crew.ts): what a
 * worker is sent about a crew request, from the Business number
 * (+91 78958 50598, Fast2SMS). Four messages, each in English, Hindi and
 * Hinglish:
 *
 *   offer       the job, place, pay, shift, stay and start; buttons Yes / No
 *   confirmed   after the recruiter's call: where, when, whom to ask, what to bring
 *   reminder    the evening before: buttons Yes / Can't come
 *   not_needed  to someone who said yes when the crew is already full
 *
 * Submitted to Meta through Fast2SMS by `node integrations/windmill/whatsapp-templates.mts --create`
 * (Utility, with the quick-reply buttons). Once one is approved, its Fast2SMS
 * message id goes in CREW_TEMPLATES and the next deploy sends it. Until then
 * the crew member shows "WhatsApp template not approved yet" and nothing goes.
 *
 * Words drafted 19 Nov 2026; the Hindi and Hinglish need a native speaker's
 * read before they are submitted (like the acknowledgement's).
 */

export const CREW_KINDS = ["offer", "confirmed", "reminder", "not_needed"] as const;
export type CrewKind = (typeof CREW_KINDS)[number];

export const CREW_LOCALES = ["en-IN", "hi-IN", "hi-Latn-IN"] as const;
export type CrewLocale = (typeof CREW_LOCALES)[number];

export interface CrewTemplate {
  kind: CrewKind;
  locale: CrewLocale;
  /** Meta's template name. Hinglish is Meta language "hi" too, so it needs its own name. */
  name: string;
  language: "en" | "hi";
  text: string;
  /** Quick-reply buttons: [yes, no]. A tap comes back as a message whose body is the label. */
  buttons?: readonly [string, string];
  /** One example value per variable, for Meta's review. */
  example: string[];
}

const hinglish = (name: string) => `${name}_hinglish`;

export const CREW_TEMPLATE_TEXT: CrewTemplate[] = [
  // --- offer: {{1}} job, {{2}} place, {{3}} pay, {{4}} shift, {{5}} stay and food, {{6}} start ---
  {
    kind: "offer",
    locale: "en-IN",
    name: "vspl_job_offer",
    language: "en",
    text:
      "Work from Vayasya Seva.\n\nJob: {{1}}\nPlace: {{2}}\nPay (in hand): {{3}}\nShift: {{4}}\nStay and food: {{5}}\nStarts: {{6}}\n\n" +
      "Tap \"Yes\" if you want this job and our team will call you.\nVayasya Seva never charges a fee. If anyone asks you for money, tell us here.",
    buttons: ["Yes, I want it", "No"],
    example: ["Packing helper", "SIDCUL, Haridwar", "₹13,500 a month, PF and ESIC extra", "8 am to 8 pm", "Room given, food your own", "Wednesday, 25 November"],
  },
  {
    kind: "offer",
    locale: "hi-IN",
    name: "vspl_job_offer",
    language: "hi",
    text:
      "Vayasya Seva से काम की ख़बर।\n\nकाम: {{1}}\nजगह: {{2}}\nतनख़्वाह (हाथ में): {{3}}\nशिफ़्ट: {{4}}\nरहना और खाना: {{5}}\nशुरू: {{6}}\n\n" +
      "यह काम करना है तो \"हाँ\" दबाएँ। हमारी टीम आपको कॉल करेगी।\nVayasya Seva कोई फ़ीस नहीं लेती। कोई पैसे माँगे तो हमें यहीं बताएँ।",
    buttons: ["हाँ, करना है", "नहीं"],
    example: ["Packing helper", "SIDCUL, हरिद्वार", "₹13,500 महीना, PF और ESIC अलग", "सुबह 8 से शाम 8", "कमरा मिलेगा, खाना अपना", "बुधवार, 25 नवंबर"],
  },
  {
    kind: "offer",
    locale: "hi-Latn-IN",
    name: hinglish("vspl_job_offer"),
    language: "hi",
    text:
      "Vayasya Seva se kaam ki khabar.\n\nKaam: {{1}}\nJagah: {{2}}\nTankhwah (haath mein): {{3}}\nShift: {{4}}\nRehna aur khana: {{5}}\nShuru: {{6}}\n\n" +
      "Yeh kaam karna hai to \"Haan\" dabayein. Hamari team aapko call karegi.\nVayasya Seva koi fees nahi leti. Koi paise maange to humein yahin batayein.",
    buttons: ["Haan, karna hai", "Nahi"],
    example: ["Packing helper", "SIDCUL, Haridwar", "₹13,500 mahina, PF aur ESIC alag", "Subah 8 se shaam 8", "Kamra milega, khana apna", "Wednesday, 25 November"],
  },

  // --- confirmed: {{1}} where (with the map link), {{2}} when, {{3}} whom to ask ---
  {
    kind: "confirmed",
    locale: "en-IN",
    name: "vspl_job_confirmed",
    language: "en",
    text:
      "Your job is confirmed.\n\nWhere: {{1}}\nWhen: {{2}}\nAsk for: {{3}}\n\n" +
      "Bring your Aadhaar card, bank passbook, 2 photos, and your PF UAN number if you have one.\nIf you cannot come, tell us here before the day.",
    example: ["Gate 2, Plot 12, Sector 4, SIDCUL Haridwar (map: https://maps.app.goo.gl/abc)", "Wednesday, 25 November, 8:00 am", "Ramesh, 98765 43210"],
  },
  {
    kind: "confirmed",
    locale: "hi-IN",
    name: "vspl_job_confirmed",
    language: "hi",
    text:
      "आपका काम पक्का हुआ।\n\nकहाँ आना है: {{1}}\nकब: {{2}}\nकिससे मिलना है: {{3}}\n\n" +
      "साथ लाएँ: आधार कार्ड, बैंक पासबुक, 2 फ़ोटो। PF का UAN नंबर हो तो वह भी।\nनहीं आ पाएँ तो पहले यहीं बता दें।",
    example: ["गेट 2, प्लॉट 12, सेक्टर 4, SIDCUL हरिद्वार (map: https://maps.app.goo.gl/abc)", "बुधवार, 25 नवंबर, सुबह 8:00 बजे", "रमेश, 98765 43210"],
  },
  {
    kind: "confirmed",
    locale: "hi-Latn-IN",
    name: hinglish("vspl_job_confirmed"),
    language: "hi",
    text:
      "Aapka kaam pakka hua.\n\nKahan aana hai: {{1}}\nKab: {{2}}\nKisse milna hai: {{3}}\n\n" +
      "Saath laayein: Aadhaar card, bank passbook, 2 photo. PF ka UAN number ho to woh bhi.\nNahi aa paayein to pehle yahin bata dein.",
    example: ["Gate 2, Plot 12, Sector 4, SIDCUL Haridwar (map: https://maps.app.goo.gl/abc)", "Wednesday, 25 November, subah 8:00 baje", "Ramesh, 98765 43210"],
  },

  // --- reminder: {{1}} the time, {{2}} the place ---
  {
    kind: "reminder",
    locale: "en-IN",
    name: "vspl_job_reminder",
    language: "en",
    text: "A reminder from Vayasya Seva: tomorrow at {{1}} you need to be at {{2}}.\n\nAre you coming?",
    buttons: ["Yes, coming", "Can't come"],
    example: ["8:00 am", "Gate 2, Plot 12, Sector 4, SIDCUL Haridwar"],
  },
  {
    kind: "reminder",
    locale: "hi-IN",
    name: "vspl_job_reminder",
    language: "hi",
    text: "Vayasya Seva से याद दिला रहे हैं: कल {{1}} आपको {{2}} पहुँचना है।\n\nक्या आप आ रहे हैं?",
    buttons: ["हाँ, आ रहे हैं", "नहीं आ पाएँगे"],
    example: ["सुबह 8:00 बजे", "गेट 2, प्लॉट 12, सेक्टर 4, SIDCUL हरिद्वार"],
  },
  {
    kind: "reminder",
    locale: "hi-Latn-IN",
    name: hinglish("vspl_job_reminder"),
    language: "hi",
    text: "Vayasya Seva se yaad dila rahe hain: kal {{1}} aapko {{2}} pahunchna hai.\n\nKya aap aa rahe hain?",
    buttons: ["Haan, aa rahe hain", "Nahi aa paayenge"],
    example: ["subah 8:00 baje", "Gate 2, Plot 12, Sector 4, SIDCUL Haridwar"],
  },

  // --- not_needed: {{1}} the job ---
  {
    kind: "not_needed",
    locale: "en-IN",
    name: "vspl_job_not_needed",
    language: "en",
    text: "Thank you for saying yes. The {{1}} job is full this time.\n\nWe have your name and will tell you about the next job.",
    example: ["Packing helper"],
  },
  {
    kind: "not_needed",
    locale: "hi-IN",
    name: "vspl_job_not_needed",
    language: "hi",
    text: "हाँ कहने के लिए धन्यवाद। {{1}} का काम इस बार भर गया।\n\nआपका नाम हमारे पास है। अगला काम आने पर बताएँगे।",
    example: ["Packing helper"],
  },
  {
    kind: "not_needed",
    locale: "hi-Latn-IN",
    name: hinglish("vspl_job_not_needed"),
    language: "hi",
    text: "Haan kehne ke liye dhanyavaad. {{1}} ka kaam is baar bhar gaya.\n\nAapka naam hamare paas hai. Agla kaam aane par batayenge.",
    example: ["Packing helper"],
  },
];

/**
 * Fast2SMS message ids of the approved templates, by kind and language
 * (`whatsapp-templates.mts` prints them). Empty until Meta approves: a crew
 * member whose message has no id here waits, with a note in Twenty.
 */
export const CREW_TEMPLATES: Record<CrewKind, Partial<Record<CrewLocale, number>>> = {
  offer: {},
  confirmed: {},
  reminder: {},
  not_needed: {},
};

export function templateText(kind: CrewKind, locale: CrewLocale): CrewTemplate {
  const t = CREW_TEMPLATE_TEXT.find((x) => x.kind === kind && x.locale === locale);
  if (!t) throw new Error(`no ${kind} template for ${locale}`);
  return t;
}

/**
 * Twenty's person.language as a template language. Punjabi readers get
 * Hindi and Kannada readers English until templates in their own language
 * exist; a worker with no language gets Hindi, as most applicants do.
 */
export function crewLocale(language: unknown): CrewLocale {
  switch (language) {
    case "EN":
    case "KN":
      return "en-IN";
    case "HI_LATN":
      return "hi-Latn-IN";
    default:
      return "hi-IN";
  }
}

/**
 * A template variable as Meta and Fast2SMS take it: one line (Meta refuses
 * new lines, tabs and runs of spaces), no "|" (Fast2SMS joins the values with
 * it), never empty, at most 200 characters.
 */
export function variableValue(value: string): string {
  const v = value.replace(/[\r\n\t]+/g, " ").replace(/\|/g, "/").replace(/ {2,}/g, " ").trim();
  return (v || "-").slice(0, 200);
}

/** The message as the worker reads it, for the Communication in Twenty. */
export function renderTemplate(t: CrewTemplate, values: string[]): string {
  const body = t.text.replace(/\{\{(\d+)\}\}/g, (_m, n: string) => values[Number(n) - 1] ?? "");
  return t.buttons ? `${body}\n[${t.buttons[0]}] [${t.buttons[1]}]` : body;
}

export const variableCount = (t: Pick<CrewTemplate, "text">) => new Set(t.text.match(/\{\{\d+\}\}/g) ?? []).size;
