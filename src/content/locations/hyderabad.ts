import type { FaqItem } from "../types";
import type { LocationCopy } from "./types";
import { linkable } from "@/content/registry";
import { wageStatePath } from "@/content/registry/identifiers";

/**
 * Hyderabad, Telangana: the hub and five industrial belts, on the location
 * page structure (owner direction, 17 Oct 2026), put up on 27 Oct 2026 to be
 * indexed before any ads run. The belts follow TGIIC's own zones (park list
 * of 8 April 2026): Patancheru (Sangareddy district), the Medchal side and
 * the east (Medchal-Malkajgiri) and Shamshabad (Rangareddy). Facts from
 * TGIIC, the state's life sciences pages, the PIB factsheet and the district
 * pages, each in `sources`. No tenant names, registrations, headcount or
 * shift claims; security guards are out of scope (no PSARA licence).
 *
 * Left out on purpose: acreage for the old estates (no official figure
 * found), and Hyderabad Pharma City at Mucherla (TGIIC lists a park there,
 * but the project's status is unsettled).
 */

const TG_WAGES = wageStatePath("telangana");
/**
 * The Telangana wage page is in review (owner, 27 Oct 2026: G.O.Ms. No. 6 is
 * before the High Court and no VDA has been declared under it), so the
 * wages answer links to /compliance, as Bengaluru's does while Karnataka's
 * is in review. Switches by itself once the page is published.
 */
const WAGES_LINK = linkable(TG_WAGES, "en-IN")
  ? { href: TG_WAGES, label: "Telangana minimum wages" }
  : { href: "/compliance", label: "How we handle compliance" };

const wagesFaq = (zone: string): FaqItem => ({
  question: "Which minimum wage and rules apply?",
  answer: `Telangana's: since 1 June 2026, one order sets basic rates by zone and skill for every listed employment, with a cost of living allowance to be declared each April and October. Professional Tax and the Labour Welfare Fund apply too. ${zone}`,
  link: WAGES_LINK,
  category: "compliance",
});

const VISIT_FAQ: FaqItem = {
  question: "Will you visit our site first?",
  answer: "Yes. We visit before a crew starts, to see the work, the shifts and your hygiene and safety rules.",
  category: "operations",
};

const SRC = {
  hyderabad: { label: "Hyderabad", url: "https://en.wikipedia.org/wiki/Hyderabad" },
  sangareddy: { label: "Sangareddy district", url: "https://en.wikipedia.org/wiki/Sangareddy_district" },
  medchal: { label: "Medchal–Malkajgiri district", url: "https://en.wikipedia.org/wiki/Medchal%E2%80%93Malkajgiri_district" },
  rangareddy: { label: "Ranga Reddy district", url: "https://en.wikipedia.org/wiki/Ranga_Reddy_district" },
  parks: {
    label: "TGIIC: list of industrial parks, by zone and district (8 April 2026)",
    url: "https://www.tgiic.telangana.gov.in/filePreview/custom/Total%20Industrial%20Parks%20List%20%2008_04_2026?fileName=CMS/File_090420261236097686806358.Total%20Industrial%20Parks%20List.pdf",
  },
  sez: { label: "TGIIC: special economic zones (area in acres and status)", url: "https://tgiic.telangana.gov.in/showView?div_id=21" },
  pib: {
    label: "PIB factsheet, 14 October 2025: Telangana's share of India's bulk drug exports and pharma output",
    url: "https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/oct/doc20251014666001.pdf",
  },
  medicalDevices: { label: "Telangana Life Sciences: Medical Devices Park (302 acres, 2017)", url: "https://lifesciences.telangana.gov.in/life-sciences-grid/clusters/medical-device-park/" },
  genome: { label: "Telangana Life Sciences: Genome Valley (23 km from Secunderabad station)", url: "https://lifesciences.telangana.gov.in/genome-valley/" },
  lifeSciencesPolicy: { label: "Telangana Life Sciences Policy: Genome Valley, about 1,500 acres in four phases", url: "https://rich.telangana.gov.in/assets/pdfs/Resources/Life-Sciences-Policy.pdf" },
  industriesReport: {
    label: "Industries Department, Telangana: annual report 2022–23 (study of 380 micro and small units in Cherlapally Industrial Park)",
    url: "https://tgtpc.telangana.gov.in/wp-content/uploads/2024/04/Telangana-Industries-Dept-Annual-Report-2022-23.pdf",
  },
  patancheru: { label: "Patancheru", url: "https://en.wikipedia.org/wiki/Patancheru" },
  bollaram: { label: "IDA Bollaram", url: "https://en.wikipedia.org/wiki/IDA_Bollaram" },
  jeedimetla: { label: "Jeedimetla", url: "https://en.wikipedia.org/wiki/Jeedimetla" },
  medchalTown: { label: "Medchal", url: "https://en.wikipedia.org/wiki/Medchal" },
  cherlapally: { label: "Cherlapally", url: "https://en.wikipedia.org/wiki/Cherlapally" },
  genomeValley: { label: "Genome Valley", url: "https://en.wikipedia.org/wiki/Genome_Valley" },
  shadnagar: { label: "Shadnagar", url: "https://en.wikipedia.org/wiki/Shadnagar" },
  // CDSCO's own copy (paras 3.4 and 11.4.6: cleaning and contract staff).
  scheduleM: {
    label: "Revised Schedule M, Drugs Rules, G.S.R. 922(E), 28 December 2023 (CDSCO copy)",
    url: "https://cdsco.gov.in/opencms/resources/UploadCDSCOWeb/2018/UploadGazette_NotificationsFiles/2023.12.28_DR_Final%20G.S.R.%20922(E)_Notification%20of%20Schedule%20M%20of.pdf",
  },
  tgWages: { label: "G.O.Ms. No. 6, 30 May 2026: Telangana minimum wages by zone and skill from 1 June 2026 (our hosted copy)", url: "https://cdn.vayasyaseva.com/sources/telangana/tg-go6-9607b5ae.pdf" },
  tgPt: { label: "Commercial Taxes Department, Telangana: Professional Tax First Schedule", url: "https://tgct.gov.in/tgportal/AllActs/APPT/APPTSchedule.aspx" },
  tgLwf: {
    label: "Labour Department, Telangana: Labour Welfare Fund Act, 1987",
    url: "https://labour.telangana.gov.in/content/ActsRules/TELANGANA%20LABOUR%20WELFARE%20FUND%20ACT,%201987.htm",
  },
};
const WAGE_SOURCES = [SRC.tgWages, SRC.tgPt, SRC.tgLwf];

export const hyderabadPages: LocationCopy[] = [
  {
    cluster: "hyderabad",
    name: "Hyderabad",
    placeId: "hyderabad",
    metaTitle: "Labour Contractor in Hyderabad",
    description:
      "Supervised contract labour crews for pharma, engineering and logistics units in Hyderabad: Patancheru, Pashamylaram, Jeedimetla, Cherlapally and Shamshabad.",
    heading: "Labour contractor in Hyderabad.",
    lede: "Supervised crews for pharma, engineering and logistics units across Hyderabad's industrial belts.",
    paragraph:
      "Hyderabad is India's bulk drug centre: Telangana makes about a third of the country's pharma output and half its bulk drug exports. The city's industry sits in TGIIC parks around it: Patancheru and Pashamylaram to the north-west, in Sangareddy district; Jeedimetla and Medchal to the north and Cherlapally to the east, in Medchal-Malkajgiri; Genome Valley at Shamirpet; and Shamshabad, Kothur and Adibatla to the south, in Rangareddy. We take requirements from units in {areas}.",
    areas: [
      { href: "/locations/hyderabad/patancheru-pashamylaram", name: "Patancheru and Pashamylaram" },
      { href: "/locations/hyderabad/jeedimetla-medchal", name: "Jeedimetla and Medchal" },
      { href: "/locations/hyderabad/cherlapally-nacharam", name: "Cherlapally and Nacharam" },
      { href: "/locations/hyderabad/genome-valley", name: "Genome Valley" },
      { href: "/locations/hyderabad/shamshabad-kothur", name: "Shamshabad and Kothur" },
    ],
    faqs: [
      {
        question: "Do you supply contract labour in Hyderabad?",
        answer: "Yes. Supervised factory, loading and unloading, and housekeeping crews, on our payroll and run on your site by our supervisor.",
        category: "commercial",
      },
      {
        question: "Do you have workers in Hyderabad?",
        answer: "We keep a worker list for Hyderabad, and job seekers from Kukatpally, Uppal, Patancheru and across the city join it on our Hyderabad jobs page. We build each crew from it for your site.",
        category: "operations",
      },
      wagesFaq("We confirm the zone for your address before pricing."),
      {
        question: "Can you supply security guards?",
        answer: "No. Security work needs a private security agency licence, which we don't hold.",
        category: "commercial",
      },
    ],
    sources: [SRC.hyderabad, SRC.pib, SRC.parks, SRC.sangareddy, SRC.medchal, SRC.rangareddy, SRC.genome, ...WAGE_SOURCES],
  },
  {
    cluster: "hyderabad",
    estate: "patancheru-pashamylaram",
    name: "Patancheru and Pashamylaram",
    placeId: "patancheru-pashamylaram",
    metaTitle: "Contract Labour in Patancheru and Pashamylaram",
    description:
      "Supervised production support, packing, stores and housekeeping crews for bulk drug, chemical and engineering units in Patancheru, Pashamylaram and Bollaram.",
    heading: "Contract labour in Patancheru and Pashamylaram.",
    lede: "Supervised crews for bulk drug, chemical and engineering units, trained to your plant's hygiene and safety rules.",
    paragraph:
      "Patancheru, on the Solapur highway north-west of Hyderabad, is the city's oldest bulk drug and chemical belt. TGIIC runs five phases of industrial park at Patancheru and four at Pashamylaram, with an export promotion park, a textile park and, at Sultanpur, a 302-acre medical devices park opened in 2017, all in Sangareddy district. IDA Bollaram and industrial land at Gaddapotharam, Gummadidala and Jinnaram lie close by.",
    faqs: [
      {
        question: "Do you supply contract labour in Patancheru and Pashamylaram?",
        answer: "Yes. Crews for production support, packing, stores and dispatch, and housekeeping, planned with your site team and run by our supervisor.",
        category: "operations",
      },
      {
        question: "How do your crews work safely in chemical and bulk drug plants?",
        answer:
          "Every worker goes through your site's induction before starting, and our supervisor holds the crew to your permit-to-work, PPE and restricted-area rules on the floor. We plan who works where with your safety team.",
        category: "operations",
      },
      {
        question: "Can your crews meet GMP training rules?",
        answer:
          "Yes. The revised Schedule M names contract staff, cleaners included. We plan each crew around your plant's training, gowning and health checks, and keep the training records.",
        category: "operations",
      },
      wagesFaq("We confirm the zone for your address before pricing."),
    ],
    sources: [SRC.parks, SRC.patancheru, SRC.bollaram, SRC.medicalDevices, SRC.sangareddy, SRC.scheduleM, ...WAGE_SOURCES],
  },
  {
    cluster: "hyderabad",
    estate: "jeedimetla-medchal",
    name: "Jeedimetla and Medchal",
    placeId: "jeedimetla-medchal",
    metaTitle: "Contract Labour in Jeedimetla and Medchal",
    description:
      "Supervised factory, packing, loading and housekeeping crews for units in Jeedimetla, Gandimaisamma, Dundigal and Medchal, on Hyderabad's northern side.",
    heading: "Contract labour in Jeedimetla and Medchal.",
    lede: "Supervised crews for pharma, engineering and chemical units in Hyderabad's northern belt.",
    paragraph:
      "Jeedimetla is a TGIIC industrial park in six phases, in Medchal-Malkajgiri district, with pharma, machine tool, electrical, textile and chemical units. The belt runs north through Gandimaisamma and Dundigal to the industrial estate at Medchal, with the older estates at Kukatpally and Sanathnagar closer to the city.",
    faqs: [
      {
        question: "Do you supply contract labour in Jeedimetla?",
        answer: "Yes. Supervised factory, packing and housekeeping crews for units in Jeedimetla, Gandimaisamma and Medchal, on our payroll and run by our supervisor.",
        category: "commercial",
      },
      {
        question: "Can you supply loading and unloading crews?",
        answer: "Yes. Supervised loading, unloading and stores crews for dispatch bays and warehouses along the belt, working to your gate and safety rules.",
        category: "operations",
      },
      wagesFaq("We confirm the zone for your address before pricing."),
      VISIT_FAQ,
    ],
    sources: [SRC.parks, SRC.jeedimetla, SRC.medchalTown, SRC.medchal, ...WAGE_SOURCES],
  },
  {
    cluster: "hyderabad",
    estate: "cherlapally-nacharam",
    name: "Cherlapally and Nacharam",
    placeId: "cherlapally-nacharam",
    metaTitle: "Contract Labour in Cherlapally and Nacharam",
    description:
      "Supervised factory, packing, loading and housekeeping crews for units in Cherlapally, Nacharam, Uppal, Mallapur and Moula Ali, on Hyderabad's eastern side.",
    heading: "Contract labour in Cherlapally and Nacharam.",
    lede: "Supervised crews for the small and mid-sized factories of east Hyderabad.",
    paragraph:
      "East Hyderabad's industry is a cluster of TGIIC parks in Medchal-Malkajgiri district: Cherlapally, in two phases, then Nacharam, Uppal, Mallapur, Moula Ali and the electronics complex at Kushaiguda. Most units are small: a 2022–23 state study looked at 380 micro and small units in Cherlapally's park alone.",
    faqs: [
      {
        question: "Do you supply contract labour in Cherlapally?",
        answer: "Yes. Supervised factory, packing, loading and housekeeping crews for units in Cherlapally, Nacharam, Uppal and Mallapur.",
        category: "commercial",
      },
      VISIT_FAQ,
      wagesFaq("We confirm the zone for your address before pricing."),
      {
        question: "How do we start?",
        answer: "Request a crew with the site address and the roles. We'll tell you plainly whether we can staff it, and plan the crew from there.",
        category: "commercial",
      },
    ],
    sources: [SRC.parks, SRC.industriesReport, SRC.cherlapally, SRC.medchal, ...WAGE_SOURCES],
  },
  {
    cluster: "hyderabad",
    estate: "genome-valley",
    name: "Genome Valley",
    placeId: "genome-valley",
    metaTitle: "Contract Labour in Genome Valley, Hyderabad",
    description:
      "Supervised housekeeping, stores, packing and production support crews for life sciences units in Genome Valley, Shamirpet and Turkapally, north of Hyderabad.",
    heading: "Contract labour in Genome Valley.",
    lede: "Supervised crews for vaccine, biotech and pharma research units, trained to your site's hygiene rules.",
    paragraph:
      "Genome Valley is Telangana's life sciences cluster: about 1,500 acres in four phases, from the biotech park at Turkapally and Kolthur to Lalgadi Malakpet, with TGIIC parks at Shameerpet and Turkapally. Its units include vaccine makers, biotech and pharma companies, and research labs. It lies about 23 km from Secunderabad station, off the Outer Ring Road.",
    faqs: [
      {
        question: "Do you supply contract labour in Genome Valley?",
        answer: "Yes. Housekeeping, stores, packing and production support crews, planned with your site team and run by our supervisor.",
        category: "commercial",
      },
      {
        question: "Can your crews meet GMP training rules?",
        answer:
          "Yes. The revised Schedule M names contract staff, cleaners included. We plan each crew around your site's training, gowning and health checks, and keep the training records.",
        category: "operations",
      },
      wagesFaq("We confirm the zone for your address before pricing."),
      {
        question: "How do crews get to sites here?",
        answer: "We plan company transport or a pick-up route for the crew with you before it starts.",
        category: "operations",
      },
    ],
    sources: [SRC.genome, SRC.lifeSciencesPolicy, SRC.genomeValley, SRC.parks, SRC.medchal, SRC.scheduleM, ...WAGE_SOURCES],
  },
  {
    cluster: "hyderabad",
    estate: "shamshabad-kothur",
    name: "Shamshabad and Kothur",
    placeId: "shamshabad-kothur",
    metaTitle: "Contract Labour in Shamshabad, Kothur and Adibatla",
    description:
      "Supervised loading, warehouse, factory and housekeeping crews for units in Shamshabad, Kothur, Shadnagar, Adibatla and Maheshwaram, south of Hyderabad.",
    heading: "Contract labour in Shamshabad and Kothur.",
    lede: "Supervised crews for warehouses, pharma and engineering units along Hyderabad's southern belt.",
    paragraph:
      "South of the city, in Rangareddy district, TGIIC runs industrial parks at Kothur and Mankhal, with a plastics park, and to the east the aerospace and precision engineering SEZ at Adibatla (about 338 acres) and the electronics cluster at Maheshwaram. The airport SEZ is at Shamshabad, and Shadnagar, further south, has pharma and battery units.",
    faqs: [
      {
        question: "Do you supply contract labour in Shamshabad and Kothur?",
        answer: "Yes. Supervised factory, loading and unloading, and housekeeping crews for units from Shamshabad to Shadnagar, and at Adibatla and Maheshwaram.",
        category: "commercial",
      },
      {
        question: "Can you staff warehouses near the airport?",
        answer: "Yes. Loading, unloading, picking and packing crews for warehouses and logistics parks, run by our supervisor.",
        category: "operations",
      },
      wagesFaq("We confirm the zone for your address before pricing."),
      VISIT_FAQ,
    ],
    sources: [SRC.parks, SRC.sez, SRC.shadnagar, SRC.rangareddy, ...WAGE_SOURCES],
  },
];
