/**
 * "Request a crew" (PLAN §8.1): what the server works out from a business
 * enquiry, and how a prefilled link maps onto the form.
 *
 * The flags are for our team only. They go into the email to the shared
 * inbox and never into the response, the page or the buyer's copy.
 */
import {
  contactOptionLabel,
  HEADCOUNT_BAND_OPTIONS,
  knownCluster,
  REQUEST_TYPE_OPTIONS,
  ROLE_OPTIONS,
  SHIFT_PATTERN_OPTIONS,
  START_WINDOW_OPTIONS,
  DURATION_BAND_OPTIONS,
  STATE_OPTIONS,
  type ContactFormData,
} from "@/lib/contact-contract";

/**
 * Version of the privacy notice a business enquiry is sent under, shown in
 * the staff email so each lead record says which notice applied. Earlier
 * enquiries carry no version and fall under the notice of their date.
 * 2026-10-16: the requirement fields and 24-month leads retention (PLAN §8.3).
 */
export const BUSINESS_NOTICE_VERSION = "2026-10-16";

/** 20 or more workers (owner decision 14, 16 October 2026). */
const QUALIFYING_HEADCOUNT = new Set(["20-49", "50-99", "100-249", "250+"]);
/** 3 months or more. */
const QUALIFYING_DURATION = new Set(["3-12-months", "ongoing"]);
/** Starting within 4 weeks: a label for follow-up order, never a gate. */
const SOON = new Set(["within-1-week", "2-4-weeks"]);

/** A number of workers as a band, for older senders' free-text `headcount`. */
export function headcountToBand(value: string | undefined) {
  if (!value) return undefined;
  if (value in HEADCOUNT_BAND_OPTIONS) return value;
  // "50", "50 workers", "about 120", "40-60" (the upper figure counts).
  const numbers = value.replace(/,/g, "").match(/\d+/g)?.map(Number);
  if (!numbers?.length || numbers.length > 2) return undefined;
  const n = Math.max(...numbers);
  if (!Number.isFinite(n) || n < 1 || n > 100_000) return undefined;
  if (n < 10) return "1-9";
  if (n < 20) return "10-19";
  if (n < 50) return "20-49";
  if (n < 100) return "50-99";
  if (n < 250) return "100-249";
  return "250+";
}

/**
 * Out of scope, by keyword: security staff (no PSARA licence), household
 * staff, new-build construction, overseas work, and job seekers on the
 * business form. A hint for whoever replies, not a filter: nothing is
 * rejected. Bare words that also name in-scope work stay out ("machine
 * guards", "canteen cooks", "truck drivers", "civil works", "Gulf Oil",
 * "naukri.com"): a pattern needs the out-of-scope context next to it.
 */
const OUT_OF_SCOPE: { id: string; label: string; pattern: RegExp }[] = [
  {
    id: "security",
    label: "Security guards: we cannot supply security staff (no PSARA licence)",
    pattern:
      /\b(security\s*(guards?|staff|personnel|services?|agency)|(night|gate|armed|lady)\s*guards?|guards?\s+for\s+(the\s+|our\s+)?(gate|night|site|factory|plant|premises|building|campus)|bouncers?|gunm[ae]n|watchm[ae]n|chowkidars?)\b|सिक्योरिटी|सुरक्षा\s*गार्ड|चौकीदार/i,
  },
  {
    id: "household",
    label: "Household staff (maids, home cooks, personal drivers): not a service we offer",
    pattern:
      /\b(maids?|house\s*(help|maid|keeper)|home\s*(cleaning|maid|cook|nurse)|domestic\s*(help|staff|workers?)|nann(y|ies)|babysitter|(home|house|family|personal)\s*cooks?|cooks?\s+for\s+(my|our)\s+(home|house|family)|(personal|family|private|car)\s*drivers?|drivers?\s+for\s+(my|our)\s+(car|home|house|family)|chauffeurs?)\b|कामवाली/i,
  },
  {
    id: "construction",
    label: "New-build construction labour: not a service we offer (civil repairs and plant modifications are)",
    pattern:
      /\b(building\s*construction|construction\s*sites?|shuttering|bar\s*benders?|raj\s*mistri|beldars?)\b|निर्माण\s*स्थल/i,
  },
  {
    id: "overseas",
    label: "Overseas or Gulf placement: not offered",
    pattern:
      /\b(overseas|abroad|foreign\s*country|work\s*visa|(jobs?|work|workers?|placements?|manpower|labou?r)\s+(in|for|to)\s+(the\s+)?(gulf|dubai|saudi(\s*arabia)?|qatar|kuwait|oman|bahrain|uae))\b|विदेश/i,
  },
  {
    id: "job-seeker",
    label: "Looks like a job seeker: reply with the /jobs/apply link in their language, do not phone",
    pattern:
      /\b(i\s*(need|want)\s*(a\s*)?(job|work)|need\s*(a\s*)?job|looking\s*for\s*(a\s*)?(job|work)|job\s*chahiye|naukri\s*chahiye|kaam\s*chahiye|mujhe\s*(job|kaam|naukri)|i\s*am\s*(a\s*)?fresher|my\s*(resume|cv|biodata))\b|नौकरी\s*चाहिए|काम\s*चाहिए/i,
  },
];

export interface CrewAssessment {
  /** A crew or site-assessment request; false for compliance help, which is not judged as a crew lead. */
  crew: boolean;
  /** 20+ workers and 3+ months. */
  qualified: boolean;
  /** Starting within 4 weeks (soft label). */
  soon: boolean;
  /** Out-of-scope hints, by id. */
  outOfScope: string[];
  headcountBand?: string;
}

export function assessCrewRequest(data: ContactFormData): CrewAssessment {
  const headcountBand = data.headcountBand ?? headcountToBand(data.headcount);
  const crew = data.requestType !== "compliance-help";
  const qualified =
    crew &&
    Boolean(headcountBand && QUALIFYING_HEADCOUNT.has(headcountBand)) &&
    Boolean(data.durationBand && QUALIFYING_DURATION.has(data.durationBand));
  const soon = crew && Boolean(data.startWindow && SOON.has(data.startWindow));
  const text = [data.details, data.industry, data.shiftRequirement].filter(Boolean).join("\n");
  const outOfScope = OUT_OF_SCOPE.filter((rule) => rule.pattern.test(text)).map((rule) => rule.id);
  return { crew, qualified, soon, outOfScope, headcountBand };
}

export function outOfScopeLabel(id: string) {
  return OUT_OF_SCOPE.find((rule) => rule.id === id)?.label ?? id;
}

/** "City, State, PIN" from the structured fields, else the older free text. */
export function siteLine(data: ContactFormData) {
  const structured = [data.siteCity, contactOptionLabel("siteState", data.siteState), data.sitePincode]
    .filter(Boolean)
    .join(", ");
  return structured || data.location;
}

/** The requirement as "Label: value" lines, for the emails and the form's recap. */
export function requirementLines(data: ContactFormData) {
  const roles = data.roles?.map((id) => ROLE_OPTIONS[id] ?? id).join(", ");
  const band = data.headcountBand ?? headcountToBand(data.headcount);
  const lines: [string, string | undefined][] = [
    // Only what differs from the default (a crew) is named.
    ["Request", data.requestType && data.requestType !== "crew" ? REQUEST_TYPE_OPTIONS[data.requestType] : undefined],
    ["Work", roles],
    // "Workers: 50 to 99", not "Workers: 50 to 99 workers".
    ["Workers", band ? HEADCOUNT_BAND_OPTIONS[band].replace(/ workers$/, "") : data.headcount],
    ["Site", siteLine(data)],
    ["Start", data.startWindow ? START_WINDOW_OPTIONS[data.startWindow] : data.targetStartDate],
    ["Duration", data.durationBand ? DURATION_BAND_OPTIONS[data.durationBand] : undefined],
    ["Shifts", data.shiftPattern ? SHIFT_PATTERN_OPTIONS[data.shiftPattern] : data.shiftRequirement],
    ["Industry", data.industry],
  ];
  return lines.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`);
}

/* ---------- Prefilled links (#roles=…&headcount=…&state=…&city=…) ---------- */

type Place = { state: string; city: string; cluster: string };

/**
 * Places a link may name in `#location=`: cluster ids and Haridwar's
 * industrial areas (the sections of /haridwar-sidcul). Anything else is
 * taken as the city as typed.
 */
const KNOWN_PLACES: Record<string, Place> = {
  haridwar: { state: "UK", city: "Haridwar", cluster: "haridwar" },
  sidcul: { state: "UK", city: "SIDCUL Haridwar", cluster: "haridwar" },
  "sidcul-haridwar": { state: "UK", city: "SIDCUL Haridwar", cluster: "haridwar" },
  bhagwanpur: { state: "UK", city: "Bhagwanpur, Haridwar", cluster: "haridwar" },
  bahadrabad: { state: "UK", city: "Bahadrabad, Haridwar", cluster: "haridwar" },
  roorkee: { state: "UK", city: "Roorkee, Haridwar", cluster: "haridwar" },
};

/** Words in free text that place a site in Uttarakhand's Haridwar district. */
const HARIDWAR_WORDS = /\b(haridwar|sidcul|bhagwanpur|bahadrabad|roorkee|ranipur|jwalapur|laksar)\b/i;

const STATE_BY_NAME = Object.fromEntries(
  Object.entries(STATE_OPTIONS).map(([code, name]) => [name.toLowerCase(), code])
);

function stateCode(value: string | undefined) {
  if (!value) return undefined;
  const upper = value.trim().toUpperCase();
  if (upper in STATE_OPTIONS) return upper;
  return STATE_BY_NAME[value.trim().toLowerCase()];
}

const pick = (options: Record<string, string>, value: string | undefined) =>
  value && value in options ? value : undefined;

export interface CrewPrefill {
  fields: Partial<Pick<ContactFormData, "name" | "phone" | "email" | "company" | "role" | "roles" | "headcountBand" | "siteState" | "siteCity" | "sitePincode" | "startWindow" | "durationBand" | "shiftPattern" | "pageCluster">>;
  /** Values that have no field of their own, as lines for the details box. */
  extraLines: string[];
}

/** Map a link's fragment values onto the form. Unknown ids are kept as text, never dropped silently. */
export function crewPrefill(values: Partial<Record<string, string>>): CrewPrefill {
  const fields: CrewPrefill["fields"] = {};
  const extraLines: string[] = [];
  for (const key of ["name", "phone", "email", "company", "role"] as const) {
    if (values[key]) fields[key] = values[key];
  }

  const roles = values.roles
    ?.split(",")
    .map((id) => id.trim())
    .filter((id, i, all) => id in ROLE_OPTIONS && all.indexOf(id) === i);
  if (roles?.length) fields.roles = roles;

  const band = headcountToBand(values.headcount);
  if (band) fields.headcountBand = band;
  else if (values.headcount) extraLines.push(`Workers: ${values.headcount}`);

  const location = values.location?.trim();
  const place = location ? KNOWN_PLACES[location.toLowerCase()] : undefined;
  const cluster = knownCluster(values.cluster) ?? place?.cluster;
  if (cluster) fields.pageCluster = cluster;
  const city = values.city?.trim() || place?.city || location;
  if (city) fields.siteCity = city.slice(0, 120);
  const state = stateCode(values.state) ?? place?.state ?? (city && HARIDWAR_WORDS.test(city) ? "UK" : undefined);
  if (state) fields.siteState = state;
  if (values.pincode && /^[1-9][0-9]{5}$/.test(values.pincode.trim())) fields.sitePincode = values.pincode.trim();

  const start = pick(START_WINDOW_OPTIONS, values.start);
  if (start) fields.startWindow = start;
  else if (values.start) extraLines.push(`Target start: ${values.start}`);

  const duration = pick(DURATION_BAND_OPTIONS, values.duration);
  if (duration) fields.durationBand = duration;
  else if (values.duration) extraLines.push(`Duration: ${values.duration}`);

  const shifts = pick(SHIFT_PATTERN_OPTIONS, values.shifts);
  if (shifts) fields.shiftPattern = shifts;
  else if (values.shifts) extraLines.push(`Shifts: ${values.shifts}`);

  if (values.industry) extraLines.push(`Industry: ${values.industry}`);
  return { fields, extraLines };
}
