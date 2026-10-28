/**
 * Job seeker intake rules shared by the website (API route, Zod contract in
 * ./job-application.v1.ts) and the Windmill scripts, which inline this file
 * at build time (integrations/windmill/build.mts). Keep it dependency-free:
 * no imports. The site imports it as @/lib/talent-intake/rules.
 */

/** Submission reference shown to the person, e.g. VS-J-7K2M9Q. */
export const REF_PATTERN = /^VS-J-[A-Z0-9]{6}$/;

/**
 * Legacy sources: which jobs page a submission came from, and the short
 * locale it implies. Stored values (integrations/windmill/talent/schema.sql): web_hinglish
 * is the hi-Latn-IN page. Old rows keep them, the agent routes still send
 * them, and tickets issued before WEB_SOURCE may carry them. Never rename one.
 */
export const INTAKE_SOURCES = {
  web_en: "en",
  web_hi: "hi",
  web_hinglish: "hinglish",
} as const;
export type IntakeSource = keyof typeof INTAKE_SOURCES;
export type LegacyLocale = (typeof INTAKE_SOURCES)[IntakeSource];

/**
 * The source of new web submissions (PLAN §1a): one value, with the page's
 * language in `locale` as a BCP 47 tag instead of being folded into the source.
 */
export const WEB_SOURCE = "web";
export type SubmissionSource = IntakeSource | typeof WEB_SOURCE;

/**
 * The source of an application made in the WhatsApp apply chat (19 Oct 2026):
 * Windmill builds it, never the website, with the language chosen in the chat
 * as `locale` and channel "whatsapp". submissions.source allowed it from the start.
 */
export const WHATSAPP_SOURCE = "whatsapp";
/** Every source Windmill stores: the website's, and the WhatsApp chat's. */
export type StoredSource = SubmissionSource | typeof WHATSAPP_SOURCE;

export function isSubmissionSource(value: unknown): value is SubmissionSource {
  return value === WEB_SOURCE || (typeof value === "string" && Object.hasOwn(INTAKE_SOURCES, value));
}

/**
 * Page languages a submission can carry (BCP 47). Same list as LOCALE_TAGS in
 * src/content/registry/identifiers.ts (content:check compares them); repeated
 * here because the Windmill build inlines this file and it must stay import-free.
 */
export const INTAKE_LOCALES = ["en-IN", "hi-IN", "hi-Latn-IN", "pa-IN", "kn-IN"] as const;
export type IntakeLocale = (typeof INTAKE_LOCALES)[number];

export function isIntakeLocale(value: unknown): value is IntakeLocale {
  return typeof value === "string" && (INTAKE_LOCALES as readonly string[]).includes(value);
}

/** The BCP 47 locale a legacy source stands for. */
export const LEGACY_SOURCE_LOCALES = { web_en: "en-IN", web_hi: "hi-IN", web_hinglish: "hi-Latn-IN" } as const satisfies Record<
  IntakeSource,
  IntakeLocale
>;

/**
 * Cluster ids (PLAN §1a). Same list as CLUSTER_IDS in
 * src/content/registry/identifiers.ts (content:check compares them).
 */
export const INTAKE_CLUSTERS = ["haridwar", "uttarakhand", "delhi-ncr", "bengaluru", "jalandhar", "saharanpur", "other", "punjab", "dehradun", "kapurthala", "visakhapatnam", "andhra-pradesh", "hyderabad", "telangana"] as const;
export type IntakeCluster = (typeof INTAKE_CLUSTERS)[number];

export function isIntakeCluster(value: unknown): value is IntakeCluster {
  return typeof value === "string" && (INTAKE_CLUSTERS as readonly string[]).includes(value);
}

/** The page a form sits on: a neutral path such as /jobs/haridwar (no locale, no query). */
export const PAGE_PATH_PATTERN = /^\/([a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*)?$/;
export const MAX_PAGE_PATH_LENGTH = 200;

export function isPagePath(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_PAGE_PATH_LENGTH && PAGE_PATH_PATTERN.test(value);
}

/**
 * How a submission reached us: the jobs form in a browser ("web"), an AI
 * agent through the open routes under /api/agent/jobs ("agent"), or the
 * WhatsApp apply chat (Windmill f/talent/whatsapp, "whatsapp"). Stored in
 * submissions.channel and shown to staff.
 */
export const INTAKE_CHANNELS = ["web", "agent", "whatsapp"] as const;
export type IntakeChannel = (typeof INTAKE_CHANNELS)[number];

/** Locale an agent writes in, mapped to the jobs page source it stands in for. */
export const AGENT_LANGUAGE_SOURCES = { en: "web_en", hi: "web_hi", hinglish: "web_hinglish" } as const satisfies Record<
  (typeof INTAKE_SOURCES)[IntakeSource],
  IntakeSource
>;
export type AgentLanguage = keyof typeof AGENT_LANGUAGE_SOURCES;

/** Longest agent name kept with a submission. */
export const MAX_AGENT_NAME_LENGTH = 100;

/**
 * Role pages under /jobs/<slug>. A submission from one carries the slug, so
 * staff can find people by the work they asked about; the label is for staff.
 */
export const JOB_ROLES = {
  "factory-helper": "Factory helper",
  packing: "Packing",
  "machine-operator": "Machine operator",
  warehouse: "Warehouse: loading, picking, packing",
  "forklift-operator": "Forklift operator",
  "data-entry-operator": "Data entry operator",
  housekeeping: "Housekeeping",
  "iti-trades": "ITI trades: welder, fitter, electrician",
  electrician: "Electrician",
  welder: "Welder",
  fitter: "Fitter",
} as const;
export type JobRole = keyof typeof JOB_ROLES;
export const JOB_ROLE_SLUGS = Object.keys(JOB_ROLES) as [JobRole, ...JobRole[]];

export function isJobRole(value: unknown): value is JobRole {
  return typeof value === "string" && Object.hasOwn(JOB_ROLES, value);
}

/**
 * Hub pages under /jobs/<slug>: who the search was from, not a kind of work.
 * They are in the sitemap and linked from the jobs overview. A submission from one
 * carries the slug, so staff can see which hub brought the person in; the
 * label is for staff.
 */
export const JOB_HUBS = {
  freshers: "Freshers page",
  "10th-pass": "10th pass page",
  "12th-pass": "12th pass page",
} as const;
export type JobHub = keyof typeof JOB_HUBS;
export const JOB_HUB_SLUGS = Object.keys(JOB_HUBS) as [JobHub, ...JobHub[]];

export function isJobHub(value: unknown): value is JobHub {
  return typeof value === "string" && Object.hasOwn(JOB_HUBS, value);
}

/**
 * Which web form a submission came from (submissions.form): the long form on
 * /jobs and the role pages, or the guided quick form on /jobs/apply. Null for
 * the agent routes. The label is for staff.
 */
export const INTAKE_FORMS = {
  long: "Long form (/jobs and role pages)",
  quick: "Quick apply (/jobs/apply)",
} as const;
export type IntakeForm = keyof typeof INTAKE_FORMS;
export const INTAKE_FORM_KEYS = Object.keys(INTAKE_FORMS) as [IntakeForm, ...IntakeForm[]];

export const MAX_APPLICANT_NAME_LENGTH = 80;

/**
 * Where a person lives, anywhere in India (28 Oct 2026): the `home` answer,
 * picked on the area step from ranked guesses or a search (src/markets/india.ts
 * has the coordinates, search words and page names). States and union
 * territories by ISO 3166-2:IN code (current codes, lower case); cities and
 * industrial clusters as "<state>:<slug>". Stored values, append-only: add new
 * cities at the end of HOME_CITIES.
 */
export const HOME_STATES = {
  an: "Andaman and Nicobar Islands", ap: "Andhra Pradesh", ar: "Arunachal Pradesh", as: "Assam", br: "Bihar", ch: "Chandigarh",
  cg: "Chhattisgarh", dh: "Dadra and Nagar Haveli and Daman and Diu", dl: "Delhi", ga: "Goa", gj: "Gujarat", hr: "Haryana",
  hp: "Himachal Pradesh", jk: "Jammu and Kashmir", jh: "Jharkhand", ka: "Karnataka", kl: "Kerala", la: "Ladakh", ld: "Lakshadweep",
  mp: "Madhya Pradesh", mh: "Maharashtra", mn: "Manipur", ml: "Meghalaya", mz: "Mizoram", nl: "Nagaland", od: "Odisha",
  py: "Puducherry", pb: "Punjab", rj: "Rajasthan", sk: "Sikkim", tn: "Tamil Nadu", ts: "Telangana", tr: "Tripura",
  up: "Uttar Pradesh", uk: "Uttarakhand", wb: "West Bengal",
} as const;
export type HomeState = keyof typeof HOME_STATES;

/** Cities and industrial clusters: id -> English name (the staff label adds the state). */
export const HOME_CITIES: Readonly<Record<string, string>> = {
  "uk:haridwar": "Haridwar", "uk:sidcul": "SIDCUL Haridwar / Bahadrabad", "uk:roorkee": "Roorkee / Bhagwanpur", "uk:laksar": "Laksar",
  "uk:dehradun": "Dehradun", "uk:selaqui": "Selaqui / Sahaspur", "uk:rishikesh": "Rishikesh / Doiwala", "uk:vikasnagar": "Vikasnagar / Herbertpur",
  "uk:rudrapur": "Rudrapur / Pantnagar", "uk:kashipur": "Kashipur", "uk:sitarganj": "Sitarganj", "uk:haldwani": "Haldwani",
  "pb:jalandhar": "Jalandhar", "pb:kapurthala": "Kapurthala", "pb:phagwara": "Phagwara", "pb:sultanpur-lodhi": "Sultanpur Lodhi / Bholath",
  "pb:goraya": "Goraya / Phillaur", "pb:ludhiana": "Ludhiana", "pb:mohali": "Mohali / Kharar", "pb:amritsar": "Amritsar",
  "pb:patiala": "Patiala", "pb:bathinda": "Bathinda", "pb:hoshiarpur": "Hoshiarpur", "pb:gobindgarh": "Mandi Gobindgarh",
  "ka:bengaluru": "Bengaluru", "ka:peenya": "Peenya", "ka:electronic-city": "Electronic City / Bommasandra", "ka:whitefield": "Whitefield / Hoskote",
  "ka:kengeri": "Kengeri / Bidadi", "ka:tumakuru": "Tumakuru", "ka:mysuru": "Mysuru", "ka:hubballi": "Hubballi-Dharwad",
  "ka:belagavi": "Belagavi", "ka:mangaluru": "Mangaluru", "ka:kalaburagi": "Kalaburagi", "ka:ballari": "Ballari",
  "ap:visakhapatnam": "Visakhapatnam", "ap:gajuwaka": "Gajuwaka / Steel Plant", "ap:pendurthi": "Pendurthi / Sabbavaram",
  "ap:anakapalli": "Anakapalli / Parawada", "ap:vijayawada": "Vijayawada", "ap:guntur": "Guntur", "ap:kakinada": "Kakinada",
  "ap:rajahmundry": "Rajahmundry", "ap:nellore": "Nellore", "ap:tirupati": "Tirupati", "ap:sri-city": "Sri City", "ap:kurnool": "Kurnool",
  "ap:anantapur": "Anantapur",
  "ts:hyderabad": "Hyderabad / Secunderabad", "ts:patancheru": "Patancheru / Bollaram", "ts:jeedimetla": "Jeedimetla / Medchal",
  "ts:uppal": "Uppal / Cherlapally", "ts:shamshabad": "Shamshabad / Shadnagar", "ts:warangal": "Warangal", "ts:karimnagar": "Karimnagar / Ramagundam",
  "ts:nalgonda": "Nalgonda / Suryapet", "ts:mahabubnagar": "Mahabubnagar / Jadcherla", "ts:khammam": "Khammam", "ts:nizamabad": "Nizamabad",
  "dl:bawana": "Bawana / Narela", "dl:okhla": "Okhla",
  "up:noida": "Noida", "up:greater-noida": "Greater Noida", "up:ghaziabad": "Ghaziabad", "up:meerut": "Meerut", "up:saharanpur": "Saharanpur",
  "up:muzaffarnagar": "Muzaffarnagar", "up:bijnor": "Bijnor", "up:moradabad": "Moradabad", "up:bareilly": "Bareilly", "up:aligarh": "Aligarh",
  "up:agra": "Agra", "up:lucknow": "Lucknow", "up:kanpur": "Kanpur", "up:prayagraj": "Prayagraj", "up:varanasi": "Varanasi",
  "up:gorakhpur": "Gorakhpur", "up:azamgarh": "Azamgarh",
  "hr:gurugram": "Gurugram", "hr:manesar": "Manesar", "hr:faridabad": "Faridabad", "hr:sonipat": "Sonipat / Kundli", "hr:panipat": "Panipat",
  "hr:karnal": "Karnal", "hr:yamunanagar": "Yamunanagar", "hr:ambala": "Ambala", "hr:hisar": "Hisar", "hr:bawal": "Bawal / Rewari",
  "hp:baddi": "Baddi / Nalagarh", "hp:paonta-sahib": "Paonta Sahib", "hp:shimla": "Shimla", "hp:una": "Una",
  "jk:jammu": "Jammu", "jk:srinagar": "Srinagar", "jk:kathua": "Kathua",
  "rj:jaipur": "Jaipur", "rj:jodhpur": "Jodhpur", "rj:kota": "Kota", "rj:udaipur": "Udaipur", "rj:bhiwadi": "Bhiwadi", "rj:neemrana": "Neemrana",
  "rj:alwar": "Alwar", "rj:bhilwara": "Bhilwara",
  "gj:ahmedabad": "Ahmedabad", "gj:sanand": "Sanand", "gj:surat": "Surat", "gj:vadodara": "Vadodara", "gj:rajkot": "Rajkot", "gj:vapi": "Vapi",
  "gj:ankleshwar": "Ankleshwar / Bharuch", "gj:morbi": "Morbi",
  "mh:mumbai": "Mumbai", "mh:thane": "Thane", "mh:navi-mumbai": "Navi Mumbai", "mh:bhiwandi": "Bhiwandi", "mh:pune": "Pune / Pimpri-Chinchwad",
  "mh:chakan": "Chakan / Talegaon", "mh:nashik": "Nashik", "mh:sambhajinagar": "Chhatrapati Sambhajinagar (Aurangabad)", "mh:nagpur": "Nagpur",
  "mh:kolhapur": "Kolhapur",
  "mp:indore": "Indore", "mp:pithampur": "Pithampur", "mp:dewas": "Dewas", "mp:bhopal": "Bhopal / Mandideep", "mp:jabalpur": "Jabalpur",
  "mp:gwalior": "Gwalior",
  "cg:raipur": "Raipur", "cg:bhilai": "Bhilai / Durg", "cg:bilaspur": "Bilaspur",
  "br:patna": "Patna", "br:gaya": "Gaya", "br:muzaffarpur": "Muzaffarpur", "br:bhagalpur": "Bhagalpur", "br:darbhanga": "Darbhanga", "br:purnia": "Purnia",
  "jh:ranchi": "Ranchi", "jh:jamshedpur": "Jamshedpur", "jh:dhanbad": "Dhanbad", "jh:bokaro": "Bokaro",
  "wb:kolkata": "Kolkata", "wb:howrah": "Howrah", "wb:durgapur": "Durgapur", "wb:asansol": "Asansol", "wb:siliguri": "Siliguri",
  "wb:kharagpur": "Kharagpur", "wb:haldia": "Haldia",
  "od:bhubaneswar": "Bhubaneswar", "od:cuttack": "Cuttack", "od:rourkela": "Rourkela", "od:jharsuguda": "Jharsuguda", "od:angul": "Angul",
  "od:berhampur": "Berhampur",
  "as:guwahati": "Guwahati", "as:dibrugarh": "Dibrugarh", "tr:agartala": "Agartala", "mn:imphal": "Imphal", "ml:shillong": "Shillong",
  "tn:chennai": "Chennai", "tn:sriperumbudur": "Sriperumbudur / Oragadam", "tn:hosur": "Hosur", "tn:coimbatore": "Coimbatore",
  "tn:tiruppur": "Tiruppur", "tn:madurai": "Madurai", "tn:trichy": "Tiruchirappalli", "tn:salem": "Salem",
  "kl:kochi": "Kochi", "kl:thiruvananthapuram": "Thiruvananthapuram", "kl:kozhikode": "Kozhikode",
  "dh:silvassa": "Silvassa", "dh:daman": "Daman",
};

/** The state a home id lies in ("wb:kolkata" -> "wb"); the id itself for a state. */
export const homeStateOf = (id: string): HomeState | undefined => {
  const state = id.split(":")[0];
  return Object.hasOwn(HOME_STATES, state) ? (state as HomeState) : undefined;
};

/** Staff labels: the state's name, or "City, State". */
const HOME_LABELS: Readonly<Record<string, string>> = {
  ...HOME_STATES,
  ...Object.fromEntries(Object.entries(HOME_CITIES).map(([id, name]) => [id, `${name}, ${HOME_STATES[homeStateOf(id)!]}`])),
};

/**
 * The quick form's questions and answers: question -> answer id -> English
 * label for staff. Ids are stored values (submissions.answers) and analytics
 * labels, the same in every page language; page wording lives in
 * src/content/pages/quick-apply.ts.
 */
export const QUICK_ANSWERS = {
  work: {
    "factory-helper": "Factory helper", packing: "Packing", warehouse: "Warehouse / loading", "machine-operator": "Machine operator",
    "iti-trades": "ITI trade", housekeeping: "Housekeeping", "data-entry-operator": "Data entry", "forklift-operator": "Forklift operator",
    any: "Any work",
  },
  trade: { electrician: "Electrician", welder: "Welder", fitter: "Fitter", machinist: "Machinist / turner", "other-trade": "Other trade" },
  iti: { "iti-pass": "ITI passed", "iti-pursuing": "Studying / apprentice", "no-iti": "Experience, no ITI" },
  machines: {
    "packing-machine": "Packing machines", moulding: "Injection moulding", press: "Press / sheet metal", "cnc-vmc": "CNC / VMC",
    "other-machine": "Other machines",
  },
  forklift: { "licence-experience": "Licence and experience", "experience-only": "Experience, no licence", "want-to-learn": "Wants to learn" },
  computer: { typing: "Typing", excel: "Excel", tally: "Tally", "sap-erp": "SAP / ERP" },
  experience: { fresher: "Fresher", "under-1": "Under 1 year", "1-3": "1 to 3 years", "3-plus": "3+ years" },
  education: { "below-10th": "Below 10th", "10th": "10th pass", "12th": "12th pass", "iti-diploma": "ITI / diploma", graduate: "Graduate" },
  shift: { day: "Day", night: "Night", rotating: "Rotating / any" },
  start: { now: "Immediately", week: "Within a week", month: "Within a month" },
  area: {
    "sidcul-bahadrabad": "SIDCUL / Bahadrabad", "haridwar-jwalapur": "Haridwar city / Jwalapur", "roorkee-bhagwanpur": "Roorkee / Bhagwanpur",
    laksar: "Laksar", outside: "Outside Haridwar",
    "bengaluru:north": "Bengaluru North / Peenya", "bengaluru:south": "Bengaluru South / Electronic City", "bengaluru:east": "Bengaluru East / Whitefield",
    "bengaluru:west": "Bengaluru West / Kengeri", "bengaluru:outside": "Outside Bengaluru",
    "jalandhar:kapurthala": "Kapurthala", "jalandhar:city": "Jalandhar city", "jalandhar:phagwara-goraya": "Phagwara / Goraya",
    "jalandhar:outside": "Outside Jalandhar", "jalandhar:goraya-phillaur": "Goraya / Phillaur",
    "uttarakhand:haridwar": "Haridwar / Roorkee", "uttarakhand:dehradun-selaqui": "Dehradun / Selaqui",
    "uttarakhand:udham-singh-nagar": "Rudrapur / Kashipur / Sitarganj", "uttarakhand:other": "Elsewhere in Uttarakhand",
    "uttarakhand:outside": "Outside Uttarakhand",
    "punjab:jalandhar-kapurthala": "Jalandhar / Kapurthala", "punjab:ludhiana": "Ludhiana", "punjab:mohali": "Mohali / Kharar",
    "punjab:amritsar": "Amritsar", "punjab:other": "Elsewhere in Punjab", "punjab:outside": "Outside Punjab",
    "punjab:jalandhar": "Jalandhar", "punjab:kapurthala": "Kapurthala / Phagwara",
    "dehradun:selaqui-sahaspur": "Selaqui / Sahaspur", "dehradun:city": "Dehradun city", "dehradun:rishikesh-doiwala": "Rishikesh / Doiwala",
    "dehradun:vikasnagar": "Vikasnagar / Herbertpur", "dehradun:outside": "Outside Dehradun",
    "kapurthala:city": "Kapurthala city", "kapurthala:phagwara": "Phagwara", "kapurthala:sultanpur-lodhi": "Sultanpur Lodhi / Bholath",
    "kapurthala:outside": "Outside Kapurthala", "kapurthala:jalandhar": "Jalandhar (Kapurthala form)",
    "visakhapatnam:city": "Visakhapatnam city", "visakhapatnam:gajuwaka": "Gajuwaka / Steel Plant / Duvvada",
    "visakhapatnam:pendurthi": "Pendurthi / Sabbavaram", "visakhapatnam:anakapalli": "Anakapalli / Parawada / Atchutapuram",
    "visakhapatnam:outside": "Outside Visakhapatnam",
    "andhra-pradesh:visakhapatnam": "Visakhapatnam / Anakapalli", "andhra-pradesh:vijayawada-guntur": "Vijayawada / Guntur",
    "andhra-pradesh:kakinada-rajahmundry": "Kakinada / Rajahmundry", "andhra-pradesh:nellore-tirupati": "Nellore / Tirupati / Sri City",
    "andhra-pradesh:other": "Elsewhere in Andhra Pradesh", "andhra-pradesh:outside": "Outside Andhra Pradesh",
    "hyderabad:city": "Hyderabad / Secunderabad city", "hyderabad:patancheru": "Patancheru / Pashamylaram / Bollaram",
    "hyderabad:jeedimetla-medchal": "Jeedimetla / Kukatpally / Medchal", "hyderabad:uppal-cherlapally": "Uppal / Cherlapally / Nacharam",
    "hyderabad:shamshabad-kothur": "Shamshabad / Kothur / Shadnagar", "hyderabad:outside": "Outside Hyderabad",
    "telangana:hyderabad": "Hyderabad / Secunderabad", "telangana:warangal": "Warangal / Hanamkonda",
    "telangana:karimnagar-ramagundam": "Karimnagar / Ramagundam", "telangana:nalgonda-suryapet": "Nalgonda / Suryapet",
    "telangana:mahabubnagar-jadcherla": "Mahabubnagar / Jadcherla", "telangana:other": "Elsewhere in Telangana",
    "telangana:outside": "Outside Telangana",
    "market:haridwar": "Haridwar / Roorkee", "market:uttarakhand": "Elsewhere in Uttarakhand", "market:jalandhar": "Jalandhar",
    "market:punjab": "Elsewhere in Punjab", "market:bengaluru": "Bengaluru", "market:other": "Somewhere else",
    "market:dehradun": "Dehradun / Selaqui", "market:kapurthala": "Kapurthala / Phagwara",
    "market:visakhapatnam": "Visakhapatnam (Vizag)", "market:andhra-pradesh": "Elsewhere in Andhra Pradesh",
    "market:hyderabad": "Hyderabad", "market:telangana": "Elsewhere in Telangana",
    "haridwar:rest-of-uttarakhand": "Elsewhere in Uttarakhand (Haridwar form)", "jalandhar:rest-of-punjab": "Elsewhere in Punjab (Jalandhar form)",
    "dehradun:rest-of-uttarakhand": "Elsewhere in Uttarakhand (Dehradun form)",
    "kapurthala:rest-of-punjab": "Elsewhere in Punjab (Kapurthala form)",
    "visakhapatnam:rest-of-andhra-pradesh": "Elsewhere in Andhra Pradesh (Visakhapatnam form)",
    "hyderabad:rest-of-telangana": "Elsewhere in Telangana (Hyderabad form)",
  },
  // Asked with `area`, on the same step: the exact place, when the person
  // picked one; `area` then holds the answer it files under (src/markets/home.ts).
  home: HOME_LABELS,
} as const;
export type QuickQuestion = keyof typeof QUICK_ANSWERS;

/**
 * The cluster each `area` answer lies in; null when the answer names no
 * cluster ("outside" Haridwar), so the page's cluster or "other" decides.
 * Append-only, like the answer ids.
 */
export const AREA_CLUSTERS: Record<keyof typeof QUICK_ANSWERS.area, IntakeCluster | null> = {
  "sidcul-bahadrabad": "haridwar",
  "haridwar-jwalapur": "haridwar",
  "roorkee-bhagwanpur": "haridwar",
  laksar: "haridwar",
  outside: null,
  "bengaluru:north": "bengaluru",
  "bengaluru:south": "bengaluru",
  "bengaluru:east": "bengaluru",
  "bengaluru:west": "bengaluru",
  "bengaluru:outside": null,
  // Files under Kapurthala since its jobs market opened (20 Oct 2026), like uttarakhand:dehradun-selaqui.
  "jalandhar:kapurthala": "kapurthala",
  "jalandhar:city": "jalandhar",
  // Off the forms since 20 Oct 2026 (FORMLESS_AREAS); earlier answers stay Jalandhar's.
  "jalandhar:phagwara-goraya": "jalandhar",
  "jalandhar:outside": null,
  "jalandhar:goraya-phillaur": "jalandhar",
  "uttarakhand:haridwar": "haridwar",
  // Files under Dehradun since its market opened (18 Oct 2026), like uttarakhand:haridwar.
  "uttarakhand:dehradun-selaqui": "dehradun",
  "uttarakhand:udham-singh-nagar": "uttarakhand",
  "uttarakhand:other": "uttarakhand",
  "uttarakhand:outside": null,
  // Off the forms since 20 Oct 2026 (FORMLESS_AREAS): punjab:jalandhar and punjab:kapurthala replace it.
  "punjab:jalandhar-kapurthala": "jalandhar",
  "punjab:ludhiana": "punjab",
  "punjab:mohali": "punjab",
  "punjab:amritsar": "punjab",
  "punjab:other": "punjab",
  "punjab:outside": null,
  "punjab:jalandhar": "jalandhar",
  "punjab:kapurthala": "kapurthala",
  "dehradun:selaqui-sahaspur": "dehradun",
  "dehradun:city": "dehradun",
  "dehradun:rishikesh-doiwala": "dehradun",
  "dehradun:vikasnagar": "dehradun",
  "dehradun:outside": null,
  "kapurthala:city": "kapurthala",
  "kapurthala:phagwara": "kapurthala",
  "kapurthala:sultanpur-lodhi": "kapurthala",
  "kapurthala:outside": null,
  "kapurthala:jalandhar": "jalandhar",
  "visakhapatnam:city": "visakhapatnam",
  "visakhapatnam:gajuwaka": "visakhapatnam",
  "visakhapatnam:pendurthi": "visakhapatnam",
  "visakhapatnam:anakapalli": "visakhapatnam",
  "visakhapatnam:outside": null,
  // Visakhapatnam's answer on the Andhra Pradesh form files under its own market, like punjab:kapurthala.
  "andhra-pradesh:visakhapatnam": "visakhapatnam",
  "andhra-pradesh:vijayawada-guntur": "andhra-pradesh",
  "andhra-pradesh:kakinada-rajahmundry": "andhra-pradesh",
  "andhra-pradesh:nellore-tirupati": "andhra-pradesh",
  "andhra-pradesh:other": "andhra-pradesh",
  "andhra-pradesh:outside": null,
  "hyderabad:city": "hyderabad",
  "hyderabad:patancheru": "hyderabad",
  "hyderabad:jeedimetla-medchal": "hyderabad",
  "hyderabad:uppal-cherlapally": "hyderabad",
  "hyderabad:shamshabad-kothur": "hyderabad",
  "hyderabad:outside": null,
  // Hyderabad, picked on the Telangana form, files under its own market.
  "telangana:hyderabad": "hyderabad",
  "telangana:warangal": "telangana",
  "telangana:karimnagar-ramagundam": "telangana",
  "telangana:nalgonda-suryapet": "telangana",
  "telangana:mahabubnagar-jadcherla": "telangana",
  "telangana:other": "telangana",
  "telangana:outside": null,
  "market:haridwar": "haridwar",
  "market:uttarakhand": "uttarakhand",
  "market:jalandhar": "jalandhar",
  "market:punjab": "punjab",
  "market:bengaluru": "bengaluru",
  "market:other": null,
  "market:dehradun": "dehradun",
  "market:kapurthala": "kapurthala",
  "market:visakhapatnam": "visakhapatnam",
  "market:andhra-pradesh": "andhra-pradesh",
  "market:hyderabad": "hyderabad",
  "market:telangana": "telangana",
  "haridwar:rest-of-uttarakhand": "uttarakhand",
  "jalandhar:rest-of-punjab": "punjab",
  "dehradun:rest-of-uttarakhand": "uttarakhand",
  "kapurthala:rest-of-punjab": "punjab",
  "visakhapatnam:rest-of-andhra-pradesh": "andhra-pradesh",
  "hyderabad:rest-of-telangana": "telangana",
};

/**
 * Area answers kept for stored rows but no longer offered on any form. Their
 * ids and filing stay (AREA_CLUSTERS is append-only).
 */
export const FORMLESS_AREAS: ReadonlySet<string> = new Set(["jalandhar:phagwara-goraya", "punjab:jalandhar-kapurthala"]);

/**
 * The cluster a submission belongs to (PLAN pipelines, rules 1 to 3): the
 * area the person chose when it names a cluster, else the page's cluster,
 * else "other", which is a real cluster, not an error. So "Outside Haridwar"
 * on /jobs/haridwar files under haridwar (the page), and the same answer on
 * /jobs/apply files under other. The page's own cluster is stored separately
 * (page_cluster). The market answers (market:*) and the cross-market ones
 * (uttarakhand:haridwar, uttarakhand:dehradun-selaqui, jalandhar:kapurthala, punjab:kapurthala,
 * andhra-pradesh:visakhapatnam, telangana:hyderabad) file under the market
 * the person named, whatever page they were on.
 */
export function submissionCluster(pageCluster: IntakeCluster | null | undefined, answers: QuickAnswers | null | undefined): IntakeCluster {
  const area = answers?.area?.[0];
  const fromArea = area && Object.hasOwn(AREA_CLUSTERS, area) ? AREA_CLUSTERS[area as keyof typeof AREA_CLUSTERS] : null;
  return fromArea ?? pageCluster ?? "other";
}
export type QuickAnswers = Partial<Record<QuickQuestion, string[]>>;

/** Staff labels for the questions, in the order they are asked. */
export const QUICK_QUESTIONS: Record<QuickQuestion, string> = {
  work: "Work", trade: "ITI trade", iti: "ITI", machines: "Machines", forklift: "Forklift", computer: "Computer skills",
  experience: "Experience", education: "Education", shift: "Shifts", start: "Can start", area: "Area", home: "Lives in",
};

/** Keeps only known questions and answer ids; null when nothing is left. */
export function cleanQuickAnswers(raw: unknown): QuickAnswers | null {
  if (!raw || typeof raw !== "object") return null;
  const out: QuickAnswers = {};
  for (const [question, options] of Object.entries(QUICK_ANSWERS) as [QuickQuestion, Record<string, string>][]) {
    const values = (raw as Record<string, unknown>)[question];
    if (!Array.isArray(values)) continue;
    const kept = [...new Set(values.filter((v): v is string => typeof v === "string" && Object.hasOwn(options, v)))];
    if (kept.length) out[question] = kept;
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Photos and documents only. Audio (voice notes) stopped being accepted on
 * 16 October 2026 when speech-to-text was dropped (PLAN, owner answers).
 */
export const ATTACHMENT_KINDS = ["image", "document"] as const;
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number];

/** MIME types accepted per kind. */
export const ATTACHMENT_MIME: Record<AttachmentKind, RegExp> = {
  image: /^image\/(jpeg|png|webp)$/,
  // PDF and Word (.doc, .docx).
  document:
    /^application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/,
};

export const INTAKE_LIMITS = {
  maxAttachments: 8,
  maxTextLength: 4000,
  maxFileNameLength: 200,
  maxBytes: { image: 10 * 1024 * 1024, document: 20 * 1024 * 1024 } as Record<AttachmentKind, number>,
} as const;

/** R2 object key for one upload: intake/YYYY/MM/<ref>/<position>.<ext> */
export function attachmentKeyPrefix(ref: string, at: Date) {
  const month = String(at.getUTCMonth() + 1).padStart(2, "0");
  return `intake/${at.getUTCFullYear()}/${month}/${ref}/`;
}

export function isAttachmentKeyFor(key: string, ref: string) {
  return key.startsWith("intake/") && key.includes(`/${ref}/`);
}

/** Indian mobile number in E.164 (+91XXXXXXXXXX), or null. */
export function normaliseIndianMobile(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return `+${digits}`;
  if (/^0[6-9]\d{9}$/.test(digits)) return `+91${digits.slice(1)}`;
  return null;
}
