import type { LocationCopy } from "./types";

/**
 * Uttarakhand location pages: the state hub and Selaqui (Dehradun).
 * Facts from SIIDCUL's estate pages and allottee lists, Invest Uttarakhand,
 * the Labour Department and the Mega Policy 2025 guidelines (checked 16–17
 * Oct 2026). No tenant names, no registration claims, no shift patterns or
 * seasonal peaks (no official source for either).
 */
export const uttarakhandPages: LocationCopy[] = [
  {
    cluster: "uttarakhand",
    name: "Uttarakhand",
    placeId: "uttarakhand",
    metaTitle: "Labour Contractor in Uttarakhand: SIIDCUL Estates",
    description:
      "Supervised contract labour crews for factories and warehouses across Uttarakhand's SIIDCUL estates, from SIDCUL Haridwar to Selaqui in Dehradun.",
    heading: "Labour contractor for Uttarakhand's industrial estates.",
    lede: "Supervised crews for factories, warehouses and facilities, from our base in SIDCUL Haridwar to Selaqui in Dehradun.",
    facts: [
      { label: "Estates developed by", value: "SIIDCUL, the State Infrastructure and Industrial Development Corporation of Uttarakhand (set up in 2002)" },
      { label: "Largest estates", value: "Pantnagar 3,233 acres, Haridwar about 2,038 acres, Sitarganj Phase II 1,870 acres" },
      { label: "Main sectors", value: "Pharma, auto components, electronics, plastics and packaging, food processing" },
      { label: "Minimum wage", value: "One rate for the whole state, by skill and type of work" },
      { label: "Professional Tax", value: "Not levied in Uttarakhand" },
    ],
    intro:
      "Most of Uttarakhand's factories sit in a handful of integrated industrial estates run by SIIDCUL: Pantnagar near Rudrapur, Haridwar, Sitarganj, Kashipur, Kotdwar and Selaqui, plus about 18 older estates. The state counts over 370 pharma units employing more than a lakh people, and over 300 units each in auto components and electronics. We are a labour contractor based in SIDCUL Haridwar. We supply supervised crews on our own payroll for production, loading and unloading, and housekeeping.",
    areas: [
      {
        href: "/haridwar-sidcul",
        name: "SIDCUL Haridwar",
        text: "Our home base. The Haridwar integrated estate, Bahadrabad, and the units around Bhagwanpur and Roorkee.",
      },
      {
        href: "/locations/uttarakhand/selaqui",
        name: "Selaqui",
        text: "Dehradun's industrial area: SIIDCUL's Pharma City and the older, mixed SIDC Selaqui estate.",
      },
    ],
    sections: [
      {
        heading: "The estates buyers here run",
        body: [
          "SIIDCUL describes Pantnagar as a major automobile hub and Sitarganj Phase II as a plastics and packaging estate. Haridwar targets medical devices and has a common effluent treatment plant and a logistics hub. Kashipur mixes electronics, auto, pharma and medical devices.",
          "Around Haridwar, not every estate is SIIDCUL's. Bahadrabad is a SIIDCUL estate. Bhagwanpur's industrial areas are private estates, and Roorkee's is a government estate run by the Industries Department. The rules on wages and contract labour are the same in all of them.",
        ],
      },
      {
        heading: "Crews we supply here",
        body: [
          "Production helpers, packers, line feeders and material handlers for plants; loading, unloading and dispatch crews for stores and warehouses; housekeeping for shopfloors, offices and canteens. Every shift is a full 8 hours.",
          "Our supervisor runs the crew on your site and sends a replacement when someone is absent. We pay wages, deposit EPF and ESIC where they apply, and keep the registers open to your audit. Tell us the site, the roles and the headcount, and we'll tell you plainly whether we can staff it.",
        ],
      },
    ],
    rules: {
      text: "Uttarakhand has one minimum wage for the whole state, set by skill and type of work, and contract workers get the same rate. There is no Professional Tax, and the Labour Welfare Fund takes fines and unpaid wages, not a per-worker contribution. The state's OSH Code rules, which cover the contract labour licence, are still in draft.",
      links: [
        { href: "/minimum-wages/uttarakhand", label: "Uttarakhand minimum wages" },
        { href: "/compliance", label: "How we handle compliance" },
      ],
    },
    faqs: [
      {
        question: "Which parts of Uttarakhand do you supply crews to?",
        answer:
          "Most of our work is in SIDCUL Haridwar and the areas around it. We also take requirements from Selaqui in Dehradun. For a site elsewhere in the state, tell us where it is and we'll tell you plainly whether we can staff it.",
        category: "operations",
      },
      {
        question: "Does the 70% local employment rule apply to contract workers?",
        answer:
          "It is a condition for incentives under the Mega Industrial and Investment Policy 2025, not a general hiring law. The policy's guidelines apply it to permanent employment, and accept a contract with a registered contractor as proof for temporary employment. Check your unit's own incentive terms.",
        category: "compliance",
      },
      {
        question: "Is the minimum wage different in Haridwar, Dehradun or Rudrapur?",
        answer:
          "No. Uttarakhand has one rate for the whole state. The type of work and the skill level decide the rate, not the town. Engineering units with 50 or more workers have their own order.",
        category: "compliance",
      },
      {
        question: "Do we need a contract labour licence in Uttarakhand?",
        answer:
          "Under the OSH Code, a contractor with 50 or more contract workers needs a licence. Uttarakhand's rules under the Code are still in draft, so ask the Labour Department how to apply until they are final.",
        category: "compliance",
      },
      {
        question: "Does the Shops and Establishments Act cover our warehouse or office?",
        answer:
          "Uttarakhand's 2017 Act applies to establishments with 10 or more employees. Since February 2026 they may stay open 24 hours, 7 days a week, while working hours and leave still follow the Act.",
        category: "compliance",
      },
    ],
    sources: [
      { label: "SIIDCUL: Integrated Industrial Estate Pantnagar", url: "https://siidcul.com/integrated-industrial-estate-pantnagar" },
      { label: "SIIDCUL: Integrated Industrial Estate Haridwar", url: "https://siidcul.com/integrated-industrial-estate-haridwar" },
      { label: "SIIDCUL: Integrated Industrial Estate Sitarganj Phase II", url: "https://siidcul.com/integrated-industrial-estate-sitarganj-phase-ii" },
      { label: "SIIDCUL: Integrated Industrial Estate Kashipur", url: "https://siidcul.com/integrated-industrial-estate-kashipur" },
      { label: "SIIDCUL: Integrated Industrial Estate Kotdwar", url: "https://siidcul.com/integrated-industrial-estate-iie-kotdwar" },
      { label: "Invest Uttarakhand: manufacturing focus sectors (2023)", url: "https://investuttarakhand.uk.gov.in/themes/backend/uploads/focus_Sector_Manufacturing.pdf" },
      { label: "Mega Industrial and Investment Policy 2025: implementation guidelines (3 March 2026)", url: "https://investuttarakhand.uk.gov.in/themes/backend/acts/policy_guideline_eng1779087051.pdf" },
      { label: "Uttarakhand Shops and Establishments Act, 2017", url: "https://highcourtofuttarakhand.gov.in/files/Shops_and_Establishments_(Regulation_of_Employment_and_Conditions_of_Service)__Act,_2017.pdf" },
      { label: "Labour Department: 24x7 opening of shops and establishments (17 February 2026)", url: "https://cdnbbsr.s3waas.gov.in/s36547884cea64550284728eb26b0947ef/uploads/2026/03/202603311966659871.pdf" },
      { label: "Draft Uttarakhand OSH Code rules (22 May 2026)", url: "https://cdnbbsr.s3waas.gov.in/s36547884cea64550284728eb26b0947ef/uploads/2026/07/20260725686982897.pdf" },
      { label: "MSME-DI district profile, Haridwar (2012)", url: "https://dcmsme.gov.in/dips/DIPSR%20-%20HARIDWAR.pdf" },
    ],
  },
  {
    cluster: "uttarakhand",
    estate: "selaqui",
    name: "Selaqui",
    placeId: "selaqui",
    metaTitle: "Selaqui Industrial Area: Contract Labour in Dehradun",
    description:
      "Contract labour crews for Selaqui industrial area in Dehradun: SIIDCUL's Pharma City and SIDC Selaqui. GMP-trained helpers, packers and housekeeping.",
    heading: "Contract labour for Selaqui industrial area.",
    lede: "Supervised crews for pharma, FMCG and packaging units in Selaqui, Dehradun, trained to your plant's hygiene rules.",
    facts: [
      { label: "Estates", value: "Integrated Industrial Estate Pharma City (50 acres) and the older SIDC Selaqui estate" },
      { label: "Developed by", value: "SIIDCUL, the State Infrastructure and Industrial Development Corporation of Uttarakhand" },
      { label: "Allotments", value: "About 204 plots in SIDC Selaqui (from 1986) and 38 in Pharma City, per SIIDCUL's 2023 lists" },
      { label: "Main sectors", value: "Pharma and nutraceuticals, consumer electronics and appliances, footwear and apparel, printing, packaging, food" },
      { label: "Getting there", value: "About 25 km from Dehradun railway station and 50 km from Jolly Grant airport" },
      { label: "Minimum wage", value: "Uttarakhand's statewide rate; no zones" },
    ],
    intro:
      "Selaqui is two estates side by side. Pharma City is SIIDCUL's 50-acre integrated estate for generic and biopharma drugs, capsules, drug intermediates and medical devices. SIDC Selaqui is older and larger, with about 121 acres of plots across electronics, appliances, footwear, apparel, printing, packaging, food and ayurveda units. A second Pharma City at Charba is proposed. We supply supervised crews on our own payroll for production support, packing, stores and housekeeping.",
    sections: [
      {
        heading: "Pharma plants need trained crews",
        body: [
          "The revised Schedule M of the Drugs Rules asks for written GMP training, with records, for everyone who works in manufacturing or QC areas. That includes cleaning and maintenance staff, and it names contract staff and contractors' employees directly.",
          "It also asks for health checks before and during employment, eye checks for visual inspectors, and hygiene and protective clothing for anyone on the floor. A worker with an illness or open wound cannot handle product. We plan the crew around your plant's training, gowning and medical requirements, and keep the records for your audit.",
        ],
      },
      {
        heading: "Crews we supply in Selaqui",
        body: [
          "Production helpers, packers and line feeders; stores, loading and dispatch crews; housekeeping for production areas, offices and canteens. Every shift is a full 8 hours.",
          "Our supervisor runs the crew with your site team and sends a replacement when someone is absent. We pay wages, deposit EPF and ESIC where they apply, and keep the registers open to your audit.",
        ],
      },
    ],
    rules: {
      text: "Selaqui pays Uttarakhand's statewide minimum wage, by skill and type of work; there are no zones. There is no Professional Tax. Factories in Dehradun district register under the OSH Code with the Assistant Director, Factories and Boilers, Dehradun; the state's OSH rules are still in draft.",
      links: [
        { href: "/minimum-wages/uttarakhand", label: "Uttarakhand minimum wages" },
        { href: "/compliance", label: "How we handle compliance" },
      ],
    },
    faqs: [
      {
        question: "Can your crews meet GMP training rules in a pharma plant?",
        answer:
          "Yes. We plan each crew around your plant's GMP training, gowning and hygiene rules, keep the training records Schedule M asks for, and put workers through the health checks your site requires before they start.",
        category: "operations",
      },
      {
        question: "Is Selaqui one estate or two?",
        answer:
          "Two, both run by SIIDCUL: the 50-acre Pharma City for pharma and medical devices, and the older SIDC Selaqui estate with a mix of electronics, footwear, apparel, printing, packaging and food units. A second Pharma City at Charba is proposed.",
        category: "operations",
      },
      {
        question: "Is the minimum wage in Selaqui different from Haridwar?",
        answer:
          "No. Uttarakhand has one rate for the whole state, so Selaqui and SIDCUL Haridwar pay the same for the same work and skill level.",
        category: "compliance",
      },
      {
        question: "Can you supply housekeeping for clean areas?",
        answer:
          "Yes. Cleaning staff in manufacturing areas get the same GMP training and hygiene rules as production workers, and our supervisor checks the routine through the shift.",
        category: "operations",
      },
    ],
    sources: [
      { label: "SIIDCUL: Integrated Industrial Estate Pharma City, Selaqui", url: "https://siidcul.com/integrated-industrial-estate-pharma-city-selaqui" },
      { label: "SIIDCUL: Pharma City allottee list (2023)", url: "https://siidcul.com/UserFiles/files/Pharmacity_Selaqui_2023.pdf" },
      { label: "SIIDCUL: SIDC Selaqui allottee list (21 July 2023)", url: "https://siidcul.com/UserFiles/files/SIDC_Selaqui21072023.pdf" },
      { label: "SIIDCUL: Pharma City II, Selaqui (proposed)", url: "https://siidcul.com/pharma-city-ii-selaqui" },
      { label: "Revised Schedule M, Drugs Rules, G.S.R. 922(E), 28 December 2023", url: "https://drugscontrol.py.gov.in/sites/default/files/2024-08/G.S.R.%20922(E).pdf" },
      { label: "Labour Department: OSH Code registering officers (10 July 2026)", url: "https://cdnbbsr.s3waas.gov.in/s36547884cea64550284728eb26b0947ef/uploads/2026/07/20260718505479381.pdf" },
      { label: "Draft Uttarakhand OSH Code rules (22 May 2026)", url: "https://cdnbbsr.s3waas.gov.in/s36547884cea64550284728eb26b0947ef/uploads/2026/07/20260725686982897.pdf" },
      { label: "MSME-DI district profile, Dehradun (2012)", url: "https://dcmsme.gov.in/old/dips/DIPSR%20-%20DEHRADUN.pdf" },
    ],
  },
];
