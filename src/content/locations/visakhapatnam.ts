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
 * are out of scope (no PSARA licence).
 *
 * OPEN (owner, 22 Oct 2026): Gajuwaka is published without Autonagar, as an
 * interim call. More data is needed: a citable source on the Autonagar
 * (Visakhapatnam) industrial estate (APIIC estate list, layout, units) and
 * whether buyers name it apart from Gajuwaka. Until then "autonagar" is also
 * not a place word in src/markets/data.ts, because Vijayawada has an
 * Autonagar too and would misroute visitors.
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

/** The te-IN wages and visit answers (docs/telugu-glossary.md); the pages they link to are English. */
const WAGES_LINK_TE = linkable(AP_WAGES, "en-IN")
  ? { href: AP_WAGES, label: "ఆంధ్రప్రదేశ్ కనీస వేతనాలు (English)" }
  : { href: "/compliance", label: "మేము కంప్లయన్స్ ఎలా చూసుకుంటాం (English)" };

const wagesFaqTe = (zone: string): FaqItem => ({
  question: "ఏ కనీస వేతనం, ఏ నిబంధనలు వర్తిస్తాయి?",
  answer: `ఆంధ్రప్రదేశ్‌వే, పని రకం, జోన్, నైపుణ్యాన్ని బట్టి: బేసిక్ రేటుతో పాటు ప్రతి ఏప్రిల్ 1, అక్టోబర్ 1న సవరించే కరువు భత్యం (VDA). ప్రొఫెషనల్ ట్యాక్స్, లేబర్ వెల్ఫేర్ ఫండ్ కూడా వర్తిస్తాయి. ${zone}`,
  link: WAGES_LINK_TE,
  category: "compliance",
});

const VISIT_FAQ_TE: FaqItem = {
  question: "ముందుగా మా సైట్‌ను చూడటానికి వస్తారా?",
  answer: "అవును. బృందం పని మొదలుపెట్టే ముందు సైట్‌కు వచ్చి పని, షిఫ్ట్‌లు, మీ హైజీన్ మరియు సేఫ్టీ నియమాలను చూస్తాం.",
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
  apWages: { label: "Labour Department, Andhra Pradesh: VDA for the scheduled employments from 1 October 2026 (basic plus VDA, revised 1 April and 1 October)", url: "https://api.apfd.apcfss.in/socialwelfaredms/user-defined-path/file-download/bucket/documents.socialwlfare.apcfss.in/labour/1790751054626_VDAGazetteason01.10.2026.pdf" },
  apPt: { label: "Commercial Taxes Department, Andhra Pradesh: Professional Tax First Schedule (Internet Archive copy, June 2022)", url: "https://web.archive.org/web/20220623183430id_/https://apct.gov.in/apportal/AllActs/APPT/APPTSchedule.aspx" },
  apLwf: { label: "Labour Department, Andhra Pradesh: Labour Welfare Fund Act, 1987", url: "https://api.apfd.apcfss.in/socialwelfaredms/user-defined-path/file-download/bucket/documents.socialwlfare.apcfss.in/labour/1755841991986_LABOUR_WELFAREFUNDACT1987.pdf" },
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
    // Draft pending native review (docs/telugu-glossary.md).
    translations: {
      "te-IN": {
        name: "విశాఖపట్నం",
        metaTitle: "విశాఖపట్నంలో లేబర్ కాంట్రాక్టర్ (Labour Contractor)",
        description:
          "విశాఖపట్నంలో ఫ్యాక్టరీలు, ఫార్మా, పోర్టు యూనిట్లకు సూపర్‌వైజర్‌తో కాంట్రాక్ట్ లేబర్ బృందాలు: JN ఫార్మా సిటీ పరవాడ, APSEZ అచ్యుతాపురం, VSEZ, గాజువాక.",
        heading: "విశాఖపట్నంలో లేబర్ కాంట్రాక్టర్.",
        lede: "వైజాగ్ పారిశ్రామిక ప్రాంతం అంతటా ఫార్మా, ఇంజినీరింగ్, దుస్తుల తయారీ, పోర్టు దగ్గరి యూనిట్లకు సూపర్‌వైజర్‌తో బృందాలు.",
        paragraph:
          "విశాఖపట్నం ఓడరేవు, ఉక్కు నగరం, దాని చుట్టూ ఫార్మా, పెట్రోకెమికల్, ఇంజినీరింగ్ యూనిట్లు ఉన్నాయి. చాలా పరిశ్రమలు నగర కేంద్రానికి నైరుతి దిశలో ఉన్నాయి: గాజువాక దగ్గర స్టీల్ ప్లాంట్ మరియు గంగవరం పోర్టు, దువ్వాడలో VSEZ, ఆ తర్వాత 2022 నుండి అనకాపల్లి జిల్లాలో, పరవాడలో ఫార్మా సిటీ, అచ్యుతాపురం మరియు రాంబిల్లిలో APIIC SEZ. {areas}లోని యూనిట్ల నుండి మేము అవసరాలు తీసుకుంటాం.",
        areas: [
          { href: "/locations/visakhapatnam/parawada-pharma-city", name: "JN ఫార్మా సిటీ, పరవాడ" },
          { href: "/locations/visakhapatnam/atchutapuram-rambilli", name: "APSEZ అచ్యుతాపురం మరియు రాంబిల్లి" },
          { href: "/locations/visakhapatnam/duvvada-vsez", name: "VSEZ దువ్వాడ" },
          { href: "/locations/visakhapatnam/gajuwaka", name: "గాజువాక" },
        ],
        faqs: [
          {
            question: "విశాఖపట్నంలో కాంట్రాక్ట్ లేబర్ సప్లై చేస్తారా?",
            answer: "అవును. ఫ్యాక్టరీ, లోడింగ్ మరియు అన్‌లోడింగ్, హౌస్‌కీపింగ్ బృందాలు, మా పేరోల్‌లో, మీ సైట్‌లో మా సూపర్‌వైజర్ పర్యవేక్షణలో.",
            category: "commercial",
          },
          {
            question: "విశాఖపట్నంలో మీ దగ్గర కార్మికులు ఉన్నారా?",
            answer:
              "వైజాగ్ కోసం మేము కార్మికుల జాబితా ఉంచుతాం. నగరం, గాజువాక, పెందుర్తి, అనకాపల్లి నుండి ప్రైవేట్ జాబ్స్ కోసం చూస్తున్నవారు మా విశాఖపట్నం జాబ్స్ పేజీలో అందులో చేరతారు. ఆ జాబితా నుండే మీ సైట్‌కు ప్రతి బృందాన్ని ఏర్పాటు చేస్తాం.",
            category: "operations",
          },
          wagesFaqTe("ధర చెప్పే ముందు మీ చిరునామాకు ఏ జోన్ వర్తిస్తుందో నిర్ధారిస్తాం."),
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
    // Draft pending native review (docs/telugu-glossary.md).
    translations: {
      "te-IN": {
        name: "JN ఫార్మా సిటీ, పరవాడ",
        metaTitle: "పరవాడ ఫార్మా సిటీలో కాంట్రాక్ట్ లేబర్ (Contract Labour)",
        description:
          "వైజాగ్ దగ్గర పరవాడలోని జవహర్‌లాల్ నెహ్రూ ఫార్మా సిటీలో బల్క్ డ్రగ్, API యూనిట్లకు సూపర్‌వైజర్‌తో ప్రొడక్షన్ సపోర్ట్, ప్యాకింగ్, స్టోర్స్, హౌస్‌కీపింగ్ బృందాలు.",
        heading: "JN ఫార్మా సిటీ, పరవాడలో కాంట్రాక్ట్ లేబర్.",
        lede: "పరవాడలోని బల్క్ డ్రగ్, API యూనిట్లకు సూపర్‌వైజర్‌తో బృందాలు, మీ ప్లాంట్ హైజీన్ మరియు సేఫ్టీ నియమాలపై శిక్షణతో.",
        paragraph:
          "జవహర్‌లాల్ నెహ్రూ ఫార్మా సిటీ బల్క్ డ్రగ్స్, ఫార్మాస్యూటికల్స్, ఫైన్ కెమికల్స్ కోసమే నిర్మించిన పార్క్: పరవాడలో సుమారు 2,100 ఎకరాలు, APIIC తో పబ్లిక్-ప్రైవేట్ భాగస్వామ్యంలో అభివృద్ధి చేశారు. దీనికి సొంత వ్యర్థ జల శుద్ధి ప్లాంట్ ఉంది, లోపల నోటిఫై చేసిన ఒక ఫార్మా SEZ కూడా ఉంది. ఇది అనకాపల్లి జిల్లాలో, దువ్వాడ స్టేషన్ నుండి సుమారు 8 కి.మీ. దూరంలో ఉంది.",
        faqs: [
          {
            question: "JN ఫార్మా సిటీలో కాంట్రాక్ట్ లేబర్ సప్లై చేస్తారా?",
            answer: "అవును. ప్రొడక్షన్ సపోర్ట్, ప్యాకింగ్, స్టోర్స్ మరియు డిస్పాచ్, హౌస్‌కీపింగ్ బృందాలు, మీ సైట్ టీమ్‌తో కలిసి ప్లాన్ చేసి, మా సూపర్‌వైజర్ నడుపుతారు.",
            category: "operations",
          },
          {
            question: "మీ బృందాలు GMP శిక్షణ నియమాలను పాటించగలవా?",
            answer:
              "అవును. సవరించిన షెడ్యూల్ M క్లీనర్లతో సహా కాంట్రాక్ట్ సిబ్బందిని కూడా ప్రస్తావిస్తుంది. మీ ప్లాంట్ శిక్షణ, గౌనింగ్, ఆరోగ్య పరీక్షలకు తగ్గట్టు ప్రతి బృందాన్ని ప్లాన్ చేస్తాం, శిక్షణ రికార్డులు ఉంచుతాం.",
            category: "operations",
          },
          wagesFaqTe("ధర చెప్పే ముందు పరవాడకు ఏ జోన్ వర్తిస్తుందో నిర్ధారిస్తాం."),
          VISIT_FAQ_TE,
        ],
      },
    },
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
    // Draft pending native review (docs/telugu-glossary.md).
    translations: {
      "te-IN": {
        name: "APSEZ అచ్యుతాపురం మరియు రాంబిల్లి",
        metaTitle: "APSEZ అచ్యుతాపురంలో కాంట్రాక్ట్ లేబర్ (Contract Labour)",
        description:
          "అనకాపల్లి జిల్లా అచ్యుతాపురం, రాంబిల్లిలోని ఆంధ్రప్రదేశ్ SEZ కోసం సూపర్‌వైజర్‌తో ఫ్యాక్టరీ, లోడింగ్, హౌస్‌కీపింగ్ బృందాలు: ఫార్మా, ఇంజినీరింగ్, దుస్తుల తయారీ.",
        heading: "APSEZ అచ్యుతాపురం మరియు రాంబిల్లిలో కాంట్రాక్ట్ లేబర్.",
        lede: "వైజాగ్‌కు దక్షిణాన ఉన్న SEZ ప్రాంతంలో ఫార్మా, ఇంజినీరింగ్, దుస్తుల తయారీ యూనిట్లకు సూపర్‌వైజర్‌తో బృందాలు.",
        paragraph:
          "ఆంధ్రప్రదేశ్ స్పెషల్ ఎకనామిక్ జోన్ అనకాపల్లి జిల్లాలోని అచ్యుతాపురం, రాంబిల్లి మండలాల్లో ఉన్న APIIC మల్టీ-ప్రొడక్ట్ SEZ. దీన్ని విశాఖపట్నం-కాకినాడ పెట్రోకెమికల్ రీజియన్‌లో భాగంగా ప్లాన్ చేశారు, విశాఖపట్నం మరియు గంగవరం పోర్టులు దీనికి సేవలు అందిస్తాయి. ఇక్కడి యూనిట్లు ఫార్మాస్యూటికల్స్, ఇంజినీరింగ్, లాజిస్టిక్స్, పెట్రోకెమికల్స్ రంగాల్లో పనిచేస్తాయి. పక్కనే ఒక అపెరల్ SEZ ఉంది, రాంబిల్లి మరియు నక్కపల్లిలో కొత్త కారిడార్ క్లస్టర్లు వస్తున్నాయి.",
        faqs: [
          {
            question: "APSEZలో కాంట్రాక్ట్ లేబర్ సప్లై చేస్తారా?",
            answer: "అవును. సూపర్‌వైజర్‌తో ఫ్యాక్టరీ, లోడింగ్ మరియు అన్‌లోడింగ్, హౌస్‌కీపింగ్ బృందాలు, మీ సైట్ ఇండక్షన్, హైజీన్, PPE నియమాల ప్రకారం పనిచేస్తాయి.",
            category: "commercial",
          },
          {
            question: "ఇంత దూరంలోని సైట్లకు బృందాలు ఎలా చేరుకుంటాయి?",
            answer: "బృందం పని మొదలుపెట్టే ముందే కంపెనీ రవాణా లేదా వసతిని మీతో కలిసి ప్లాన్ చేస్తాం.",
            category: "operations",
          },
          wagesFaqTe("ధర చెప్పే ముందు మీ చిరునామాకు ఏ జోన్ వర్తిస్తుందో నిర్ధారిస్తాం."),
          {
            question: "ఎలా మొదలుపెట్టాలి?",
            answer: "సైట్ చిరునామా, కావలసిన రోల్స్‌తో కార్మికులను అడగండి. మేము కార్మికులను ఇవ్వగలమో లేదో స్పష్టంగా చెబుతాం, అక్కడి నుండి బృందాన్ని ప్లాన్ చేస్తాం.",
            category: "commercial",
          },
        ],
      },
    },
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
    // Draft pending native review (docs/telugu-glossary.md).
    translations: {
      "te-IN": {
        name: "VSEZ దువ్వాడ",
        metaTitle: "VSEZ దువ్వాడలో కాంట్రాక్ట్ లేబర్ (Contract Labour)",
        description:
          "దువ్వాడలోని విశాఖపట్నం స్పెషల్ ఎకనామిక్ జోన్ కోసం సూపర్‌వైజర్‌తో ఫ్యాక్టరీ, ప్యాకింగ్, లోడింగ్, హౌస్‌కీపింగ్ బృందాలు: ఎలక్ట్రానిక్స్, సాఫ్ట్‌వేర్, ఫార్మా.",
        heading: "VSEZ దువ్వాడలో కాంట్రాక్ట్ లేబర్.",
        lede: "విశాఖపట్నం SEZ లోపల ఎలక్ట్రానిక్స్, ఫార్మా, ఎగుమతి యూనిట్లకు సూపర్‌వైజర్‌తో బృందాలు.",
        paragraph:
          "దువ్వాడలోని విశాఖపట్నం స్పెషల్ ఎకనామిక్ జోన్ 1989లో ఎక్స్‌పోర్ట్ ప్రాసెసింగ్ జోన్‌గా మొదలై, 2003లో SEZ అయింది. ఇది భారత ప్రభుత్వానిది, వాణిజ్య మంత్రిత్వ శాఖ కింద ఒక డెవలప్‌మెంట్ కమిషనర్ దీన్ని నడుపుతారు: సుమారు 146 హెక్టార్లలో ఎలక్ట్రానిక్స్, సాఫ్ట్‌వేర్, ఫార్మాస్యూటికల్ యూనిట్లు, నగరం నుండి సుమారు 20 కి.మీ. దూరంలో.",
        faqs: [
          {
            question: "VSEZలో కాంట్రాక్ట్ లేబర్ సప్లై చేస్తారా?",
            answer: "అవును. జోన్‌లోని యూనిట్లకు హెల్పర్లు, ప్యాకర్లు, లోడర్లు, హౌస్‌కీపింగ్ బృందాలు, మీ సైట్ టీమ్‌తో కలిసి ప్లాన్ చేసి, మా సూపర్‌వైజర్ నడుపుతారు.",
            category: "commercial",
          },
          {
            question: "జోన్ ఎంట్రీ నియమాలకు తగ్గట్టు మీ బృందాలు పనిచేయగలవా?",
            answer: "అవును. బృందం మొదలయ్యే ముందే మీ సైట్ టీమ్‌తో కలిసి పాస్‌లు, ID కార్డులు ఏర్పాటు చేస్తాం. మనుషులు మారినప్పుడల్లా మా సూపర్‌వైజర్ జాబితాను అప్‌డేట్ చేస్తారు.",
            category: "operations",
          },
          wagesFaqTe("ధర చెప్పే ముందు దువ్వాడకు ఏ జోన్ వర్తిస్తుందో నిర్ధారిస్తాం."),
          VISIT_FAQ_TE,
        ],
      },
    },
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
    // Draft pending native review (docs/telugu-glossary.md).
    translations: {
      "te-IN": {
        name: "గాజువాక",
        metaTitle: "గాజువాకలో లేబర్ కాంట్రాక్టర్ (Labour Contractor)",
        description:
          "గాజువాక, దక్షిణ విశాఖపట్నంలో స్టీల్ ప్లాంట్, గంగవరం పోర్టు, NH-16 దగ్గరలోని యూనిట్లకు సూపర్‌వైజర్‌తో లోడింగ్, ఫ్యాక్టరీ, హౌస్‌కీపింగ్ బృందాలు.",
        heading: "గాజువాకలో లేబర్ కాంట్రాక్టర్.",
        lede: "విశాఖపట్నం దక్షిణ పారిశ్రామిక ప్రాంతంలో ఇంజినీరింగ్, పోర్టు దగ్గరి, లాజిస్టిక్స్ యూనిట్లకు సూపర్‌వైజర్‌తో బృందాలు.",
        paragraph:
          "గాజువాక దక్షిణ విశాఖపట్నానికి కేంద్రం: ఇళ్లు, దుకాణాలు, పరిశ్రమలు కలిసి ఉన్న ప్రాంతం, దగ్గర్లోనే స్టీల్ ప్లాంట్, గంగవరం పోర్టు ఉన్నాయి. NH-16 మండలం గుండా వెళుతుంది, చుట్టూ కూర్మన్నపాలెం, అగనంపూడి, మల్కాపురం, స్టీల్ ప్లాంట్ టౌన్‌షిప్ ఉన్నాయి.",
        faqs: [
          {
            question: "గాజువాకలో కాంట్రాక్ట్ లేబర్ సప్లై చేస్తారా?",
            answer: "అవును. గాజువాక మరియు చుట్టుపక్కల యూనిట్లు, యార్డులకు సూపర్‌వైజర్‌తో లోడింగ్ మరియు అన్‌లోడింగ్, ఫ్యాక్టరీ, హౌస్‌కీపింగ్ బృందాలు.",
            category: "commercial",
          },
          {
            question: "కార్మికులు ఇక్కడి సైట్లకు ఎలా చేరుకుంటారు?",
            answer:
              "చాలామంది APSRTC బస్సుల్లో వస్తారు: గాజువాకకు సొంత బస్ స్టేషన్ ఉంది, కూర్మన్నపాలెం మరియు స్టీల్ ప్లాంట్ మీదుగా సిటీ రూట్లు ఉన్నాయి. నైట్ షిఫ్ట్‌లకు మీతో కలిసి రవాణా ప్లాన్ చేస్తాం.",
            category: "operations",
          },
          wagesFaqTe("ధర చెప్పే ముందు మీ చిరునామాకు ఏ జోన్ వర్తిస్తుందో నిర్ధారిస్తాం."),
          VISIT_FAQ_TE,
        ],
      },
    },
  },
];
