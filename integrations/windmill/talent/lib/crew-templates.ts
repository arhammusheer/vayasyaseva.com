/**
 * The WhatsApp templates of crew offers (talent/lib/run-crew.ts): what a
 * worker is sent about a crew request, from the Business number
 * (+91 78958 50598, Fast2SMS). Since 19 Nov 2026 the first message invites
 * the worker to an interview rather than offering the job. Each message in
 * English, Hindi and Hinglish:
 *
 *   offer       interview invitation: job, place, start (and stay and food when
 *               given, a second template); buttons Yes / No
 *   confirmed   interview details after the recruiter's call: where, when,
 *               whom to ask, what to bring
 *   reminder    the evening before the interview: buttons Yes / Can't come
 *   not_needed  to someone who said yes when the interviews are full
 *
 * All are meant to be filed by Meta as Utility, not Marketing (the owner's
 * rule, 19 Nov 2026): each is a status update on the worker's own job
 * application or interview. The invitation and the crew-full message carry
 * the application's reference (VS-J-...) as their first variable; none
 * advertises other work, promises future messages or urges action. Meta
 * filed earlier wordings as Marketing when they opened like an announcement
 * ("Work from Vayasya Seva") or promised to "tell you about the next job".
 *
 * Submitted to Meta through Fast2SMS by `node integrations/windmill/whatsapp-templates.mts --create`
 * (Utility, with the quick-reply buttons). Once one is approved, its Fast2SMS
 * message id goes in CREW_TEMPLATES and the next deploy sends it. Until then
 * the crew member shows "WhatsApp template not approved yet" and nothing goes.
 */

export const CREW_KINDS = ["offer", "confirmed", "reminder", "not_needed"] as const;
export type CrewKind = (typeof CREW_KINDS)[number];

/** A template: the message, and for the invitation whether it has the stay and food line. */
export type TemplateKey = CrewKind | "offer_stay";
export const templateKey = (kind: CrewKind, stay = false): TemplateKey => (kind === "offer" && stay ? "offer_stay" : kind);

export const CREW_LOCALES = ["en-IN", "hi-IN", "hi-Latn-IN"] as const;
export type CrewLocale = (typeof CREW_LOCALES)[number];

export interface CrewTemplate {
  kind: CrewKind;
  /** The invitation's version with the stay and food line. */
  stay?: true;
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

/** The invitation's words, with or without the stay and food line ({{5}}). */
const INVITE = {
  "en-IN": {
    head: "Update on your job application {{1}} with Vayasya Seva.\n\nYou are shortlisted for an interview for this job:\nJob: {{2}}\nPlace: {{3}}\nStarts: {{4}}",
    stay: "\nStay and food: {{5}}",
    tail: "\n\nTap \"Yes\" if you want the interview. Our team will call you to fix the time.\nVayasya Seva never charges a fee. If anyone asks you for money, tell us here.",
    buttons: ["Yes, I'm interested", "No"] as const,
    example: ["VS-J-ABC234", "Packing helper", "SIDCUL, Haridwar", "Wednesday, 25 November", "Room and food given"],
  },
  "hi-IN": {
    head: "Vayasya Seva में आपके नौकरी के आवेदन {{1}} पर अपडेट।\n\nइस काम के इंटरव्यू के लिए आपका नाम चुना गया है:\nकाम: {{2}}\nजगह: {{3}}\nशुरू: {{4}}",
    stay: "\nरहना और खाना: {{5}}",
    tail: "\n\nइंटरव्यू देना है तो \"हाँ\" दबाएँ। हमारी टीम कॉल करके समय तय करेगी।\nVayasya Seva कोई फ़ीस नहीं लेती। कोई पैसे माँगे तो हमें यहीं बताएँ।",
    buttons: ["हाँ, इंटरव्यू देना है", "नहीं"] as const,
    example: ["VS-J-ABC234", "Packing helper", "SIDCUL, हरिद्वार", "बुधवार, 25 नवंबर", "कमरा और खाना मिलेगा"],
  },
  "hi-Latn-IN": {
    head: "Vayasya Seva mein aapke job application {{1}} par update.\n\nIs kaam ke interview ke liye aapka naam chuna gaya hai:\nKaam: {{2}}\nJagah: {{3}}\nShuru: {{4}}",
    stay: "\nRehna aur khana: {{5}}",
    tail: "\n\nInterview dena hai to \"Haan\" dabayein. Hamari team call karke samay tay karegi.\nVayasya Seva koi fees nahi leti. Koi paise maange to humein yahin batayein.",
    buttons: ["Haan, interview dena hai", "Nahi"] as const,
    example: ["VS-J-ABC234", "Packing helper", "SIDCUL, Haridwar", "Wednesday, 25 November", "Kamra aur khana milega"],
  },
};

const invite = (locale: CrewLocale, stay: boolean): CrewTemplate => {
  const w = INVITE[locale];
  const base = stay ? "vspl_interview_invite_stay" : "vspl_interview_invite";
  return {
    kind: "offer",
    ...(stay ? { stay: true as const } : {}),
    locale,
    name: locale === "hi-Latn-IN" ? hinglish(base) : base,
    language: locale === "en-IN" ? "en" : "hi",
    text: w.head + (stay ? w.stay : "") + w.tail,
    buttons: w.buttons,
    example: stay ? w.example : w.example.slice(0, 4),
  };
};

export const CREW_TEMPLATE_TEXT: CrewTemplate[] = [
  // --- offer (interview invitation): {{1}} application reference, {{2}} job, {{3}} place, {{4}} start, {{5}} stay and food (the _stay version) ---
  ...CREW_LOCALES.flatMap((locale) => [invite(locale, false), invite(locale, true)]),

  // --- confirmed (interview details): {{1}} where (with the map link), {{2}} when, {{3}} whom to ask ---
  {
    kind: "confirmed",
    locale: "en-IN",
    name: "vspl_interview_details",
    language: "en",
    text:
      "Your interview with Vayasya Seva is fixed.\n\nWhere: {{1}}\nWhen: {{2}}\nAsk for: {{3}}\n\n" +
      "Bring your Aadhaar card, bank passbook, 2 photos, and your PF UAN number if you have one.\nIf you cannot come, tell us here before the day.",
    example: ["Gate 2, Plot 12, Sector 4, SIDCUL Haridwar (map: https://maps.app.goo.gl/abc)", "Wednesday, 25 November, 8:00 am", "Ramesh, 98765 43210"],
  },
  {
    kind: "confirmed",
    locale: "hi-IN",
    name: "vspl_interview_details",
    language: "hi",
    text:
      "Vayasya Seva के साथ आपका इंटरव्यू तय हुआ।\n\nकहाँ आना है: {{1}}\nकब: {{2}}\nकिससे मिलना है: {{3}}\n\n" +
      "साथ लाएँ: आधार कार्ड, बैंक पासबुक, 2 फ़ोटो। PF का UAN नंबर हो तो वह भी।\nनहीं आ पाएँ तो पहले यहीं बता दें।",
    example: ["गेट 2, प्लॉट 12, सेक्टर 4, SIDCUL हरिद्वार (map: https://maps.app.goo.gl/abc)", "बुधवार, 25 नवंबर, सुबह 8:00 बजे", "रमेश, 98765 43210"],
  },
  {
    kind: "confirmed",
    locale: "hi-Latn-IN",
    name: hinglish("vspl_interview_details"),
    language: "hi",
    text:
      "Vayasya Seva ke saath aapka interview tay hua.\n\nKahan aana hai: {{1}}\nKab: {{2}}\nKisse milna hai: {{3}}\n\n" +
      "Saath laayein: Aadhaar card, bank passbook, 2 photo. PF ka UAN number ho to woh bhi.\nNahi aa paayein to pehle yahin bata dein.",
    example: ["Gate 2, Plot 12, Sector 4, SIDCUL Haridwar (map: https://maps.app.goo.gl/abc)", "Wednesday, 25 November, subah 8:00 baje", "Ramesh, 98765 43210"],
  },

  // --- reminder (the evening before the interview): {{1}} the time, {{2}} the place ---
  {
    kind: "reminder",
    locale: "en-IN",
    name: "vspl_interview_reminder",
    language: "en",
    text: "A reminder from Vayasya Seva: your interview is tomorrow at {{1}}, at {{2}}.\n\nAre you coming?",
    buttons: ["Yes, coming", "Can't come"],
    example: ["8:00 am", "Gate 2, Plot 12, Sector 4, SIDCUL Haridwar"],
  },
  {
    kind: "reminder",
    locale: "hi-IN",
    name: "vspl_interview_reminder",
    language: "hi",
    text: "Vayasya Seva से याद दिला रहे हैं: कल {{1}} आपका इंटरव्यू है, {{2}} पर।\n\nक्या आप आ रहे हैं?",
    buttons: ["हाँ, आ रहे हैं", "नहीं आ पाएँगे"],
    example: ["सुबह 8:00 बजे", "गेट 2, प्लॉट 12, सेक्टर 4, SIDCUL हरिद्वार"],
  },
  {
    kind: "reminder",
    locale: "hi-Latn-IN",
    name: hinglish("vspl_interview_reminder"),
    language: "hi",
    text: "Vayasya Seva se yaad dila rahe hain: kal {{1}} aapka interview hai, {{2}} par.\n\nKya aap aa rahe hain?",
    buttons: ["Haan, aa rahe hain", "Nahi aa paayenge"],
    example: ["subah 8:00 baje", "Gate 2, Plot 12, Sector 4, SIDCUL Haridwar"],
  },

  // --- not_needed (interviews full): {{1}} application reference, {{2}} the job ---
  {
    kind: "not_needed",
    locale: "en-IN",
    name: "vspl_interview_full",
    language: "en",
    text: "Update on your job application {{1}} with Vayasya Seva.\n\nThe interviews for {{2}} are full, so we will not call you for this one. Your application stays open with us.",
    example: ["VS-J-ABC234", "Packing helper"],
  },
  {
    kind: "not_needed",
    locale: "hi-IN",
    name: "vspl_interview_full",
    language: "hi",
    text: "Vayasya Seva में आपके नौकरी के आवेदन {{1}} पर अपडेट।\n\n{{2}} के इंटरव्यू पूरे हो गए हैं, इसलिए इसके लिए हम आपको कॉल नहीं करेंगे। आपका आवेदन हमारे पास खुला रहेगा।",
    example: ["VS-J-ABC234", "Packing helper"],
  },
  {
    kind: "not_needed",
    locale: "hi-Latn-IN",
    name: hinglish("vspl_interview_full"),
    language: "hi",
    text: "Vayasya Seva mein aapke job application {{1}} par update.\n\n{{2}} ke interview poore ho gaye hain, isliye iske liye hum aapko call nahi karenge. Aapka application hamare paas khula rahega.",
    example: ["VS-J-ABC234", "Packing helper"],
  },
];

/**
 * Fast2SMS message ids of the approved templates, by template and language
 * (`whatsapp-templates.mts` prints them). Only approved ones go here: a crew
 * member whose message has no id waits, with a note in Twenty, unless its
 * language has a stand-in (crew.ts LOCALE_STAND_IN: Hindi borrows Hinglish).
 *
 * The interview templates were submitted on 19 Nov 2026, all approved as
 * Utility except the two Hindi invitations (offer and offer_stay hi-IN,
 * 46028 and 46029), still pending on 20 Nov: Hindi readers get the Hinglish
 * invitation meanwhile. They replace the job-offer templates (vspl_job_*,
 * vspl_application_offer, 46002 to 46018), which are no longer used.
 */
export const CREW_TEMPLATES: Record<TemplateKey, Partial<Record<CrewLocale, number>>> = {
  offer: { "en-IN": 46026, "hi-Latn-IN": 46030 },
  offer_stay: { "en-IN": 46027, "hi-Latn-IN": 46031 },
  confirmed: { "en-IN": 46032, "hi-IN": 46033, "hi-Latn-IN": 46034 },
  reminder: { "en-IN": 46035, "hi-IN": 46036, "hi-Latn-IN": 46037 },
  not_needed: { "en-IN": 46038, "hi-IN": 46039, "hi-Latn-IN": 46040 },
};

export function templateText(kind: CrewKind, locale: CrewLocale, stay = false): CrewTemplate {
  const withStay = kind === "offer" && stay;
  const t = CREW_TEMPLATE_TEXT.find((x) => x.kind === kind && x.locale === locale && Boolean(x.stay) === withStay);
  if (!t) throw new Error(`no ${kind}${withStay ? " (stay)" : ""} template for ${locale}`);
  return t;
}

/** What Twenty's crew request Stay and food option reads as, by language; nothing given leaves the line out. */
export const STAY_TEXT: Record<string, Record<CrewLocale, string>> = {
  ROOM: { "en-IN": "Room given", "hi-IN": "कमरा मिलेगा", "hi-Latn-IN": "Kamra milega" },
  FOOD: { "en-IN": "Food given", "hi-IN": "खाना मिलेगा", "hi-Latn-IN": "Khana milega" },
  ROOM_AND_FOOD: { "en-IN": "Room and food given", "hi-IN": "कमरा और खाना मिलेगा", "hi-Latn-IN": "Kamra aur khana milega" },
};

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
