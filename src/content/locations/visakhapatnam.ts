import type { FaqItem } from "../types";
import type { LocationCopy } from "./types";
import { linkable } from "@/content/registry";
import { wageStatePath } from "@/content/registry/identifiers";

/**
 * Visakhapatnam, Andhra Pradesh: the hub and four industrial belts, on the
 * location page structure (owner direction, 17 Oct 2026), put up on 22 Oct
 * 2026 to be indexed before any ads run. Parawada and Atchutapuram–Rambilli
 * are in Anakapalli district (split from Visakhapatnam's on 4 April 2022)
 * but are Vizag's industrial belt to buyers and job seekers alike. Facts
 * from the SEZ notifications list, the JN Pharma City environment report,
 * APSEZ's and VSEZ's records and the district pages, each in `sources`. No
 * tenant names, registrations, headcount or shift claims; security guards
 * are out of scope (no PSARA licence). Autonagar was left out: no citable
 * source on the estate was found (22 Oct 2026).
 */

const AP_WAGES = wageStatePath("andhra-pradesh");
/**
 * The Andhra Pradesh wage page comes in its own change; until it is
 * published, the wages answer links to /compliance (as Bengaluru's did while
 * Karnataka's was in review). Switches by itself once the page is linkable.
 */
const WAGES_LINK = linkable(AP_WAGES, "en-IN")
  ? { href: AP_WAGES, label: "Andhra Pradesh minimum wages" }
  : { href: "/compliance", label: "How we handle compliance" };

const wagesFaq = (zone: string): FaqItem => ({
  question: "Which minimum wage and rules apply?",
  answer: `Andhra Pradesh's, by type of work, zone and skill: a basic rate plus a dearness allowance (VDA) revised on 1 April and 1 October. Professional Tax and the Labour Welfare Fund apply too. ${zone}`,
  link: WAGES_LINK,
  category: "compliance",
});

const VISIT_FAQ: FaqItem = {
  question: "Will you visit our site first?",
  answer: "Yes. We visit before a crew starts, to see the work, the shifts and your hygiene and safety rules.",
  category: "operations",
};

const SRC = {
  vizag: { label: "Visakhapatnam", url: "https://en.wikipedia.org/wiki/Visakhapatnam" },
  vizagDistrict: { label: "Visakhapatnam district (mandals since April 2022)", url: "https://en.wikipedia.org/wiki/Visakhapatnam_district" },
  anakapalli: { label: "Anakapalli district (formed 4 April 2022)", url: "https://en.wikipedia.org/wiki/Anakapalli_district" },
  neighbourhoods: { label: "List of neighbourhoods in Visakhapatnam", url: "https://en.wikipedia.org/wiki/List_of_neighbourhoods_in_Visakhapatnam" },
  sezList: { label: "Ministry of Commerce: notified SEZs (as on 18 March 2025)", url: "https://sezindia.gov.in/sites/default/files/notifed/Notified%20SEZs%20UPDATED.pdf" },
  jnpcEmp: { label: "JN Pharma City, Parawada: environment management plan (park area, CETP, location)", url: "https://torrentpharma.com/assets/EMP_Report_a00fd31559.pdf" },
  jnpc: { label: "Jawaharlal Nehru Pharma City", url: "https://en.wikipedia.org/wiki/Jawaharlal_Nehru_Pharma_City" },
  apsez: { label: "Andhra Pradesh Special Economic Zone", url: "https://en.wikipedia.org/wiki/Andhra_Pradesh_Special_Economic_Zone" },
  vcic: { label: "ADB: Visakhapatnam–Chennai Industrial Corridor (Rambilli and Nakkapalli clusters)", url: "https://ewsdata.rightsindevelopment.org/projects/48434-004-visakhapatnam-chennai-industrial-corridor-developm/" },
  vsez: { label: "Visakhapatnam Special Economic Zone", url: "https://en.wikipedia.org/wiki/Visakhapatnam_Special_Economic_Zone" },
  gajuwaka: { label: "Gajuwaka", url: "https://en.wikipedia.org/wiki/Gajuwaka" },
  // CDSCO's own copy (paras 3.4 and 11.4.6: cleaning and contract staff).
  scheduleM: { label: "Revised Schedule M, Drugs Rules, G.S.R. 922(E), 28 December 2023 (CDSCO copy)", url: "https://cdsco.gov.in/opencms/resources/UploadCDSCOWeb/2018/UploadGazette_NotificationsFiles/2023.12.28_DR_Final%20G.S.R.%20922(E)_Notification%20of%20Schedule%20M%20of.pdf" },
  apWages: { label: "Andhra Pradesh minimum rates of wages, October 2026 (basic plus VDA, 1 April and 1 October)", url: "https://www.sgcms.com/regulatory-updates/minimum-rate-of-wages-andhra-pradesh-october-2026/" },
  apPt: { label: "Andhra Pradesh Professional Tax", url: "https://www.greythr.com/wiki/acts/professional-tax-andhra-pradesh" },
  apLwf: { label: "Andhra Pradesh Labour Welfare Fund Act", url: "https://www.greythr.com/wiki/acts/andhra-pradesh-labour-welfare-fund-act" },
};
const WAGE_SOURCES = [SRC.apWages, SRC.apPt, SRC.apLwf];

export const visakhapatnamPages: LocationCopy[] = [
  {
    cluster: "visakhapatnam",
    name: "Visakhapatnam",
    placeId: "visakhapatnam",
    metaTitle: "Labour Contractor in Visakhapatnam (Vizag)",
    description:
      "Supervised contract labour crews for factories, pharma and port-side units in Visakhapatnam: JN Pharma City Parawada, APSEZ Atchutapuram, VSEZ and Gajuwaka.",
    heading: "Labour contractor in Visakhapatnam.",
    lede: "Supervised crews for pharma, engineering, apparel and port-side units across Vizag's industrial belt.",
    paragraph:
      "Visakhapatnam is a port and steel city, with pharma, petrochemical and engineering units around it. Most of its industry lies south-west of the centre: the steel plant and Gangavaram Port by Gajuwaka, the VSEZ at Duvvada, then, in Anakapalli district since 2022, a pharma city at Parawada and APIIC's SEZ at Atchutapuram and Rambilli. We take requirements from units in {areas}.",
    areas: [
      { href: "/locations/visakhapatnam/parawada-pharma-city", name: "JN Pharma City, Parawada" },
      { href: "/locations/visakhapatnam/atchutapuram-rambilli", name: "APSEZ Atchutapuram and Rambilli" },
      { href: "/locations/visakhapatnam/duvvada-vsez", name: "VSEZ Duvvada" },
      { href: "/locations/visakhapatnam/gajuwaka", name: "Gajuwaka" },
    ],
    faqs: [
      {
        question: "Do you supply contract labour in Visakhapatnam?",
        answer: "Yes. Supervised factory, loading and unloading, and housekeeping crews, on our payroll and run on your site by our supervisor.",
        category: "commercial",
      },
      {
        question: "Do you have workers in Visakhapatnam?",
        answer: "We keep a worker list for Vizag, and job seekers from the city, Gajuwaka, Pendurthi and Anakapalli join it on our Visakhapatnam jobs page. We build each crew from it for your site.",
        category: "operations",
      },
      wagesFaq("We confirm the zone for your address before pricing."),
      {
        question: "Can you supply security guards?",
        answer: "No. Security work needs a private security agency licence, which we don't hold.",
        category: "commercial",
      },
    ],
    sources: [SRC.vizag, SRC.vizagDistrict, SRC.anakapalli, SRC.gajuwaka, SRC.vsez, SRC.jnpc, SRC.apsez, SRC.sezList, ...WAGE_SOURCES],
  },
  {
    cluster: "visakhapatnam",
    estate: "parawada-pharma-city",
    name: "JN Pharma City, Parawada",
    placeId: "parawada-pharma-city",
    metaTitle: "Contract Labour in JN Pharma City, Parawada",
    description:
      "Supervised production support, packing, stores and housekeeping crews for bulk drug and API units in Jawaharlal Nehru Pharma City, Parawada, near Vizag.",
    heading: "Contract labour in JN Pharma City, Parawada.",
    lede: "Supervised crews for bulk drug and API units in Parawada, trained to your plant's hygiene and safety rules.",
    paragraph:
      "Jawaharlal Nehru Pharma City is a park built only for bulk drugs, pharmaceuticals and fine chemicals: about 2,100 acres at Parawada, developed with APIIC as a public–private partnership, with its own effluent treatment plant and a notified pharma SEZ inside it. It lies in Anakapalli district, about 8 km from Duvvada station.",
    faqs: [
      {
        question: "Do you supply contract labour in JN Pharma City?",
        answer: "Yes. Crews for production support, packing, stores and dispatch, and housekeeping, planned with your site team and run by our supervisor.",
        category: "operations",
      },
      {
        question: "Can your crews meet GMP training rules?",
        answer:
          "Yes. The revised Schedule M names contract staff, cleaners included. We plan each crew around your plant's training, gowning and health checks, and keep the training records.",
        category: "operations",
      },
      wagesFaq("We confirm the zone for Parawada before pricing."),
      VISIT_FAQ,
    ],
    sources: [SRC.jnpcEmp, SRC.jnpc, SRC.sezList, SRC.anakapalli, SRC.scheduleM, ...WAGE_SOURCES],
  },
  {
    cluster: "visakhapatnam",
    estate: "atchutapuram-rambilli",
    name: "APSEZ Atchutapuram and Rambilli",
    placeId: "atchutapuram-rambilli",
    metaTitle: "Contract Labour in APSEZ Atchutapuram and Rambilli",
    description:
      "Supervised factory, loading and housekeeping crews for the Andhra Pradesh SEZ at Atchutapuram and Rambilli, Anakapalli district: pharma, engineering, apparel.",
    heading: "Contract labour in APSEZ Atchutapuram and Rambilli.",
    lede: "Supervised crews for pharma, engineering and apparel units in the SEZ belt south of Vizag.",
    paragraph:
      "The Andhra Pradesh Special Economic Zone is APIIC's multi-product SEZ across Atchutapuram and Rambilli mandals in Anakapalli district, planned within the Visakhapatnam–Kakinada petrochemical region and served by Visakhapatnam and Gangavaram ports. Its units work in pharmaceuticals, engineering, logistics and petrochemicals, beside an apparel SEZ, with new corridor clusters coming up at Rambilli and Nakkapalli.",
    faqs: [
      {
        question: "Do you supply contract labour in APSEZ?",
        answer: "Yes. Supervised factory, loading and unloading, and housekeeping crews, working under your site's induction, hygiene and PPE rules.",
        category: "commercial",
      },
      {
        question: "How do crews get to sites this far out?",
        answer: "We plan company transport or housing for the crew with you before it starts.",
        category: "operations",
      },
      wagesFaq("We confirm the zone for your address before pricing."),
      {
        question: "How do we start?",
        answer: "Request a crew with the site address and the roles. We'll tell you plainly whether we can staff it, and plan the crew from there.",
        category: "commercial",
      },
    ],
    sources: [SRC.apsez, SRC.sezList, SRC.anakapalli, SRC.vcic, ...WAGE_SOURCES],
  },
  {
    cluster: "visakhapatnam",
    estate: "duvvada-vsez",
    name: "VSEZ Duvvada",
    placeId: "duvvada-vsez",
    metaTitle: "Contract Labour in VSEZ Duvvada, Visakhapatnam",
    description:
      "Supervised factory, packing, loading and housekeeping crews for the Visakhapatnam Special Economic Zone at Duvvada: electronics, software and pharma units.",
    heading: "Contract labour in VSEZ Duvvada.",
    lede: "Supervised crews for electronics, pharma and export units inside the Visakhapatnam SEZ.",
    paragraph:
      "The Visakhapatnam Special Economic Zone at Duvvada began in 1989 as an export processing zone and became an SEZ in 2003. It is owned by the Government of India and run by a Development Commissioner under the Ministry of Commerce: about 146 hectares of electronics, software and pharmaceutical units, some 20 km from the city.",
    faqs: [
      {
        question: "Do you supply contract labour in VSEZ?",
        answer: "Yes. Helpers, packers, loaders and housekeeping crews for units in the zone, planned with your site team and run by our supervisor.",
        category: "commercial",
      },
      {
        question: "Can your crews work with the zone's entry rules?",
        answer: "Yes. We sort out passes and IDs with your site team before the crew starts, and our supervisor keeps the list current as people change.",
        category: "operations",
      },
      wagesFaq("We confirm the zone for Duvvada before pricing."),
      VISIT_FAQ,
    ],
    sources: [SRC.vsez, SRC.sezList, SRC.neighbourhoods, ...WAGE_SOURCES],
  },
  {
    cluster: "visakhapatnam",
    estate: "gajuwaka",
    name: "Gajuwaka",
    placeId: "gajuwaka",
    metaTitle: "Labour Contractor in Gajuwaka, Visakhapatnam",
    description:
      "Supervised loading, factory and housekeeping crews for units in Gajuwaka and south Visakhapatnam, near the steel plant, Gangavaram Port and NH-16.",
    heading: "Labour contractor in Gajuwaka.",
    lede: "Supervised crews for engineering, port-side and logistics units in Visakhapatnam's industrial south.",
    paragraph:
      "Gajuwaka is the centre of south Visakhapatnam, a mix of homes, shops and industry, with the steel plant and Gangavaram Port close by. NH-16 runs through the mandal, and Kurmannapalem, Aganampudi, Malkapuram and the Steel Plant township lie around it.",
    faqs: [
      {
        question: "Do you supply contract labour in Gajuwaka?",
        answer: "Yes. Supervised loading and unloading, factory and housekeeping crews for units and yards in Gajuwaka and around it.",
        category: "commercial",
      },
      {
        question: "How do workers reach sites here?",
        answer: "Most come by APSRTC bus: Gajuwaka has its own bus station, with city routes through Kurmannapalem and the Steel Plant. For night shifts we plan transport with you.",
        category: "operations",
      },
      wagesFaq("We confirm the zone for your address before pricing."),
      VISIT_FAQ,
    ],
    sources: [SRC.gajuwaka, SRC.neighbourhoods, SRC.vizagDistrict, ...WAGE_SOURCES],
  },
];
