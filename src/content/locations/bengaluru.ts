import type { FaqItem } from "../types";
import type { LocationCopy } from "./types";
import { wageStatePath } from "@/content/registry/identifiers";

/**
 * Bengaluru: the hub and four industrial areas, on the location page
 * structure (owner direction, 17 Oct 2026). Facts from the research of 16 and
 * 17 Oct 2026, each cited in `sources`. Peenya (a Special Investment Region)
 * and Electronic City (an industrial township) are asked to confirm their
 * wage zone. No tenant names, headcounts or registration claims; security
 * guards are out of scope (no PSARA licence). Wages link to the Karnataka
 * wage page.
 */

const RULES_LINK = { href: wageStatePath("karnataka"), label: "Karnataka minimum wages" };

const KA_DUES = "Professional Tax is ₹200 a month on wages of ₹25,000 or more, and the Labour Welfare Fund is ₹50 from the worker and ₹100 from the employer each year.";

const wagesFaq = (zone: string): FaqItem => ({
  question: "Which minimum wage and rules apply?",
  answer: `Karnataka's notification of 22 May 2026, by skill and zone; ${zone} ${KA_DUES}`,
  link: RULES_LINK,
  category: "compliance",
});

const SRC = {
  rename: { label: "Bengaluru: renamed from Bangalore on 1 November 2014", url: "https://en.wikipedia.org/wiki/Bengaluru" },
  investUrban: { label: "Invest Karnataka: Bengaluru Urban district", url: "https://investkarnataka.co.in/our-districts/bengaluru-urban/" },
  investRural: { label: "Invest Karnataka: Bengaluru Rural district", url: "https://investkarnataka.co.in/our-districts/bengaluru-rural/" },
  investKolar: { label: "Invest Karnataka: Kolar district", url: "https://investkarnataka.co.in/our-districts/kolar/" },
  msmeDi: { label: "MSME-DI: Bangalore Urban district industrial profile (2012)", url: "https://dcmsme.gov.in/dips/Bangalore%20Urban%20District.pdf" },
  elcita: { label: "ELCITA: Electronic City Industrial Township Authority", url: "https://www.elcita.in/" },
  peenyaSir: { label: "India Briefing: Karnataka notifies Peenya as a Special Investment Region", url: "https://www.india-briefing.com/news/karnataka-notifies-peenya-as-special-investment-region-38147.html/" },
  gba: { label: "Deccan Herald: Greater Bengaluru area to remain the BBMP area", url: "https://www.deccanherald.com/amp/story/india%2Fkarnataka%2Fbengaluru%2Fgreater-bengaluru-area-to-remain-same-as-bbmp-area-three-corporations-likely-3542788" },
  greenLine: { label: "Green Line (Namma Metro)", url: "https://en.wikipedia.org/wiki/Green_Line_(Namma_Metro)" },
  yellowLine: { label: "Yellow Line (Namma Metro)", url: "https://en.wikipedia.org/wiki/Yellow_Line_(Namma_Metro)" },
  purpleLine: { label: "Purple Line (Namma Metro)", url: "https://en.wikipedia.org/wiki/Purple_Line_(Namma_Metro)" },
  warehouse2026: { label: "Tribune (Cushman & Wakefield): Bengaluru warehouse leasing, H1 2026", url: "https://www.tribuneindia.com/news/business/bengaluru-warehouse-leasing-jumps-78-to-3-1-msf-in-h1-2026-fastest-growth-among-major-markets/" },
  strr: { label: "Asianet: Bengaluru–Chennai Expressway and STRR stretches open", url: "https://newsable.asianetnews.com/karnataka-news/bengaluru-chennai-expressway-new-25-km-stretch-opens-100-km-now-accessible-toll-charges-announced-articleshow-b071o72" },
  attibele: { label: "Attibele", url: "https://en.wikipedia.org/wiki/Attibele" },
  narasapura: { label: "Narasapura Industrial Area", url: "https://en.wikipedia.org/wiki/Narasapura_Industrial_Area" },
  eastCorp: { label: "Bengaluru East City Corporation", url: "https://en.wikipedia.org/wiki/Bengaluru_East_City_Corporation" },
  kaWages: { label: "Karnataka Labour Department: single minimum wage notification, 22 May 2026", url: "https://karmikaspandana.karnataka.gov.in/uploads/media_to_upload1780292271.pdf" },
};

export const bengaluruPages: LocationCopy[] = [
  {
    cluster: "bengaluru",
    name: "Bengaluru",
    placeId: "bengaluru",
    metaTitle: "Labour Contractor and Manpower Supplier in Bangalore",
    description:
      "Labour supplier for factories, warehouses and campuses in Bangalore: supervised contract workers in Peenya, Bommasandra, Jigani, Electronic City and Hoskote.",
    heading: "Labour contractor and manpower supplier in Bengaluru.",
    lede: "Supervised contract workers for factories, warehouses and campuses across Bengaluru's industrial belts.",
    paragraph:
      "Bengaluru, named Bangalore until 2014, has its factories and warehouses in four belts around the city, most of them KIADB industrial areas: engineering in the north-west, pharma and chemicals on Hosur Road, electronics and tech campuses in the south and east, and new warehousing along Old Madras Road. We take requirements from units in {areas}.",
    areas: [
      { href: "/locations/bengaluru/peenya", name: "Peenya" },
      { href: "/locations/bengaluru/bommasandra-jigani-attibele", name: "Bommasandra, Jigani and Attibele" },
      { href: "/locations/bengaluru/electronic-city-whitefield", name: "Electronic City and Whitefield" },
      { href: "/locations/bengaluru/hoskote-narasapura", name: "Hoskote and Narasapura" },
    ],
    faqs: [
      {
        question: "Are you a manpower supplier in Bangalore?",
        answer: "Yes. We supply contract labour: supervised factory, loading and unloading, and housekeeping crews, on our payroll and run on your site by our supervisor.",
        category: "commercial",
      },
      {
        question: "Do you have workers in Bengaluru?",
        answer: "We keep a worker list for Bengaluru, and job seekers across the city join it on our Bengaluru jobs page. We build each crew from it for your site.",
        category: "operations",
      },
      wagesFaq("the zone depends on the address, so we confirm it with you before pricing."),
      {
        question: "Can you supply security guards?",
        answer: "No. Security work needs a private security agency licence, which we don't hold.",
        category: "commercial",
      },
    ],
    sources: [SRC.rename, SRC.investUrban, SRC.investRural, SRC.investKolar, SRC.msmeDi, SRC.kaWages, SRC.gba],
  },
  {
    cluster: "bengaluru",
    estate: "peenya",
    name: "Peenya",
    placeId: "peenya",
    metaTitle: "Labour Contractor in Peenya Industrial Area, Bangalore",
    description:
      "Manpower supplier for Peenya Industrial Area and the Nelamangala–Dabaspet belt in Bangalore: supervised factory, loading and housekeeping crews.",
    heading: "Labour contractor in Peenya Industrial Area.",
    lede: "Supervised crews for Peenya's engineering and garment units, and for the Nelamangala warehouse belt beyond it.",
    paragraph:
      "Peenya is Bengaluru's oldest large engineering base, on Tumakuru Road: about 1,461 acres of KIADB industrial area beside KSSIDC's Peenya Industrial Estate, notified as a Special Investment Region in 2025. Its units are mostly CNC machining, die-casting, fabrication, tooling and garments.",
    faqs: [
      {
        question: "Do you supply contract labour in Peenya?",
        answer: "Yes. Supervised factory, loading and unloading, and housekeeping crews for units across Peenya's phases and the KSSIDC estate.",
        category: "commercial",
      },
      {
        question: "Can you supply machine-shop helpers, and cover the Nelamangala warehouses?",
        answer: "Yes. Shop-floor helpers, packers and material handlers for Peenya's units, and loading, picking and packing crews for the Nelamangala and Dabaspet warehouse belt.",
        category: "operations",
      },
      wagesFaq("we confirm Peenya's zone for your address before pricing."),
      {
        question: "How do workers reach Peenya?",
        answer: "Most use the Green Line, which has five stations through the area, or buses on Tumakuru Road. Sites on the Nelamangala side need buses or company transport.",
        category: "operations",
      },
    ],
    sources: [SRC.peenyaSir, SRC.msmeDi, SRC.greenLine, SRC.warehouse2026, SRC.kaWages],
  },
  {
    cluster: "bengaluru",
    estate: "bommasandra-jigani-attibele",
    name: "Bommasandra, Jigani and Attibele",
    placeId: "bommasandra-jigani-attibele",
    metaTitle: "Labour Contractor in Bommasandra and Jigani, Bangalore",
    description:
      "Labour supplier for Bommasandra, Jigani and Attibele industrial areas on Hosur Road, Bangalore: supervised factory, loading and housekeeping crews.",
    heading: "Labour contractor in Bommasandra, Jigani and Attibele.",
    lede: "Supervised crews for the KIADB parks on Hosur Road and in Anekal taluk, up to the Tamil Nadu border.",
    paragraph:
      "Bommasandra, Jigani and Attibele are KIADB industrial areas in Anekal taluk, along Hosur Road and the NICE Road, with KSSIDC estates among them. The belt leans to pharma, API and chemical units, with cold storage and a stone-cutting cluster in Jigani, and runs to the Tamil Nadu border at Attibele.",
    faqs: [
      {
        question: "Do you supply contract labour in Bommasandra, Jigani and Attibele?",
        answer: "Yes. Supervised factory, loading and unloading, and housekeeping crews, working under your site's induction, hygiene and PPE rules.",
        category: "commercial",
      },
      {
        question: "Our workers live in Hosur. Which state's rates apply?",
        answer: "The site's. A crew working in Karnataka is paid at least Karnataka's rate for the zone, whatever state the workers live in.",
        category: "compliance",
      },
      wagesFaq("these areas are in Zone 3."),
      {
        question: "Is there a metro to these sites?",
        answer: "To Bommasandra, yes: the Yellow Line ends at Hebbagodi and Bommasandra. Jigani and Attibele need buses or company transport.",
        category: "operations",
      },
    ],
    sources: [SRC.investUrban, SRC.msmeDi, SRC.attibele, SRC.yellowLine, SRC.gba, SRC.kaWages],
  },
  {
    cluster: "bengaluru",
    estate: "electronic-city-whitefield",
    name: "Electronic City and Whitefield",
    placeId: "electronic-city-whitefield",
    metaTitle: "Manpower Supply in Electronic City and Whitefield",
    description:
      "Supervised housekeeping, factory and loading crews for Electronic City and Whitefield in Bangalore: electronics, biotech units and large tech campuses.",
    heading: "Contract labour in Electronic City and Whitefield.",
    lede: "Supervised crews for electronics and biotech units, and for the facility work of Bengaluru's large tech campuses.",
    paragraph:
      "Electronic City and Whitefield are Bengaluru's two technology districts, at opposite ends of the city. Electronic City is an industrial township of about 903 acres run by its own authority, ELCITA; Whitefield grew around KIADB's Export Promotion Industrial Park. Both hold electronics and biotech units alongside large tech campuses.",
    faqs: [
      {
        question: "Do you supply contract labour in Electronic City and Whitefield?",
        answer: "Yes. Housekeeping and facility crews for campuses, and helpers and packers for electronics and biotech units, under your hygiene and gowning rules.",
        category: "commercial",
      },
      {
        question: "Can you run housekeeping for a tech campus, including security?",
        answer: "Housekeeping, pantry and washroom teams, yes, with our supervisor checking the routine through the day. Security, no: it needs a private security agency licence, which we don't hold.",
        category: "operations",
      },
      wagesFaq("Whitefield is Zone 1, and we confirm Electronic City's zone for your address before pricing."),
      {
        question: "How do workers reach these sites?",
        answer: "By metro: the Yellow Line serves Electronic City, and the Purple Line runs through Hoodi and Kundalahalli to Whitefield.",
        category: "operations",
      },
    ],
    sources: [SRC.elcita, SRC.msmeDi, SRC.eastCorp, SRC.yellowLine, SRC.purpleLine, SRC.gba, SRC.kaWages],
  },
  {
    cluster: "bengaluru",
    estate: "hoskote-narasapura",
    name: "Hoskote and Narasapura",
    placeId: "hoskote-narasapura",
    metaTitle: "Labour Contractor in Hoskote and Narasapura",
    description:
      "Manpower supplier for Hoskote's warehouses and KIADB Narasapura, east of Bangalore: supervised loading, factory and housekeeping crews on Old Madras Road.",
    heading: "Labour contractor in Hoskote and Narasapura.",
    lede: "Supervised crews for the eastern warehouse belt and the KIADB industrial area at Narasapura in Kolar district.",
    paragraph:
      "East of the city, Hoskote took 46% of Bengaluru's warehouse leasing in the first half of 2026, mostly logistics and e-commerce. Narasapura, about 55 km out in Kolar district, is a KIADB industrial area of about 700 acres with a second phase notified, making automobile, smartphone and machinery components.",
    faqs: [
      {
        question: "Do you supply contract labour in Hoskote and Narasapura?",
        answer: "Yes. Loading, picking, packing and dispatch crews for Hoskote's warehouses, and supervised shop-floor helpers and packers for Narasapura's factories.",
        category: "commercial",
      },
      {
        question: "How do crews get to sites 50 km out?",
        answer: "There is no metro, and Narasapura is about 15 km from Kolar and Malur stations. We plan company transport or housing for the crew with you before it starts.",
        category: "operations",
      },
      wagesFaq("Hoskote and Narasapura are in Zone 3."),
      {
        question: "How do we start?",
        answer: "Request a crew with the site address and the roles. We'll tell you plainly whether we can staff it, and plan the crew from there.",
        category: "commercial",
      },
    ],
    sources: [SRC.investRural, SRC.investKolar, SRC.narasapura, SRC.warehouse2026, SRC.strr, SRC.kaWages],
  },
];
