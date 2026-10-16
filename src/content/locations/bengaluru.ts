import type { LocationCopy } from "./types";

/**
 * Bengaluru: the hub and four industrial areas (owner direction, 16 Oct 2026).
 * Facts from the research of 16 and 17 Oct 2026, each cited in `sources`.
 * Wage zones are stated only where they are clear; Peenya (a Special
 * Investment Region) and Electronic City (an industrial township) are asked
 * to confirm theirs. No tenant names, headcounts or registration claims;
 * security guards are out of scope (no PSARA licence).
 */

const KA_RULES =
  "Karnataka's minimum wage comes from the single notification of 22 May 2026: one table by skill and zone, plus a VDA of ₹1,030.80 a month. Employers have challenged it in the High Court, which refused them interim relief. Professional Tax is ₹200 a month on wages of ₹25,000 or more (₹300 in February), and the Labour Welfare Fund is ₹50 from the worker and ₹100 from the employer each year. The state's rules for the contract labour licence are still in draft.";

const RULES_LINKS = [{ href: "/compliance", label: "How we handle compliance" }];

const SRC = {
  investUrban: { label: "Invest Karnataka: Bengaluru Urban district", url: "https://investkarnataka.co.in/our-districts/bengaluru-urban/" },
  investRural: { label: "Invest Karnataka: Bengaluru Rural district", url: "https://investkarnataka.co.in/our-districts/bengaluru-rural/" },
  investKolar: { label: "Invest Karnataka: Kolar district", url: "https://investkarnataka.co.in/our-districts/kolar/" },
  msmeDi: { label: "MSME-DI: Bangalore Urban district industrial profile (2012)", url: "https://dcmsme.gov.in/dips/Bangalore%20Urban%20District.pdf" },
  elcia: { label: "ELCIA: Electronic City", url: "https://elcia.in/?p=20105" },
  elcita: { label: "ELCITA: Electronic City Industrial Township Authority", url: "https://www.elcita.in/" },
  peenyaSir: { label: "India Briefing: Karnataka notifies Peenya as a Special Investment Region", url: "https://www.india-briefing.com/news/karnataka-notifies-peenya-as-special-investment-region-38147.html/" },
  peenyaIjurr: { label: "Banerji, IJURR (2024): The persistence of Peenya", url: "https://www.ijurr.org/article/the-persistence-of-peenya-examining-industrial-space-in-global-bangalore/" },
  gba: { label: "Deccan Herald: Greater Bengaluru area to remain the BBMP area", url: "https://www.deccanherald.com/amp/story/india%2Fkarnataka%2Fbengaluru%2Fgreater-bengaluru-area-to-remain-same-as-bbmp-area-three-corporations-likely-3542788" },
  greenLine: { label: "Green Line (Namma Metro)", url: "https://en.wikipedia.org/wiki/Green_Line_(Namma_Metro)" },
  greenExt: { label: "The News Minute: Green Line extends to Madavara", url: "https://www.thenewsminute.com/karnataka/bengalurus-namma-metro-green-line-extends-to-madavara" },
  yellowLine: { label: "Yellow Line (Namma Metro)", url: "https://en.wikipedia.org/wiki/Yellow_Line_(Namma_Metro)" },
  purpleLine: { label: "Purple Line (Namma Metro)", url: "https://en.wikipedia.org/wiki/Purple_Line_(Namma_Metro)" },
  warehouse2026: { label: "Tribune (Cushman & Wakefield): Bengaluru warehouse leasing, H1 2026", url: "https://www.tribuneindia.com/news/business/bengaluru-warehouse-leasing-jumps-78-to-3-1-msf-in-h1-2026-fastest-growth-among-major-markets/" },
  warehouse2024: { label: "CXOToday (Knight Frank): Bengaluru warehousing, 2024", url: "https://cxotoday.com/media-coverage/demand-for-space-in-bengalurus-warehousing-market-grows-by-27-yoy-to-6-6-mn-sq-ft-in-2024-knight-frank-india/" },
  strr: { label: "Asianet: Bengaluru–Chennai Expressway and STRR stretches open", url: "https://newsable.asianetnews.com/karnataka-news/bengaluru-chennai-expressway-new-25-km-stretch-opens-100-km-now-accessible-toll-charges-announced-articleshow-b071o72" },
  electronicCity: { label: "Electronic City", url: "https://en.wikipedia.org/wiki/Electronic_City" },
  attibele: { label: "Attibele", url: "https://en.wikipedia.org/wiki/Attibele" },
  narasapura: { label: "Narasapura Industrial Area", url: "https://en.wikipedia.org/wiki/Narasapura_Industrial_Area" },
  eastCorp: { label: "Bengaluru East City Corporation", url: "https://en.wikipedia.org/wiki/Bengaluru_East_City_Corporation" },
  kiadbSarjapur: { label: "Deccan Herald: KIADB plans 647-acre industrial park near Sarjapur", url: "https://www.deccanherald.com/amp/story/india%2Fkarnataka%2Fbengaluru%2Fkiadb-plans-647-acre-industrial-park-in-sarjapur-2956311" },
  kaWages: { label: "Karnataka Labour Department: single minimum wage notification, 22 May 2026", url: "https://karmikaspandana.karnataka.gov.in/uploads/media_to_upload1780292271.pdf" },
};

export const bengaluruPages: LocationCopy[] = [
  {
    cluster: "bengaluru",
    name: "Bengaluru",
    placeId: "bengaluru",
    metaTitle: "Labour Contractor in Bengaluru for Factories",
    description:
      "Supervised contract labour crews for factories, warehouses and campuses in Bengaluru: Peenya, Bommasandra, Jigani, Electronic City, Whitefield and Hoskote.",
    heading: "Labour contractor in Bengaluru.",
    lede: "Supervised crews for factories, warehouses and campuses across Bengaluru's industrial belts.",
    facts: [
      { label: "Industrial belts", value: "Peenya and Nelamangala; Hosur Road and Anekal; Electronic City and Whitefield; the Old Madras Road and Kolar belt" },
      { label: "Developed by", value: "KIADB and KSSIDC, plus township authorities in Peenya and Electronic City" },
      { label: "Districts", value: "Bengaluru Urban, Bengaluru Rural (being renamed Bengaluru North) and Kolar" },
      { label: "Minimum wage", value: "Karnataka single notification of 22 May 2026, by skill and zone" },
      { label: "Metro", value: "Green Line to Peenya, Yellow Line to Electronic City and Bommasandra, Purple Line to Whitefield" },
    ],
    intro:
      "Bengaluru's factories and warehouses sit in four belts around the city. Peenya, in the north-west, is the old engineering base. Hosur Road and Anekal hold the KIADB parks of Bommasandra, Jigani and Attibele. Electronic City and Whitefield mix electronics and biotech with large tech campuses. To the east, Hoskote and Narasapura grow along Old Madras Road and the new Bengaluru–Chennai Expressway. We are a labour contractor: the crews are on our payroll, and our supervisor runs them on your site.",
    areas: [
      { href: "/locations/bengaluru/peenya", name: "Peenya", text: "Engineering, tooling and garment units, with the Nelamangala warehouse belt beyond." },
      { href: "/locations/bengaluru/bommasandra-jigani-attibele", name: "Bommasandra, Jigani and Attibele", text: "KIADB parks on Hosur Road and in Anekal taluk, next to the Tamil Nadu border." },
      { href: "/locations/bengaluru/electronic-city-whitefield", name: "Electronic City and Whitefield", text: "Electronics, biotech and the facility work of large tech campuses." },
      { href: "/locations/bengaluru/hoskote-narasapura", name: "Hoskote and Narasapura", text: "The eastern warehouse belt and the Kolar district industrial area." },
    ],
    sections: [
      {
        heading: "Crews we supply in Bengaluru",
        body: [
          "Factory labour for production, packing and material handling. Loading and unloading crews for docks, stores and warehouses. Housekeeping for plants, offices and campuses.",
          "Tell us the site, the roles, the headcount and the shifts. We plan the crew and its supervision around them, and pay wages, EPF and ESIC where they apply.",
        ],
      },
      {
        heading: "Hiring for Bengaluru sites",
        body: [
          "Most of the city's industrial work now has a metro line nearby: the Green Line reaches Peenya and Madavara, the Yellow Line reaches Electronic City and Bommasandra, and the Purple Line ends at Whitefield. Sites further out, in Jigani, Attibele, Hoskote or Narasapura, depend on buses or company transport.",
          "We keep a worker list for Bengaluru. Job seekers can join it on our Bengaluru jobs page.",
        ],
      },
    ],
    rules: { text: KA_RULES, links: RULES_LINKS },
    faqs: [
      {
        question: "Which minimum wage zone is my Bengaluru site in?",
        answer:
          "Zone 1 is the Greater Bengaluru Authority area, the old BBMP limits. Zone 2 is other city corporations and district headquarters. Zone 3 is everywhere else, which includes most industrial areas outside the city. Townships such as Peenya and Electronic City need confirming; tell us the address and we'll check it with you.",
        category: "compliance",
      },
      {
        question: "Is the 22 May 2026 minimum wage in force while it is in court?",
        answer:
          "Yes. Employers have challenged it in the Karnataka High Court, but the court refused them interim relief. We pay at least the notified rate for the employment, skill and zone.",
        category: "compliance",
      },
      {
        question: "Do you deduct Professional Tax and Labour Welfare Fund in Karnataka?",
        answer:
          "Yes, where they apply. Professional Tax is ₹200 a month on wages of ₹25,000 or more, ₹300 in February. The Labour Welfare Fund is ₹50 from the worker and ₹100 from the employer each year, paid in January.",
        category: "compliance",
      },
      {
        question: "Can you supply security guards in Bengaluru?",
        answer: "No. Security work needs a private security agency licence, which we don't hold. We supply factory, loading and unloading, and housekeeping crews.",
        category: "commercial",
      },
      {
        question: "How do we start?",
        answer: "Request a crew with the site address, roles, headcount and shifts. We'll tell you plainly whether we can staff it, and plan the crew from there.",
        category: "commercial",
      },
    ],
    sources: [SRC.investUrban, SRC.investRural, SRC.investKolar, SRC.kaWages, SRC.gba, SRC.greenLine, SRC.yellowLine, SRC.purpleLine, SRC.msmeDi],
  },
  {
    cluster: "bengaluru",
    estate: "peenya",
    name: "Peenya",
    placeId: "peenya",
    metaTitle: "Labour Contractor in Peenya Industrial Area",
    description:
      "Supervised factory, loading and housekeeping crews for Peenya Industrial Area and the Nelamangala–Dabaspet belt in Bengaluru. Engineering, tooling, garments.",
    heading: "Labour contractor in Peenya Industrial Area.",
    lede: "Supervised crews for Peenya's engineering and garment units, and for the Nelamangala warehouse belt beyond it.",
    facts: [
      { label: "Run by", value: "KIADB (Phases I–IV, a Special Investment Region since June 2025) and KSSIDC (Peenya Industrial Estate, three stages)" },
      { label: "Size", value: "About 1,461 acres for KIADB Phases I–IV" },
      { label: "Sectors", value: "CNC machine tools, die-casting, fabrication, dies and moulds, transformers and motors, hydraulics, rubber moulding, garments" },
      { label: "Location", value: "Bengaluru Urban district, Bengaluru North taluk, on Tumakuru Road (NH-48)" },
      { label: "Metro", value: "Green Line: Goraguntepalya, Peenya, Peenya Industry, Jalahalli, Dasarahalli, Nagasandra and on to Madavara" },
    ],
    intro:
      "Peenya is Bengaluru's oldest large engineering base. KIADB's Peenya Industrial Area covers about 1,461 acres in four phases, and KSSIDC runs the Peenya Industrial Estate beside it, with flatted factories and a testing complex. In June 2025 the state notified the area as a Special Investment Region, which makes KIADB its township authority. Estimates of its size vary by source: one 2024 study counts more than 8,000 manufacturing firms and 180,000 workers.",
    sections: [
      {
        heading: "Work here",
        body: [
          "Peenya's units are mostly machine shops and fabricators: CNC machining, die-casting, dies and moulds, transformers, motors and hydraulics, with rubber moulding and garment units among them. Crews here are usually helpers on the shop floor, packers and material handlers.",
          "Beyond Peenya, the Nelamangala and Dabaspet side holds KIADB's Dabaspete estates and a large share of the city's new warehouses: the western corridor took 52% of Bengaluru's warehouse leasing in the first half of 2026. That is loading, picking and packing work.",
        ],
      },
      {
        heading: "Getting crews to Peenya",
        body: [
          "The Green Line runs through Peenya, with stations at Peenya, Peenya Industry, Jalahalli, Dasarahalli and Nagasandra, and since November 2024 on to Madavara. Tumakuru Road carries buses and goods. The Satellite Town Ring Road now links Dabaspet to Hoskote, which shortens trips between the city's west and east belts.",
        ],
      },
    ],
    rules: {
      text: `Peenya's minimum wage zone needs confirming: the ward is inside a Greater Bengaluru corporation (Zone 1), but the 2025 Special Investment Region notification reportedly moved the industrial area out of the city's municipal limits. Nelamangala and Dabaspet are Zone 3. ${KA_RULES}`,
      links: RULES_LINKS,
    },
    faqs: [
      {
        question: "Is Peenya in minimum wage Zone 1?",
        answer:
          "Probably, but it needs confirming. The Peenya ward sits inside a Greater Bengaluru corporation, which is Zone 1, but the 2025 Special Investment Region notification reportedly took the industrial area out of the city's municipal limits. We'll confirm the zone for your address before we price.",
        category: "compliance",
      },
      {
        question: "Can you supply helpers for machine shops and fabrication units?",
        answer: "Yes. We supply supervised shop-floor helpers, packers and material handlers, trained on your tasks with your team and following your safety rules.",
        category: "operations",
      },
      {
        question: "Do you cover warehouses in Nelamangala and Dabaspet?",
        answer: "Yes. Loading, unloading, picking and packing crews for the western warehouse belt, sized to your daily and peak volumes.",
        category: "operations",
      },
      {
        question: "How do workers reach Peenya?",
        answer: "Most use the Green Line, which has five stations through the area, or buses on Tumakuru Road. Sites on the Nelamangala side are further from the metro, so plan for buses or company transport there.",
        category: "operations",
      },
    ],
    sources: [SRC.peenyaSir, SRC.msmeDi, SRC.peenyaIjurr, SRC.investRural, SRC.greenLine, SRC.greenExt, SRC.warehouse2026, SRC.strr, SRC.kaWages],
  },
  {
    cluster: "bengaluru",
    estate: "bommasandra-jigani-attibele",
    name: "Bommasandra, Jigani and Attibele",
    placeId: "bommasandra-jigani-attibele",
    metaTitle: "Labour Contractor in Bommasandra and Jigani",
    description:
      "Supervised factory, loading and housekeeping crews for Bommasandra, Jigani and Attibele industrial areas on Hosur Road. Minimum wage Zone 3, Anekal taluk.",
    heading: "Labour contractor in Bommasandra, Jigani and Attibele.",
    lede: "Supervised crews for the KIADB parks on Hosur Road and in Anekal taluk, up to the Tamil Nadu border.",
    facts: [
      { label: "Run by", value: "KIADB (Bommasandra Phases I–IV, Jigani I–II, Attibele) and KSSIDC estates in Jigani and Bommasandra" },
      { label: "Size", value: "About 1,119 acres in Bommasandra I–IV, 615 in Jigani and 250 in Attibele (MSME-DI, 2012)" },
      { label: "Sectors", value: "Pharma, API and chemicals; a stone-cutting cluster and a pharma and cold-storage cluster in Jigani" },
      { label: "Location", value: "Anekal taluk, Bengaluru Urban district, on NH-44 (Hosur Road) and the NICE Road" },
      { label: "Minimum wage", value: "Zone 3 (outside the Greater Bengaluru Authority area)" },
    ],
    intro:
      "Hosur Road is Bengaluru's southern industrial spine. KIADB's parks along it, at Bommasandra, Jigani, Attibele, Veerasandra and Electronic City, cover about 3,316 acres and are reported full, so KIADB plans a new 647-acre park between Attibele and Sarjapur. Attibele is a town municipal council 32 km from the city, at the Karnataka–Tamil Nadu check-post, and Hosur lies just across the border.",
    sections: [
      {
        heading: "Work here",
        body: [
          "The belt leans to pharma, API and chemical units, with a pharma and cold-storage cluster and a stone-cutting cluster in Jigani. Warehousing is in demand here too: Bommasandra–Jigani has the highest Grade A warehouse rents in the city, ₹26–42 a square foot a month in 2024.",
          "That means factory helpers and packers in production, and loading and unloading crews for stores, cold storage and dispatch.",
        ],
      },
      {
        heading: "Getting crews to Hosur Road",
        body: [
          "The Yellow Line opened in August 2025 and ends at Hebbagodi and Bommasandra, so Bommasandra now has a metro. Jigani and Attibele still depend on buses or company transport along NH-44 and the NICE Road. A planned extension would add stations at Chandapura and Attibele.",
          "Many workers live across the border in Hosur. A crew on the Karnataka side is paid on Karnataka's rates whatever state the workers live in.",
        ],
      },
    ],
    rules: { text: `Bommasandra, Jigani and Attibele are in Zone 3: they lie outside the Greater Bengaluru Authority area, and their councils are municipal councils, not corporations. ${KA_RULES}`, links: RULES_LINKS },
    faqs: [
      {
        question: "Which minimum wage zone applies in Bommasandra, Jigani and Attibele?",
        answer: "Zone 3. These areas are outside the Greater Bengaluru Authority limits and are not city corporations or district headquarters.",
        category: "compliance",
      },
      {
        question: "Our workers live in Hosur. Which state's rates apply?",
        answer: "The site's. A crew working at a site in Karnataka is paid at least Karnataka's rate for the zone, whatever state the workers live in.",
        category: "compliance",
      },
      {
        question: "Can your crews work in pharma and chemical units?",
        answer: "Yes, under your site's rules. Tell us your induction, hygiene and PPE requirements and we plan the crew and its supervision around them.",
        category: "operations",
      },
      {
        question: "Is there a metro to these sites?",
        answer: "To Bommasandra, yes: the Yellow Line ends at Hebbagodi and Bommasandra. Jigani and Attibele have no metro yet, so plan for buses or company transport.",
        category: "operations",
      },
    ],
    sources: [SRC.investUrban, SRC.msmeDi, SRC.kiadbSarjapur, SRC.attibele, SRC.yellowLine, SRC.warehouse2024, SRC.gba, SRC.kaWages],
  },
  {
    cluster: "bengaluru",
    estate: "electronic-city-whitefield",
    name: "Electronic City and Whitefield",
    placeId: "electronic-city-whitefield",
    metaTitle: "Contract Labour in Electronic City and Whitefield",
    description:
      "Supervised housekeeping, factory and loading crews for Electronic City and Whitefield in Bengaluru: electronics, biotech units and large tech campuses.",
    heading: "Contract labour in Electronic City and Whitefield.",
    lede: "Supervised crews for electronics and biotech units, and for the facility work of Bengaluru's large tech campuses.",
    facts: [
      { label: "Electronic City", value: "Set up by KEONICS in 1978; a notified industrial township since 2013, run by ELCITA; about 903 acres" },
      { label: "Whitefield", value: "KIADB EPIP Stages I–II (554 acres) and Kadugodi–Sadaramangala (539 acres); ITPL since 1994" },
      { label: "Sectors", value: "IT and ITES, electronics hardware and components, biotech" },
      { label: "Metro", value: "Yellow Line to Electronic City; Purple Line to Whitefield (Kadugodi), Hoodi and Kundalahalli" },
      { label: "Minimum wage", value: "Whitefield: Zone 1. Electronic City: to confirm (a township outside the city corporations)" },
    ],
    intro:
      "Electronic City and Whitefield are Bengaluru's two big technology districts, at opposite ends of the city. Electronic City began in 1978 on 332 acres and is now a notified industrial township of about 903 acres, governed by its own authority, ELCITA; its industry association counts about 200,000 people working there. Whitefield grew around KIADB's Export Promotion Industrial Park and the ITPL tech park, and sits inside the Bengaluru East City Corporation.",
    sections: [
      {
        heading: "Work here",
        body: [
          "Alongside IT offices, both districts hold electronics hardware, components and biotech units. Electronic City is described as home to the city's biggest biotech cluster.",
          "For contractors the larger share of work is facility work: housekeeping, pantry and campus upkeep in tech parks, and helpers and packers in electronics and biotech units, where hygiene and cleanroom rules apply.",
        ],
      },
      {
        heading: "Getting crews there",
        body: [
          "The Yellow Line serves Electronic City, and the elevated expressway from Silk Board runs above NH-44. Whitefield is the end of the Purple Line, with stations at Hoodi, Kundalahalli, Pattandur Agrahara, Kadugodi Tree Park and Whitefield (Kadugodi). Both districts are reachable by metro for most of the city.",
        ],
      },
    ],
    rules: {
      text: `Whitefield is inside the Greater Bengaluru Authority area, so Zone 1 applies. Electronic City is an industrial township governed by ELCITA rather than a city corporation, which on a literal reading puts it in Zone 3; confirm it before pricing. ${KA_RULES}`,
      links: RULES_LINKS,
    },
    faqs: [
      {
        question: "Which minimum wage zone applies in Electronic City?",
        answer:
          "It needs confirming. Electronic City is an industrial township run by ELCITA, outside the Greater Bengaluru corporations, which on a literal reading is Zone 3. Tell us the address and we'll confirm the zone with you before pricing. Whitefield, inside the Bengaluru East City Corporation, is Zone 1.",
        category: "compliance",
      },
      {
        question: "Can you supply housekeeping for a tech campus?",
        answer: "Yes. Housekeeping, pantry and washroom teams on full 8-hour shifts, with a routine agreed per area and our supervisor checking it through the shift.",
        category: "operations",
      },
      {
        question: "Can your crews work in cleanrooms or biotech units?",
        answer: "Yes, under your site's rules. We train each worker on your gowning, hygiene and induction requirements with your team before they start.",
        category: "operations",
      },
      {
        question: "Do you supply security for campuses?",
        answer: "No. Security work needs a private security agency licence, which we don't hold. We supply housekeeping, factory and loading crews.",
        category: "commercial",
      },
    ],
    sources: [SRC.elcia, SRC.elcita, SRC.electronicCity, SRC.msmeDi, SRC.eastCorp, SRC.yellowLine, SRC.purpleLine, SRC.gba, SRC.kaWages],
  },
  {
    cluster: "bengaluru",
    estate: "hoskote-narasapura",
    name: "Hoskote and Narasapura",
    placeId: "hoskote-narasapura",
    metaTitle: "Labour Contractor in Hoskote and Narasapura",
    description:
      "Supervised loading, factory and housekeeping crews for Hoskote's warehouses and KIADB Narasapura in Kolar district, on Old Madras Road and the expressway.",
    heading: "Labour contractor in Hoskote and Narasapura.",
    lede: "Supervised crews for the eastern warehouse belt and the KIADB industrial area at Narasapura in Kolar district.",
    facts: [
      { label: "Hoskote", value: "KIADB estates at Pillagumpa and Kambalipura, and a KSSIDC estate; Hoskote taluk, Bengaluru Rural district" },
      { label: "Narasapura", value: "KIADB, about 700 acres, Kolar district; a second phase of 1,480 acres notified" },
      { label: "Sectors", value: "Kolar district: automobile, smartphones, machinery, aerospace and defence components" },
      { label: "Roads", value: "NH-75 (Old Madras Road), the Bengaluru–Chennai Expressway and the Satellite Town Ring Road" },
      { label: "Minimum wage", value: "Zone 3 for both" },
    ],
    intro:
      "East of the city, Hoskote and Narasapura are where Bengaluru's newest industry and warehousing is going. The eastern submarket around Hoskote took 46% of the city's warehouse leasing in the first half of 2026, mostly third-party logistics and e-commerce. Narasapura, about 55 km from Bengaluru and 15 km from Kolar, is a KIADB industrial area of about 700 acres, with a second phase of 1,480 acres notified and more land identified.",
    sections: [
      {
        heading: "Work here",
        body: [
          "Around Hoskote the work is mostly warehousing: loading, unloading, picking, packing and dispatch for logistics and e-commerce operators. Narasapura and Kolar district host automobile, smartphone, machinery and aerospace component manufacturing, which means shop-floor helpers, packers and material handlers.",
        ],
      },
      {
        heading: "Getting crews there",
        body: [
          "There is no metro. The nearest is the Purple Line's end at Whitefield (Kadugodi); Hoskote's nearest railway stations are Whitefield and KR Puram, and Narasapura is about 15 km from both Kolar and Malur stations.",
          "The Bengaluru–Chennai Expressway is open from Hoskote to the KGF border, and it connects to the Satellite Town Ring Road. For sites 50 km or more out, plan for company transport or housing for the crew; we plan it with you.",
        ],
      },
    ],
    rules: { text: `Hoskote and Narasapura are in Zone 3: neither is in the Greater Bengaluru Authority area, a city corporation or a district headquarters. ${KA_RULES}`, links: RULES_LINKS },
    faqs: [
      {
        question: "Which minimum wage zone applies in Hoskote and Narasapura?",
        answer: "Zone 3. Hoskote is not a city corporation, and Narasapura is a separate place from the Kolar district headquarters town.",
        category: "compliance",
      },
      {
        question: "Can you supply crews for a warehouse near Hoskote?",
        answer: "Yes. Loading, unloading, picking, packing and dispatch crews, sized to your normal and peak days and billed per manday.",
        category: "operations",
      },
      {
        question: "How do workers get to Narasapura?",
        answer: "There is no metro, and the nearest stations are Kolar and Malur, about 15 km away. Most sites this far out need company transport or housing; we plan the crew's travel with you before it starts.",
        category: "operations",
      },
      {
        question: "Do you staff factories in Kolar district?",
        answer: "Yes. Supervised shop-floor helpers, packers and material handlers for Narasapura and the Kolar belt, trained on your tasks with your team.",
        category: "operations",
      },
    ],
    sources: [SRC.investRural, SRC.investKolar, SRC.narasapura, SRC.warehouse2026, SRC.warehouse2024, SRC.strr, SRC.purpleLine, SRC.kaWages],
  },
];
