import type { FaqItem } from "../types";
import type { LocationCopy } from "./types";

/**
 * The Jalandhar region, Punjab: the hub and three industrial clusters, with
 * Kapurthala as a cluster of its own (owner direction, 17 Oct 2026), on the
 * location page structure. Business only: since 20 Oct 2026 Kapurthala
 * district (Phagwara included) is a jobs market of its own, so its pages
 * send job seekers to /jobs/kapurthala (`jobsMarket`). Facts from the research of 17 Oct 2026, each
 * cited in `sources`; MSME-DI district profiles carry 2010–11 data, so their
 * figures are named as theirs. Road distances not in a source are left out.
 * No tenant names (the Rail Coach Factory, the mills and the focal point's
 * plants included), registrations, headcount or shift claims; security
 * guards are out of scope (no PSARA licence).
 */

const WAGES_LINK = { href: "/minimum-wages/punjab", label: "Punjab minimum wages" };

const wagesFaq: FaqItem = {
  question: "Which minimum wage and rules apply?",
  answer:
    "Punjab's, with one rate for the whole state: ₹13,486 a month unskilled from 1 May 2026. The ₹200 development tax applies only to income-tax payers, so it rarely touches a crew's wages, and the Labour Welfare Fund is paid half-yearly.",
  link: WAGES_LINK,
  category: "compliance",
};

const SRC = {
  psiec: { label: "PSIEC: industrial estates, Zone 6 (Jalandhar)", url: "https://psiec.punjab.gov.in/?p=94" },
  msmeJalandhar: { label: "MSME-DI: Jalandhar district industrial profile (2010–11 data)", url: "https://www.dcmsme.gov.in/old/dips/Jalandhar.pdf" },
  msmeKapurthala: { label: "MSME-DI: Kapurthala district industrial profile (2010–11 data)", url: "https://dcmsme.gov.in/old/dips/Kapurthala.pdf" },
  kapurthalaProfile: { label: "Kapurthala district: district profile", url: "https://kapurthala.gov.in/?p=24430" },
  kapurthalaReach: { label: "Kapurthala district: how to reach", url: "https://kapurthala.gov.in/how-to-reach/" },
  jalandharReach: { label: "Jalandhar district: how to reach", url: "https://jalandhar.nic.in/how-to-reach/" },
  jalandharDistrict: { label: "Jalandhar district: about the district", url: "https://jalandhar.nic.in/about-district/" },
  mcPhagwara: { label: "Municipal Corporation Phagwara", url: "https://mcphagwara.punjab.gov.in/" },
  goraya: { label: "Goraya", url: "https://en.wikipedia.org/wiki/Goraya" },
  clri: { label: "CSIR-CLRI Regional Centre, Leather Complex, Kapurthala Road", url: "https://clri.org/DepartmentDetails.aspx?D=45" },
  tribune2025: { label: "Tribune: administrative secretary on Jalandhar's industrial complexes, 3 Jul 2025", url: "https://www.tribuneindia.com/news/jalandhar/admn-secretary-yadav-assures-industrialists-of-fast-tracked-solutions-to-their-concerns" },
  pbWages: { label: "Punjab Labour Department: minimum rates of wages from 1 May 2026", url: "https://pblabour.gov.in/pbLabourStaticSiteAdmin/uploads/8ec9bd9d-aecf-4bf6-b9bf-672b2970adad_Basic%20Minimum%20rates%20of%20wages.pdf" },
  psdt: { label: "Punjab State Development Tax Act, 2018", url: "https://taxation.punjab.gov.in/attachments/attachment0015236141020201602663756_punjab_state_development_tax_2018.pdf" },
  lwf2025: { label: "Punjab Labour Welfare Fund (Amendment) Bill, 2025, as passed", url: "https://punjabassembly.gov.in/images/docs/AssemblyFiles/16/179/20250710/Documents/15%20PLA%20passed%20Bill%202025.pdf" },
};

export const jalandharPages: LocationCopy[] = [
  {
    cluster: "jalandhar",
    name: "Jalandhar and Kapurthala",
    placeId: "jalandhar",
    metaTitle: "Labour Contractor in Jalandhar and Kapurthala",
    description:
      "Supervised contract labour crews for factories, food plants and warehouses in the Jalandhar region: Kapurthala, Jalandhar's focal points, Phagwara and Goraya.",
    heading: "Labour contractor in Jalandhar and Kapurthala.",
    lede: "Supervised packing, factory and loading crews across the Jalandhar region's industrial clusters.",
    paragraph:
      "The Jalandhar region works in clusters. The city makes hand tools, valves, auto parts and sports goods in PSIEC's focal points and complexes; Kapurthala, PSIEC's other estate in the zone, adds food, starch, sugar and engineering units; and Phagwara and Goraya line NH-44 to the south-east. We take requirements from units in {areas}.",
    areas: [
      { href: "/locations/jalandhar/kapurthala", name: "Kapurthala" },
      { href: "/locations/jalandhar/jalandhar-focal-point", name: "Jalandhar's Focal Point" },
      { href: "/locations/jalandhar/phagwara-goraya", name: "Phagwara and Goraya" },
    ],
    faqs: [
      {
        question: "Do you supply contract labour in Jalandhar and Kapurthala?",
        answer: "Yes. Supervised packing, factory, loading and unloading, and housekeeping crews, on our payroll and run on your site by our supervisor.",
        category: "commercial",
      },
      {
        question: "Where do your workers come from?",
        answer: "Job seekers across Jalandhar, Kapurthala and Phagwara apply on our jobs pages for each. We build each crew from them, close to your site.",
        category: "operations",
      },
      wagesFaq,
      {
        question: "Can you supply security guards?",
        answer: "No. Security work needs a private security agency licence, which we don't hold.",
        category: "commercial",
      },
    ],
    sources: [SRC.psiec, SRC.msmeJalandhar, SRC.msmeKapurthala, SRC.mcPhagwara, SRC.goraya, SRC.pbWages, SRC.psdt, SRC.lwf2025],
  },
  {
    cluster: "jalandhar",
    estate: "kapurthala",
    jobsMarket: "kapurthala",
    name: "Kapurthala",
    placeId: "kapurthala",
    metaTitle: "Labour Contractor in Kapurthala, Punjab",
    description:
      "Supervised packing, factory, loading and housekeeping crews for Kapurthala's Industrial Focal Point and the food, starch and engineering units around it.",
    heading: "Labour contractor in Kapurthala.",
    lede: "Supervised packing and factory crews for Kapurthala's focal point and the units around it.",
    paragraph:
      "Kapurthala is the Jalandhar region's second industrial cluster, on the Jalandhar–Ferozepur road and railway. PSIEC runs its Industrial Focal Point. The district's industry is food and beverages, starch, sugar, distilling and textiles, with a foundry and engineering cluster making castings, engine parts and auto components.",
    faqs: [
      {
        question: "Do you supply contract labour in Kapurthala?",
        answer: "Yes. Packing crews, line and production helpers, loading and unloading, and housekeeping, for units in the focal point and across the district.",
        category: "commercial",
      },
      {
        question: "Can you staff packing lines at food plants?",
        answer: "Yes. Line packing, cartoning, labelling and dispatch crews, inducted on your site's hygiene and safety rules before they start.",
        category: "operations",
      },
      wagesFaq,
      {
        question: "How do workers reach Kapurthala?",
        answer: "Government and private buses link Kapurthala with Jalandhar, and autos run within the town. For shifts outside bus hours, we plan transport with you.",
        category: "operations",
      },
    ],
    sources: [SRC.psiec, SRC.kapurthalaProfile, SRC.msmeKapurthala, SRC.kapurthalaReach, SRC.pbWages],
  },
  {
    cluster: "jalandhar",
    estate: "jalandhar-focal-point",
    name: "Focal Point, Jalandhar",
    placeId: "jalandhar-focal-point",
    metaTitle: "Labour Contractor in Focal Point, Jalandhar",
    description:
      "Supervised factory, packing, loading and housekeeping crews for Jalandhar's Industrial Focal Point, Leather Complex and Sports and Surgical Goods Complex.",
    heading: "Labour contractor in Focal Point, Jalandhar.",
    lede: "Supervised crews for Jalandhar's hand tool, valve, auto part, sports goods and leather units.",
    paragraph:
      "Jalandhar's industry sits in PSIEC estates: the Industrial Focal Point and its extension, about 305 acres in the MSME-DI district profile, the older Industrial Area, the Sports and Surgical Goods Complex, and the Leather Complex on Kapurthala Road. Its units make hand tools, valves, auto parts, sports and surgical goods, and leather.",
    faqs: [
      {
        question: "Do you supply contract labour in Focal Point, Jalandhar?",
        answer: "Yes. Shop-floor helpers, packers, loaders and housekeeping staff for units in the Focal Point and its extension.",
        category: "commercial",
      },
      {
        question: "Do you cover the Leather and Sports Complexes too?",
        answer: "Yes. The same supervised crews for units in the Leather Complex, the Sports and Surgical Goods Complex and the Industrial Area.",
        category: "operations",
      },
      wagesFaq,
      {
        question: "How do workers reach the industrial areas?",
        answer: "Most live in the city, which has a large network of state and private buses. Jalandhar City station is a major stop on the Amritsar–Delhi line.",
        category: "operations",
      },
    ],
    sources: [SRC.psiec, SRC.msmeJalandhar, SRC.clri, SRC.tribune2025, SRC.jalandharReach, SRC.pbWages],
  },
  {
    cluster: "jalandhar",
    estate: "phagwara-goraya",
    // Phagwara leads the page and is in Kapurthala district.
    jobsMarket: "kapurthala",
    name: "Phagwara and Goraya",
    placeId: "phagwara-goraya",
    metaTitle: "Labour Contractor in Phagwara and Goraya",
    description:
      "Supervised factory, packing, loading and housekeeping crews for Phagwara's mills and industrial area and the Goraya engineering belt on NH-44, Punjab.",
    heading: "Labour contractor in Phagwara and Goraya.",
    lede: "Supervised crews for the mills and engineering units along NH-44, south-east of Jalandhar.",
    paragraph:
      "Phagwara is a sub-division of Kapurthala district on NH-44, about 20 km from Jalandhar, known for sugar, glucose, starch, fine textiles and engine parts; its industrial area of about 35 acres is fully allotted, per the MSME-DI profile. Goraya, further along the old GT Road in Jalandhar district, was once called the Manchester of Punjab for its foundries and bearings, and still makes fodder cutters and ball bearings.",
    faqs: [
      {
        question: "Do you supply contract labour in Phagwara and Goraya?",
        answer: "Yes. Production helpers, packers, loaders and housekeeping staff for mills, machine shops and foundries along NH-44.",
        category: "commercial",
      },
      {
        question: "Can one contract cover Phagwara and Jalandhar sites?",
        answer: "Yes. Both are in Punjab, on the same rules, so each site gets its own crew and you get one monthly invoice.",
        category: "commercial",
      },
      wagesFaq,
      {
        question: "Can you supply foundry and machine-shop helpers?",
        answer: "Yes. Helpers, material handlers and loaders for the shop floor. Welders and fitters on request.",
        category: "operations",
      },
    ],
    sources: [SRC.kapurthalaProfile, SRC.mcPhagwara, SRC.msmeKapurthala, SRC.goraya, SRC.jalandharDistrict, SRC.pbWages],
  },
];
