/**
 * Primary sources the guides cite: the Codes as enacted, the Gazette of
 * India notifications that brought them into force, the central rules and
 * the state rules we have seen in the state's own gazette. A guide cites a
 * source in its text as [[id]]; an id that is not here fails the build.
 *
 * Every entry was opened and read on `retrievedOn`. Where the government
 * does not publish a copy we could fetch, `url` is left out and the page
 * cites the number and date only. Summary sites are never a source.
 */
export type GuideSourceKind = "act" | "notification" | "rules" | "scheme" | "press-release" | "listing";

export type GuideSource = {
  id: string;
  kind: GuideSourceKind;
  title: string;
  /** Act number, S.O. or G.S.R. number, or the state's notification number. */
  number?: string;
  /** ISO date of the document (assent, notification or publication). */
  date: string;
  authority: string;
  /** "India" or the state. */
  jurisdiction: string;
  url?: string;
  language: "en" | "hi";
  retrievedOn: string;
};

const CHECKED = "2026-10-16";
const MOLE = "Ministry of Labour and Employment, Government of India";
const GAZETTE = "https://egazette.gov.in/WriteReadData";
/** Uttarakhand Labour Department's document store. */
const UK_FILES = "https://cdnbbsr.s3waas.gov.in/s36547884cea64550284728eb26b0947ef/uploads";

export const guideSources: readonly GuideSource[] = [
  // ── The Codes ────────────────────────────────────────────────────────────
  {
    id: "code-wages",
    kind: "act",
    title: "The Code on Wages, 2019",
    number: "Act No. 29 of 2019",
    date: "2019-08-08",
    authority: "Parliament of India",
    jurisdiction: "India",
    url: "https://www.indiacode.nic.in/handle/123456789/15793",
    language: "en",
    retrievedOn: CHECKED,
  },
  {
    id: "code-ir",
    kind: "act",
    title: "The Industrial Relations Code, 2020",
    number: "Act No. 35 of 2020",
    date: "2020-09-28",
    authority: "Parliament of India",
    jurisdiction: "India",
    url: "https://www.indiacode.nic.in/handle/123456789/22040",
    language: "en",
    retrievedOn: CHECKED,
  },
  {
    id: "code-ss",
    kind: "act",
    title: "The Code on Social Security, 2020",
    number: "Act No. 36 of 2020",
    date: "2020-09-28",
    authority: "Parliament of India",
    jurisdiction: "India",
    url: "https://www.indiacode.nic.in/handle/123456789/16823",
    language: "en",
    retrievedOn: CHECKED,
  },
  {
    id: "code-osh",
    kind: "act",
    title: "The Occupational Safety, Health and Working Conditions Code, 2020",
    number: "Act No. 37 of 2020",
    date: "2020-09-28",
    authority: "Parliament of India",
    jurisdiction: "India",
    url: "https://www.indiacode.nic.in/handle/123456789/22041",
    language: "en",
    retrievedOn: CHECKED,
  },
  {
    id: "clra-1970",
    kind: "act",
    title: "The Contract Labour (Regulation and Abolition) Act, 1970 (repealed by the OSH Code)",
    number: "Act No. 37 of 1970",
    date: "1970-09-05",
    authority: "Parliament of India",
    jurisdiction: "India",
    url: `${UK_FILES}/2025/04/20250414207825416.pdf`,
    language: "en",
    retrievedOn: CHECKED,
  },

  // ── Commencement, 21 November 2025 ──────────────────────────────────────
  {
    id: "pib-codes-effective",
    kind: "press-release",
    title: "Government Makes the Four Labour Codes effective to Simplify and Streamline Labour Laws",
    number: "PIB Release ID 2192463",
    date: "2025-11-21",
    authority: `Press Information Bureau, for the ${MOLE}`,
    jurisdiction: "India",
    url: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2192463",
    language: "en",
    retrievedOn: CHECKED,
  },
  {
    id: "so-5322",
    kind: "notification",
    title: "Commencement of the Code on Wages, 2019 (Gazette of India, Extraordinary)",
    number: "S.O. 5322(E)",
    date: "2025-11-21",
    authority: MOLE,
    jurisdiction: "India",
    url: `${GAZETTE}/2025/267885.pdf`,
    language: "en",
    retrievedOn: CHECKED,
  },
  {
    id: "so-5320",
    kind: "notification",
    title: "Commencement of the Industrial Relations Code, 2020 (Gazette of India, Extraordinary)",
    number: "S.O. 5320(E)",
    date: "2025-11-21",
    authority: MOLE,
    jurisdiction: "India",
    url: `${GAZETTE}/2025/267883.pdf`,
    language: "en",
    retrievedOn: CHECKED,
  },
  {
    id: "so-5319",
    kind: "notification",
    title: "Commencement of the Code on Social Security, 2020 (Gazette of India, Extraordinary)",
    number: "S.O. 5319(E)",
    date: "2025-11-21",
    authority: MOLE,
    jurisdiction: "India",
    url: `${GAZETTE}/2025/267882.pdf`,
    language: "en",
    retrievedOn: CHECKED,
  },
  {
    id: "so-5321",
    kind: "notification",
    title: "Commencement of the Occupational Safety, Health and Working Conditions Code, 2020 (Gazette of India, Extraordinary)",
    number: "S.O. 5321(E)",
    date: "2025-11-21",
    authority: MOLE,
    jurisdiction: "India",
    url: `${GAZETTE}/2025/267884.pdf`,
    language: "en",
    retrievedOn: CHECKED,
  },

  // ── Central rules and schemes, 2026 ─────────────────────────────────────
  {
    id: "gsr-343",
    kind: "rules",
    title: "Code on Wages (Central) Rules, 2026",
    number: "G.S.R. 343(E)",
    date: "2026-05-08",
    authority: MOLE,
    jurisdiction: "India",
    url: `${GAZETTE}/2026/272365.pdf`,
    language: "en",
    retrievedOn: CHECKED,
  },
  {
    id: "gsr-342",
    kind: "rules",
    title: "Industrial Relations (Central) Rules, 2026",
    number: "G.S.R. 342(E)",
    date: "2026-05-08",
    authority: MOLE,
    jurisdiction: "India",
    url: `${GAZETTE}/2026/272336.pdf`,
    language: "en",
    retrievedOn: CHECKED,
  },
  {
    id: "gsr-344",
    kind: "rules",
    title: "Social Security (Central) Rules, 2026",
    number: "G.S.R. 344(E)",
    date: "2026-05-08",
    authority: MOLE,
    jurisdiction: "India",
    url: `${GAZETTE}/2026/272366.pdf`,
    language: "en",
    retrievedOn: CHECKED,
  },
  {
    id: "gsr-345",
    kind: "rules",
    title: "Occupational Safety, Health and Working Conditions (Central) Rules, 2026",
    number: "G.S.R. 345(E)",
    date: "2026-05-08",
    authority: MOLE,
    jurisdiction: "India",
    url: `${GAZETTE}/2026/272379.pdf`,
    language: "en",
    retrievedOn: CHECKED,
  },
  {
    id: "gsr-525",
    kind: "scheme",
    title: "Employees' Provident Funds Scheme, 2026",
    number: "G.S.R. 525(E)",
    date: "2026-06-29",
    authority: MOLE,
    jurisdiction: "India",
    url: `${GAZETTE}/2026/273957.pdf`,
    language: "en",
    retrievedOn: CHECKED,
  },

  // ── State rules ─────────────────────────────────────────────────────────
  {
    id: "uk-wages-rules",
    kind: "rules",
    title: "Uttarakhand Code on Wages Rules, 2026 (Uttarakhand Gazette, Extraordinary)",
    number: "1115/VIII-I/2026-60(Shram)/2019",
    date: "2026-08-25",
    authority: "Shram Anubhag, Government of Uttarakhand",
    jurisdiction: "Uttarakhand",
    url: `${UK_FILES}/2026/09/202609241754770724.pdf`,
    language: "hi",
    retrievedOn: CHECKED,
  },
  {
    id: "uk-ir-rules",
    kind: "rules",
    title: "Uttarakhand Industrial Relations Rules, 2026 (Uttarakhand Gazette, Extraordinary)",
    number: "1117/VIII-I/2026-39(Shram)2018",
    date: "2026-08-25",
    authority: "Shram Anubhag, Government of Uttarakhand",
    jurisdiction: "Uttarakhand",
    url: `${UK_FILES}/2026/09/20260924196250226.pdf`,
    language: "hi",
    retrievedOn: CHECKED,
  },
  {
    id: "uk-acts-rules",
    kind: "listing",
    title: "Acts and Rules, Labour Department, Government of Uttarakhand (lists the Social Security and OSH rules as proposed rules)",
    date: "2026-10-16",
    authority: "Labour Department, Government of Uttarakhand",
    jurisdiction: "Uttarakhand",
    url: "https://labour.uk.gov.in/document-category/acts-rules/",
    language: "en",
    retrievedOn: CHECKED,
  },
  {
    id: "up-wages-rules",
    kind: "rules",
    title: "Uttar Pradesh Code on Wages Rules, 2026 (Uttar Pradesh Gazette, Extraordinary)",
    number: "1377/36-03-2026-1901341",
    date: "2026-08-12",
    authority: "Shram Anubhag-3, Government of Uttar Pradesh",
    jurisdiction: "Uttar Pradesh",
    language: "hi",
    retrievedOn: CHECKED,
  },
  {
    id: "up-osh-rules",
    kind: "rules",
    title: "Uttar Pradesh Occupational Safety, Health and Working Conditions Rules, 2026 (Uttar Pradesh Gazette, Extraordinary)",
    number: "962/36-3-2026-1903305",
    date: "2026-08-27",
    authority: "Shram Anubhag, Government of Uttar Pradesh",
    jurisdiction: "Uttar Pradesh",
    language: "hi",
    retrievedOn: CHECKED,
  },
  {
    id: "up-ss-rules",
    kind: "rules",
    title: "Uttar Pradesh Code on Social Security Rules, 2026 (Uttar Pradesh Gazette, Extraordinary)",
    number: "1431/36-3-2026-1399661",
    date: "2026-08-27",
    authority: "Shram Anubhag-3, Government of Uttar Pradesh",
    jurisdiction: "Uttar Pradesh",
    language: "hi",
    retrievedOn: CHECKED,
  },
];

export function guideSource(id: string): GuideSource {
  const source = guideSources.find((s) => s.id === id);
  if (!source) throw new Error(`Unknown guide source "${id}"`);
  return source;
}
