import type { LocationCopy } from "./types";

/**
 * The Uttarakhand state hub: the state's estates outside the Haridwar and
 * Dehradun markets, which have hubs of their own (Selaqui moved to
 * /locations/dehradun/selaqui on 18 Oct 2026). Titles say "SIDCUL", the
 * spelling people search; the corporation is SIIDCUL.
 * Facts from SIIDCUL's estate pages and allottee lists, the Labour Department,
 * the Mega Policy 2025 guidelines and the revised Schedule M (checked 16–17
 * Oct 2026). No tenant names, no registration claims, no shift patterns.
 */
export const uttarakhandPages: LocationCopy[] = [
  {
    cluster: "uttarakhand",
    name: "Uttarakhand",
    placeId: "uttarakhand",
    metaTitle: "Labour Contractor in Uttarakhand: SIDCUL Estates",
    description:
      "Supervised contract labour crews for factories and warehouses across Uttarakhand's SIDCUL estates: Haridwar, Selaqui in Dehradun, Pantnagar and Kashipur.",
    heading: "Labour contractor in Uttarakhand.",
    lede: "Supervised crews for factories, warehouses and facilities, from SIDCUL Haridwar and Selaqui to the estates of Udham Singh Nagar.",
    paragraph:
      "Most of Uttarakhand's factories sit in integrated industrial estates run by SIIDCUL, the state's industrial development corporation: Haridwar, Pantnagar, Sitarganj, Kashipur, Kotdwar and Selaqui. Pharma, auto components, electronics, plastics and packaging lead. We take requirements from units in {areas}.",
    areas: [
      { href: "/locations/haridwar", name: "SIDCUL Haridwar" },
      { href: "/locations/dehradun", name: "Dehradun and Selaqui" },
    ],
    faqs: [
      {
        question: "Do you supply contract labour across Uttarakhand?",
        answer:
          "Yes, in SIDCUL Haridwar, Dehradun and Selaqui, and the areas around them. Crews for production, packing, loading and dispatch, and housekeeping, run by our supervisor.",
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
      { label: "SIIDCUL: Integrated Industrial Estate Pharma City, Selaqui", url: "https://siidcul.com/integrated-industrial-estate-pharma-city-selaqui" },
      { label: "Invest Uttarakhand: manufacturing focus sectors (2023)", url: "https://investuttarakhand.uk.gov.in/themes/backend/uploads/focus_Sector_Manufacturing.pdf" },
      { label: "Mega Industrial and Investment Policy 2025: implementation guidelines (3 March 2026)", url: "https://investuttarakhand.uk.gov.in/themes/backend/acts/policy_guideline_eng1779087051.pdf" },
      { label: "Draft Uttarakhand OSH Code rules (22 May 2026)", url: "https://cdnbbsr.s3waas.gov.in/s36547884cea64550284728eb26b0947ef/uploads/2026/07/20260725686982897.pdf" },
    ],
  },
];
