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
 * The wages answer links the Telangana wage page, published 24 Nov 2026
 * (it was in review from 27 Oct 2026, when the answer linked /compliance).
 * If the page ever goes back to review, the answer falls back by itself.
 */
const WAGES_LINK = linkable(TG_WAGES, "en-IN")
  ? { href: TG_WAGES, label: "Telangana minimum wages" }
  : { href: "/compliance", label: "How we handle compliance" };

const wagesFaq = (zone: string): FaqItem => ({
  question: "Which minimum wage and rules apply?",
  answer: `Telangana's: since 1 June 2026, one order sets basic rates by zone and skill for most listed employments (garments, spinning, powerlooms and a few others wait for a committee), with a cost of living allowance to be declared each April and October. Professional Tax and the Labour Welfare Fund apply too. ${zone}`,
  link: WAGES_LINK,
  category: "compliance",
});

const VISIT_FAQ: FaqItem = {
  question: "Will you visit our site first?",
  answer: "Yes. We visit before a crew starts, to see the work, the shifts and your hygiene and safety rules.",
  category: "operations",
};

/** The te-IN answers used on several pages (docs/telugu-glossary.md); the pages they link to are English. */
const WAGES_LINK_TE = linkable(TG_WAGES, "en-IN")
  ? { href: TG_WAGES, label: "తెలంగాణ కనీస వేతనాలు (English)" }
  : { href: "/compliance", label: "మేము కంప్లయన్స్ ఎలా చూసుకుంటాం (English)" };

const wagesFaqTe = (zone: string): FaqItem => ({
  question: "ఏ కనీస వేతనం, ఏ రూల్స్ వర్తిస్తాయి?",
  answer: `తెలంగాణ కనీస వేతనాలే: 2026 జూన్ 1 నుండి ఒకే జీవో, జాబితాలో ఉన్న ప్రతి రకం పనికి జోన్, స్కిల్‌ని బట్టి బేసిక్ రేట్లు నిర్ణయిస్తుంది. జీవన వ్యయ భత్యాన్ని ప్రతి ఏప్రిల్, అక్టోబర్‌లో ప్రకటించాల్సి ఉంటుంది. ప్రొఫెషనల్ ట్యాక్స్, లేబర్ వెల్ఫేర్ ఫండ్ కూడా వర్తిస్తాయి. ${zone}`,
  link: WAGES_LINK_TE,
  category: "compliance",
});
const ZONE_TE = "రేటు చెప్పే ముందు మీ అడ్రస్ ఏ జోన్‌లోకి వస్తుందో కన్ఫర్మ్ చేస్తాం.";

const VISIT_FAQ_TE: FaqItem = {
  question: "ముందుగా మా సైట్‌ను చూడటానికి వస్తారా?",
  answer: "అవును. టీమ్ పని మొదలుపెట్టే ముందే సైట్‌కి వచ్చి పని, షిఫ్ట్‌లు, మీ హైజీన్, సేఫ్టీ రూల్స్ చూస్తాం.",
  category: "operations",
};

const START_FAQ_TE: FaqItem = {
  question: "ఎలా మొదలుపెట్టాలి?",
  answer: "సైట్ అడ్రస్, ఏ రోల్స్ కావాలో చెబుతూ రిక్వెస్ట్ పంపండి. వర్కర్లను ఇవ్వగలమో లేదో స్పష్టంగా చెబుతాం, అక్కడి నుండి టీమ్‌ని ప్లాన్ చేస్తాం.",
  category: "commercial",
};

const gmpFaqTe = (where: string): FaqItem => ({
  question: "మీ టీమ్‌లు GMP ట్రైనింగ్ రూల్స్ పాటించగలవా?",
  answer: `అవును. రివైజ్డ్ షెడ్యూల్ Mలో క్లీనర్లతో సహా కాంట్రాక్ట్ స్టాఫ్ గురించి కూడా ఉంది. మీ ${where} ట్రైనింగ్, గౌనింగ్, మెడికల్ చెకప్‌లకు తగ్గట్టు ప్రతి టీమ్‌ని ప్లాన్ చేస్తాం, ట్రైనింగ్ రికార్డులు కూడా ఉంచుతాం.`,
  category: "operations",
});

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
  medicalDevices: { label: "Telangana Life Sciences: Medical Devices Park (302 acres, 2017)", url: "https://lifesciences.telangana.gov.in/medical-device-park/" },
  genome: { label: "Telangana Life Sciences: Genome Valley (23 km from Secunderabad station)", url: "https://lifesciences.telangana.gov.in/genome-valley/" },
  lifeSciencesPolicy: { label: "Telangana Life Sciences Policy: Genome Valley, about 1,500 acres in four phases", url: "https://rich.telangana.gov.in/assets/pdfs/Resources/Life-Sciences-Policy.pdf" },
  industriesReport: {
    label: "Industries Department, Telangana: annual report 2022–23 (study of 380 micro and small units in Cherlapally Industrial Park) (Internet Archive copy)",
    // tgtpc.telangana.gov.in does not answer from outside India (24 Nov 2026), so this is the Internet Archive capture.
    url: "https://web.archive.org/web/20250712223502id_/https://tgtpc.telangana.gov.in/wp-content/uploads/2024/04/Telangana-Industries-Dept-Annual-Report-2022-23.pdf",
  },
  patancheru: { label: "Patancheru", url: "https://en.wikipedia.org/wiki/Patancheru" },
  bollaram: { label: "IDA Bollaram", url: "https://en.wikipedia.org/wiki/IDA_Bollaram" },
  jeedimetla: { label: "Jeedimetla", url: "https://en.wikipedia.org/wiki/Jeedimetla" },
  medchalTown: { label: "Medchal", url: "https://en.wikipedia.org/wiki/Medchal" },
  cherlapally: { label: "Cherlapally", url: "https://en.wikipedia.org/wiki/Cherlapally" },
  genomeValley: { label: "Genome Valley", url: "https://en.wikipedia.org/wiki/Genome_Valley" },
  shadnagar: { label: "Shadnagar", url: "https://en.wikipedia.org/wiki/Shadnagar" },
  // CDSCO's own copy (paras 11.4.1 and 11.4.6: training of cleaning and contract staff).
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
    metaTitle: "Manpower Company and Labour Contractor in Hyderabad",
    description:
      "Labour supplier for pharma, engineering and logistics units in Hyderabad: supervised contract workers in Patancheru, Jeedimetla, Cherlapally and Shamshabad.",
    heading: "Labour contractor and manpower supplier in Hyderabad.",
    lede: "Supervised contract workers for pharma, engineering and logistics units across Hyderabad's industrial belts.",
    paragraph:
      "Hyderabad is at the centre of India's bulk drug industry: Telangana makes about a third of the country's pharma output and half its bulk drug exports. The city's industry sits in TGIIC parks around it: Patancheru and Pashamylaram to the north-west, in Sangareddy district; Jeedimetla and Medchal to the north and Cherlapally to the east, in Medchal-Malkajgiri; Genome Valley at Shamirpet; and Shamshabad, Kothur and Adibatla to the south, in Rangareddy. We take requirements from units in {areas}.",
    areas: [
      { href: "/locations/hyderabad/patancheru-pashamylaram", name: "Patancheru and Pashamylaram" },
      { href: "/locations/hyderabad/jeedimetla-medchal", name: "Jeedimetla and Medchal" },
      { href: "/locations/hyderabad/cherlapally-nacharam", name: "Cherlapally and Nacharam" },
      { href: "/locations/hyderabad/genome-valley", name: "Genome Valley" },
      { href: "/locations/hyderabad/shamshabad-kothur", name: "Shamshabad and Kothur" },
    ],
    faqs: [
      {
        question: "Are you a manpower supplier in Hyderabad?",
        answer: "Yes. We supply contract labour: supervised factory, loading and unloading, and housekeeping crews, on our payroll and run on your site by our supervisor.",
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
    // Draft pending native review (docs/telugu-glossary.md).
    translations: {
      "te-IN": {
        name: "హైదరాబాద్",
        metaTitle: "హైదరాబాద్‌లో లేబర్ కాంట్రాక్టర్ (Labour Contractor)",
        description:
          "హైదరాబాద్‌లో ఫార్మా, ఇంజినీరింగ్, లాజిస్టిక్స్ యూనిట్లకు మ్యాన్‌పవర్ సప్లై: పటాన్‌చెరు, జీడిమెట్ల, చర్లపల్లి, శంషాబాద్‌లో సూపర్‌వైజర్ చూసుకునే వర్కర్లు.",
        heading: "హైదరాబాద్‌లో లేబర్ కాంట్రాక్టర్, మ్యాన్‌పవర్ సప్లై.",
        lede: "హైదరాబాద్ చుట్టూ ఉన్న ఇండస్ట్రియల్ బెల్ట్‌లన్నిటిలో ఫార్మా, ఇంజినీరింగ్, లాజిస్టిక్స్ యూనిట్లకు సూపర్‌వైజర్ చూసుకునే కాంట్రాక్ట్ వర్కర్లు.",
        paragraph:
          "హైదరాబాద్ భారతదేశ బల్క్ డ్రగ్ కేంద్రం: దేశ ఫార్మా ఉత్పత్తిలో దాదాపు మూడో వంతు, బల్క్ డ్రగ్ ఎగుమతుల్లో సగం తెలంగాణదే. ఇక్కడి పరిశ్రమలు నగరం చుట్టూ ఉన్న TGIIC పార్కుల్లో ఉన్నాయి: వాయువ్యం వైపు సంగారెడ్డి జిల్లాలో పటాన్‌చెరు, పాశమైలారం; మేడ్చల్-మల్కాజిగిరి జిల్లాలో ఉత్తరాన జీడిమెట్ల, మేడ్చల్, తూర్పున చర్లపల్లి; శామీర్‌పేటలో జీనోమ్ వ్యాలీ; దక్షిణాన రంగారెడ్డి జిల్లాలో శంషాబాద్, కొత్తూరు, ఆదిభట్ల. {areas}లోని యూనిట్ల నుండి రిక్వైర్‌మెంట్లు తీసుకుంటాం.",
        areas: [
          { href: "/locations/hyderabad/patancheru-pashamylaram", name: "పటాన్‌చెరు-పాశమైలారం" },
          { href: "/locations/hyderabad/jeedimetla-medchal", name: "జీడిమెట్ల-మేడ్చల్" },
          { href: "/locations/hyderabad/cherlapally-nacharam", name: "చర్లపల్లి-నాచారం" },
          { href: "/locations/hyderabad/genome-valley", name: "జీనోమ్ వ్యాలీ" },
          { href: "/locations/hyderabad/shamshabad-kothur", name: "శంషాబాద్-కొత్తూరు" },
        ],
        faqs: [
          {
            question: "హైదరాబాద్‌లో మీరు మ్యాన్‌పవర్ సప్లై చేస్తారా?",
            answer: "అవును. కాంట్రాక్ట్ లేబర్ సప్లై చేస్తాం: ఫ్యాక్టరీ, లోడింగ్-అన్‌లోడింగ్, హౌస్‌కీపింగ్ టీమ్‌లు. వర్కర్లు మా పేరోల్‌లో ఉంటారు, మీ సైట్‌లో మా సూపర్‌వైజర్ వాళ్లను చూసుకుంటారు.",
            category: "commercial",
          },
          {
            question: "హైదరాబాద్‌లో మీ దగ్గర వర్కర్లు ఉన్నారా?",
            answer:
              "హైదరాబాద్‌కి మా దగ్గర వర్కర్ల లిస్ట్ ఉంది. కూకట్‌పల్లి, ఉప్పల్, పటాన్‌చెరుతో పాటు సిటీ నలుమూలల నుండి జాబ్ కోసం చూస్తున్నవారు మా హైదరాబాద్ జాబ్స్ పేజీ ద్వారా ఈ లిస్ట్‌లో చేరుతారు. మీ సైట్‌కి ప్రతి టీమ్‌ని ఈ లిస్ట్ నుండే ఏర్పాటు చేస్తాం.",
            category: "operations",
          },
          wagesFaqTe(ZONE_TE),
          {
            question: "సెక్యూరిటీ గార్డులను సప్లై చేస్తారా?",
            answer: "లేదు. సెక్యూరిటీ పనికి ప్రైవేట్ సెక్యూరిటీ ఏజెన్సీ లైసెన్స్ కావాలి, అది మా దగ్గర లేదు.",
            category: "commercial",
          },
        ],
      },
    },
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
      "Patancheru, on the Solapur highway north-west of Hyderabad, is one of the city's main bulk drug and chemical belts. TGIIC runs five phases of industrial park at Patancheru and four at Pashamylaram, with an export promotion park, a textile park and, at Sultanpur, a 302-acre medical devices park set up in 2017, all in Sangareddy district. IDA Bollaram and industrial land at Gaddapotharam, Gummadidala and Jinnaram lie close by.",
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
    // Draft pending native review (docs/telugu-glossary.md).
    translations: {
      "te-IN": {
        name: "పటాన్‌చెరు-పాశమైలారం",
        metaTitle: "పటాన్‌చెరు, పాశమైలారంలో లేబర్ సప్లై (Contract Labour)",
        description:
          "పటాన్‌చెరు, పాశమైలారం, బొల్లారంలోని ఫార్మా, కెమికల్, ఇంజినీరింగ్ యూనిట్లకు సూపర్‌వైజర్ చూసుకునే ప్రొడక్షన్ సపోర్ట్, ప్యాకింగ్, స్టోర్స్, హౌస్‌కీపింగ్ టీమ్‌లు.",
        heading: "పటాన్‌చెరు, పాశమైలారంలో కాంట్రాక్ట్ లేబర్.",
        lede: "బల్క్ డ్రగ్, కెమికల్, ఇంజినీరింగ్ యూనిట్లకు సూపర్‌వైజర్ చూసుకునే టీమ్‌లు, మీ ప్లాంట్ హైజీన్, సేఫ్టీ రూల్స్‌పై ట్రైనింగ్‌తో.",
        paragraph:
          "సోలాపూర్ హైవే మీద, హైదరాబాద్‌కు వాయువ్యం వైపు ఉన్న పటాన్‌చెరు, నగరంలో అన్నిటికంటే పాత బల్క్ డ్రగ్, కెమికల్ బెల్ట్. TGIIC పటాన్‌చెరులో ఐదు ఫేజ్‌లలో, పాశమైలారంలో నాలుగు ఫేజ్‌లలో ఇండస్ట్రియల్ పార్కులు నడుపుతోంది. వీటితో పాటు ఎక్స్‌పోర్ట్ ప్రమోషన్ పార్క్, టెక్స్‌టైల్ పార్క్, సుల్తాన్‌పూర్‌లో 2017లో మొదలైన 302 ఎకరాల మెడికల్ డివైసెస్ పార్క్ కూడా ఉన్నాయి, ఇవన్నీ సంగారెడ్డి జిల్లాలోనే. IDA బొల్లారం, గడ్డపోతారం, గుమ్మడిదల, జిన్నారంలోని పారిశ్రామిక భూములు దగ్గర్లోనే ఉన్నాయి.",
        faqs: [
          {
            question: "పటాన్‌చెరు, పాశమైలారంలో కాంట్రాక్ట్ లేబర్ సప్లై చేస్తారా?",
            answer: "అవును. ప్రొడక్షన్ సపోర్ట్, ప్యాకింగ్, స్టోర్స్-డిస్పాచ్, హౌస్‌కీపింగ్ టీమ్‌లు ఇస్తాం. మీ సైట్ టీమ్‌తో కలిసి ప్లాన్ చేస్తాం, పని మా సూపర్‌వైజర్ చూసుకుంటారు.",
            category: "operations",
          },
          {
            question: "కెమికల్, బల్క్ డ్రగ్ ప్లాంట్లలో మీ టీమ్‌లు సురక్షితంగా ఎలా పనిచేస్తాయి?",
            answer:
              "పని మొదలుపెట్టే ముందు ప్రతి వర్కర్ మీ సైట్ ఇండక్షన్ పూర్తి చేస్తారు. ఫ్లోర్ మీద మీ పర్మిట్-టు-వర్క్, PPE, రిస్ట్రిక్టెడ్ ఏరియా రూల్స్ టీమ్ పాటించేలా మా సూపర్‌వైజర్ చూసుకుంటారు. ఎవరు ఎక్కడ పనిచేయాలో మీ సేఫ్టీ టీమ్‌తో కలిసి ప్లాన్ చేస్తాం.",
            category: "operations",
          },
          gmpFaqTe("ప్లాంట్"),
          wagesFaqTe(ZONE_TE),
        ],
      },
    },
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
    // Draft pending native review (docs/telugu-glossary.md).
    translations: {
      "te-IN": {
        name: "జీడిమెట్ల-మేడ్చల్",
        metaTitle: "జీడిమెట్ల, మేడ్చల్ కాంట్రాక్ట్ లేబర్ (Contract Labour)",
        description:
          "హైదరాబాద్ ఉత్తర భాగంలో జీడిమెట్ల, గండిమైసమ్మ, దుండిగల్, మేడ్చల్‌లోని యూనిట్లకు సూపర్‌వైజర్ చూసుకునే ఫ్యాక్టరీ, ప్యాకింగ్, లోడింగ్, హౌస్‌కీపింగ్ టీమ్‌లు.",
        heading: "జీడిమెట్ల, మేడ్చల్‌లో కాంట్రాక్ట్ లేబర్.",
        lede: "హైదరాబాద్ ఉత్తర ఇండస్ట్రియల్ బెల్ట్‌లో ఫార్మా, ఇంజినీరింగ్, కెమికల్ యూనిట్లకు సూపర్‌వైజర్ చూసుకునే టీమ్‌లు.",
        paragraph:
          "జీడిమెట్ల అనేది మేడ్చల్-మల్కాజిగిరి జిల్లాలోని ఆరు ఫేజ్‌ల TGIIC ఇండస్ట్రియల్ పార్క్. ఇక్కడ ఫార్మా, మెషిన్ టూల్స్, ఎలక్ట్రికల్, టెక్స్‌టైల్, కెమికల్ యూనిట్లు ఉన్నాయి. ఈ బెల్ట్ ఉత్తరం వైపు గండిమైసమ్మ, దుండిగల్ మీదుగా మేడ్చల్ ఇండస్ట్రియల్ ఎస్టేట్ వరకు ఉంటుంది. నగరానికి దగ్గరగా కూకట్‌పల్లి, సనత్‌నగర్‌లో పాత ఎస్టేట్లు ఉన్నాయి.",
        faqs: [
          {
            question: "జీడిమెట్లలో కాంట్రాక్ట్ లేబర్ సప్లై చేస్తారా?",
            answer: "అవును. జీడిమెట్ల, గండిమైసమ్మ, మేడ్చల్‌లోని యూనిట్లకు ఫ్యాక్టరీ, ప్యాకింగ్, హౌస్‌కీపింగ్ టీమ్‌లు ఇస్తాం. వర్కర్లు మా పేరోల్‌లో ఉంటారు, మా సూపర్‌వైజర్ చూసుకుంటారు.",
            category: "commercial",
          },
          {
            question: "లోడింగ్, అన్‌లోడింగ్ టీమ్‌లను సప్లై చేస్తారా?",
            answer: "అవును. ఈ బెల్ట్‌లోని డిస్పాచ్ బేలు, వేర్‌హౌస్‌లకు సూపర్‌వైజర్ చూసుకునే లోడింగ్, అన్‌లోడింగ్, స్టోర్స్ టీమ్‌లు ఇస్తాం. మీ గేట్, సేఫ్టీ రూల్స్ ప్రకారమే పనిచేస్తాయి.",
            category: "operations",
          },
          wagesFaqTe(ZONE_TE),
          VISIT_FAQ_TE,
        ],
      },
    },
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
      "East Hyderabad's industry is a cluster of TGIIC parks in Medchal-Malkajgiri district: Cherlapally, in five phases, then Nacharam, Uppal, Mallapur, Moula Ali and the electronics complex at Kushaiguda. Most units are small: a 2022–23 state study looked at 380 micro and small units in Cherlapally's park alone.",
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
    // Draft pending native review (docs/telugu-glossary.md).
    translations: {
      "te-IN": {
        name: "చర్లపల్లి-నాచారం",
        metaTitle: "చర్లపల్లి, నాచారంలో కాంట్రాక్ట్ లేబర్ (Contract Labour)",
        description:
          "హైదరాబాద్ తూర్పు భాగంలో చర్లపల్లి, నాచారం, ఉప్పల్, మల్లాపూర్, మౌలాలిలోని యూనిట్లకు సూపర్‌వైజర్ చూసుకునే ఫ్యాక్టరీ, ప్యాకింగ్, లోడింగ్, హౌస్‌కీపింగ్ టీమ్‌లు.",
        heading: "చర్లపల్లి, నాచారంలో కాంట్రాక్ట్ లేబర్.",
        lede: "తూర్పు హైదరాబాద్‌లోని చిన్న, మధ్య తరహా ఫ్యాక్టరీలకు సూపర్‌వైజర్ చూసుకునే టీమ్‌లు.",
        paragraph:
          "తూర్పు హైదరాబాద్ పరిశ్రమలు మేడ్చల్-మల్కాజిగిరి జిల్లాలోని TGIIC పార్కుల్లో ఉన్నాయి: రెండు ఫేజ్‌ల చర్లపల్లి, తర్వాత నాచారం, ఉప్పల్, మల్లాపూర్, మౌలాలి, కుషాయిగూడలోని ఎలక్ట్రానిక్స్ కాంప్లెక్స్. చాలా యూనిట్లు చిన్నవే: 2022-23లో రాష్ట్ర ప్రభుత్వం చేసిన ఒక అధ్యయనం ఒక్క చర్లపల్లి పార్క్‌లోనే 380 మైక్రో, చిన్న యూనిట్లను పరిశీలించింది.",
        faqs: [
          {
            question: "చర్లపల్లిలో కాంట్రాక్ట్ లేబర్ సప్లై చేస్తారా?",
            answer: "అవును. చర్లపల్లి, నాచారం, ఉప్పల్, మల్లాపూర్‌లోని యూనిట్లకు సూపర్‌వైజర్ చూసుకునే ఫ్యాక్టరీ, ప్యాకింగ్, లోడింగ్, హౌస్‌కీపింగ్ టీమ్‌లు ఇస్తాం.",
            category: "commercial",
          },
          VISIT_FAQ_TE,
          wagesFaqTe(ZONE_TE),
          START_FAQ_TE,
        ],
      },
    },
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
      "Genome Valley is Telangana's life sciences cluster: about 1,500 acres in four phases, with biotech parks at Turkapally and Lalgadi Malakpet and a third phase being built at Karakapatla, and TGIIC parks at Shameerpet, Turkapally and Kolthur. Its units include vaccine makers, biotech and pharma companies, and research labs. It lies about 23 km from Secunderabad station, off the Outer Ring Road.",
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
    // Draft pending native review (docs/telugu-glossary.md).
    translations: {
      "te-IN": {
        name: "జీనోమ్ వ్యాలీ",
        metaTitle: "జీనోమ్ వ్యాలీలో కాంట్రాక్ట్ లేబర్ (Contract Labour)",
        description:
          "జీనోమ్ వ్యాలీ, శామీర్‌పేట, తుర్కపల్లిలో లైఫ్ సైన్సెస్ యూనిట్లకు సూపర్‌వైజర్ చూసుకునే హౌస్‌కీపింగ్, స్టోర్స్, ప్యాకింగ్, ప్రొడక్షన్ సపోర్ట్ టీమ్‌లు.",
        heading: "జీనోమ్ వ్యాలీలో కాంట్రాక్ట్ లేబర్.",
        lede: "వ్యాక్సిన్, బయోటెక్, ఫార్మా రీసెర్చ్ యూనిట్లకు సూపర్‌వైజర్ చూసుకునే టీమ్‌లు, మీ సైట్ హైజీన్ రూల్స్‌పై ట్రైనింగ్‌తో.",
        paragraph:
          "జీనోమ్ వ్యాలీ తెలంగాణ లైఫ్ సైన్సెస్ క్లస్టర్: నాలుగు ఫేజ్‌లలో దాదాపు 1,500 ఎకరాలు, తుర్కపల్లి-కొల్తూరులోని బయోటెక్ పార్క్ నుండి లాల్‌గడి మలక్‌పేట వరకు. శామీర్‌పేట, తుర్కపల్లిలో TGIIC పార్కులు కూడా ఉన్నాయి. ఇక్కడ వ్యాక్సిన్ తయారీ కంపెనీలు, బయోటెక్, ఫార్మా కంపెనీలు, రీసెర్చ్ ల్యాబ్‌లు ఉన్నాయి. ఇది ఔటర్ రింగ్ రోడ్ దగ్గర, సికింద్రాబాద్ స్టేషన్ నుండి దాదాపు 23 కి.మీ. దూరంలో ఉంది.",
        faqs: [
          {
            question: "జీనోమ్ వ్యాలీలో కాంట్రాక్ట్ లేబర్ సప్లై చేస్తారా?",
            answer: "అవును. హౌస్‌కీపింగ్, స్టోర్స్, ప్యాకింగ్, ప్రొడక్షన్ సపోర్ట్ టీమ్‌లు ఇస్తాం. మీ సైట్ టీమ్‌తో కలిసి ప్లాన్ చేస్తాం, పని మా సూపర్‌వైజర్ చూసుకుంటారు.",
            category: "commercial",
          },
          gmpFaqTe("సైట్"),
          wagesFaqTe(ZONE_TE),
          {
            question: "ఇక్కడి సైట్లకు టీమ్‌లు ఎలా వస్తాయి?",
            answer: "టీమ్ పని మొదలుపెట్టే ముందే కంపెనీ ట్రాన్స్‌పోర్ట్ గానీ, పికప్ రూట్ గానీ మీతో కలిసి ప్లాన్ చేస్తాం.",
            category: "operations",
          },
        ],
      },
    },
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
    // Draft pending native review (docs/telugu-glossary.md).
    translations: {
      "te-IN": {
        name: "శంషాబాద్-కొత్తూరు",
        metaTitle: "శంషాబాద్, కొత్తూరు కాంట్రాక్ట్ లేబర్ (Contract Labour)",
        description:
          "హైదరాబాద్‌కు దక్షిణాన శంషాబాద్, కొత్తూరు, షాద్‌నగర్, ఆదిభట్ల, మహేశ్వరంలోని యూనిట్లకు సూపర్‌వైజర్ చూసుకునే లోడింగ్, వేర్‌హౌస్, ఫ్యాక్టరీ, హౌస్‌కీపింగ్ టీమ్‌లు.",
        heading: "శంషాబాద్, కొత్తూరులో కాంట్రాక్ట్ లేబర్.",
        lede: "హైదరాబాద్ దక్షిణ బెల్ట్‌లో వేర్‌హౌస్‌లు, ఫార్మా, ఇంజినీరింగ్ యూనిట్లకు సూపర్‌వైజర్ చూసుకునే టీమ్‌లు.",
        paragraph:
          "నగరానికి దక్షిణాన రంగారెడ్డి జిల్లాలో TGIIC కొత్తూరు, మంఖాల్‌లో ఇండస్ట్రియల్ పార్కులు నడుపుతోంది, ఒక ప్లాస్టిక్స్ పార్క్ కూడా ఉంది. తూర్పు వైపు ఆదిభట్లలో ఏరోస్పేస్, ప్రెసిషన్ ఇంజినీరింగ్ SEZ (దాదాపు 338 ఎకరాలు), మహేశ్వరంలో ఎలక్ట్రానిక్స్ క్లస్టర్ ఉన్నాయి. ఎయిర్‌పోర్ట్ SEZ శంషాబాద్‌లో ఉంది, ఇంకా దక్షిణాన ఉన్న షాద్‌నగర్‌లో ఫార్మా, బ్యాటరీ యూనిట్లు ఉన్నాయి.",
        faqs: [
          {
            question: "శంషాబాద్, కొత్తూరులో కాంట్రాక్ట్ లేబర్ సప్లై చేస్తారా?",
            answer: "అవును. శంషాబాద్ నుండి షాద్‌నగర్ వరకు, ఆదిభట్ల, మహేశ్వరంలోని యూనిట్లకు కూడా సూపర్‌వైజర్ చూసుకునే ఫ్యాక్టరీ, లోడింగ్-అన్‌లోడింగ్, హౌస్‌కీపింగ్ టీమ్‌లు ఇస్తాం.",
            category: "commercial",
          },
          {
            question: "ఎయిర్‌పోర్ట్ దగ్గరి వేర్‌హౌస్‌లకు వర్కర్లను ఇవ్వగలరా?",
            answer: "అవును. వేర్‌హౌస్‌లు, లాజిస్టిక్స్ పార్కులకు లోడింగ్, అన్‌లోడింగ్, పికింగ్, ప్యాకింగ్ టీమ్‌లు ఇస్తాం, పని మా సూపర్‌వైజర్ చూసుకుంటారు.",
            category: "operations",
          },
          wagesFaqTe(ZONE_TE),
          VISIT_FAQ_TE,
        ],
      },
    },
  },
];
