// Generated from integrations/windmill/talent/scripts/crew.ts by integrations/windmill/build.mts. Edit the source, not this.

import * as wmill from "windmill-client";

import postgres from "postgres";

// integrations/windmill/talent/lib/config.ts
const { VARIABLES, isKept, variablePath, setConfigForTests, config } = (() => {
const VARIABLES = {
    talent_pg_url: { secret: true },
    fast2sms_api_key: { secret: true },
    intake_webhook_secret: { secret: true },
    r2_read_key_id: { secret: true },
    r2_read_secret: { secret: true },
    r2_erase_key_id: { secret: true },
    r2_erase_secret: { secret: true },
    r2_endpoint: { secret: false },
    r2_bucket: { secret: false },
    twenty_base_url: { secret: false },
    twenty_api_key: { secret: true },
    lead_webhook_secret: { secret: true },
    fast2sms_dlr_secret: { secret: true },
    leads_pg_url: { secret: true },
    submission_signing_secret: { secret: true },
    fast2sms_whatsapp_secret: { secret: true },
    crew_test_phones: { secret: true, kept: true },
    alerts_email_from: { secret: false },
    alerts_reply_to: { secret: false },
    lead_staff_email_from: { secret: false },
    lead_buyer_email_from: { secret: false },
    lead_inbox_email: { secret: false },
};
const isKept = (name) => "kept" in VARIABLES[name];
const variablePath = (name) => `f/talent/${name}`;
let override = null;
function setConfigForTests(values) {
    override = values;
}
async function config(name) {
    if (override) {
        const value = override[name];
        if (value === undefined)
            throw new Error(`test config has no ${name}`);
        return value;
    }
    const value = await wmill.getVariable(variablePath(name));
    if (!value)
        throw new Error(`variable ${variablePath(name)} is empty`);
    return value;
}
  return { VARIABLES, isKept, variablePath, setConfigForTests, config };
})();

// integrations/windmill/talent/lib/db.ts
const { withTalentDb, withDatabase, queryWith } = (() => {
const passThroughJson = (oid) => ({
    to: oid,
    from: [oid],
    serialize: (value) => (typeof value === "string" ? value : JSON.stringify(value)),
    parse: (value) => JSON.parse(value),
});
async function withTalentDb(fn) {
    return withDatabase("talent_pg_url", fn);
}
async function withDatabase(url, fn) {
    const sql = postgres(await config(url), {
        max: 1,
        connect_timeout: 10,
        idle_timeout: 5,
        prepare: false,
        types: { json: passThroughJson(114), jsonb: passThroughJson(3802) },
        onnotice: () => { },
    });
    try {
        return await fn(queryWith(sql));
    }
    finally {
        await sql.end({ timeout: 5 });
    }
}
const queryWith = (sql) => async (text, params = []) => (await sql.unsafe(text, params));
  return { withTalentDb, withDatabase, queryWith };
})();

// packages/contracts/src/rules.ts
const { REF_PATTERN, INTAKE_SOURCES, WEB_SOURCE, WHATSAPP_SOURCE, isSubmissionSource, INTAKE_LOCALES, isIntakeLocale, LEGACY_SOURCE_LOCALES, INTAKE_CLUSTERS, isIntakeCluster, PAGE_PATH_PATTERN, MAX_PAGE_PATH_LENGTH, isPagePath, INTAKE_CHANNELS, AGENT_LANGUAGE_SOURCES, MAX_AGENT_NAME_LENGTH, JOB_ROLES, JOB_ROLE_SLUGS, isJobRole, JOB_HUBS, JOB_HUB_SLUGS, isJobHub, INTAKE_FORMS, INTAKE_FORM_KEYS, MAX_APPLICANT_NAME_LENGTH, HOME_STATES, HOME_CITIES, homeStateOf, QUICK_ANSWERS, AREA_CLUSTERS, FORMLESS_AREAS, submissionCluster, QUICK_QUESTIONS, cleanQuickAnswers, ATTACHMENT_KINDS, ATTACHMENT_MIME, INTAKE_LIMITS, attachmentKeyPrefix, isAttachmentKeyFor, normaliseIndianMobile } = (() => {
const REF_PATTERN = /^VS-J-[A-Z0-9]{6}$/;
const INTAKE_SOURCES = {
    web_en: "en",
    web_hi: "hi",
    web_hinglish: "hinglish",
};
const WEB_SOURCE = "web";
const WHATSAPP_SOURCE = "whatsapp";
function isSubmissionSource(value) {
    return value === WEB_SOURCE || (typeof value === "string" && Object.hasOwn(INTAKE_SOURCES, value));
}
const INTAKE_LOCALES = ["en-IN", "hi-IN", "hi-Latn-IN", "pa-IN", "kn-IN"];
function isIntakeLocale(value) {
    return typeof value === "string" && INTAKE_LOCALES.includes(value);
}
const LEGACY_SOURCE_LOCALES = { web_en: "en-IN", web_hi: "hi-IN", web_hinglish: "hi-Latn-IN" };
const INTAKE_CLUSTERS = ["haridwar", "uttarakhand", "delhi-ncr", "bengaluru", "jalandhar", "saharanpur", "other", "punjab", "dehradun", "kapurthala", "visakhapatnam", "andhra-pradesh", "hyderabad", "telangana"];
function isIntakeCluster(value) {
    return typeof value === "string" && INTAKE_CLUSTERS.includes(value);
}
const PAGE_PATH_PATTERN = /^\/([a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*)?$/;
const MAX_PAGE_PATH_LENGTH = 200;
function isPagePath(value) {
    return typeof value === "string" && value.length <= MAX_PAGE_PATH_LENGTH && PAGE_PATH_PATTERN.test(value);
}
const INTAKE_CHANNELS = ["web", "agent", "whatsapp"];
const AGENT_LANGUAGE_SOURCES = { en: "web_en", hi: "web_hi", hinglish: "web_hinglish" };
const MAX_AGENT_NAME_LENGTH = 100;
const JOB_ROLES = {
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
};
const JOB_ROLE_SLUGS = Object.keys(JOB_ROLES);
function isJobRole(value) {
    return typeof value === "string" && Object.hasOwn(JOB_ROLES, value);
}
const JOB_HUBS = {
    freshers: "Freshers page",
    "10th-pass": "10th pass page",
    "12th-pass": "12th pass page",
};
const JOB_HUB_SLUGS = Object.keys(JOB_HUBS);
function isJobHub(value) {
    return typeof value === "string" && Object.hasOwn(JOB_HUBS, value);
}
const INTAKE_FORMS = {
    long: "Long form (/jobs and role pages)",
    quick: "Quick apply (/jobs/apply)",
};
const INTAKE_FORM_KEYS = Object.keys(INTAKE_FORMS);
const MAX_APPLICANT_NAME_LENGTH = 80;
const HOME_STATES = {
    an: "Andaman and Nicobar Islands", ap: "Andhra Pradesh", ar: "Arunachal Pradesh", as: "Assam", br: "Bihar", ch: "Chandigarh",
    cg: "Chhattisgarh", dh: "Dadra and Nagar Haveli and Daman and Diu", dl: "Delhi", ga: "Goa", gj: "Gujarat", hr: "Haryana",
    hp: "Himachal Pradesh", jk: "Jammu and Kashmir", jh: "Jharkhand", ka: "Karnataka", kl: "Kerala", la: "Ladakh", ld: "Lakshadweep",
    mp: "Madhya Pradesh", mh: "Maharashtra", mn: "Manipur", ml: "Meghalaya", mz: "Mizoram", nl: "Nagaland", od: "Odisha",
    py: "Puducherry", pb: "Punjab", rj: "Rajasthan", sk: "Sikkim", tn: "Tamil Nadu", ts: "Telangana", tr: "Tripura",
    up: "Uttar Pradesh", uk: "Uttarakhand", wb: "West Bengal",
};
const HOME_CITIES = {
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
const homeStateOf = (id) => {
    const state = id.split(":")[0];
    return Object.hasOwn(HOME_STATES, state) ? state : undefined;
};
const HOME_LABELS = {
    ...HOME_STATES,
    ...Object.fromEntries(Object.entries(HOME_CITIES).map(([id, name]) => [id, `${name}, ${HOME_STATES[homeStateOf(id)]}`])),
};
const QUICK_ANSWERS = {
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
    home: HOME_LABELS,
};
const AREA_CLUSTERS = {
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
    "jalandhar:kapurthala": "kapurthala",
    "jalandhar:city": "jalandhar",
    "jalandhar:phagwara-goraya": "jalandhar",
    "jalandhar:outside": null,
    "jalandhar:goraya-phillaur": "jalandhar",
    "uttarakhand:haridwar": "haridwar",
    "uttarakhand:dehradun-selaqui": "dehradun",
    "uttarakhand:udham-singh-nagar": "uttarakhand",
    "uttarakhand:other": "uttarakhand",
    "uttarakhand:outside": null,
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
const FORMLESS_AREAS = new Set(["jalandhar:phagwara-goraya", "punjab:jalandhar-kapurthala"]);
function submissionCluster(pageCluster, answers) {
    const area = answers?.area?.[0];
    const fromArea = area && Object.hasOwn(AREA_CLUSTERS, area) ? AREA_CLUSTERS[area] : null;
    return fromArea ?? pageCluster ?? "other";
}
const QUICK_QUESTIONS = {
    work: "Work", trade: "ITI trade", iti: "ITI", machines: "Machines", forklift: "Forklift", computer: "Computer skills",
    experience: "Experience", education: "Education", shift: "Shifts", start: "Can start", area: "Area", home: "Lives in",
};
function cleanQuickAnswers(raw) {
    if (!raw || typeof raw !== "object")
        return null;
    const out = {};
    for (const [question, options] of Object.entries(QUICK_ANSWERS)) {
        const values = raw[question];
        if (!Array.isArray(values))
            continue;
        const kept = [...new Set(values.filter((v) => typeof v === "string" && Object.hasOwn(options, v)))];
        if (kept.length)
            out[question] = kept;
    }
    return Object.keys(out).length ? out : null;
}
const ATTACHMENT_KINDS = ["image", "document"];
const ATTACHMENT_MIME = {
    image: /^image\/(jpeg|png|webp)$/,
    document: /^application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/,
};
const INTAKE_LIMITS = {
    maxAttachments: 8,
    maxTextLength: 4000,
    maxFileNameLength: 200,
    maxBytes: { image: 10 * 1024 * 1024, document: 20 * 1024 * 1024 },
};
function attachmentKeyPrefix(ref, at) {
    const month = String(at.getUTCMonth() + 1).padStart(2, "0");
    return `intake/${at.getUTCFullYear()}/${month}/${ref}/`;
}
function isAttachmentKeyFor(key, ref) {
    return key.startsWith("intake/") && key.includes(`/${ref}/`);
}
function normaliseIndianMobile(input) {
    const digits = input.replace(/\D/g, "");
    if (/^[6-9]\d{9}$/.test(digits))
        return `+91${digits}`;
    if (/^91[6-9]\d{9}$/.test(digits))
        return `+${digits}`;
    if (/^0[6-9]\d{9}$/.test(digits))
        return `+91${digits.slice(1)}`;
    return null;
}
  return { REF_PATTERN, INTAKE_SOURCES, WEB_SOURCE, WHATSAPP_SOURCE, isSubmissionSource, INTAKE_LOCALES, isIntakeLocale, LEGACY_SOURCE_LOCALES, INTAKE_CLUSTERS, isIntakeCluster, PAGE_PATH_PATTERN, MAX_PAGE_PATH_LENGTH, isPagePath, INTAKE_CHANNELS, AGENT_LANGUAGE_SOURCES, MAX_AGENT_NAME_LENGTH, JOB_ROLES, JOB_ROLE_SLUGS, isJobRole, JOB_HUBS, JOB_HUB_SLUGS, isJobHub, INTAKE_FORMS, INTAKE_FORM_KEYS, MAX_APPLICANT_NAME_LENGTH, HOME_STATES, HOME_CITIES, homeStateOf, QUICK_ANSWERS, AREA_CLUSTERS, FORMLESS_AREAS, submissionCluster, QUICK_QUESTIONS, cleanQuickAnswers, ATTACHMENT_KINDS, ATTACHMENT_MIME, INTAKE_LIMITS, attachmentKeyPrefix, isAttachmentKeyFor, normaliseIndianMobile };
})();

// integrations/windmill/talent/lib/crew-templates.ts
const { CREW_KINDS, templateKey, CREW_LOCALES, CREW_TEMPLATE_TEXT, CREW_TEMPLATES, templateText, STAY_TEXT, crewLocale, variableValue, renderTemplate, variableCount } = (() => {
const CREW_KINDS = ["offer", "confirmed", "reminder", "not_needed"];
const templateKey = (kind, stay = false) => (kind === "offer" && stay ? "offer_stay" : kind);
const CREW_LOCALES = ["en-IN", "hi-IN", "hi-Latn-IN"];
const hinglish = (name) => `${name}_hinglish`;
const INVITE = {
    "en-IN": {
        head: "Update on your job application {{1}} with Vayasya Seva.\n\nYou are shortlisted for an interview for this job:\nJob: {{2}}\nPlace: {{3}}\nStarts: {{4}}",
        stay: "\nStay and food: {{5}}",
        tail: "\n\nTap \"Yes\" if you want the interview. Our team will call you to fix the time.\nVayasya Seva never charges a fee. If anyone asks you for money, tell us here.",
        buttons: ["Yes, I'm interested", "No"],
        example: ["VS-J-ABC234", "Packing helper", "SIDCUL, Haridwar", "Wednesday, 25 November", "Room and food given"],
    },
    "hi-IN": {
        head: "Vayasya Seva में आपके नौकरी के आवेदन {{1}} पर अपडेट।\n\nइस काम के इंटरव्यू के लिए आपका नाम चुना गया है:\nकाम: {{2}}\nजगह: {{3}}\nशुरू: {{4}}",
        stay: "\nरहना और खाना: {{5}}",
        tail: "\n\nइंटरव्यू देना है तो \"हाँ\" दबाएँ। हमारी टीम कॉल करके समय तय करेगी।\nVayasya Seva कोई फ़ीस नहीं लेती। कोई पैसे माँगे तो हमें यहीं बताएँ।",
        buttons: ["हाँ, इंटरव्यू देना है", "नहीं"],
        example: ["VS-J-ABC234", "Packing helper", "SIDCUL, हरिद्वार", "बुधवार, 25 नवंबर", "कमरा और खाना मिलेगा"],
    },
    "hi-Latn-IN": {
        head: "Vayasya Seva mein aapke job application {{1}} par update.\n\nIs kaam ke interview ke liye aapka naam chuna gaya hai:\nKaam: {{2}}\nJagah: {{3}}\nShuru: {{4}}",
        stay: "\nRehna aur khana: {{5}}",
        tail: "\n\nInterview dena hai to \"Haan\" dabayein. Hamari team call karke samay tay karegi.\nVayasya Seva koi fees nahi leti. Koi paise maange to humein yahin batayein.",
        buttons: ["Haan, interview dena hai", "Nahi"],
        example: ["VS-J-ABC234", "Packing helper", "SIDCUL, Haridwar", "Wednesday, 25 November", "Kamra aur khana milega"],
    },
};
const invite = (locale, stay) => {
    const w = INVITE[locale];
    const base = stay ? "vspl_interview_invite_stay" : "vspl_interview_invite";
    return {
        kind: "offer",
        ...(stay ? { stay: true } : {}),
        locale,
        name: locale === "hi-Latn-IN" ? hinglish(base) : base,
        language: locale === "en-IN" ? "en" : "hi",
        text: w.head + (stay ? w.stay : "") + w.tail,
        buttons: w.buttons,
        example: stay ? w.example : w.example.slice(0, 4),
    };
};
const CREW_TEMPLATE_TEXT = [
    ...CREW_LOCALES.flatMap((locale) => [invite(locale, false), invite(locale, true)]),
    {
        kind: "confirmed",
        locale: "en-IN",
        name: "vspl_interview_details",
        language: "en",
        text: "Your interview with Vayasya Seva is fixed.\n\nWhere: {{1}}\nWhen: {{2}}\nAsk for: {{3}}\n\n" +
            "Bring your Aadhaar card, bank passbook, 2 photos, and your PF UAN number if you have one.\nIf you cannot come, tell us here before the day.",
        example: ["Gate 2, Plot 12, Sector 4, SIDCUL Haridwar (map: https://maps.app.goo.gl/abc)", "Wednesday, 25 November, 8:00 am", "Ramesh, 98765 43210"],
    },
    {
        kind: "confirmed",
        locale: "hi-IN",
        name: "vspl_interview_details",
        language: "hi",
        text: "Vayasya Seva के साथ आपका इंटरव्यू तय हुआ।\n\nकहाँ आना है: {{1}}\nकब: {{2}}\nकिससे मिलना है: {{3}}\n\n" +
            "साथ लाएँ: आधार कार्ड, बैंक पासबुक, 2 फ़ोटो। PF का UAN नंबर हो तो वह भी।\nनहीं आ पाएँ तो पहले यहीं बता दें।",
        example: ["गेट 2, प्लॉट 12, सेक्टर 4, SIDCUL हरिद्वार (map: https://maps.app.goo.gl/abc)", "बुधवार, 25 नवंबर, सुबह 8:00 बजे", "रमेश, 98765 43210"],
    },
    {
        kind: "confirmed",
        locale: "hi-Latn-IN",
        name: hinglish("vspl_interview_details"),
        language: "hi",
        text: "Vayasya Seva ke saath aapka interview tay hua.\n\nKahan aana hai: {{1}}\nKab: {{2}}\nKisse milna hai: {{3}}\n\n" +
            "Saath laayein: Aadhaar card, bank passbook, 2 photo. PF ka UAN number ho to woh bhi.\nNahi aa paayein to pehle yahin bata dein.",
        example: ["Gate 2, Plot 12, Sector 4, SIDCUL Haridwar (map: https://maps.app.goo.gl/abc)", "Wednesday, 25 November, subah 8:00 baje", "Ramesh, 98765 43210"],
    },
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
const CREW_TEMPLATES = {
    offer: {},
    offer_stay: {},
    confirmed: {},
    reminder: {},
    not_needed: {},
};
function templateText(kind, locale, stay = false) {
    const withStay = kind === "offer" && stay;
    const t = CREW_TEMPLATE_TEXT.find((x) => x.kind === kind && x.locale === locale && Boolean(x.stay) === withStay);
    if (!t)
        throw new Error(`no ${kind}${withStay ? " (stay)" : ""} template for ${locale}`);
    return t;
}
const STAY_TEXT = {
    ROOM: { "en-IN": "Room given", "hi-IN": "कमरा मिलेगा", "hi-Latn-IN": "Kamra milega" },
    FOOD: { "en-IN": "Food given", "hi-IN": "खाना मिलेगा", "hi-Latn-IN": "Khana milega" },
    ROOM_AND_FOOD: { "en-IN": "Room and food given", "hi-IN": "कमरा और खाना मिलेगा", "hi-Latn-IN": "Kamra aur khana milega" },
};
function crewLocale(language) {
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
function variableValue(value) {
    const v = value.replace(/[\r\n\t]+/g, " ").replace(/\|/g, "/").replace(/ {2,}/g, " ").trim();
    return (v || "-").slice(0, 200);
}
function renderTemplate(t, values) {
    const body = t.text.replace(/\{\{(\d+)\}\}/g, (_m, n) => values[Number(n) - 1] ?? "");
    return t.buttons ? `${body}\n[${t.buttons[0]}] [${t.buttons[1]}]` : body;
}
const variableCount = (t) => new Set(t.text.match(/\{\{\d+\}\}/g) ?? []).size;
  return { CREW_KINDS, templateKey, CREW_LOCALES, CREW_TEMPLATE_TEXT, CREW_TEMPLATES, templateText, STAY_TEXT, crewLocale, variableValue, renderTemplate, variableCount };
})();

// integrations/windmill/talent/lib/crew.ts
const { CREW_STATUSES, WATCHED_STATUSES, istHour, formatDay, formatTime, stayText, missingFields, templateValues, personPhone, personName, SEND_HOURS, REMINDER, NO_REPLY_AFTER_MS, TEST_REMINDER_AFTER_MS, planMember, normaliseReply, interpretReply, statusAfterReply, crewDeliveryStatus, kindLabel, SENT_FIELD, noteAfterSend } = (() => {
const CREW_STATUSES = ["OFFERED", "SAID_YES", "SAID_NO", "NO_REPLY", "CONFIRMED", "CANT_COME", "REPORTED", "DIDNT_COME", "NOT_NEEDED"];
const WATCHED_STATUSES = ["OFFERED", "SAID_YES", "CONFIRMED", "NOT_NEEDED"];
const OPEN = ["OFFERED", "SAID_YES", "CONFIRMED"];
const IST_MS = 330 * 60 * 1000;
const ist = (d) => new Date(d.getTime() + IST_MS);
const istHour = (d) => ist(d).getUTCHours();
const istDay = (d) => ist(d).toISOString().slice(0, 10);
const istAt = (day, hours) => new Date(Date.parse(`${day}T00:00:00+05:30`) + hours * 3600_000);
const DATE_FORMAT = { "en-IN": "en-IN", "hi-IN": "hi-IN", "hi-Latn-IN": "en-IN" };
function formatDay(value, locale) {
    const d = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? istAt(value, 12) : new Date(value);
    return new Intl.DateTimeFormat(DATE_FORMAT[locale], { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" }).format(d);
}
const DAY_PARTS = {
    "hi-IN": ["सुबह", "दोपहर", "शाम", "रात"],
    "hi-Latn-IN": ["subah", "dopahar", "shaam", "raat"],
};
function formatTime(value, locale) {
    const d = ist(new Date(value));
    const h = d.getUTCHours();
    const clock = `${h % 12 || 12}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
    if (locale === "en-IN")
        return `${clock} ${h < 12 ? "am" : "pm"}`;
    const [morning, afternoon, evening, night] = DAY_PARTS[locale];
    const part = h >= 4 && h < 12 ? morning : h >= 12 && h < 16 ? afternoon : h >= 16 && h < 20 ? evening : night;
    return `${part} ${clock} ${locale === "hi-IN" ? "बजे" : "baje"}`;
}
const NEEDS = {
    offer: [["offerJob", "Job (for workers)"], ["offerPlace", "Place (for workers)"], ["startDate", "Start"]],
    confirmed: [["reportAddress", "Interview at"], ["reportAt", "Interview time"], ["siteContact", "Ask for"]],
    reminder: [["reportAddress", "Interview at"], ["reportAt", "Interview time"]],
    not_needed: [["offerJob", "Job (for workers)"]],
};
const stayText = (req, locale) => STAY_TEXT[req.stayAndFood ?? ""]?.[locale] ?? null;
const filled = (v) => typeof v === "string" && v.trim() !== "";
function missingFields(kind, req) {
    return NEEDS[kind].filter(([field]) => !filled(req[field])).map(([, label]) => label);
}
function templateValues(kind, req, locale, reference = "") {
    const s = (v) => v ?? "";
    switch (kind) {
        case "offer": {
            const stay = stayText(req, locale);
            return [reference, s(req.offerJob), s(req.offerPlace), formatDay(s(req.startDate), locale), ...(stay ? [stay] : [])].map(variableValue);
        }
        case "confirmed": {
            const where = filled(req.mapLink) ? `${s(req.reportAddress)} (map: ${s(req.mapLink).trim()})` : s(req.reportAddress);
            return [where, `${formatDay(s(req.reportAt), locale)}, ${formatTime(s(req.reportAt), locale)}`, s(req.siteContact)].map(variableValue);
        }
        case "reminder":
            return [formatTime(s(req.reportAt), locale), s(req.reportAddress)].map(variableValue);
        case "not_needed":
            return [reference, s(req.offerJob)].map(variableValue);
    }
}
function personPhone(p) {
    const number = p.phones?.primaryPhoneNumber ?? "";
    const code = (p.phones?.primaryPhoneCallingCode ?? "+91").replace(/\s/g, "");
    if (!number || (code && code !== "+91" && code !== "91"))
        return null;
    return normaliseIndianMobile(number);
}
const personName = (p) => [p?.name?.firstName, p?.name?.lastName].filter((x) => x && x.trim()).join(" ").trim();
const SEND_HOURS = {
    offer: [8, 21],
    not_needed: [8, 21],
    confirmed: [7, 22],
};
const REMINDER = { fromHour: 18, toHour: 21, beforeReportMs: 2 * 3600_000, afterConfirmedMs: 3 * 3600_000 };
const NO_REPLY_AFTER_MS = 24 * 3600_000;
const TEST_REMINDER_AFTER_MS = 60_000;
const ms = (v) => (v ? new Date(v).getTime() : 0);
function dueMessage(c) {
    const sent = (k) => c.ledger.find((r) => r.kind === k);
    switch (c.member.status) {
        case "OFFERED": {
            const offer = sent("offer");
            if (!offer)
                return "offer";
            if (offer.status === "accepted" && !offer.replied && c.now.getTime() - ms(offer.sent_at) >= NO_REPLY_AFTER_MS)
                return "no_reply";
            return null;
        }
        case "CONFIRMED": {
            const confirmed = sent("confirmed");
            if (!confirmed)
                return "confirmed";
            if (sent("reminder") || !c.request?.reportAt)
                return null;
            if (c.test)
                return confirmed.status === "accepted" && c.now.getTime() - ms(confirmed.sent_at) >= TEST_REMINDER_AFTER_MS ? "reminder" : null;
            const report = new Date(c.request.reportAt);
            const eve = new Date(report.getTime() - 24 * 3600_000);
            const day = istDay(eve);
            const from = istAt(day, REMINDER.fromHour).getTime();
            const to = Math.min(istAt(day, REMINDER.toHour).getTime(), report.getTime() - REMINDER.beforeReportMs);
            const now = c.now.getTime();
            const settled = confirmed.status !== "accepted" || now - ms(confirmed.sent_at) >= REMINDER.afterConfirmedMs;
            return now >= from && now < to && settled ? "reminder" : null;
        }
        case "NOT_NEEDED": {
            const offer = sent("offer");
            return !sent("not_needed") && offer?.said_yes ? "not_needed" : null;
        }
        default:
            return null;
    }
}
function blockingMember(c) {
    const created = (m) => ms(m.createdAt ?? null);
    const earlier = (m) => created(m) < created(c.member) || (created(m) === created(c.member) && m.id < c.member.id);
    return (c.others.find((m) => m.id !== c.member.id && m.personId === c.member.personId && OPEN.includes(m.status) && earlier(m)) ?? null);
}
function planMember(c) {
    const due = dueMessage(c);
    if (due === "no_reply")
        return { kind: "no_reply" };
    if (!due)
        return { kind: "wait", note: c.member.messageNote ?? null };
    const p = c.person;
    if (!p)
        return { kind: "wait", note: "Pick the worker (Person) on this crew member" };
    if (!c.request)
        return { kind: "wait", note: "Pick the crew request on this crew member" };
    if (p.workerStatus === "DO_NOT_CONTACT")
        return { kind: "wait", note: "Do not contact: no message sent" };
    if (p.workerStatus === "NOT_AVAILABLE" && due === "offer")
        return { kind: "wait", note: "Marked not available: no invite sent" };
    if (!p.consentedAt)
        return { kind: "wait", note: "No consent on record (they have not applied on the website): call them instead" };
    const phone = personPhone(p);
    if (!phone)
        return { kind: "wait", note: "No Indian mobile number on the person" };
    if (due === "offer") {
        const other = blockingMember(c);
        if (other) {
            return {
                kind: "wait",
                note: other.opportunityId === c.member.opportunityId
                    ? "Already on this crew request (another crew member record)"
                    : "Already has an open interview invite on another crew request: one at a time",
            };
        }
    }
    const missing = missingFields(due, c.request);
    if (missing.length)
        return { kind: "wait", note: `Fill in on the crew request: ${missing.join(", ")}` };
    const reference = c.reference?.trim() ?? "";
    if ((due === "offer" || due === "not_needed") && !reference) {
        return { kind: "wait", note: "No job application on record for this worker: call them instead" };
    }
    const locale = crewLocale(p.language);
    const key = templateKey(due, due === "offer" && !!stayText(c.request, locale));
    const templateId = (c.templates ?? CREW_TEMPLATES)[key][locale];
    if (!templateId || c.canSend === false)
        return { kind: "wait", note: `WhatsApp template not approved yet (${key}, ${locale})` };
    if (due !== "reminder" && !c.test) {
        const [from, to] = SEND_HOURS[due];
        const hour = istHour(c.now);
        if (hour < from || hour >= to)
            return { kind: "wait", note: `Waiting for ${from}:00 to send (no messages ${to}:00 to ${from}:00)` };
    }
    return { kind: "send", message: due, locale, templateId, values: templateValues(due, c.request, locale, reference), phone };
}
const YES_WORDS = new Set([
    "yes", "y", "yeah", "yep", "ok", "okay", "haan", "han", "haa", "ha", "hn", "hanji", "haanji", "ji", "jee", "theek", "thik", "sure", "coming",
    "हाँ", "हां", "हा", "जी", "हाँजी", "ठीक", "ਹਾਂ", "ਜੀ", "ಹೌದು", "1",
]);
const NO_WORDS = new Set([
    "no", "n", "nope", "nahi", "nahin", "nai", "nhi", "na", "cant", "cannot", "not",
    "नहीं", "नही", "ना", "ਨਹੀਂ", "ਨਹੀ", "ಇಲ್ಲ", "2",
]);
const asciiDigits = (s) => s.replace(/[०-९੦-੯೦-೯]/g, (ch) => {
    const cp = ch.codePointAt(0);
    return String(cp - (cp >= 0x0ce6 ? 0x0ce6 : cp >= 0x0a66 ? 0x0a66 : 0x0966));
});
function normaliseReply(text) {
    return asciiDigits(text.normalize("NFC").toLowerCase())
        .replace(/[’'`]/g, "")
        .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
        .trim();
}
const BUTTONS = new Map(CREW_TEMPLATE_TEXT.flatMap((t) => (t.buttons ? [[normaliseReply(t.buttons[0]), "yes"], [normaliseReply(t.buttons[1]), "no"]] : [])));
function interpretReply(text, buttons = BUTTONS) {
    const n = normaliseReply(text);
    if (!n)
        return "other";
    const tapped = buttons.get(n);
    if (tapped)
        return tapped;
    const words = n.split(" ");
    const sayNo = words.some((w) => NO_WORDS.has(w));
    if (NO_WORDS.has(words[0]))
        return "no";
    if (YES_WORDS.has(words[0]) && !sayNo)
        return "yes";
    return "other";
}
function statusAfterReply(kind, answer, current) {
    if (kind === "offer") {
        if (answer === "yes" && (current === "OFFERED" || current === "NO_REPLY"))
            return "SAID_YES";
        if (answer === "no" && (current === "OFFERED" || current === "NO_REPLY" || current === "SAID_YES"))
            return "SAID_NO";
    }
    if (kind === "reminder" && answer === "no" && current === "CONFIRMED")
        return "CANT_COME";
    return null;
}
function crewDeliveryStatus(status, delivery) {
    if (status === "accepted")
        return delivery === "read" ? "READ" : delivery === "delivered" ? "DELIVERED" : delivery === "failed" ? "FAILED" : "SENT";
    return status === "failed" ? "FAILED" : status === "unknown" ? "UNKNOWN" : "QUEUED";
}
const KIND_LABEL = { offer: "interview invite", confirmed: "interview details", reminder: "interview reminder", not_needed: "interviews full" };
const kindLabel = (kind) => KIND_LABEL[kind];
const SENT_FIELD = { offer: "offerSentAt", confirmed: "confirmationSentAt", reminder: "reminderSentAt" };
function noteAfterSend(kind, status, delivery) {
    const what = kind === "offer" ? "interview invite" : kind === "confirmed" ? "interview details" : kind === "reminder" ? "reminder" : "interviews-full message";
    if (status === "failed" || delivery === "failed")
        return `The WhatsApp ${what} did not reach them: call them`;
    if (status === "unknown")
        return `The WhatsApp ${what} may not have gone: call them`;
    return null;
}
  return { CREW_STATUSES, WATCHED_STATUSES, istHour, formatDay, formatTime, stayText, missingFields, templateValues, personPhone, personName, SEND_HOURS, REMINDER, NO_REPLY_AFTER_MS, TEST_REMINDER_AFTER_MS, planMember, normaliseReply, interpretReply, statusAfterReply, crewDeliveryStatus, kindLabel, SENT_FIELD, noteAfterSend };
})();

// integrations/windmill/talent/lib/sql.ts
const { RETENTION_MONTHS, SAVE_SUBMISSION, CLAIM_ACKNOWLEDGEMENT, CLAIM_ACKNOWLEDGEMENT_FOR, RECOVER_INTERRUPTED_SENDS, SAVE_ACKNOWLEDGEMENT_RESULT, GET_ACKNOWLEDGEMENT, SKIP_WHATSAPP, CLAIM_WHATSAPP_ACK, SAVE_WHATSAPP_RESULT, RECOVER_WHATSAPP_SEND, SAVE_WHATSAPP_REPORT, SKIP_SMS, QUEUE_EXPIRED_AND_RECOVER, CLAIM_ERASURE, DELETE_ROWS, schemaStatements, CRM_SYNC_LOCK, SYNC_CANDIDATES, RECORD_CRM_SYNC, SAVE_DELIVERY_REPORT, DELIVERY_CHECK_DUE, MARK_DELIVERY_CHECKED, DISPATCH_LOCK, RECOVER_STUCK_DISPATCH, CLAIM_DELIVERY, FINISH_DELIVERY, LEGACY_STATUS, SYNC_CANDIDATE_FOR, ERASURE_DISPATCH_LOCK, ERASURE_DISPATCH_UNLOCK, FILES_SUBMISSION, FILES_FOR, SAVE_FILE_ID, SETTLE_FILE, FILE_ERROR, CLEAR_FILE_ID } = (() => {
const RETENTION_MONTHS = 12;
const SAVE_SUBMISSION = `
WITH s AS (
  INSERT INTO submissions (ref, source, locale, phone, consent_version, consented_at, adult, text, role, hub, channel, agent_name, form, applicant_name, answers, cluster, page_cluster, page_path)
  VALUES ($1, $2, $3, $4, $5, $6::timestamptz, true, $7, $9, $10, $11, $12, $13, $14, $15::jsonb, $16, $17, $18)
  ON CONFLICT (ref) DO NOTHING
  RETURNING id
), ack AS (
  INSERT INTO sms_acknowledgements (submission_id)
  SELECT id FROM s
  RETURNING 1
), person AS (
  -- The worker list (PLAN §8.2): an application is the person reaching us,
  -- so it renews last_contact_at. Lists merge; the newest name and language win.
  INSERT INTO people (phone, name, clusters, home_area, roles, locale, consent_version, last_applied_at, last_contact_at)
  SELECT $4, $14,
         CASE WHEN $16::text IS NULL THEN '{}'::text[] ELSE ARRAY[$16::text] END,
         -- Where they live: the exact place when they picked one (answers.home), else the area answer.
         coalesce($15::jsonb #>> '{home,0}', $15::jsonb #>> '{area,0}'),
         ARRAY(SELECT DISTINCT r FROM unnest(array_remove(ARRAY[$9::text], NULL) || ARRAY(SELECT jsonb_array_elements_text(coalesce($15::jsonb -> 'work', '[]'::jsonb)))) AS r),
         $3, $5, now(), now()
  FROM s
  ON CONFLICT (phone) DO UPDATE SET
    name = coalesce(EXCLUDED.name, people.name),
    clusters = ARRAY(SELECT DISTINCT c FROM unnest(people.clusters || EXCLUDED.clusters) AS c),
    home_area = coalesce(EXCLUDED.home_area, people.home_area),
    roles = ARRAY(SELECT DISTINCT r FROM unnest(people.roles || EXCLUDED.roles) AS r),
    locale = EXCLUDED.locale,
    consent_version = EXCLUDED.consent_version,
    status = CASE WHEN people.status = 'do-not-contact' THEN 'active' ELSE people.status END,
    last_applied_at = now(),
    last_contact_at = now(),
    updated_at = now()
  RETURNING 1
), a AS (
  INSERT INTO attachments (submission_id, position, kind, r2_key, mime, size_bytes, original_name, transcript_status)
  SELECT s.id, (x->>'position')::int, x->>'kind', x->>'key', x->>'mime', (x->>'size')::int, x->>'name',
         CASE WHEN x->>'kind' = 'audio' THEN 'pending' ELSE 'none' END
  FROM s, jsonb_array_elements($8::jsonb) AS x
  RETURNING 1
)
SELECT (SELECT id FROM s) AS submission_id, (SELECT count(*) FROM a) AS attachments, (SELECT count(*) FROM ack) AS acknowledgements, (SELECT count(*) FROM person) AS people;`;
const claimAcknowledgement = (filter) => `
WITH candidate AS (
  SELECT a.submission_id FROM sms_acknowledgements a
  JOIN submissions s ON s.id = a.submission_id
  WHERE a.status = 'pending' AND a.next_attempt_at <= now() AND a.attempts < 3 AND ${filter}
  ORDER BY a.created_at LIMIT 1 FOR UPDATE OF a SKIP LOCKED
), claimed AS (
  UPDATE sms_acknowledgements a SET status = 'sending', attempts = attempts + 1, updated_at = now()
  FROM candidate c WHERE a.submission_id = c.submission_id RETURNING a.*
)
SELECT c.submission_id, c.attempts, s.ref, s.phone FROM claimed c
JOIN submissions s ON s.id = c.submission_id;`;
const CLAIM_ACKNOWLEDGEMENT = claimAcknowledgement("true");
const CLAIM_ACKNOWLEDGEMENT_FOR = claimAcknowledgement("s.id = $1::uuid");
const RECOVER_INTERRUPTED_SENDS = `
UPDATE sms_acknowledgements SET status = 'unknown',
  last_error = 'Interrupted send; check Fast2SMS delivery history before retrying', updated_at = now()
WHERE status = 'sending' AND updated_at < now() - interval '5 minutes';`;
const SAVE_ACKNOWLEDGEMENT_RESULT = `
UPDATE sms_acknowledgements
SET status = $2, request_id = $3, last_error = $4,
    accepted_at = CASE WHEN $2 = 'accepted' THEN now() ELSE accepted_at END,
    next_attempt_at = now() + interval '1 minute', updated_at = now()
WHERE submission_id = $1::uuid AND status = 'sending'
RETURNING submission_id, status;`;
const GET_ACKNOWLEDGEMENT = `
SELECT a.status, a.wa_status, a.wa_request_id, a.wa_sent_at, a.wa_delivery, a.wa_updated_at, s.ref, s.phone, s.locale
FROM sms_acknowledgements a JOIN submissions s ON s.id = a.submission_id
WHERE a.submission_id = $1::uuid;`;
const SKIP_WHATSAPP = `
UPDATE sms_acknowledgements SET wa_status = 'skipped', wa_error = $2, wa_updated_at = now(), updated_at = now()
WHERE submission_id = $1::uuid AND wa_status IS NULL;`;
const CLAIM_WHATSAPP_ACK = `
UPDATE sms_acknowledgements SET wa_status = 'sending', wa_updated_at = now(), updated_at = now()
WHERE submission_id = $1::uuid AND wa_status IS NULL AND status = 'pending'
RETURNING submission_id;`;
const SAVE_WHATSAPP_RESULT = `
UPDATE sms_acknowledgements
SET wa_status = $2, wa_request_id = $3, wa_error = $4,
    wa_sent_at = CASE WHEN $2 = 'accepted' THEN now() ELSE wa_sent_at END,
    wa_updated_at = now(), updated_at = now()
WHERE submission_id = $1::uuid AND wa_status = 'sending';`;
const RECOVER_WHATSAPP_SEND = `
UPDATE sms_acknowledgements
SET wa_status = 'unknown', wa_error = 'Interrupted WhatsApp send; the SMS goes instead', wa_updated_at = now(), updated_at = now()
WHERE submission_id = $1::uuid AND wa_status = 'sending';`;
const SAVE_WHATSAPP_REPORT = `
UPDATE sms_acknowledgements
SET wa_delivery = $2, wa_detail = $3,
    wa_delivered_at = CASE WHEN $2 IN ('delivered', 'read') THEN coalesce(wa_delivered_at, $4::timestamptz, now()) ELSE wa_delivered_at END,
    wa_updated_at = now(), updated_at = now()
WHERE submission_id = $1::uuid AND wa_status = 'accepted'
  AND wa_delivery IS DISTINCT FROM 'read'
  AND (wa_delivery IS DISTINCT FROM 'delivered' OR $2 = 'read');`;
const SKIP_SMS = `
UPDATE sms_acknowledgements SET status = 'skipped', last_error = NULL, updated_at = now()
WHERE submission_id = $1::uuid AND status = 'pending';`;
const EXPIRED_PHONES = `
  SELECT p.phone FROM people p
  WHERE greatest(coalesce(p.last_contact_at, p.created_at), coalesce(p.last_confirmed_at, p.created_at)) < now() - interval '${RETENTION_MONTHS} months'
  UNION
  -- Submissions from before the people table, with no row of their own.
  SELECT s.phone FROM submissions s
  WHERE NOT EXISTS (SELECT 1 FROM people p WHERE p.phone = s.phone)
  GROUP BY s.phone HAVING max(s.created_at) < now() - interval '${RETENTION_MONTHS} months'`;
const QUEUE_EXPIRED_AND_RECOVER = `
WITH recovered AS (
  UPDATE erasure_requests
  SET status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'pending' END,
      last_error = coalesce(last_error, 'Interrupted; retried'), updated_at = now()
  WHERE status = 'running' AND updated_at < now() - interval '1 hour'
  RETURNING id
), expired AS (${EXPIRED_PHONES}
), withdrawn AS (
  -- Queued for retention, then applied or confirmed again: no longer due.
  DELETE FROM erasure_requests
  WHERE status = 'pending' AND reason = 'retention' AND phone NOT IN (SELECT phone FROM expired)
  RETURNING id
), queued AS (
  INSERT INTO erasure_requests (phone, reason)
  SELECT phone, 'retention' FROM expired
  ON CONFLICT (phone) WHERE status IN ('pending', 'running') DO NOTHING
  RETURNING id
)
SELECT (SELECT count(*) FROM recovered) AS recovered, (SELECT count(*) FROM queued) AS queued;`;
const CLAIM_ERASURE = `
WITH claimed AS (
  UPDATE erasure_requests e
  SET status = 'running', attempts = e.attempts + 1, last_error = NULL, updated_at = now()
  WHERE e.id = (
    SELECT id FROM erasure_requests
    WHERE status = 'pending' AND phone IS NOT NULL
      AND (reason = 'request' OR phone IN (${EXPIRED_PHONES}))
    ORDER BY reason = 'request' DESC, requested_at LIMIT 1 FOR UPDATE SKIP LOCKED)
  RETURNING e.id, e.phone, e.reason
)
SELECT c.id, c.phone, c.reason,
  coalesce((SELECT jsonb_agg(s.id) FROM submissions s WHERE s.phone = c.phone), '[]'::jsonb) AS submissions,
  coalesce((SELECT jsonb_agg(a.r2_key) FROM attachments a JOIN submissions s ON s.id = a.submission_id WHERE s.phone = c.phone), '[]'::jsonb) AS files
FROM claimed c;`;
const DELETE_ROWS = `
WITH gone AS (
  DELETE FROM submissions WHERE phone = $2 AND id = ANY($5::uuid[]) RETURNING id
), crew AS (
  DELETE FROM crew_messages WHERE phone = $2
    AND NOT EXISTS (SELECT 1 FROM submissions s WHERE s.phone = $2 AND s.id <> ALL($5::uuid[]))
  RETURNING 1
), person AS (
  DELETE FROM people WHERE phone = $2
    AND NOT EXISTS (SELECT 1 FROM submissions s WHERE s.phone = $2 AND s.id <> ALL($5::uuid[]))
  RETURNING 1
)
UPDATE erasure_requests
SET status = 'done', processed_at = now(), updated_at = now(),
    removed_submissions = (SELECT count(*) FROM gone), removed_files = $3::int,
    removed_crm_files = $4::int, phone = NULL, ref = NULL
WHERE id = $1::uuid AND status = 'running'
RETURNING id, status, removed_submissions;`;
const schemaStatements = (schema) => schema.replace(/^--.*\n/gm, "");
const CRM_SYNC_LOCK = `SELECT pg_try_advisory_lock(hashtext('talent:crm_sync')) AS locked;`;
const SYNC_CANDIDATES = `
SELECT s.id, s.ref, s.source, s.channel, s.locale, s.phone, s.consent_version, s.consented_at, s.text, s.role,
       s.cluster, s.answers, s.page_path, s.applicant_name, s.created_at,
       p.name AS person_name, p.clusters AS person_clusters, p.roles AS person_roles, p.home_area,
       p.locale AS person_locale, p.status AS person_status, p.last_applied_at, p.last_contact_at, p.last_confirmed_at,
       a.status AS ack_status, a.request_id, a.last_error AS ack_error, a.accepted_at, a.updated_at AS ack_updated_at,
       a.delivery_status, a.delivery_detail, a.delivered_at,
       a.wa_status, a.wa_request_id, a.wa_error, a.wa_sent_at, a.wa_delivery, a.wa_detail, a.wa_delivered_at, a.wa_updated_at,
       c.person_id, c.application_id, c.ack_status AS synced_ack_status, (c.submission_id IS NOT NULL) AS synced
FROM submissions s
LEFT JOIN people p ON p.phone = s.phone
LEFT JOIN sms_acknowledgements a ON a.submission_id = s.id
LEFT JOIN crm_sync c ON c.submission_id = s.id
WHERE c.submission_id IS NULL
   OR c.ack_status IS DISTINCT FROM nullif(concat_ws(':', a.status, a.delivery_status, a.wa_status, a.wa_delivery), '')
ORDER BY s.created_at
LIMIT $1;`;
const RECORD_CRM_SYNC = `
INSERT INTO crm_sync (submission_id, person_id, application_id, ack_status, synced_at)
VALUES ($1::uuid, $2::uuid, $3::uuid, $4, now())
ON CONFLICT (submission_id) DO UPDATE
SET person_id = EXCLUDED.person_id, application_id = EXCLUDED.application_id, ack_status = EXCLUDED.ack_status, synced_at = now();`;
const SAVE_DELIVERY_REPORT = `
UPDATE sms_acknowledgements
SET delivery_status = $2, delivery_detail = $3,
    delivered_at = CASE WHEN $2 = 'delivered' THEN coalesce($4::timestamptz, delivered_at, now()) ELSE delivered_at END,
    delivery_checked_at = now(), updated_at = now()
WHERE request_id = $1 AND status = 'accepted'
  AND (delivery_status IS DISTINCT FROM 'delivered' OR $2 = 'delivered')
RETURNING submission_id;`;
const DELIVERY_CHECK_DUE = `
SELECT submission_id, request_id
FROM sms_acknowledgements
WHERE status = 'accepted' AND request_id IS NOT NULL
  AND (delivery_status IS NULL OR delivery_status = 'pending')
  AND accepted_at < now() - interval '10 minutes'
  AND accepted_at > now() - interval '7 days'
  AND (delivery_checked_at IS NULL OR delivery_checked_at < now() - interval '1 hour')
ORDER BY accepted_at
LIMIT $1;`;
const MARK_DELIVERY_CHECKED = `UPDATE sms_acknowledgements SET delivery_checked_at = now() WHERE submission_id = $1::uuid;`;
const DISPATCH_LOCK = `SELECT pg_try_advisory_lock(hashtext('talent:dispatch')) AS locked;`;
const RECOVER_STUCK_DISPATCH = `
UPDATE deliveries
SET status = CASE WHEN target = 'sms' THEN 'unknown' WHEN attempts >= max_attempts THEN 'dead' ELSE 'pending' END,
    last_error = coalesce(last_error, 'Interrupted; picked up again by the dispatcher'),
    next_attempt_at = now(), updated_at = now()
WHERE status = 'running' AND updated_at < now() - interval '15 minutes'
RETURNING submission_id, target, status;`;
const CLAIM_DELIVERY = `
WITH c AS (
  SELECT submission_id, target FROM deliveries d
  WHERE target = $1 AND status = 'pending' AND next_attempt_at <= now()
    AND ($2::uuid IS NULL OR submission_id = $2::uuid)
    AND ($1 <> 'files' OR EXISTS (
      SELECT 1 FROM crm_sync cs WHERE cs.submission_id = d.submission_id AND cs.application_id IS NOT NULL))
  ORDER BY next_attempt_at, created_at LIMIT 1 FOR UPDATE SKIP LOCKED
)
UPDATE deliveries d SET status = 'running', attempts = d.attempts + 1, updated_at = now()
FROM c WHERE d.submission_id = c.submission_id AND d.target = c.target
RETURNING d.submission_id, d.target, d.attempts, d.max_attempts;`;
const FINISH_DELIVERY = `
UPDATE deliveries
SET status = CASE WHEN $3 = 'retry' THEN (CASE WHEN attempts >= max_attempts THEN 'dead' ELSE 'pending' END)
                  WHEN $3 = 'wait' THEN 'pending' ELSE $3 END,
    attempts = CASE WHEN $3 = 'wait' THEN greatest(attempts - 1, 0) ELSE attempts END,
    next_attempt_at = CASE WHEN $3 IN ('retry', 'wait') THEN now() + make_interval(secs => $5::int) ELSE next_attempt_at END,
    last_error = $4,
    done_at = CASE WHEN $3 = 'done' THEN now() ELSE done_at END,
    updated_at = now()
WHERE submission_id = $1::uuid AND target = $2 AND status = 'running'
RETURNING status;`;
const LEGACY_STATUS = `
SELECT a.status AS sms, a.attempts AS sms_attempts, (c.submission_id IS NOT NULL) AS crm_synced
FROM submissions s
LEFT JOIN sms_acknowledgements a ON a.submission_id = s.id
LEFT JOIN crm_sync c ON c.submission_id = s.id
WHERE s.id = $1::uuid;`;
const SYNC_CANDIDATE_FOR = SYNC_CANDIDATES.replace(/WHERE c\.submission_id IS NULL\n {3}OR c\.ack_status IS DISTINCT FROM nullif\(concat_ws\(':', a\.status, a\.delivery_status, a\.wa_status, a\.wa_delivery\), ''\)\nORDER BY s\.created_at\nLIMIT \$1;/, "WHERE s.id = $1::uuid;");
if (SYNC_CANDIDATE_FOR === SYNC_CANDIDATES)
    throw new Error("SYNC_CANDIDATE_FOR: the WHERE clause was not replaced");
const ERASURE_DISPATCH_LOCK = DISPATCH_LOCK;
const ERASURE_DISPATCH_UNLOCK = `SELECT pg_advisory_unlock(hashtext('talent:dispatch')) AS unlocked;`;
const FILES_SUBMISSION = `
SELECT s.id, s.ref, c.application_id
FROM submissions s LEFT JOIN crm_sync c ON c.submission_id = s.id
WHERE s.id = $1::uuid;`;
const FILES_FOR = `
SELECT id, position, kind, r2_key, mime, size_bytes, twenty_file_id, twenty_attachment_id, crm_file_status
FROM attachments WHERE submission_id = $1::uuid ORDER BY position;`;
const SAVE_FILE_ID = `UPDATE attachments SET twenty_file_id = $2::uuid, crm_file_error = NULL, updated_at = now() WHERE id = $1::uuid;`;
const SETTLE_FILE = `
UPDATE attachments
SET crm_file_status = $2, twenty_attachment_id = coalesce($3::uuid, twenty_attachment_id),
    twenty_file_id = coalesce($4::uuid, twenty_file_id), crm_file_error = $5, crm_file_at = now(), updated_at = now()
WHERE id = $1::uuid;`;
const FILE_ERROR = `UPDATE attachments SET crm_file_error = $2, updated_at = now() WHERE id = $1::uuid;`;
const CLEAR_FILE_ID = `UPDATE attachments SET twenty_file_id = NULL, updated_at = now() WHERE id = $1::uuid;`;
  return { RETENTION_MONTHS, SAVE_SUBMISSION, CLAIM_ACKNOWLEDGEMENT, CLAIM_ACKNOWLEDGEMENT_FOR, RECOVER_INTERRUPTED_SENDS, SAVE_ACKNOWLEDGEMENT_RESULT, GET_ACKNOWLEDGEMENT, SKIP_WHATSAPP, CLAIM_WHATSAPP_ACK, SAVE_WHATSAPP_RESULT, RECOVER_WHATSAPP_SEND, SAVE_WHATSAPP_REPORT, SKIP_SMS, QUEUE_EXPIRED_AND_RECOVER, CLAIM_ERASURE, DELETE_ROWS, schemaStatements, CRM_SYNC_LOCK, SYNC_CANDIDATES, RECORD_CRM_SYNC, SAVE_DELIVERY_REPORT, DELIVERY_CHECK_DUE, MARK_DELIVERY_CHECKED, DISPATCH_LOCK, RECOVER_STUCK_DISPATCH, CLAIM_DELIVERY, FINISH_DELIVERY, LEGACY_STATUS, SYNC_CANDIDATE_FOR, ERASURE_DISPATCH_LOCK, ERASURE_DISPATCH_UNLOCK, FILES_SUBMISSION, FILES_FOR, SAVE_FILE_ID, SETTLE_FILE, FILE_ERROR, CLEAR_FILE_ID };
})();

// integrations/windmill/talent/lib/crew-sql.ts
const { CREW_LOCK, CREW_UNLOCK, CREW_LEDGER, CLAIM_CREW_MESSAGE, SAVE_CREW_SEND, RECOVER_CREW_SENDING, CREW_REPORTS_DUE, CREW_REPORT_CHECKED, SAVE_CREW_REPORT, CREW_CRM_STATE, CREW_CRM_DUE, MARK_CREW_CRM, OPEN_CREW_MESSAGE, SAVE_CREW_REPLY, CREW_REPLIES_DUE, CREW_REPLY_DONE, CREW_REPLY_FAILED } = (() => {
const CREW_LOCK = DISPATCH_LOCK;
const CREW_UNLOCK = ERASURE_DISPATCH_UNLOCK;
const CREW_LEDGER = `
SELECT m.id, m.crew_member_id, m.kind, m.status, m.sent_at, m.delivery,
       EXISTS (SELECT 1 FROM crew_replies r WHERE r.message_id = m.id) AS replied,
       EXISTS (SELECT 1 FROM crew_replies r WHERE r.message_id = m.id AND r.answer = 'yes') AS said_yes
FROM crew_messages m
WHERE m.crew_member_id = ANY($1::uuid[]);`;
const CLAIM_CREW_MESSAGE = `
INSERT INTO crew_messages (crew_member_id, kind, phone, person_id, opportunity_id, locale, template_id, variables)
VALUES ($1::uuid, $2, $3, $4::uuid, $5::uuid, $6, $7::int, $8::jsonb)
ON CONFLICT (crew_member_id, kind) DO NOTHING
RETURNING id;`;
const SAVE_CREW_SEND = `
UPDATE crew_messages
SET status = $2, request_id = $3, error = $4,
    sent_at = CASE WHEN $2 = 'accepted' THEN now() ELSE sent_at END, updated_at = now()
WHERE id = $1::uuid AND status = 'sending';`;
const RECOVER_CREW_SENDING = `
UPDATE crew_messages
SET status = 'unknown', error = 'Interrupted while sending: it may or may not have gone', updated_at = now()
WHERE status = 'sending' AND updated_at < now() - interval '5 minutes';`;
const CREW_REPORTS_DUE = `
SELECT id, request_id
FROM crew_messages
WHERE status = 'accepted' AND request_id IS NOT NULL
  AND (delivery IS NULL OR delivery IN ('pending', 'delivered'))
  AND sent_at > now() - interval '2 days'
  AND (checked_at IS NULL
       OR (sent_at > now() - interval '30 minutes' AND checked_at < now() - interval '50 seconds')
       OR checked_at < now() - interval '15 minutes')
ORDER BY checked_at NULLS FIRST, sent_at
LIMIT $1;`;
const CREW_REPORT_CHECKED = `UPDATE crew_messages SET checked_at = now() WHERE id = $1::uuid;`;
const SAVE_CREW_REPORT = `
UPDATE crew_messages
SET delivery = $2, delivery_detail = $3, checked_at = now(),
    delivered_at = CASE WHEN $2 IN ('delivered', 'read') THEN coalesce(delivered_at, $4::timestamptz, now()) ELSE delivered_at END,
    updated_at = now()
WHERE id = $1::uuid AND status = 'accepted'
  AND delivery IS DISTINCT FROM 'read'
  AND (delivery IS DISTINCT FROM 'delivered' OR $2 = 'read');`;
const CREW_CRM_STATE = `concat_ws(':', m.status, m.delivery)`;
const CREW_CRM_DUE = `
SELECT m.id, m.crew_member_id, m.kind, m.person_id, m.opportunity_id, m.locale, m.template_id, m.variables,
       m.status, m.request_id, m.error, m.sent_at, m.delivery, m.delivery_detail, m.delivered_at,
       m.communication_id, m.updated_at, ${CREW_CRM_STATE} AS state
FROM crew_messages m
WHERE m.status <> 'sending' AND m.crm_state IS DISTINCT FROM ${CREW_CRM_STATE}
ORDER BY m.updated_at
LIMIT $1;`;
const MARK_CREW_CRM = `
UPDATE crew_messages m SET communication_id = $2::uuid, crm_state = $3
WHERE m.id = $1::uuid AND ${CREW_CRM_STATE} = $3;`;
const OPEN_CREW_MESSAGE = `
SELECT id, kind, crew_member_id
FROM crew_messages
WHERE phone = $1 AND status = 'accepted' AND sent_at > now() - interval '7 days'
ORDER BY sent_at DESC
LIMIT 1;`;
const SAVE_CREW_REPLY = `
WITH saved AS (
  INSERT INTO crew_replies (key, phone, message_id, answer, message_type, body)
  VALUES ($1, $2, $3::uuid, $4, $5, $6)
  ON CONFLICT (key) DO NOTHING
  RETURNING key
), renewed AS (
  UPDATE people SET last_contact_at = now(), updated_at = now()
  WHERE phone = $2 AND EXISTS (SELECT 1 FROM saved)
  RETURNING 1
)
SELECT key FROM saved;`;
const CREW_REPLIES_DUE = `
SELECT r.key, r.phone, r.answer, r.message_type, r.body, r.received_at, r.attempts,
       m.id AS message_id, m.kind, m.crew_member_id, m.person_id, m.opportunity_id
FROM crew_replies r JOIN crew_messages m ON m.id = r.message_id
WHERE r.status = 'pending'
ORDER BY r.received_at
LIMIT $1;`;
const CREW_REPLY_DONE = `
UPDATE crew_replies SET status = 'done', applied_at = now(), body = NULL, last_error = NULL WHERE key = $1;`;
const CREW_REPLY_FAILED = `
UPDATE crew_replies
SET attempts = attempts + 1, last_error = $2,
    status = CASE WHEN attempts + 1 >= 8 THEN 'failed' ELSE status END,
    body = CASE WHEN attempts + 1 >= 8 THEN NULL ELSE body END
WHERE key = $1;`;
  return { CREW_LOCK, CREW_UNLOCK, CREW_LEDGER, CLAIM_CREW_MESSAGE, SAVE_CREW_SEND, RECOVER_CREW_SENDING, CREW_REPORTS_DUE, CREW_REPORT_CHECKED, SAVE_CREW_REPORT, CREW_CRM_STATE, CREW_CRM_DUE, MARK_CREW_CRM, OPEN_CREW_MESSAGE, SAVE_CREW_REPLY, CREW_REPLIES_DUE, CREW_REPLY_DONE, CREW_REPLY_FAILED };
})();

// integrations/windmill/talent/lib/notify-application.ts
const { TWENTY_APP_URL, CLUSTER_LABELS, roleLabel, areaLabel, clusterLabel, applicationEvent } = (() => {
const TWENTY_APP_URL = "https://crm.vayasyaseva.com";
const CLUSTER_LABELS = {
    haridwar: "Haridwar",
    uttarakhand: "Uttarakhand",
    "delhi-ncr": "Delhi NCR",
    bengaluru: "Bengaluru",
    jalandhar: "Jalandhar",
    saharanpur: "Saharanpur",
    punjab: "Punjab",
    dehradun: "Dehradun",
    kapurthala: "Kapurthala",
    visakhapatnam: "Visakhapatnam",
    "andhra-pradesh": "Andhra Pradesh",
    hyderabad: "Hyderabad",
    telangana: "Telangana",
    other: "other area",
};
const LANGUAGE_LABELS = {
    en: "English",
    "en-IN": "English",
    hi: "Hindi",
    "hi-IN": "Hindi",
    hinglish: "Hinglish",
    "hi-Latn-IN": "Hinglish",
    "pa-IN": "Punjabi",
    "kn-IN": "Kannada",
};
const has = (table, key) => typeof key === "string" && Object.hasOwn(table, key);
const firstAnswer = (c, question) => {
    const value = c.answers?.[question];
    return Array.isArray(value) && typeof value[0] === "string" ? value[0] : null;
};
function roleLabel(c) {
    if (has(JOB_ROLES, c.role))
        return JOB_ROLES[c.role];
    const work = firstAnswer(c, "work");
    if (has(QUICK_ANSWERS.work, work))
        return QUICK_ANSWERS.work[work];
    return "any work";
}
function areaLabel(c) {
    const home = firstAnswer(c, "home");
    if (has(QUICK_ANSWERS.home, home))
        return `lives in ${QUICK_ANSWERS.home[home]}`;
    const area = firstAnswer(c, "area");
    return has(QUICK_ANSWERS.area, area) ? QUICK_ANSWERS.area[area] : null;
}
const clusterLabel = (cluster) => (cluster && has(CLUSTER_LABELS, cluster) ? CLUSTER_LABELS[cluster] : "no area");
function formLabel(c) {
    if (c.channel === "agent")
        return "AI agent";
    if (c.channel === "whatsapp")
        return "WhatsApp chat";
    if (c.answers && Object.keys(c.answers).length)
        return "quick form";
    if (c.source === "web" || c.source.startsWith("web_"))
        return "website form";
    return c.source;
}
function applicationEvent(c, personId) {
    const role = roleLabel(c);
    const cluster = clusterLabel(c.cluster);
    const area = areaLabel(c);
    const language = LANGUAGE_LABELS[c.person_locale ?? c.locale] ?? LANGUAGE_LABELS[c.locale] ?? c.locale;
    const name = (c.applicant_name ?? c.person_name ?? "").trim();
    return {
        source: "talent",
        type: "application.received",
        severity: "info",
        dedupeKey: `application:${c.ref}`,
        title: `New job application: ${role}, ${cluster}`,
        summary: [c.ref, role, area, cluster, formLabel(c), language].filter(Boolean).join(" · "),
        link: { label: "View in Twenty", url: `${TWENTY_APP_URL}/object/person/${encodeURIComponent(personId)}` },
        pii: { ...(name ? { name } : {}), phone: c.phone },
    };
}
  return { TWENTY_APP_URL, CLUSTER_LABELS, roleLabel, areaLabel, clusterLabel, applicationEvent };
})();

// integrations/windmill/talent/lib/twenty.ts
const { isIn, findEvery, eq, twentyClient, twentyFromConfig, TwentyGraphqlError, inClusterUploadUrl, twentyFilesClient, twentyFilesFromConfig } = (() => {
const isIn = (field, values) => `${field}[in]:${JSON.stringify(values)}`;
async function findEvery(crm, plural, filter, max = 600) {
    if (!crm.findPage)
        return crm.find(plural, filter);
    const out = [];
    let after = null;
    do {
        const page = await crm.findPage(plural, filter, after);
        out.push(...page.records);
        after = page.next;
    } while (after && out.length < max);
    return out;
}
const eq = (field, value) => `${field}[eq]:${JSON.stringify(value)}`;
function twentyClient(baseUrl, apiKey, fetchImpl = fetch) {
    const base = baseUrl.replace(/\/$/, "");
    async function call(method, path, body) {
        const res = await fetchImpl(`${base}/rest${path}`, {
            method,
            headers: { authorization: `Bearer ${apiKey}`, ...(body === undefined ? {} : { "content-type": "application/json" }) },
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: AbortSignal.timeout(30_000),
        });
        const text = await res.text();
        let json = null;
        try {
            json = text ? JSON.parse(text) : null;
        }
        catch { }
        if (!res.ok && !(method === "DELETE" && res.status === 404)) {
            const messages = json?.messages?.join("; ") ?? text.slice(0, 200);
            throw new Error(`Twenty ${method} ${path.split("?")[0]}: HTTP ${res.status} ${messages}`);
        }
        return { status: res.status, json };
    }
    return {
        async find(plural, filter) {
            const { json } = await call("GET", `/${plural}?limit=60&filter=${encodeURIComponent(filter)}`);
            return (json.data[plural] ?? []);
        },
        async findPage(plural, filter, after) {
            const cursor = after ? `&starting_after=${encodeURIComponent(after)}` : "";
            const { json } = await call("GET", `/${plural}?limit=60&filter=${encodeURIComponent(filter)}${cursor}`);
            const body = json;
            const records = (body.data[plural] ?? []);
            return { records, next: body.pageInfo?.hasNextPage && body.pageInfo.endCursor ? body.pageInfo.endCursor : null };
        },
        async create(plural, singular, body) {
            const { json } = await call("POST", `/${plural}`, body);
            const created = json.data[`create${singular}`];
            if (!created?.id)
                throw new Error(`Twenty POST /${plural}: no record in the answer`);
            return created;
        },
        async update(plural, id, body) {
            await call("PATCH", `/${plural}/${id}`, body);
        },
        async remove(plural, id) {
            const { status } = await call("DELETE", `/${plural}/${id}`);
            return status !== 404;
        },
    };
}
async function twentyFromConfig() {
    return twentyClient(await config("twenty_base_url"), await config("twenty_api_key"));
}
class TwentyGraphqlError extends Error {
    codes;
    constructor(message, codes) {
        super(message);
        this.codes = codes;
    }
}
const FILE_UPLOAD_PATH = "/file-upload/";
function inClusterUploadUrl(uploadUrl, baseUrl) {
    const url = new URL(uploadUrl);
    if (!url.pathname.startsWith(FILE_UPLOAD_PATH))
        return uploadUrl;
    return `${baseUrl.replace(/\/$/, "")}${url.pathname}${url.search}`;
}
const isPermissionError = (messages, codes) => codes.includes("FORBIDDEN") || codes.includes("PERMISSION_DENIED") || messages.some((m) => /permission/i.test(m));
function twentyFilesClient(baseUrl, apiKey, fetchImpl = fetch) {
    const base = baseUrl.replace(/\/$/, "");
    let fieldId = null;
    async function gql(operation, query, variables = {}) {
        const res = await fetchImpl(`${base}/metadata`, {
            method: "POST",
            headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
            body: JSON.stringify({ query, variables }),
            signal: AbortSignal.timeout(30_000),
        });
        const text = await res.text();
        let json = null;
        try {
            json = text ? JSON.parse(text) : null;
        }
        catch { }
        const errors = json?.errors ?? [];
        if (errors.length) {
            const messages = errors.map((e) => e.message);
            const codes = errors.map((e) => e.extensions?.code ?? "").filter(Boolean);
            if (isPermissionError(messages, codes)) {
                throw new TwentyGraphqlError(`Twenty ${operation}: refused for permissions; the API key's role needs the Upload files permission (UPLOAD_FILE). ${messages.join("; ").slice(0, 200)}`, codes);
            }
            const limited = !res.ok ? res.status === 429 : messages.some((m) => /too many requests|rate limit|limit reached/i.test(m));
            const status = limited ? "HTTP 429 " : res.ok ? "" : `HTTP ${res.status} `;
            throw new TwentyGraphqlError(`Twenty ${operation}: ${status}${messages.join("; ").slice(0, 300)}`, codes);
        }
        if (!res.ok)
            throw new Error(`Twenty ${operation}: HTTP ${res.status} ${text.slice(0, 200)}`);
        if (!json?.data)
            throw new Error(`Twenty ${operation}: no data in the answer`);
        return json.data;
    }
    return {
        attachmentFileFieldId() {
            fieldId ??= gql("objects", `{ objects(paging:{first:500}) { edges { node { id nameSingular fields(paging:{first:500}) { edges { node { id name type } } } } } } }`)
                .then((data) => {
                const attachment = data.objects.edges.map((e) => e.node).find((o) => o.nameSingular === "attachment");
                const field = attachment?.fields.edges.map((e) => e.node).find((f) => f.name === "file" && f.type === "FILES");
                if (!field)
                    throw new Error("Twenty has no attachment.file (FILES) field");
                return field.id;
            })
                .catch((err) => {
                fieldId = null;
                throw err;
            });
            return fieldId;
        },
        async createFileUpload(filename, size, fieldMetadataId) {
            const data = await gql("createFileUpload", `mutation CreateFileUpload($filename: String!, $size: Float!, $fileFolder: FileFolder!, $fieldMetadataId: String) {
  createFileUpload(filename: $filename, size: $size, fileFolder: $fileFolder, fieldMetadataId: $fieldMetadataId) { fileId uploadUrl contentType expiresAt }
}`, { filename, size, fileFolder: "FilesField", fieldMetadataId });
            const target = data.createFileUpload;
            if (!target?.fileId || !target.uploadUrl)
                throw new Error("Twenty createFileUpload: no upload target in the answer");
            return target;
        },
        async put(uploadUrl, data) {
            const res = await fetchImpl(inClusterUploadUrl(uploadUrl, base), {
                method: "PUT",
                headers: { "content-type": "application/octet-stream" },
                body: data,
                signal: AbortSignal.timeout(120_000),
            });
            if (!res.ok)
                throw new Error(`Twenty PUT /file-upload: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
            await res.body?.cancel().catch(() => { });
        },
        async completeFileUpload(fileId) {
            await gql("completeFileUpload", `mutation CompleteFileUpload($fileId: String!) { completeFileUpload(fileId: $fileId) { id } }`, { fileId });
        },
    };
}
async function twentyFilesFromConfig() {
    return twentyFilesClient(await config("twenty_base_url"), await config("twenty_api_key"));
}
  return { isIn, findEvery, eq, twentyClient, twentyFromConfig, TwentyGraphqlError, inClusterUploadUrl, twentyFilesClient, twentyFilesFromConfig };
})();

// integrations/windmill/talent/lib/whatsapp-ack.ts
const { WA_SEND_URL, WA_REPORT_URL, WA_TIMEOUT_MS, WA_PHONE_NUMBER_ID, WA_FALLBACK_MS, WA_CHECK_SECONDS, WA_TEMPLATES, templateFor, whatsAppRequestUrl, templateRequestUrl, sendWhatsAppTemplate, classifyWhatsApp, sendWhatsAppAck, parseWhatsAppReport, lookupWhatsAppReport, runWhatsAppAck } = (() => {
const WA_SEND_URL = "https://www.fast2sms.com/dev/whatsapp";
const WA_REPORT_URL = "https://www.fast2sms.com/dev/whatsapp/";
const WA_TIMEOUT_MS = 15_000;
const WA_PHONE_NUMBER_ID = "1426644927192285";
const WA_FALLBACK_MS = 10 * 60 * 1000;
const WA_CHECK_SECONDS = 60;
const WA_TEMPLATES = {
    "en-IN": 38422,
    "hi-IN": 38423,
    "hi-Latn-IN": 38424,
    "pa-IN": 38425,
    "kn-IN": 38426,
};
const LOCALE_ALIASES = { en: "en-IN", hi: "hi-IN", hinglish: "hi-Latn-IN" };
const templateFor = (locale, templates = WA_TEMPLATES) => templates[LOCALE_ALIASES[locale ?? ""] ?? locale ?? "en-IN"] ?? null;
function whatsAppRequestUrl(claim, messageId) {
    const params = new URLSearchParams({
        message_id: String(messageId),
        phone_number_id: WA_PHONE_NUMBER_ID,
        numbers: claim.phone.slice(-10),
        variables_values: claim.ref,
        udf1: claim.ref,
    });
    return `${WA_SEND_URL}?${params}`;
}
function templateRequestUrl(message, messageId) {
    const params = new URLSearchParams({
        message_id: String(messageId),
        phone_number_id: WA_PHONE_NUMBER_ID,
        numbers: message.phone.slice(-10),
        ...(message.values.length ? { variables_values: message.values.join("|") } : {}),
        udf1: message.udf1,
    });
    return `${WA_SEND_URL}?${params}`;
}
async function sendWhatsAppTemplate(message, messageId, apiKey, fetchImpl = fetch) {
    try {
        const res = await fetchImpl(templateRequestUrl(message, messageId), {
            headers: { authorization: apiKey },
            signal: AbortSignal.timeout(WA_TIMEOUT_MS),
        });
        let body;
        try {
            body = (await res.json());
        }
        catch {
            body = undefined;
        }
        return { statusCode: res.status, body };
    }
    catch {
        return { error: "request failed" };
    }
}
function classifyWhatsApp(response) {
    const body = response.body;
    const ok = body?.status === true || body?.return === true;
    const requestId = typeof body?.request_id === "string" && body.request_id ? body.request_id : null;
    if (response.statusCode === 200 && ok && requestId)
        return { status: "accepted", requestId, error: null };
    const refused = body?.status === false || body?.return === false;
    if (response.statusCode && response.statusCode >= 400 && response.statusCode < 500 && refused) {
        const why = typeof body?.message === "string" ? `: ${body.message.slice(0, 200)}` : "";
        return { status: "failed", requestId: null, error: `Fast2SMS refused the WhatsApp message (HTTP ${response.statusCode})${why}` };
    }
    return { status: "unknown", requestId: null, error: "WhatsApp send outcome uncertain; the SMS goes instead" };
}
async function sendWhatsAppAck(claim, messageId, apiKey, fetchImpl = fetch) {
    try {
        const res = await fetchImpl(whatsAppRequestUrl(claim, messageId), {
            headers: { authorization: apiKey },
            signal: AbortSignal.timeout(WA_TIMEOUT_MS),
        });
        let body;
        try {
            body = (await res.json());
        }
        catch {
            body = undefined;
        }
        return { statusCode: res.status, body };
    }
    catch {
        return { error: "request failed" };
    }
}
const RANK = { pending: 0, delivered: 1, read: 2, failed: 3 };
const text = (v) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
function parseWhatsAppReport(raw) {
    const entries = raw?.data;
    if (!Array.isArray(entries) || entries.length === 0)
        return null;
    let best = null;
    for (const e of entries) {
        const status = text(e?.status).toLowerCase();
        if (!status)
            continue;
        const outcome = status === "read" ? "read" : status === "delivered" ? "delivered"
            : /fail|undeliv|reject|error/.test(status) ? "failed" : "pending";
        const errors = text(e.errors);
        const ts = /^\d+$/.test(text(e.timestamp)) ? new Date(Number(text(e.timestamp)) * 1000).toISOString() : null;
        const report = { outcome, detail: (errors && errors !== "null" && errors !== "[]" ? `${status}: ${errors}` : status).slice(0, 300), at: ts };
        if (!best || RANK[outcome] > RANK[best.outcome])
            best = report;
    }
    return best;
}
async function lookupWhatsAppReport(requestId, apiKey, fetchImpl = fetch) {
    try {
        const res = await fetchImpl(WA_REPORT_URL + encodeURIComponent(requestId), {
            headers: { authorization: apiKey },
            signal: AbortSignal.timeout(WA_TIMEOUT_MS),
        });
        if (!res.ok)
            return null;
        return parseWhatsAppReport(await res.json());
    }
    catch {
        return null;
    }
}
const wait = { kind: "wait", seconds: WA_CHECK_SECONDS };
const ms = (v) => (v ? new Date(v).getTime() : 0);
async function runWhatsAppAck(submissionId, deps) {
    const now = (deps.now ?? (() => new Date()))().getTime();
    const [row] = await deps.query(GET_ACKNOWLEDGEMENT, [submissionId]);
    if (!row || row.status !== "pending")
        return row?.status === "skipped" ? { kind: "done" } : { kind: "sms" };
    if (row.wa_status === null) {
        const template = templateFor(row.locale, deps.templates);
        if (!template || !deps.sendWhatsApp) {
            await deps.query(SKIP_WHATSAPP, [submissionId, template ? "WhatsApp is not set up" : `No approved WhatsApp template for ${row.locale ?? "this language"}`]);
            return { kind: "sms" };
        }
        const [claimed] = await deps.query(CLAIM_WHATSAPP_ACK, [submissionId]);
        if (!claimed)
            return wait;
        const result = classifyWhatsApp(await deps.sendWhatsApp(row, template));
        await deps.query(SAVE_WHATSAPP_RESULT, [submissionId, result.status, result.requestId, result.error]);
        return result.status === "accepted" ? wait : { kind: "sms" };
    }
    if (row.wa_status === "sending") {
        if (now - ms(row.wa_updated_at) < 5 * 60 * 1000)
            return wait;
        await deps.query(RECOVER_WHATSAPP_SEND, [submissionId]);
        return { kind: "sms" };
    }
    if (row.wa_status !== "accepted")
        return { kind: "sms" };
    if (row.wa_delivery === "delivered" || row.wa_delivery === "read") {
        await deps.query(SKIP_SMS, [submissionId]);
        return { kind: "done" };
    }
    if (row.wa_delivery === "failed")
        return { kind: "sms" };
    const report = row.wa_request_id ? await deps.lookupWhatsApp(row.wa_request_id) : null;
    if (report)
        await deps.query(SAVE_WHATSAPP_REPORT, [submissionId, report.outcome, report.detail, report.at]);
    if (report?.outcome === "delivered" || report?.outcome === "read") {
        await deps.query(SKIP_SMS, [submissionId]);
        return { kind: "done" };
    }
    if (report?.outcome === "failed")
        return { kind: "sms" };
    if (now - ms(row.wa_sent_at) >= WA_FALLBACK_MS) {
        await deps.query(SAVE_WHATSAPP_REPORT, [submissionId, "pending", report?.detail ?? "No delivery report in 10 minutes: SMS sent", null]);
        return { kind: "sms" };
    }
    return wait;
}
  return { WA_SEND_URL, WA_REPORT_URL, WA_TIMEOUT_MS, WA_PHONE_NUMBER_ID, WA_FALLBACK_MS, WA_CHECK_SECONDS, WA_TEMPLATES, templateFor, whatsAppRequestUrl, templateRequestUrl, sendWhatsAppTemplate, classifyWhatsApp, sendWhatsAppAck, parseWhatsAppReport, lookupWhatsAppReport, runWhatsAppAck };
})();

// integrations/windmill/talent/lib/run-crew.ts
const { SENDS_PER_RUN, parseTestPhones, runCrew, WATCH_DAYS, watchedFilter, crewCommunicationFields } = (() => {
const SENDS_PER_RUN = 10;
const REPLIES_PER_RUN = 20;
const REPORTS_PER_RUN = 20;
const CRM_PER_RUN = 15;
function parseTestPhones(value) {
    return new Set((value ?? "")
        .split(/[,;\n]+/)
        .map((v) => normaliseIndianMobile(v))
        .filter((v) => !!v));
}
const isRateLimit = (err) => err instanceof Error && /HTTP 429|too many requests/i.test(err.message);
const isGone = (err) => err instanceof Error && /HTTP 404/.test(err.message);
const message = (err) => (err instanceof Error ? err.message : String(err)).slice(0, 300);
const iso = (v) => (v ? new Date(v).toISOString() : null);
const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const memberUrl = (id) => `${TWENTY_APP_URL}/object/crewMember/${encodeURIComponent(id)}`;
async function runCrew(deps) {
    const result = { locked: false, replies: 0, sent: 0, noReply: 0, notes: 0, reports: 0, crm: 0, limited: false, errors: [] };
    const [lock] = await deps.query(CREW_LOCK);
    if (!lock?.locked)
        return { ...result, locked: true };
    try {
        await deps.query(RECOVER_CREW_SENDING);
        const crm = deps.crm;
        if (!crm) {
            result.errors.push("Twenty is not reachable");
            return result;
        }
        try {
            await applyReplies(deps, crm, result);
            await planAndSend(deps, crm, result);
            await lookupReports(deps, result);
            await syncCrm(deps, crm, result);
        }
        catch (err) {
            if (!isRateLimit(err))
                throw err;
            result.limited = true;
        }
        return result;
    }
    finally {
        await deps.query(CREW_UNLOCK);
    }
}
async function first(crm, plural, id) {
    if (!id)
        return null;
    return (await crm.find(plural, eq("id", id)))[0] ?? null;
}
async function upsertCommunication(crm, fields, knownId = null) {
    if (knownId) {
        try {
            await crm.update("communications", knownId, fields);
            return knownId;
        }
        catch (err) {
            if (!isGone(err))
                throw err;
        }
    }
    const [existing] = await crm.find("communications", eq("externalKey", String(fields.externalKey)));
    if (existing) {
        await crm.update("communications", existing.id, fields);
        return existing.id;
    }
    return (await crm.create("communications", "Communication", fields)).id;
}
async function applyReplies(deps, crm, result) {
    const rows = await deps.query(CREW_REPLIES_DUE, [REPLIES_PER_RUN]);
    for (const r of rows) {
        try {
            const member = (await first(crm, "crewMembers", r.crew_member_id));
            const text = (r.body ?? "").trim();
            const next = member ? statusAfterReply(r.kind, r.answer, member.status) : null;
            if (member) {
                await crm.update("crewMembers", member.id, {
                    repliedAt: iso(r.received_at),
                    lastReply: clip(text || `(${r.message_type ?? "message"})`, 200),
                    ...(next ? { status: next } : {}),
                });
            }
            await upsertCommunication(crm, {
                name: `WhatsApp · reply to ${kindLabel(r.kind)}`,
                channel: "WHATSAPP",
                direction: "INBOUND",
                body: text || `(${r.message_type ?? "message"} without text)`,
                provider: "Fast2SMS",
                statusAt: iso(r.received_at),
                externalKey: `crew-reply:${r.key}`,
                personId: r.person_id,
                opportunityId: r.opportunity_id,
            });
            if (member && (next === "SAID_YES" || next === "CANT_COME"))
                await tellRecruiters(deps, crm, member, next, r);
            await deps.query(CREW_REPLY_DONE, [r.key]);
            result.replies++;
        }
        catch (err) {
            if (isRateLimit(err))
                throw err;
            result.errors.push(`reply: ${message(err)}`);
            await deps.query(CREW_REPLY_FAILED, [r.key, message(err)]);
        }
    }
}
async function tellRecruiters(deps, crm, member, next, r) {
    const person = (await first(crm, "people", member.personId ?? r.person_id));
    const request = (await first(crm, "opportunities", member.opportunityId ?? r.opportunity_id));
    const job = request?.offerJob?.trim() || "the job";
    const crew = request?.name?.trim() || "a crew request";
    const yes = next === "SAID_YES";
    await deps.notify({
        source: "talent",
        type: yes ? "crew.said_yes" : "crew.cant_come",
        severity: yes ? "info" : "warning",
        dedupeKey: `crew-${yes ? "yes" : "cant-come"}:${member.id}`,
        title: yes ? `Said yes: ${crew}` : `Can't come: ${crew}`,
        summary: yes ? `${job} · call to confirm` : `${job} · confirmed worker can't come; call the next one who said yes`,
        link: { label: "Open in Twenty", url: memberUrl(member.id) },
        pii: { name: personName(person) || undefined, phone: r.phone },
    });
}
async function byIds(crm, plural, ids) {
    const out = new Map();
    for (let i = 0; i < ids.length; i += 50) {
        for (const rec of await findEvery(crm, plural, isIn("id", ids.slice(i, i + 50))))
            out.set(rec.id, rec);
    }
    return out;
}
async function latestApplications(crm, personIds) {
    const out = new Map();
    for (let i = 0; i < personIds.length; i += 50) {
        for (const app of await findEvery(crm, "applications", isIn("personId", personIds.slice(i, i + 50)))) {
            const personId = typeof app.personId === "string" ? app.personId : null;
            const name = typeof app.name === "string" ? app.name.trim() : "";
            if (!personId || !name)
                continue;
            const at = new Date(String(app.submittedAt ?? app.createdAt ?? 0)).getTime() || 0;
            const have = out.get(personId);
            if (!have || at > have.at)
                out.set(personId, { name, at });
        }
    }
    return new Map([...out].map(([id, v]) => [id, v.name]));
}
const unique = (xs) => [...new Set(xs.filter((x) => !!x))];
const createdMs = (m) => (m.createdAt ? new Date(m.createdAt).getTime() : 0);
const WATCH_DAYS = 60;
const watchedFilter = (now) => `and(${isIn("status", WATCHED_STATUSES)},createdAt[gte]:${JSON.stringify(new Date(now.getTime() - WATCH_DAYS * 86_400_000).toISOString())})`;
async function planAndSend(deps, crm, result) {
    const now = (deps.now ?? (() => new Date()))();
    const members = (await findEvery(crm, "crewMembers", watchedFilter(now))).sort((a, b) => createdMs(a) - createdMs(b) || a.id.localeCompare(b.id));
    if (!members.length)
        return;
    const people = await byIds(crm, "people", unique(members.map((m) => m.personId)));
    const requests = await byIds(crm, "opportunities", unique(members.map((m) => m.opportunityId)));
    const references = await latestApplications(crm, unique(members.map((m) => m.personId)));
    const ledger = await deps.query(CREW_LEDGER, [members.map((m) => m.id)]);
    for (const m of members) {
        const person = (m.personId ? people.get(m.personId) : null);
        const request = (m.opportunityId ? requests.get(m.opportunityId) : null);
        const plan = planMember({
            member: m,
            person,
            request,
            ledger: ledger.filter((r) => r.crew_member_id === m.id),
            others: members,
            now,
            templates: deps.templates,
            canSend: !!deps.sendWhatsApp,
            test: !!person && !!deps.testPhones?.has(personPhone(person) ?? ""),
            reference: m.personId ? (references.get(m.personId) ?? null) : null,
        });
        const patch = {};
        if (!m.name?.trim() && person && request)
            patch.name = clip(`${personName(person) || "Worker"} · ${request.name ?? "crew request"}`, 120);
        if (plan.kind === "no_reply") {
            patch.status = "NO_REPLY";
            result.noReply++;
        }
        else if (plan.kind === "wait") {
            if ((plan.note || null) !== (m.messageNote || null)) {
                patch.messageNote = plan.note ?? "";
                result.notes++;
            }
        }
        if (Object.keys(patch).length)
            await crm.update("crewMembers", m.id, patch);
        if (plan.kind !== "send" || result.sent >= SENDS_PER_RUN || !deps.sendWhatsApp)
            continue;
        const [claimed] = await deps.query(CLAIM_CREW_MESSAGE, [
            m.id, plan.message, plan.phone, m.personId ?? null, m.opportunityId ?? null, plan.locale, plan.templateId, JSON.stringify(plan.values),
        ]);
        if (!claimed)
            continue;
        const outcome = classifyWhatsApp(await deps.sendWhatsApp({ phone: plan.phone, values: plan.values, udf1: claimed.id }, plan.templateId));
        await deps.query(SAVE_CREW_SEND, [claimed.id, outcome.status, outcome.requestId, outcome.status === "accepted" ? null : outcome.error]);
        result.sent++;
    }
}
async function lookupReports(deps, result) {
    const rows = await deps.query(CREW_REPORTS_DUE, [REPORTS_PER_RUN]);
    for (const r of rows) {
        const report = await deps.lookupWhatsApp(r.request_id);
        if (report)
            await deps.query(SAVE_CREW_REPORT, [r.id, report.outcome, report.detail, report.at]);
        else
            await deps.query(CREW_REPORT_CHECKED, [r.id]);
        result.reports++;
    }
}
function crewCommunicationFields(r) {
    const values = (typeof r.variables === "string" ? JSON.parse(r.variables) : r.variables);
    const template = templateText(r.kind, r.locale, r.kind === "offer" && values.length === 5);
    return {
        name: `WhatsApp · ${kindLabel(r.kind)}`,
        channel: "WHATSAPP",
        direction: "OUTBOUND",
        deliveryStatus: crewDeliveryStatus(r.status, r.delivery),
        template: `${template.name} (${template.language}, WhatsApp)`,
        body: renderTemplate(template, values),
        provider: "Fast2SMS",
        providerId: r.request_id ?? "",
        statusAt: iso(r.delivered_at ?? r.sent_at ?? r.updated_at),
        error: r.delivery === "failed" ? (r.delivery_detail ?? "") : (r.error ?? ""),
        externalKey: `crew:${r.id}`,
        personId: r.person_id,
        opportunityId: r.opportunity_id,
    };
}
async function syncCrm(deps, crm, result) {
    const rows = await deps.query(CREW_CRM_DUE, [CRM_PER_RUN]);
    for (const r of rows) {
        try {
            const commId = await upsertCommunication(crm, crewCommunicationFields(r), r.communication_id);
            const sentField = SENT_FIELD[r.kind];
            const patch = { messageNote: noteAfterSend(r.kind, r.status, r.delivery) ?? "" };
            if (sentField && r.status === "accepted")
                patch[sentField] = iso(r.sent_at);
            try {
                await crm.update("crewMembers", r.crew_member_id, patch);
            }
            catch (err) {
                if (!isGone(err))
                    throw err;
            }
            await deps.query(MARK_CREW_CRM, [r.id, commId, r.state]);
            result.crm++;
        }
        catch (err) {
            if (isRateLimit(err))
                throw err;
            result.errors.push(`crm: ${message(err)}`);
        }
    }
}
  return { SENDS_PER_RUN, parseTestPhones, runCrew, WATCH_DAYS, watchedFilter, crewCommunicationFields };
})();

// integrations/windmill/notify/lib/config.ts
const { NOTIFY_VARIABLES, notifyVariablePath, setNotifyConfigForTests, notifyConfig, OWNER_PLACEHOLDER } = (() => {
const NOTIFY_VARIABLES = {
    notify_pg_url: { secret: true },
    ingest_secret: { secret: true },
    alertmanager_secret: { secret: true },
    ntfy_token: { secret: true },
    ntfy_base_url: { secret: false },
    resend_api_key: { secret: true },
    email_from: { secret: false },
    email_to: { secret: true },
    policy: { secret: false },
};
const notifyVariablePath = (name) => `f/notify/${name}`;
let notifyOverride = null;
function setNotifyConfigForTests(values) {
    notifyOverride = values;
}
async function notifyConfig(name) {
    if (notifyOverride) {
        const value = notifyOverride[name];
        if (value === undefined)
            throw new Error(`test config has no ${name}`);
        return value;
    }
    const value = await wmill.getVariable(notifyVariablePath(name));
    if (!value)
        throw new Error(`variable ${notifyVariablePath(name)} is empty`);
    return value;
}
const OWNER_PLACEHOLDER = "set-by-owner";
  return { NOTIFY_VARIABLES, notifyVariablePath, setNotifyConfigForTests, notifyConfig, OWNER_PLACEHOLDER };
})();

// integrations/windmill/notify/lib/db.ts
const { withNotifyDb, NOTIFY_INSERT_EVENT, NOTIFY_KEY_STATUSES, NOTIFY_CLAIM_UNROUTED, NOTIFY_ENSURE_KEY, NOTIFY_LOCK_KEY, NOTIFY_SAVE_KEY, NOTIFY_MARK_ROUTED, NOTIFY_ADD_DELIVERY, NOTIFY_CLAIM_SWEEP, NOTIFY_CLAIM_DIGEST, NOTIFY_MARK_DIGESTED, NOTIFY_RECOVER_STUCK, NOTIFY_CLAIM_DELIVERIES, NOTIFY_FINISH_DELIVERY, NOTIFY_RELEASE_PII, NOTIFY_CLEAR_PII_BEFORE, NOTIFY_PURGE_BEFORE, toStoredEvent, insertEventWith, pgNotifyStore, notifySchemaStatements } = (() => {
async function withNotifyDb(fn) {
    const sql = postgres(await notifyConfig("notify_pg_url"), {
        max: 1,
        connect_timeout: 10,
        idle_timeout: 5,
        prepare: false,
        onnotice: () => { },
    });
    try {
        return await fn(sql);
    }
    finally {
        await sql.end({ timeout: 5 });
    }
}
const NOTIFY_INSERT_EVENT = `
INSERT INTO notify_events (v, source, type, severity, dedupe_key, status, occurred_at, title, summary, body, link, pii, received_at)
VALUES (1, $1, $2, $3, $4, $5, $6::timestamptz, $7, $8, $9, $10::jsonb, $11::jsonb, $12::timestamptz)
RETURNING id::text AS id;`;
const NOTIFY_KEY_STATUSES = `
WITH k AS (
  SELECT dedupe_key, status FROM notify_keys WHERE left(dedupe_key, length($1)) = $1 AND status IS NOT NULL
), p AS (
  SELECT DISTINCT ON (dedupe_key) dedupe_key, status FROM notify_events
  WHERE routed_at IS NULL AND status IS NOT NULL AND left(dedupe_key, length($1)) = $1
  ORDER BY dedupe_key, id DESC
)
SELECT dedupe_key, coalesce(p.status, k.status) AS status FROM k FULL JOIN p USING (dedupe_key);`;
const EVENT_COLUMNS = `e.id::text AS id, e.source, e.type, e.severity, e.dedupe_key, e.status, e.occurred_at, e.received_at, e.title, e.summary, e.body, e.link, e.pii`;
const NOTIFY_CLAIM_UNROUTED = `
SELECT ${EVENT_COLUMNS} FROM notify_events e
WHERE e.routed_at IS NULL
ORDER BY e.id
LIMIT $1
FOR UPDATE SKIP LOCKED;`;
const NOTIFY_ENSURE_KEY = `INSERT INTO notify_keys (dedupe_key) VALUES ($1) ON CONFLICT (dedupe_key) DO NOTHING RETURNING 1 AS created;`;
const NOTIFY_LOCK_KEY = `SELECT status, firing_pushed, firing_emailed, last_push_at, pending_count, seen_count FROM notify_keys WHERE dedupe_key = $1 FOR UPDATE;`;
const NOTIFY_SAVE_KEY = `
UPDATE notify_keys SET status = $2, firing_pushed = $3, firing_emailed = $4, last_push_at = $5::timestamptz,
  pending_count = $6, seen_count = $7, last_event_id = coalesce($8::bigint, last_event_id), updated_at = $9::timestamptz
WHERE dedupe_key = $1;`;
const NOTIFY_MARK_ROUTED = `
UPDATE notify_events SET routed_at = $6::timestamptz, rule = $2, duplicate = $3, digest = $4,
  pii = CASE WHEN $5 THEN pii ELSE NULL END
WHERE id = $1::bigint;`;
const NOTIFY_ADD_DELIVERY = `
INSERT INTO notify_deliveries (event_id, channel, kind, count, next_attempt_at, created_at, updated_at)
VALUES ($1::bigint, $2, $3, $4, $5::timestamptz, $5::timestamptz, $5::timestamptz);`;
const NOTIFY_CLAIM_SWEEP = `
SELECT k.dedupe_key, k.status AS key_status, k.firing_pushed, k.firing_emailed, k.last_push_at, k.pending_count, k.seen_count, ${EVENT_COLUMNS}
FROM notify_keys k JOIN notify_events e ON e.id = k.last_event_id
WHERE k.last_push_at IS NOT NULL AND (
  (k.status = 'firing' AND k.firing_pushed AND k.last_push_at <= $1::timestamptz - make_interval(mins => $2::int))
  OR (k.pending_count > 0 AND k.last_push_at <= $1::timestamptz - make_interval(mins => $3::int))
)
ORDER BY k.last_push_at
LIMIT $4
FOR UPDATE OF k SKIP LOCKED;`;
const NOTIFY_CLAIM_DIGEST = `
SELECT ${EVENT_COLUMNS} FROM notify_events e
WHERE e.digest AND e.digested_at IS NULL AND e.routed_at IS NOT NULL
ORDER BY e.id
LIMIT $1
FOR UPDATE SKIP LOCKED;`;
const NOTIFY_MARK_DIGESTED = `UPDATE notify_events SET digested_at = $2::timestamptz WHERE id = ANY($1::bigint[]);`;
const NOTIFY_RECOVER_STUCK = `
UPDATE notify_deliveries
SET status = CASE WHEN attempts >= $2 THEN 'failed' ELSE 'pending' END, last_error = 'interrupted', updated_at = $1::timestamptz
WHERE status = 'sending' AND updated_at <= $1::timestamptz - interval '10 minutes'
RETURNING id;`;
const NOTIFY_CLAIM_DELIVERIES = `
WITH due AS (
  SELECT id FROM notify_deliveries
  WHERE status = 'pending' AND next_attempt_at <= $1::timestamptz AND attempts < $3
  ORDER BY next_attempt_at, id
  LIMIT $2
  FOR UPDATE SKIP LOCKED
), claimed AS (
  UPDATE notify_deliveries d SET status = 'sending', attempts = d.attempts + 1, updated_at = $1::timestamptz
  FROM due WHERE d.id = due.id
  RETURNING d.id, d.event_id, d.channel, d.kind, d.count, d.attempts
)
SELECT c.id::text AS delivery_id, c.channel, c.kind, c.count, c.attempts, ${EVENT_COLUMNS}
FROM claimed c JOIN notify_events e ON e.id = c.event_id
ORDER BY c.id;`;
const NOTIFY_FINISH_DELIVERY = `
UPDATE notify_deliveries SET status = $2, last_error = $3, next_attempt_at = coalesce($4::timestamptz, next_attempt_at),
  sent_at = CASE WHEN $2 = 'sent' THEN $5::timestamptz ELSE sent_at END, updated_at = $5::timestamptz
WHERE id = $1::bigint;`;
const NOTIFY_RELEASE_PII = `
UPDATE notify_events SET pii = NULL
WHERE id = $1::bigint AND pii IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM notify_deliveries d WHERE d.event_id = $1::bigint AND d.channel = 'push' AND d.status IN ('pending', 'sending')
);`;
const NOTIFY_CLEAR_PII_BEFORE = `UPDATE notify_events SET pii = NULL WHERE pii IS NOT NULL AND received_at < $1::timestamptz RETURNING id;`;
const NOTIFY_PURGE_BEFORE = `DELETE FROM notify_events WHERE received_at < $1::timestamptz RETURNING id;`;
const iso = (v) => (v instanceof Date ? v.toISOString() : v === null || v === undefined ? null : new Date(String(v)).toISOString());
function toStoredEvent(r) {
    return {
        v: 1,
        id: String(r.id),
        source: r.source,
        type: String(r.type),
        severity: r.severity,
        dedupeKey: String(r.dedupe_key),
        ...(r.status ? { status: r.status } : {}),
        occurredAt: iso(r.occurred_at),
        receivedAt: iso(r.received_at),
        title: String(r.title),
        summary: String(r.summary),
        ...(r.body ? { body: String(r.body) } : {}),
        ...(r.link ? { link: r.link } : {}),
        ...(r.pii ? { pii: r.pii } : {}),
    };
}
const toState = (r, statusColumn = "status") => ({
    status: r[statusColumn] ?? null,
    firingPushed: Boolean(r.firing_pushed),
    firingEmailed: Boolean(r.firing_emailed),
    lastPushAt: iso(r.last_push_at),
    pendingCount: Number(r.pending_count ?? 0),
    seenCount: Number(r.seen_count ?? 0),
});
const execOn = (sql) => async (text, params = []) => (await sql.unsafe(text, params));
function insertEventWith(exec) {
    return async (e, now) => {
        const rows = await exec(NOTIFY_INSERT_EVENT, [
            e.source, e.type, e.severity, e.dedupeKey, e.status ?? null, e.occurredAt, e.title, e.summary, e.body ?? null, e.link ?? null, e.pii ?? null, now,
        ]);
        return String(rows[0].id);
    };
}
function txOn(exec) {
    const addDelivery = async (eventId, channel, kind, count, now) => {
        await exec(NOTIFY_ADD_DELIVERY, [eventId, channel, kind, count, now]);
    };
    return {
        claimUnrouted: async (limit) => (await exec(NOTIFY_CLAIM_UNROUTED, [limit])).map(toStoredEvent),
        async lockKey(key) {
            const created = (await exec(NOTIFY_ENSURE_KEY, [key])).length > 0;
            const rows = await exec(NOTIFY_LOCK_KEY, [key]);
            return created || rows.length === 0 ? null : toState(rows[0]);
        },
        async saveKey(key, s, lastEventId, now) {
            await exec(NOTIFY_SAVE_KEY, [key, s.status, s.firingPushed, s.firingEmailed, s.lastPushAt, s.pendingCount, s.seenCount, lastEventId, now]);
        },
        async markRouted(id, o, now) {
            await exec(NOTIFY_MARK_ROUTED, [id, o.rule, o.duplicate, o.digest, o.keepPii, now]);
        },
        addDelivery,
        claimSweepKeys: async (now, reminderMinutes, collapseMinutes, limit) => (await exec(NOTIFY_CLAIM_SWEEP, [now, Math.round(reminderMinutes), Math.round(collapseMinutes), limit])).map((r) => ({
            key: String(r.dedupe_key),
            state: toState(r, "key_status"),
            event: toStoredEvent(r),
        })),
        claimDigest: async (limit) => (await exec(NOTIFY_CLAIM_DIGEST, [limit])).map(toStoredEvent),
        async markDigested(ids, now) {
            await exec(NOTIFY_MARK_DIGESTED, [ids, now]);
        },
    };
}
function pgNotifyStore(sql) {
    const exec = execOn(sql);
    const tx = txOn(exec);
    return {
        transaction: async (fn) => (await sql.begin((t) => fn(txOn(execOn(t))))),
        insertEvent: insertEventWith(exec),
        keyStatuses: async (prefix) => Object.fromEntries((await exec(NOTIFY_KEY_STATUSES, [prefix])).map((r) => [String(r.dedupe_key), r.status])),
        recoverStuck: async (now, maxAttempts) => (await exec(NOTIFY_RECOVER_STUCK, [now, maxAttempts])).length,
        claimDeliveries: async (now, limit, maxAttempts) => (await exec(NOTIFY_CLAIM_DELIVERIES, [now, limit, maxAttempts])).map((r) => ({
            id: String(r.delivery_id),
            channel: r.channel,
            kind: r.kind,
            count: Number(r.count),
            attempts: Number(r.attempts),
            event: toStoredEvent(r),
        })),
        async finishDelivery(id, o, now) {
            await exec(NOTIFY_FINISH_DELIVERY, [id, o.status, o.status === "sent" ? null : o.error, o.status === "pending" ? o.retryAt : null, now]);
        },
        addDelivery: tx.addDelivery,
        async releasePii(eventId) {
            await exec(NOTIFY_RELEASE_PII, [eventId]);
        },
        clearPiiBefore: async (before) => (await exec(NOTIFY_CLEAR_PII_BEFORE, [before])).length,
        purgeBefore: async (before) => (await exec(NOTIFY_PURGE_BEFORE, [before])).length,
    };
}
const notifySchemaStatements = (schema) => schema.replace(/^--.*\n/gm, "");
  return { withNotifyDb, NOTIFY_INSERT_EVENT, NOTIFY_KEY_STATUSES, NOTIFY_CLAIM_UNROUTED, NOTIFY_ENSURE_KEY, NOTIFY_LOCK_KEY, NOTIFY_SAVE_KEY, NOTIFY_MARK_ROUTED, NOTIFY_ADD_DELIVERY, NOTIFY_CLAIM_SWEEP, NOTIFY_CLAIM_DIGEST, NOTIFY_MARK_DIGESTED, NOTIFY_RECOVER_STUCK, NOTIFY_CLAIM_DELIVERIES, NOTIFY_FINISH_DELIVERY, NOTIFY_RELEASE_PII, NOTIFY_CLEAR_PII_BEFORE, NOTIFY_PURGE_BEFORE, toStoredEvent, insertEventWith, pgNotifyStore, notifySchemaStatements };
})();

// integrations/windmill/talent/lib/mask.ts
const { maskIds, maskDeep } = (() => {
function maskIds(value) {
    return value
        .replace(/\b([2-9]\d{3})[ -]?(\d{4})[ -]?(\d{4})\b/g, (_m, _a, _b, last) => `XXXX XXXX ${last}`)
        .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, "[PAN removed]");
}
function maskDeep(value) {
    if (typeof value === "string")
        return maskIds(value);
    if (Array.isArray(value))
        return value.map(maskDeep);
    if (value && typeof value === "object") {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, maskDeep(v)]));
    }
    return value;
}
  return { maskIds, maskDeep };
})();

// integrations/windmill/notify/lib/event.ts
const { EVENT_SOURCES, SEVERITIES, STATUSES, TITLE_MAX, SUMMARY_MAX, BODY_MAX, scrubText, validateEvent, maskPhone, telUrl } = (() => {
const EVENT_SOURCES = ["talent", "leads", "seo-watch", "compliance", "platform", "alertmanager", "github", "website"];
const SEVERITIES = ["info", "notice", "warning", "critical"];
const STATUSES = ["firing", "resolved"];
const TITLE_MAX = 80;
const SUMMARY_MAX = 500;
const BODY_MAX = 20_000;
const PII_MAX = 200;
const PHONE_LIKE = /(?<![\w/=-])\+?\d(?:[\s.-]?\d){9,14}(?![\w/-])/g;
const EMAIL_LIKE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
function scrubText(value) {
    return maskIds(value).replace(EMAIL_LIKE, "[email removed]").replace(PHONE_LIKE, "[phone removed]");
}
const clip = (value, max) => (value.length <= max ? value : `${value.slice(0, max - 1)}…`);
const oneLine = (value) => value.replace(/\s+/g, " ").trim();
const isRecord = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v) => (typeof v === "string" ? v : undefined);
function validateEvent(input, now = new Date()) {
    if (!isRecord(input))
        return { ok: false, errors: ["event must be an object"] };
    const errors = [];
    if (input.v !== 1)
        errors.push("v must be 1");
    const source = str(input.source);
    if (!source || !EVENT_SOURCES.includes(source))
        errors.push(`source must be one of ${EVENT_SOURCES.join(", ")}`);
    const type = str(input.type);
    if (!type || !/^[a-z][a-z0-9_]*(\.[a-zA-Z0-9_-]+)+$/.test(type) || type.length > 100)
        errors.push("type must be dotted, e.g. lead.received");
    const severity = str(input.severity);
    if (!severity || !SEVERITIES.includes(severity))
        errors.push(`severity must be one of ${SEVERITIES.join(", ")}`);
    const dedupeKey = str(input.dedupeKey);
    if (!dedupeKey || dedupeKey.length > 200)
        errors.push("dedupeKey is required (≤ 200 characters)");
    const status = input.status === undefined || input.status === null ? undefined : str(input.status);
    if (status !== undefined && !STATUSES.includes(status))
        errors.push("status must be firing or resolved");
    const occurred = str(input.occurredAt);
    const occurredAt = occurred && !Number.isNaN(Date.parse(occurred)) ? new Date(occurred) : null;
    if (occurred !== undefined && !occurredAt)
        errors.push("occurredAt must be an ISO 8601 time");
    const title = str(input.title);
    if (!title?.trim())
        errors.push("title is required");
    const summary = str(input.summary);
    if (summary === undefined)
        errors.push("summary is required");
    if (input.body !== undefined && input.body !== null && typeof input.body !== "string")
        errors.push("body must be text");
    let link;
    if (input.link !== undefined && input.link !== null) {
        const l = isRecord(input.link) ? input.link : {};
        const url = str(l.url);
        if (!url || !/^https?:\/\//.test(url) || url.length > 2000)
            errors.push("link.url must be an http(s) URL");
        else
            link = { label: clip(oneLine(scrubText(str(l.label) ?? "Open")), 40), url };
    }
    let pii;
    if (input.pii !== undefined && input.pii !== null) {
        if (!isRecord(input.pii))
            errors.push("pii must be an object");
        else {
            pii = {};
            for (const key of ["name", "phone", "email", "company"]) {
                const value = input.pii[key];
                if (value === undefined || value === null || value === "")
                    continue;
                if (typeof value !== "string")
                    errors.push(`pii.${key} must be text`);
                else if (key === "phone") {
                    const phone = value.replace(/[^\d+]/g, "");
                    if (!/^\+?\d{6,15}$/.test(phone))
                        errors.push("pii.phone must be a phone number");
                    else
                        pii.phone = phone;
                }
                else
                    pii[key] = clip(oneLine(maskIds(value)), PII_MAX);
            }
            if (Object.keys(pii).length === 0)
                pii = undefined;
        }
    }
    if (errors.length)
        return { ok: false, errors };
    return {
        ok: true,
        event: {
            v: 1,
            source: source,
            type: type,
            severity: severity,
            dedupeKey: dedupeKey,
            ...(status ? { status: status } : {}),
            occurredAt: (occurredAt ?? now).toISOString(),
            title: clip(oneLine(scrubText(title)), TITLE_MAX),
            summary: clip(scrubText(summary).trim(), SUMMARY_MAX),
            ...(typeof input.body === "string" && input.body.trim() ? { body: clip(maskIds(input.body), BODY_MAX) } : {}),
            ...(link ? { link } : {}),
            ...(pii ? { pii } : {}),
        },
    };
}
function maskPhone(phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 4)
        return "XXXX";
    const last = digits.slice(-4);
    if (digits.length === 12 && digits.startsWith("91"))
        return `+91 XXXXXX${last}`;
    return `${"X".repeat(Math.max(2, digits.length - 4))}${last}`;
}
function telUrl(phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 6)
        return null;
    if (digits.length === 10 && /^[6-9]/.test(digits))
        return `tel:+91${digits}`;
    if (digits.length === 12 && /^91[6-9]/.test(digits))
        return `tel:+${digits}`;
    return `tel:${phone.trim().startsWith("+") ? "+" : ""}${digits}`;
}
  return { EVENT_SOURCES, SEVERITIES, STATUSES, TITLE_MAX, SUMMARY_MAX, BODY_MAX, scrubText, validateEvent, maskPhone, telUrl };
})();

// integrations/windmill/notify/lib/emit.ts
const { InvalidEventError, emit, tryEmit } = (() => {
class InvalidEventError extends Error {
    errors;
    constructor(errors) {
        super(`invalid notification event: ${errors.join("; ")}`);
        this.name = "InvalidEventError";
        this.errors = errors;
    }
}
async function emit(input, options = {}) {
    const now = options.now ?? new Date();
    const checked = validateEvent({ v: 1, ...input }, now);
    if (!checked.ok)
        throw new InvalidEventError(checked.errors);
    if (options.store)
        return options.store.insertEvent(checked.event, now);
    return withNotifyDb((sql) => pgNotifyStore(sql).insertEvent(checked.event, now));
}
async function tryEmit(input, options = {}) {
    try {
        await emit(input, options);
        return true;
    }
    catch (err) {
        console.error("notify: emit failed:", err instanceof InvalidEventError ? err.message : err instanceof Error ? err.name : "unknown error");
        return false;
    }
}
  return { InvalidEventError, emit, tryEmit };
})();

export async function main() {
    const apiKey = await config("fast2sms_api_key");
    const crm = await twentyFromConfig().catch(() => null);
    const testPhones = parseTestPhones(await config("crew_test_phones").catch(() => ""));
    const result = await withTalentDb((query) => runCrew({
        query,
        crm,
        sendWhatsApp: (message, templateId) => sendWhatsAppTemplate(message, templateId, apiKey),
        lookupWhatsApp: (id) => lookupWhatsAppReport(id, apiKey),
        notify: tryEmit,
        testPhones,
    }));
    if (result.errors.length)
        console.error(`crew: ${result.errors.length} error(s): ${result.errors.join(" | ")}`);
    return result;
}

