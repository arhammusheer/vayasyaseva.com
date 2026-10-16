import type { LocationCopy } from "./types";

/**
 * Delhi NCR location pages: the hub and four industrial areas. Facts come
 * from the research of 16–17 Oct 2026, each cited in `sources` (official
 * first). Wage figures: Haryana notification of 9 Apr 2026 (from 1 Apr
 * 2026), UP order of 17 Apr 2026 (Category I), Delhi order of 15 Apr 2025.
 * No tenant names, registrations, headcount, shift patterns or seasonal
 * peaks are claimed.
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
    heading: "Contract labour across Delhi NCR.",
    lede: "Supervised crews for factories, warehouses and facilities in Gurugram, Manesar, Noida, Faridabad, Ghaziabad and Delhi's industrial areas.",
    facts: [
      { label: "States", value: "Delhi, Haryana and Uttar Pradesh" },
      { label: "Main estates", value: "IMT Manesar, Udyog Vihar, Noida, Greater Noida, Faridabad, Sahibabad, Bawana, Narela, Okhla, Kundli" },
      { label: "Unskilled minimum wage", value: "Delhi ₹18,456, Haryana ₹15,220.71, UP Category I ₹13,690 a month" },
      { label: "Professional Tax", value: "Not levied in Delhi, Haryana or UP" },
      { label: "Delhi's approved industrial areas", value: "28, with 24,169 units on pollution-board records" },
    ],
    intro:
      "Delhi NCR is three states sharing one labour market. A worker can live in Delhi, work in Kundli and be paid on Haryana's rate, or live in Ghaziabad and cross into Faridabad. The estates were built by different bodies: HSIIDC in Haryana, the NOIDA and Greater Noida authorities and UPSIDA in Uttar Pradesh, and DSIIDC in Delhi. We supply supervised crews on our own payroll for factory work, loading and unloading, and housekeeping across the region.",
    areas: [
      { href: "/locations/delhi-ncr/gurugram-manesar", name: "Gurugram and Manesar", text: "IMT Manesar and Udyog Vihar on NH-48: auto components, garments and a large transport and warehousing hub." },
      { href: "/locations/delhi-ncr/noida-greater-noida", name: "Noida and Greater Noida", text: "Noida's phases, the export zone and Greater Noida's Ecotech sectors, on the UP Category I wage." },
      { href: "/locations/delhi-ncr/faridabad-ghaziabad", name: "Faridabad and Ghaziabad", text: "Faridabad's engineering sectors and Ghaziabad's Sahibabad sites, a few kilometres apart on two state rates." },
      { href: "/locations/delhi-ncr/delhi-industrial-areas", name: "Delhi industrial areas", text: "Bawana, Narela, Okhla, Mayapuri, Wazirpur and Naraina, and Kundli across the Haryana border." },
    ],
    sections: [
      {
        heading: "Three states, three wage rules",
        body: [
          "Delhi pays one rate across the territory: ₹18,456 a month for unskilled work from the order of 15 April 2025, the latest the Labour Department lists. Haryana pays one statewide rate, ₹15,220.71 a month unskilled from 1 April 2026, its first full revision since 2015. In UP, Gautam Buddha Nagar and Ghaziabad are Category I, the highest band, at ₹13,690 a month unskilled.",
          "The state is set by where the site is, not where the worker lives. We price every crew on the rate for its site.",
        ],
      },
      {
        heading: "Winter on the NCR shop floor",
        body: [
          "The Graded Response Action Plan restricts older diesel trucks entering Delhi and limits diesel generators and some fuels at its higher stages. Stage IV was invoked twice in the 2025–26 winter.",
          "If your dispatch or power backup depends on these, tell us when you plan the crew, so loading and shift timings can be set around the curbs.",
        ],
      },
    ],
    rules: {
      text: "No Professional Tax in Delhi, Haryana or UP. Haryana's Labour Welfare Fund is deducted monthly: 0.2% of wages, up to ₹35 from the worker and ₹70 from the employer. Delhi's is ₹0.75 and ₹2.25 every six months. We deposit EPF and ESIC for every crew.",
      links: [RULE_LINKS.delhi, RULE_LINKS.up, RULE_LINKS.compliance],
    },
    faqs: [
      {
        question: "Which minimum wage applies to a site in Delhi NCR?",
        answer: "The rate of the state the site is in: Delhi's for Delhi, Haryana's for Gurugram, Manesar, Faridabad and Kundli, and UP's Category I for Noida, Greater Noida and Ghaziabad.",
        category: "compliance",
      },
      {
        question: "Do Haryana sites have to hire local residents?",
        answer: "Haryana's 2020 Act reserving 75% of lower-paid jobs for residents was struck down by the Punjab and Haryana High Court in November 2023. The State's appeal is pending in the Supreme Court.",
        category: "compliance",
      },
      {
        question: "Is there Professional Tax in Delhi NCR?",
        answer: "No. Delhi, Haryana and Uttar Pradesh do not levy it.",
        category: "compliance",
      },
      {
        question: "Can one crew contract cover sites in two NCR states?",
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
    heading: "Contract labour in IMT Manesar and Gurugram.",
    lede: "Supervised crews for auto component, garment and warehousing units in IMT Manesar, Udyog Vihar and along NH-48.",
    facts: [
      { label: "Developed by", value: "HSIIDC (Haryana State Industrial and Infrastructure Development Corporation)" },
      { label: "IMT Manesar", value: "Phases I–IV from 1997 to 2004, plus a 465-acre transport hub and a 285-acre warehousing hub" },
      { label: "Udyog Vihar", value: "1,124.5 acres from 1976, about 8 km from IGI Airport" },
      { label: "Main sectors", value: "Auto components, die-casting, plastic moulding, garments, ITES" },
      { label: "Unskilled minimum wage", value: "₹15,220.71 a month (Haryana, from 1 April 2026)" },
    ],
    intro:
      "IMT Manesar is HSIIDC's township on NH-48, built in phases from 1997. Its first four phases cover about 1,610 acres, and beside them sit a 465-acre transport hub and a 285-acre warehousing and transport hub. HSIIDC lists automobiles and components, die-casting, plastic moulding, automotive electronics, control cables, knitted garments and CNC machining among its activities. Closer to Delhi, Udyog Vihar in Gurugram has grown since 1976 to 1,124.5 acres of IT, garment and auto-ancillary units.",
    sections: [
      {
        heading: "Getting crews to Manesar",
        body: [
          "No metro reaches Manesar yet; a line to Pachgaon via IMT Manesar is proposed but not approved. Workers come by road on NH-48 and the KMP and Dwarka expressways, and the nearest railway station is Patli, about 5 km away.",
          "We plan how a crew reaches your gate before it starts, along with its shifts and supervision.",
        ],
      },
      {
        heading: "Haryana's 2026 wage and what it means for you",
        body: [
          "Haryana revised its minimum wage from 1 April 2026: ₹15,220.71 unskilled, ₹16,780.74 semi-skilled, ₹18,500.81 skilled and ₹19,425.85 highly skilled a month. One rate applies across the state, with no zones, so Manesar, Gurugram and Rewari district pay the same.",
          "The notification makes the principal employer responsible if a contractor fails to pay, and on 5 October 2026 the Labour Commissioner ordered it enforced on every establishment. We pay every crew at or above it and share the registers and challans.",
        ],
      },
    ],
    rules: {
      text: "Haryana's Labour Welfare Fund is deducted monthly: 0.2% of wages, up to ₹35 from the worker and ₹70 from the employer. Haryana levies no Professional Tax. EPF and ESIC are deposited every month.",
      links: [RULE_LINKS.compliance],
    },
    faqs: [
      {
        question: "Is the minimum wage different in Manesar and Gurugram?",
        answer: "No. Haryana's 2026 notification sets one rate for the whole state, so the same figures apply in IMT Manesar, Udyog Vihar and Dharuhera.",
        category: "compliance",
      },
      {
        question: "Can you supply loading crews for the IMT transport and warehousing hubs?",
        answer: "Yes. We supply loading, unloading, picking and dispatch crews sized to the vehicles you handle on normal and peak days.",
        category: "operations",
      },
      {
        question: "Who is liable if a contractor underpays in Haryana?",
        answer: "The 2026 notification makes the occupier or principal employer personally responsible. That is why we share wage registers and payment records every month.",
        category: "compliance",
      },
      {
        question: "Do Manesar units have to hire Haryana residents?",
        answer: "Not under the 2020 local-candidates Act today: the High Court struck it down in November 2023, and the State's appeal is pending in the Supreme Court.",
        category: "compliance",
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
    heading: "Contract labour in Noida and Greater Noida.",
    lede: "Supervised crews for electronics, garment and engineering units in Noida, the export zone, Greater Noida and the Yamuna Expressway area.",
    facts: [
      { label: "Noida", value: "NOIDA Authority, set up in 1976; Phase I 393 ha, Phase II 259 ha with the export zone, Phase III 376 ha" },
      { label: "Greater Noida", value: "GNIDA, set up in 1991; Ecotech sectors, with UPSIDA's Surajpur and EPIP Kasna" },
      { label: "Main sectors", value: "Hosiery and garments, electronics, textiles, engineering goods" },
      { label: "District", value: "Gautam Buddha Nagar, UP minimum wage Category I" },
      { label: "Unskilled minimum wage", value: "₹13,690 a month (from 1 April 2026)" },
    ],
    intro:
      "Noida was set up by the NOIDA Authority in April 1976 under the UP Industrial Area Development Act. Phase I covers sectors 1, 11 and 16, Phase II takes in the Noida export processing zone, and Phase III runs across sectors 57 to 64. Greater Noida followed in 1991 under GNIDA, with its Ecotech series of industrial sectors, while UPSIDA works on Surajpur and EPIP Kasna. In the district's MSME profile, hosiery and garments was the largest category, with 3,429 units employing 76,716 people.",
    sections: [
      {
        heading: "A wage set after unrest",
        body: [
          "UP's order of 17 April 2026 raised Category I to ₹13,690 a month unskilled, ₹15,059 semi-skilled and ₹16,868 skilled, effective 1 April 2026. The order itself cites labour unrest in Noida and Greater Noida, where workers asked for wages on Haryana's pattern, and notes that revisions due in 2019 and 2024 had not been made.",
          "The same Category I rate applies from Noida through Greater Noida to the Yamuna Expressway area. We pay crews at or above it and keep the records open to your audit.",
        ],
      },
      {
        heading: "How workers reach the sectors",
        body: [
          "The Noida Metro Aqua Line runs from Sector 51 to Depot, with stations including Pari Chowk, Knowledge Park II and NSEZ, and the Delhi Metro Blue Line links Delhi to Noida. Ecotech-12 is on a proposed Aqua Line extension, not yet built.",
          "Greater Noida sits where the Western and Eastern Dedicated Freight Corridors meet, so warehousing and dispatch work is close to the factories.",
        ],
      },
    ],
    rules: {
      text: "UP levies no Professional Tax. Category I wages apply to Gautam Buddha Nagar and Ghaziabad. EPF and ESIC are deposited every month.",
      links: [RULE_LINKS.up, RULE_LINKS.compliance],
    },
    faqs: [
      {
        question: "Which UP wage category is Noida?",
        answer: "Category I, the highest. It covers Gautam Buddha Nagar, which includes Noida and Greater Noida, and Ghaziabad.",
        category: "compliance",
      },
      {
        question: "Is the rate the same in Greater Noida and along the Yamuna Expressway?",
        answer: "Yes. They are in the same district, so the Category I rate applies.",
        category: "compliance",
      },
      {
        question: "Can you staff garment and export units in Noida?",
        answer: "Yes. We supply production helpers, packers, line feeders and material handlers, planned around your line and shifts.",
        category: "operations",
      },
      {
        question: "Why did UP raise the Noida rate in April 2026?",
        answer: "The order cites labour unrest in Noida and Greater Noida and revisions that were due in 2019 and 2024 but not made.",
        category: "compliance",
      },
    ],
    sources: [
      UP_WAGE,
      { label: "GNIDA: about Greater Noida", url: "https://greaternoidaauthority.in/node/47" },
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
    heading: "Contract labour in Faridabad and Ghaziabad.",
    lede: "Supervised crews for engineering, auto component and garment units in Faridabad's sectors and Ghaziabad's industrial sites.",
    facts: [
      { label: "Faridabad", value: "Sectors 24, 25, 27A–D, 58 and 59 (HSVP); HSIIDC estates in sectors 31 and 59; IMT Faridabad in sectors 66–69" },
      { label: "Ghaziabad", value: "Sahibabad Site-4 (679.5 acres), Bulandshahr Road, Loni Road, Meerut Road; Tronica City in Loni" },
      { label: "Main sectors", value: "Light engineering, auto components, garments, electrical goods, engineering goods" },
      { label: "Unskilled minimum wage", value: "Faridabad ₹15,220.71 (Haryana); Ghaziabad ₹13,690 (UP Category I)" },
      { label: "Rail links", value: "Namo Bharat (Delhi–Meerut) at Sahibabad and Ghaziabad; Violet Line to Faridabad" },
    ],
    intro:
      "Faridabad grew from a 1948 refugee camp into a self-help industrial township, and its sectors were later developed by HUDA, now HSVP: Sector 24 alone covers 664 acres and Sector 25 540 acres. HSIIDC added estates in sectors 31 and 59 and IMT Faridabad across sectors 66 to 69. Across the state border, Ghaziabad's industrial land is spread over Sahibabad, Bulandshahr Road, Loni Road and Meerut Road, and engineering goods is the district's One District One Product sector, with about 6,500 MSME units.",
    sections: [
      {
        heading: "Two states, a few kilometres apart",
        body: [
          "A Faridabad site pays Haryana's rate, ₹15,220.71 a month unskilled from 1 April 2026. A Ghaziabad site pays UP's Category I rate, ₹13,690. The difference is set by where the site is, not where the crew lives.",
          "Haryana's notification also makes the principal employer responsible for unpaid wages. We price each site on its own state's rate and share the records each month.",
        ],
      },
      {
        heading: "Crews for engineering and dispatch",
        body: [
          "Faridabad's HSIIDC estates list light engineering, auto components, garments and electrical goods, and the older district profile noted die-casting work. Ghaziabad's sites carry engineering goods and electronics in Tronica City.",
          "The Namo Bharat rapid rail line between Delhi and Meerut stops at Sahibabad and Ghaziabad, and Faridabad is served by the Violet Line and NH-44. We plan crew travel with your shift times.",
        ],
      },
    ],
    rules: {
      text: "Neither Haryana nor UP levies Professional Tax. Faridabad sites pay Haryana's monthly Labour Welfare Fund (0.2% of wages, up to ₹35 and ₹70). EPF and ESIC are deposited every month.",
      links: [RULE_LINKS.up, RULE_LINKS.compliance],
    },
    faqs: [
      {
        question: "Why is the minimum wage lower in Ghaziabad than in Faridabad?",
        answer: "They are in different states. Faridabad follows Haryana's 2026 notification; Ghaziabad follows UP's Category I order of 17 April 2026.",
        category: "compliance",
      },
      {
        question: "Can one crew work across sites in both cities?",
        answer: "Each site is paid and recorded on its own state's rules. A worker moved between them is paid the rate of the site they work at.",
        category: "operations",
      },
      {
        question: "Do you supply crews for Sahibabad and Loni?",
        answer: "Yes. Tell us the site, the roles and the shifts, and we plan the crew and its supervision.",
        category: "operations",
      },
      {
        question: "Is there a Labour Welfare Fund deduction in Faridabad?",
        answer: "Yes, Haryana's: 0.2% of wages each month, up to ₹35 from the worker and ₹70 from the employer.",
        category: "compliance",
      },
    ],
    sources: [
      { label: "HSIIDC: Faridabad estates", url: "https://hsiidc.org.in/activities-and-services/infrastructure-development-industrial-estates/faridabad" },
      { label: "HSIIDC: IMT Faridabad", url: "https://hsiidc.org.in/activities-and-services/infrastructure-imts/imt-faridabad" },
      { label: "MSME-DI: District profile, Faridabad (2012)", url: "https://dcmsme.gov.in/old/dips/DIP%20Report%20%20Faridabad.pdf" },
      { label: "Lok Sabha debates, 23 Nov 1956: Faridabad township", url: "https://eparlib.nic.in/bitstream/123456789/896784/1/01_XIV_23-11-1956_p61_p70_PII.pdf" },
      { label: "Ghaziabad district: about the district", url: "https://ghaziabad.nic.in/about-district/" },
      { label: "MSME-DI: District profile, Ghaziabad (2012–13)", url: "https://dcmsme.gov.in/old/dips/final%20Report%20Ghaziabad.pdf" },
      { label: "UPSDM: Ghaziabad district skill plan", url: "https://www.upsdm.gov.in/Content/WebAssets/DSDP/GHAZIABAD.pdf" },
      { label: "UP government: Tronica City, Ghaziabad", url: "https://nri.up.gov.in/post/en/tronica-city-ghaziabad" },
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
    heading: "Contract labour in Delhi's industrial areas.",
    lede: "Supervised crews for units in Bawana, Narela, Okhla, Mayapuri, Wazirpur and Naraina, and in Kundli just across the border.",
    facts: [
      { label: "Delhi's approved industrial areas", value: "28, with 24,169 units on DPCC records" },
      { label: "Largest by units", value: "Bawana 8,875, Narela 3,120, Mayapuri 2,062, Okhla 1,517, Wazirpur 1,050, Naraina 543" },
      { label: "Administered by", value: "DSIIDC; Kundli by HSIIDC (Haryana)" },
      { label: "Unskilled minimum wage", value: "Delhi ₹18,456 a month; Kundli ₹15,220.71 (Haryana)" },
      { label: "Kundli", value: "1,243.91 acres from 1982 to 2010, on NH-44, 7 km from Narela station" },
    ],
    intro:
      "Delhi has 28 approved industrial areas with 24,169 units on the pollution control committee's records. Bawana and Narela were built by DSIIDC for the relocation scheme that followed the Supreme Court's orders in the M.C. Mehta cases, and Bawana alone holds 8,875 units over about 778 hectares. Okhla's units include garments, leather, pharma and printing. Kundli, in Sonipat district, is HSIIDC's 1,243.91-acre estate on NH-44, with auto parts, LED products, batteries and cold storage.",
    sections: [
      {
        heading: "Delhi's rate, and Kundli's",
        body: [
          "Delhi pays one minimum wage across the territory: ₹18,456 a month unskilled, ₹20,371 semi-skilled and ₹22,411 skilled, from the order of 15 April 2025, the latest the Labour Department lists. The order itself warns about tampered copies in circulation.",
          "Kundli is in Haryana, so a worker who lives in Delhi but works in Kundli is paid Haryana's rate, ₹15,220.71 a month unskilled. We set each crew's pay by the site, not the worker's address.",
        ],
      },
      {
        heading: "Getting to Bawana and Narela",
        body: [
          "The Delhi Metro Red Line extension from Rithala through Narela to Kundli, approved in December 2024, includes a Bawana Industrial Area station; it is expected around 2028. Until then crews reach the northern estates by road on NH-44.",
          "Winter air-quality curbs under the Graded Response Action Plan can stop older trucks entering Delhi and limit diesel generators, so we plan dispatch work around them.",
        ],
      },
    ],
    rules: {
      text: "Delhi levies no Professional Tax. Delhi's Labour Welfare Fund is ₹0.75 from the worker and ₹2.25 from the employer every six months; Kundli follows Haryana's monthly fund. EPF and ESIC are deposited every month.",
      links: [RULE_LINKS.delhi, RULE_LINKS.compliance],
    },
    faqs: [
      {
        question: "Is the minimum wage the same in Bawana and Okhla?",
        answer: "Yes. Delhi has one rate for the whole territory: ₹18,456 a month unskilled from 1 April 2025.",
        category: "compliance",
      },
      {
        question: "Why is Kundli's rate lower than Narela's next door?",
        answer: "Kundli is in Haryana's Sonipat district, so it follows Haryana's 2026 rate, not Delhi's.",
        category: "compliance",
      },
      {
        question: "Do the winter pollution curbs affect crews?",
        answer: "They can affect dispatch and power backup: at higher stages older trucks cannot enter Delhi and diesel generators are restricted. Tell us what your site depends on and we plan around it.",
        category: "operations",
      },
      {
        question: "Can you supply crews for units in Bawana and Narela?",
        answer: "Yes. Tell us the roles, the headcount and the shifts, and we plan the crew and its supervision.",
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
