import type { LocationCopy } from "./types";

/**
 * Uttarakhand location pages: the state hub and Selaqui (Dehradun).
 * Facts from SIIDCUL's estate pages and allottee lists, the Labour Department,
 * the Mega Policy 2025 guidelines and the revised Schedule M (checked 16–17
 * Oct 2026). No tenant names, no registration claims, no shift patterns.
 */
export const uttarakhandPages: LocationCopy[] = [
  {
    cluster: "uttarakhand",
    name: "Uttarakhand",
    placeId: "uttarakhand",
    metaTitle: "Labour Contractor in Uttarakhand: SIIDCUL Estates",
    description:
      "Supervised contract labour crews for factories and warehouses across Uttarakhand's SIIDCUL estates, from SIDCUL Haridwar to Selaqui in Dehradun.",
    heading: "Labour contractor in Uttarakhand.",
    lede: "Supervised crews for factories, warehouses and facilities, from SIDCUL Haridwar to Selaqui in Dehradun.",
    paragraph:
      "Most of Uttarakhand's factories sit in integrated industrial estates run by SIIDCUL, the state's industrial development corporation: Haridwar, Pantnagar, Sitarganj, Kashipur, Kotdwar and Selaqui. Pharma, auto components, electronics, plastics and packaging lead. We take requirements from units in {areas}.",
    areas: [
      { href: "/locations/haridwar", name: "SIDCUL Haridwar" },
      { href: "/locations/uttarakhand/selaqui", name: "Selaqui" },
    ],
    faqs: [
      {
        question: "Do you supply contract labour across Uttarakhand?",
        answer:
          "Yes, in SIDCUL Haridwar, Selaqui and the areas around them. Crews for production, packing, loading and dispatch, and housekeeping, run by our supervisor.",
        category: "operations",
      },
      {
        question: "Does the 70% local employment rule cover contract workers?",
        answer:
          "It is an incentive condition under the Mega Industrial and Investment Policy 2025, applied to permanent jobs. For temporary work, the guidelines accept a contract with a registered contractor.",
        category: "compliance",
      },
      {
        question: "Is the minimum wage different from town to town?",
        answer:
          "No. Uttarakhand has one rate for the whole state, by skill and type of work. There is no Professional Tax, and the state's OSH Code rules are still in draft.",
        link: { href: "/minimum-wages/uttarakhand", label: "Uttarakhand minimum wages" },
        category: "compliance",
      },
      {
        question: "What about a site elsewhere in the state?",
        answer: "Tell us where it is and what the work is. We'll tell you plainly whether we can staff it.",
        category: "operations",
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
      { label: "Draft Uttarakhand OSH Code rules (22 May 2026)", url: "https://cdnbbsr.s3waas.gov.in/s36547884cea64550284728eb26b0947ef/uploads/2026/07/20260725686982897.pdf" },
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
    heading: "Contract labour in Selaqui.",
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
      {
        question: "Is the minimum wage in Selaqui different from the rest of the state?",
        answer:
          "No. Uttarakhand has one rate for the whole state, by skill and type of work. There is no Professional Tax, and the state's OSH Code rules are still in draft.",
        link: { href: "/minimum-wages/uttarakhand", label: "Uttarakhand minimum wages" },
        category: "compliance",
      },
      {
        question: "Will you visit our site first?",
        answer: "Yes. We visit before a crew starts, to see the work, the shifts and your hygiene and safety rules.",
        category: "operations",
      },
    ],
    sources: [
      { label: "SIIDCUL: Integrated Industrial Estate Pharma City, Selaqui", url: "https://siidcul.com/integrated-industrial-estate-pharma-city-selaqui" },
      { label: "SIIDCUL: SIDC Selaqui allottee list (21 July 2023)", url: "https://siidcul.com/UserFiles/files/SIDC_Selaqui21072023.pdf" },
      { label: "Revised Schedule M, Drugs Rules, G.S.R. 922(E), 28 December 2023", url: "https://drugscontrol.py.gov.in/sites/default/files/2024-08/G.S.R.%20922(E).pdf" },
      { label: "Draft Uttarakhand OSH Code rules (22 May 2026)", url: "https://cdnbbsr.s3waas.gov.in/s36547884cea64550284728eb26b0947ef/uploads/2026/07/20260725686982897.pdf" },
      { label: "MSME-DI district profile, Dehradun (2012)", url: "https://dcmsme.gov.in/old/dips/DIPSR%20-%20DEHRADUN.pdf" },
    ],
  },
];
