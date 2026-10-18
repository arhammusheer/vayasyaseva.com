import type { LocationCopy } from "./types";

/**
 * Delhi NCR location pages: the hub and four industrial areas. Facts come
 * from the research of 16–17 Oct 2026, each cited in `sources` (official
 * first). Wage figures: Haryana notification of 9 Apr 2026 (from 1 Apr
 * 2026), UP order of 17 Apr 2026 (Category I), Delhi order of 15 Apr 2025.
 * No tenant names, registrations, headcount or shift patterns are claimed.
 */

const HR_WAGE = { label: "Haryana minimum wage notification No. 2/25/26-2 Lab, 9 Apr 2026 (gazette copy)", url: "https://www.sgcms.com/regulatory-updates/wp-content/uploads/2026/04/HAMWA2026Sep4.pdf" };
const HR_ENFORCE = { label: "Haryana Labour Department: order to enforce minimum wages, 5 Oct 2026", url: "https://storage.hrylabour.gov.in/uploads/labour_laws/Y2026/Oct/W1/D05/1791186016.pdf" };
const UP_WAGE = { label: "UP Labour Department: minimum wage order No. 374/36-2-2026-2041256, 17 Apr 2026", url: "https://uplabour.gov.in/MediaGallery/TickerScrolls/document-34.pdf" };
const DL_WAGE = { label: "Delhi Labour Department: minimum wage order of 15 Apr 2025", url: "https://labour.delhi.gov.in/sites/default/files/Labour/generic_multiple_files/da15april2025.pdf" };
const DL_RATES = { label: "Delhi Labour Department: current minimum wage rates", url: "https://labour.delhi.gov.in/labour/current-minimum-wage-rate" };
const HR_LWF = { label: "SCC Online: Haryana Labour Welfare Fund contribution revised, 2026", url: "https://www.scconline.com/blog/post/2026/05/11/haryana-labour-welfare-fund-contribution-revised-2026/" };
const DL_LWF = { label: "greytHR: Delhi Labour Welfare Fund rules", url: "https://www.greythr.com/wiki/acts/delhi-labour-welfare-fund-rules" };
const HR_LOCAL_HC = { label: "LiveLaw: High Court strikes down Haryana's 75% local quota, 17 Nov 2023", url: "https://www.livelaw.in/high-court/punjab-and-haryana-high-court/punjab-haryana-high-court-struck-down-75-reservation-for-haryana-domicile-in-private-sector-unconstitutional-242457" };
const HR_LOCAL_SC = { label: "LiveLaw: Supreme Court notice on Haryana's appeal, Feb 2024", url: "https://www.livelaw.in/top-stories/supreme-court-haryana-government-punjab-and-haryana-high-court-75-percent-domicile-quota-unconstitutional-248522" };
const GRAP = { label: "Commission for Air Quality Management: Graded Response Action Plan", url: "https://caqm.nic.in/index1.aspx?lsid=4217&lev=2&lid=4216&langid=1" };

const RULE_LINKS = {
  delhi: { href: "/minimum-wages/delhi", label: "Delhi minimum wages" },
  up: { href: "/minimum-wages/uttar-pradesh", label: "UP minimum wages" },
  haryana: { href: "/minimum-wages/haryana", label: "Haryana minimum wages" },
  compliance: { href: "/compliance", label: "How we handle compliance" },
};

export const delhiNcrPages: LocationCopy[] = [
  {
    cluster: "delhi-ncr",
    name: "Delhi NCR",
    placeId: "delhi-ncr",
    metaTitle: "Labour Contractor in Delhi NCR: Manesar to Noida",
    description:
      "Supervised contract labour crews for factories and warehouses in Delhi NCR: Gurugram and Manesar, Noida, Faridabad, Ghaziabad and Delhi's industrial areas.",
    heading: "Labour contractor in Delhi NCR.",
    lede: "Supervised crews for factories, warehouses and facilities across Delhi, Haryana and Uttar Pradesh.",
    paragraph:
      "Delhi NCR is three states sharing one labour market: a worker can live in Delhi and work in Kundli on Haryana's rate, or live in Ghaziabad and cross into Faridabad. We pay each crew on the rules of the state its site is in. We take requirements from units in {areas}.",
    areas: [
      { href: "/locations/delhi-ncr/gurugram-manesar", name: "Gurugram and Manesar" },
      { href: "/locations/delhi-ncr/noida-greater-noida", name: "Noida and Greater Noida" },
      { href: "/locations/delhi-ncr/faridabad-ghaziabad", name: "Faridabad and Ghaziabad" },
      { href: "/locations/delhi-ncr/delhi-industrial-areas", name: "Delhi's industrial areas" },
    ],
    faqs: [
      {
        question: "Do you supply contract labour in Delhi NCR?",
        answer: "Yes. We supply supervised crews on our own payroll for factory work, loading and unloading, and housekeeping in Delhi, Haryana and UP.",
        category: "operations",
      },
      {
        question: "Do the winter pollution curbs affect crews?",
        answer: "They can: at the Graded Response Action Plan's higher stages older diesel trucks cannot enter Delhi and diesel generators are restricted. Tell us what your site depends on and we plan around it.",
        category: "operations",
      },
      {
        question: "Which minimum wage and rules apply in Delhi NCR?",
        answer: "The state the site is in sets them: Delhi ₹18,456, Haryana ₹15,220.71 and UP Category I ₹13,690 a month unskilled. None of the three levies Professional Tax.",
        link: RULE_LINKS.compliance,
        category: "compliance",
      },
      {
        question: "Can one contract cover sites in two NCR states?",
        answer: "Yes. Each site is paid and recorded on its own state's rules, and you get one monthly invoice.",
        category: "commercial",
      },
    ],
    sources: [HR_WAGE, HR_ENFORCE, UP_WAGE, DL_WAGE, DL_RATES, GRAP, HR_LWF, DL_LWF, HR_LOCAL_HC, HR_LOCAL_SC, { label: "DPCC response in NGT Appeal No. 39 of 2026 (Delhi industrial areas and unit counts)", url: "https://www.greentribunal.gov.in/sites/default/files/news_updates/RESPONSE%20BY%20DPCC%20IN%20APPEAL%20NO.%2039%20of%202026%20HARJEET%20SINGH%20VS%20DPCC%20and%20ORS.pdf" }],
  },
  {
    cluster: "delhi-ncr",
    estate: "gurugram-manesar",
    name: "Gurugram and Manesar",
    placeId: "gurugram-manesar",
    metaTitle: "Contract Labour in IMT Manesar and Gurugram",
    description:
      "Supervised contract labour for IMT Manesar, Udyog Vihar and Gurugram's industrial sectors: factory crews, loading and housekeeping on Haryana's 2026 wage.",
    heading: "Labour contractor in IMT Manesar and Gurugram.",
    lede: "Supervised crews for auto component, garment and warehousing units in IMT Manesar, Udyog Vihar and along NH-48.",
    paragraph:
      "IMT Manesar is HSIIDC's township on NH-48, built in phases from 1997, with a transport hub and a warehousing hub beside it; its units make auto components, die-castings, plastic mouldings and knitted garments. Closer to Delhi, Udyog Vihar in Gurugram has grown since 1976 into 1,124.5 acres of IT, garment and auto-ancillary units.",
    faqs: [
      {
        question: "Do you supply contract labour in Manesar and Gurugram?",
        answer: "Yes. We supply supervised factory, loading and housekeeping crews to units in IMT Manesar, Udyog Vihar and along NH-48.",
        category: "operations",
      },
      {
        question: "Is the minimum wage different in Manesar and Gurugram?",
        answer: "No. Haryana's 2026 notification sets one rate for the whole state, with no zones.",
        category: "compliance",
      },
      {
        question: "Which wage and rules apply in Haryana?",
        answer: "₹15,220.71 a month unskilled from 1 April 2026, and the notification makes the principal employer liable if a contractor underpays. There is no Professional Tax; the Labour Welfare Fund is 0.2% of wages a month, up to ₹35 from the worker and ₹70 from the employer.",
        link: RULE_LINKS.haryana,
        category: "compliance",
      },
      {
        question: "How do workers reach Manesar?",
        answer: "By road on NH-48 and the KMP and Dwarka expressways; no metro reaches Manesar yet. We plan how a crew reaches your gate before it starts.",
        category: "operations",
      },
    ],
    sources: [
      { label: "HSIIDC: IMT Manesar", url: "https://hsiidc.org.in/activities-and-services/infrastructure-imts/imts-manesar" },
      { label: "HSIIDC: Udyog Vihar, Gurugram", url: "https://hsiidc.org.in/activities-and-services/infrastructure-development-industrial-estates/udyog-vihar-gurugram" },
      { label: "HSIIDC: Dharuhera", url: "https://hsiidc.org.in/activities-and-services/infrastructure-development-industrial-estates/dharuhera" },
      HR_WAGE,
      HR_ENFORCE,
      HR_LWF,
      HR_LOCAL_HC,
      HR_LOCAL_SC,
      { label: "Swarajya: proposed Gurugram metro expansion (secondary)", url: "https://swarajyamag.com/amp/story/news-brief/gurugrams-rs-10000-crore-metro-dream-takes-shape-with-36-km-expansion-plan" },
    ],
  },
  {
    cluster: "delhi-ncr",
    estate: "noida-greater-noida",
    name: "Noida and Greater Noida",
    placeId: "noida-greater-noida",
    metaTitle: "Contract Labour in Noida and Greater Noida",
    description:
      "Supervised contract labour for Noida's phases, the export zone and Greater Noida's industrial sectors: factory, garment, loading and housekeeping crews.",
    heading: "Labour contractor in Noida and Greater Noida.",
    lede: "Supervised crews for electronics, garment and engineering units in Noida, the export zone, Greater Noida and the Yamuna Expressway area.",
    paragraph:
      "Noida was set up by the NOIDA Authority in 1976, its three phases taking in the export processing zone; Greater Noida followed in 1991 with its Ecotech sectors, Surajpur and EPIP Kasna. Hosiery and garments is the district's largest industry, beside electronics and engineering goods.",
    faqs: [
      {
        question: "Do you supply contract labour in Noida and Greater Noida?",
        answer: "Yes. We supply production helpers, packers, line feeders, loading crews and housekeeping, with a supervisor on site.",
        category: "operations",
      },
      {
        question: "Why did UP raise the Noida rate in April 2026?",
        answer: "The order of 17 April 2026 cites labour unrest in Noida and Greater Noida, where workers asked for Haryana's rates, and revisions due in 2019 and 2024 that were not made.",
        category: "compliance",
      },
      {
        question: "Which minimum wage and rules apply in Noida?",
        answer: "Gautam Buddha Nagar is UP's Category I: ₹13,690 a month unskilled from 1 April 2026, the same through Greater Noida and the Yamuna Expressway area. UP levies no Professional Tax.",
        link: RULE_LINKS.up,
        category: "compliance",
      },
      {
        question: "How do workers reach the sectors?",
        answer: "The Noida Metro Aqua Line runs from Sector 51 through Knowledge Park II and Pari Chowk, and the Delhi Metro Blue Line links Delhi to Noida.",
        category: "operations",
      },
    ],
    sources: [
      UP_WAGE,
      // GNIDA's own site stopped answering (Oct 2026); the CAG audit gives January 1991, the Ecotech sectors and Surajpur.
      { label: "CAG: performance audit of GNIDA, Report No. 4 of 2023", url: "https://cag.gov.in/ag1/uttar-pradesh/en/audit-report/details/122410" },
      { label: "MSME-DI: District profile, Gautam Buddha Nagar (2012–13)", url: "https://dcmsme.gov.in/old/dips/DIP%20Report%20Gautam%20Budh%20Nagar.pdf" },
      { label: "ThePrint: Noida at 50 (secondary)", url: "https://theprint.in/ground-reports/at-50-noida-cosmopolitan-city-commercial-centre-industrial-utopia/2666905/" },
      { label: "PTI via The Week: Surajpur and UPSIDA (secondary)", url: "https://www.theweek.in/wire-updates/business/2024/12/21/des89-ncr-cm-surajpur.html" },
      { label: "Wikipedia: Aqua Line, Noida Metro (secondary)", url: "https://en.wikipedia.org/wiki/Aqua_Line_(Noida_Metro)" },
      { label: "Business Standard: Aqua Line extension approved (secondary)", url: "https://www.business-standard.com/india-news/noida-metro-govt-approves-aqua-line-extension-from-sector-51-greater-noida-124112500413_1.html" },
    ],
  },
  {
    cluster: "delhi-ncr",
    estate: "faridabad-ghaziabad",
    name: "Faridabad and Ghaziabad",
    placeId: "faridabad-ghaziabad",
    metaTitle: "Contract Labour in Faridabad and Ghaziabad",
    description:
      "Supervised contract labour for Faridabad's industrial sectors and Ghaziabad's Sahibabad, Loni and Meerut Road sites, each paid on its own state's wage rate.",
    heading: "Labour contractor in Faridabad and Ghaziabad.",
    lede: "Supervised crews for engineering, auto component and garment units in Faridabad's sectors and Ghaziabad's industrial sites.",
    paragraph:
      "Faridabad, founded in 1607 by Shaikh Farid, is Haryana's engineering city, with HSIIDC estates in sectors 31 and 59 and IMT Faridabad in sectors 66 to 69. Across the state border, Ghaziabad's industry runs along Sahibabad, Loni Road and Meerut Road, and engineering goods is its One District One Product sector.",
    faqs: [
      {
        question: "Do you supply contract labour in Faridabad and Ghaziabad?",
        answer: "Yes. We supply supervised factory, loading and housekeeping crews in Faridabad's sectors and at Sahibabad, Loni and Meerut Road.",
        category: "operations",
      },
      {
        question: "Why is the wage lower in Ghaziabad than in Faridabad?",
        answer: "They are in different states a few kilometres apart. A worker moved between sites is paid the rate of the site they work at.",
        category: "compliance",
      },
      {
        question: "Which minimum wage and rules apply?",
        answer: "Faridabad pays Haryana's ₹15,220.71 a month unskilled plus the Labour Welfare Fund; Ghaziabad pays UP Category I, ₹13,690. Neither state levies Professional Tax.",
        link: RULE_LINKS.up,
        category: "compliance",
      },
      {
        question: "How do workers reach the sites?",
        answer: "The Namo Bharat line between Delhi and Meerut stops at Sahibabad and Ghaziabad, and the Violet Line and NH-44 serve Faridabad.",
        category: "operations",
      },
    ],
    sources: [
      { label: "HSIIDC: Faridabad estates", url: "https://hsiidc.org.in/activities-and-services/infrastructure-development-industrial-estates/faridabad" },
      { label: "HSIIDC: IMT Faridabad", url: "https://hsiidc.org.in/activities-and-services/infrastructure-imts/imt-faridabad" },
      { label: "MSME-DI: District profile, Faridabad (2012)", url: "https://dcmsme.gov.in/old/dips/DIP%20Report%20%20Faridabad.pdf" },
      { label: "Ghaziabad district: about the district", url: "https://ghaziabad.nic.in/about-district/" },
      { label: "MSME-DI: District profile, Ghaziabad (2012–13)", url: "https://dcmsme.gov.in/old/dips/final%20Report%20Ghaziabad.pdf" },
      { label: "UPSDM: Ghaziabad district skill plan", url: "https://www.upsdm.gov.in/Content/WebAssets/DSDP/GHAZIABAD.pdf" },
      HR_WAGE,
      UP_WAGE,
      HR_LWF,
      { label: "Swarajya: Namo Bharat corridor fully open (secondary)", url: "https://swarajyamag.com/amp/story/infrastructure/indias-first-rrts-fully-operational-as-pm-modi-dedicates-final-26-km-of-82-km-delhimeerut-namo-bharat-corridor-to-nation" },
    ],
  },
  {
    cluster: "delhi-ncr",
    estate: "delhi-industrial-areas",
    name: "Delhi industrial areas",
    placeId: "delhi-industrial-areas",
    metaTitle: "Contract Labour in Bawana, Narela, Okhla and Kundli",
    description:
      "Supervised contract labour for Delhi's industrial areas, Bawana, Narela, Okhla, Mayapuri, Wazirpur and Naraina, and Kundli across the Haryana border.",
    heading: "Labour contractor in Delhi's industrial areas.",
    lede: "Supervised crews for units in Bawana, Narela, Okhla, Mayapuri, Wazirpur and Naraina, and in Kundli just across the border.",
    paragraph:
      "Delhi has 28 approved industrial areas with 24,169 units on pollution-board records; Bawana alone holds 8,875, built by DSIIDC for the relocation of units from residential areas. Okhla's units run to garments, leather, pharma and printing. Kundli, across the border in Sonipat, is HSIIDC's estate on NH-44.",
    faqs: [
      {
        question: "Do you supply contract labour in Delhi's industrial areas?",
        answer: "Yes. We supply supervised crews to units in Bawana, Narela, Okhla, Mayapuri, Wazirpur, Naraina and Kundli.",
        category: "operations",
      },
      {
        question: "Why is Kundli's rate lower than Narela's next door?",
        answer: "Kundli is in Haryana, so a worker who lives in Delhi but works there is paid Haryana's ₹15,220.71, not Delhi's rate. Pay follows the site, not the worker's address.",
        category: "compliance",
      },
      {
        question: "Which minimum wage and rules apply in Delhi?",
        answer: "One rate across the territory: ₹18,456 a month unskilled from the order of 15 April 2025. Delhi levies no Professional Tax; its Labour Welfare Fund is ₹0.75 from the worker and ₹2.25 from the employer every six months.",
        link: RULE_LINKS.delhi,
        category: "compliance",
      },
      {
        question: "Do the winter pollution curbs affect crews?",
        answer: "They can affect dispatch and power backup: at higher stages older trucks cannot enter Delhi and diesel generators are restricted. We plan around what your site depends on.",
        category: "operations",
      },
    ],
    sources: [
      { label: "DPCC response in NGT Appeal No. 39 of 2026 (industrial areas and unit counts)", url: "https://www.greentribunal.gov.in/sites/default/files/news_updates/RESPONSE%20BY%20DPCC%20IN%20APPEAL%20NO.%2039%20of%202026%20HARJEET%20SINGH%20VS%20DPCC%20and%20ORS.pdf" },
      { label: "DSIIDC: relocation scheme", url: "https://dsiidc.delhi.gov.in/relocation" },
      { label: "HSIIDC: Kundli", url: "https://hsiidc.org.in/activities-and-services/infrastructure-development-industrial-estates/kundli" },
      { label: "Delhi Industries Department: export promotion cell (Okhla)", url: "https://industries.delhi.gov.in/industries/export-promotion-cell" },
      DL_WAGE,
      DL_RATES,
      HR_WAGE,
      GRAP,
      DL_LWF,
      { label: "PUDR: Living, Working and Dying in Bawana, 2018 (secondary)", url: "https://www.pudr.org/publicatiosn-files/2018-Living%20Working%20and%20Dying%20in%20Bawana.pdf" },
      { label: "NBM&CW: Rithala–Narela–Kundli metro approved (secondary)", url: "https://www.nbmcw.com/news/pm-approves-rithala-narela-nathupur-corridor-under-delhi-metro-phase-iv.html" },
    ],
  },
];
