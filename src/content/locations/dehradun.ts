import type { FaqItem } from "../types";
import type { LocationCopy } from "./types";

/**
 * Dehradun district, Uttarakhand: the hub and Selaqui (moved here from the
 * Uttarakhand hub when Dehradun became a market, 18 Oct 2026), on the
 * location page structure. Facts from SIIDCUL's estate pages and allottee
 * list, the MSME-DI district profile (2010–12 data, named as such where a
 * figure is used), the revised Schedule M and the draft OSH rules, each in
 * `sources`. No tenant names (the profile lists some), registrations,
 * headcount or shift claims. Titles say "SIDCUL", the spelling people
 * search; the corporation is SIIDCUL.
 */

const WAGES_LINK = { href: "/minimum-wages/uttarakhand", label: "Uttarakhand minimum wages" };

const wagesFaq = (place: string): FaqItem => ({
  question: `Is the minimum wage in ${place} different from the rest of the state?`,
  answer:
    "No. Uttarakhand has one rate for the whole state, by skill and type of work. There is no Professional Tax, and the state's OSH Code rules are still in draft.",
  link: WAGES_LINK,
  category: "compliance",
});

const SRC = {
  pharmaCity: { label: "SIIDCUL: Integrated Industrial Estate Pharma City, Selaqui", url: "https://siidcul.com/integrated-industrial-estate-pharma-city-selaqui" },
  sidcSelaqui: { label: "SIIDCUL: SIDC Selaqui allottee list (21 July 2023)", url: "https://siidcul.com/UserFiles/files/SIDC_Selaqui21072023.pdf" },
  msme: { label: "MSME-DI: Dehradun district industrial profile (2010–12 data)", url: "https://dcmsme.gov.in/old/dips/DIPSR%20-%20DEHRADUN.pdf" },
  // CDSCO's own copy (paras 3.4 and 11.4.6: cleaning and contract staff); the Puducherry copy's certificate expired (Oct 2026).
  scheduleM: { label: "Revised Schedule M, Drugs Rules, G.S.R. 922(E), 28 December 2023 (CDSCO copy)", url: "https://cdsco.gov.in/opencms/resources/UploadCDSCOWeb/2018/UploadGazette_NotificationsFiles/2023.12.28_DR_Final%20G.S.R.%20922(E)_Notification%20of%20Schedule%20M%20of.pdf" },
  osh: { label: "Draft Uttarakhand OSH Code rules (22 May 2026)", url: "https://cdnbbsr.s3waas.gov.in/s36547884cea64550284728eb26b0947ef/uploads/2026/07/20260725686982897.pdf" },
};

export const dehradunPages: LocationCopy[] = [
  {
    cluster: "dehradun",
    name: "Dehradun",
    placeId: "dehradun",
    metaTitle: "Labour Contractor in Dehradun and SIDCUL Selaqui",
    description:
      "Supervised contract labour crews for factories in Dehradun: SIDCUL Selaqui's pharma and industrial estates, Langha Road, Mohabbewala, Laltappar and Rishikesh.",
    heading: "Labour contractor in Dehradun and Selaqui.",
    lede: "Supervised crews for pharma, food, packaging and engineering units across Dehradun district.",
    paragraph:
      "Dehradun's factories sit in a few industrial areas. Selaqui, about 25 km from the city, is the largest: SIIDCUL's Pharma City beside the older Selaqui industrial area, with pharma, electronics, footwear and packaging units. Closer to the city are the Langha Road, Mohabbewala and Laltappar industrial areas and the Patel Nagar estate, and units near Rishikesh and Doiwala make drugs, glass and sugar. We take requirements from units in {areas}.",
    areas: [
      { href: "/locations/dehradun/selaqui", name: "Selaqui" },
      { name: "Langha Road" },
      { name: "Mohabbewala" },
      { name: "Laltappar" },
    ],
    faqs: [
      {
        question: "Do you supply contract labour in Dehradun?",
        answer: "Yes. Supervised packing, factory, loading and unloading, and housekeeping crews, on our payroll and run on your site by our supervisor.",
        category: "commercial",
      },
      {
        question: "Where do your workers come from?",
        answer: "Job seekers across Dehradun, Selaqui, Vikasnagar and Rishikesh apply on our jobs page for the district. We build each crew from them, close to your site.",
        category: "operations",
      },
      wagesFaq("Dehradun"),
      {
        question: "Will you visit our site first?",
        answer: "Yes. We visit before a crew starts, to see the work, the shifts and your hygiene and safety rules.",
        category: "operations",
      },
    ],
    sources: [SRC.pharmaCity, SRC.sidcSelaqui, SRC.msme, SRC.osh],
  },
  {
    cluster: "dehradun",
    estate: "selaqui",
    name: "Selaqui",
    placeId: "selaqui",
    metaTitle: "SIDCUL Selaqui: Contract Labour in Dehradun",
    description:
      "Contract labour crews for Selaqui industrial area in Dehradun: SIIDCUL's Pharma City and SIDC Selaqui. GMP-trained helpers, packers and housekeeping.",
    heading: "Contract labour in SIDCUL Selaqui.",
    lede: "Supervised crews for pharma, FMCG and packaging units in Selaqui, Dehradun, trained to your plant's hygiene rules.",
    paragraph:
      "Selaqui is two SIIDCUL estates side by side, about 25 km from Dehradun. Pharma City is a 50-acre estate for drugs, capsules and medical devices. The older SIDC Selaqui mixes electronics, appliances, footwear, apparel, printing, packaging and food units.",
    faqs: [
      {
        question: "Do you supply contract labour to Selaqui units?",
        answer:
          "Yes. Crews for production support, packing, stores and dispatch, and housekeeping, planned with your site team and run by our supervisor.",
        category: "operations",
      },
      {
        question: "Can your crews meet GMP training rules?",
        answer:
          "Yes. The revised Schedule M names contract staff, cleaners included. We plan each crew around your plant's training, gowning and health checks, and keep the training records.",
        category: "operations",
      },
      wagesFaq("Selaqui"),
      {
        question: "Will you visit our site first?",
        answer: "Yes. We visit before a crew starts, to see the work, the shifts and your hygiene and safety rules.",
        category: "operations",
      },
    ],
    sources: [SRC.pharmaCity, SRC.sidcSelaqui, SRC.scheduleM, SRC.osh, SRC.msme],
  },
];
