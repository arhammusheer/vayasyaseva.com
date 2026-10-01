import type { ServiceLandingContent } from "../service-pages";

/**
 * hi-Latn-IN (Hindi in Latin script) drafts of src/content/service-pages.ts.
 * Same slugs and order. Status: draft, pending native-speaker review.
 * Spellings follow docs/hindi-glossary.md.
 */
export const servicePagesHiLatn: ServiceLandingContent[] = [
  {
    slug: "warehouse-labour",
    serviceId: "warehouse-logistics",
    name: "Warehouse labour",
    metaTitle: "SIDCUL Haridwar mein Warehouse Labour Supplier",
    description:
      "SIDCUL aur poore Haridwar ke warehouses ke liye loading, unloading, picking, packing aur dispatch labour, site coordination aur EPF/ESIC records ke saath.",
    heading: "SIDCUL aur poore Haridwar ke liye warehouse labour.",
    lede: "Loading, unloading, picking, packing aur dispatch teams, aapke inbound aur outbound kaam ke hisaab se.",
    roles: [
      "Loading aur unloading",
      "Picking aur packing",
      "Stacking aur racking",
      "Dispatch aur staging",
      "Inventory support",
      "Forklift aur MHE operation",
      "Data entry operators (ERP / SAP)",
    ],
    planning:
      "Dock timings, gaadiyon ki movement, shift pattern aur peak days bataiye. Hum usi hisaab se team aur supervision plan karte hain, aur volume badalne par changes par baat karte hain.",
    related: [
      { href: "/services/factory-labour", label: "Factory labour" },
      { href: "/services/housekeeping", label: "Housekeeping" },
      { href: "/services/contract-labour", label: "Contract labour kaise kaam karta hai" },
    ],
    faqs: [
      {
        question: "Kya aap SIDCUL warehouses ke liye loading-unloading labour dete hain?",
        answer:
          "Haan. Hum SIDCUL aur poore Haridwar ke warehouses aur distribution sites ke liye loading, unloading, stacking aur dispatch teams plan karte hain.",
        category: "operations",
      },
      {
        question: "Kya warehouse labour night shift aur peak days mein kaam kar sakti hai?",
        answer:
          "Night work aur peak periods samet shift patterns par requirement ke saath hi baat hoti hai, taaki team aur supervision aapke kaam se match karein.",
        category: "operations",
      },
      {
        question: "Warehouse workers ka EPF aur ESIC kaun sambhalta hai?",
        answer:
          "Contractor ke roop mein hum. Deploy kiye gaye workers ke applicable EPF aur ESIC contributions, attendance aur wage records hum rakhte hain, aur ye aapke review ke liye available hain.",
        category: "compliance",
      },
    ],
  },
  {
    slug: "factory-labour",
    serviceId: "manufacturing-shopfloor",
    name: "Factory labour",
    metaTitle: "Haridwar mein Factory Labour aur Production Helpers",
    description:
      "SIDCUL aur poore Haridwar ki factories ke liye production helpers, packers, line feeders aur material handlers, aapki shifts aur site procedures ke hisaab se.",
    heading: "SIDCUL plants ke liye factory labour.",
    lede: "SIDCUL aur poore Haridwar mein shopfloor ke kaam ke liye production helpers, packers, line feeders aur material handlers.",
    roles: [
      "Production helpers",
      "Packers aur labellers",
      "Line feeders",
      "Material handlers",
      "Quality check assistants",
      "Shopfloor housekeeping",
      "Data entry operators (ERP / SAP)",
    ],
    planning:
      "Line, kaam, shift timings aur aapki site induction aur safety requirements bataiye. Hum onboarding aur supervision aapke plant ke kaam karne ke tareeke ke hisaab se plan karte hain.",
    related: [
      { href: "/services/warehouse-labour", label: "Warehouse labour" },
      { href: "/services/housekeeping", label: "Housekeeping" },
      { href: "/industries", label: "Hum kin industries ke saath kaam karte hain (English mein)" },
    ],
    faqs: [
      {
        question: "Haridwar ki factories ke liye aap kaun-se roles dete hain?",
        answer:
          "Production helpers, packers, labellers, line feeders, material handlers aur quality check assistants. Roles ka mix aapki line aur shift pattern ke hisaab se tay hota hai.",
        category: "operations",
      },
      {
        question: "Kya workers hamari site induction aur safety process follow kar sakte hain?",
        answer:
          "Haan. Aapki induction, PPE aur safety procedures engagement ki planning ka hissa hain, aur hamare supervisors inhe aapki site team ke saath coordinate karte hain.",
        category: "operations",
      },
      {
        question: "Kya nayi line ya seasonal peak ke liye workers badhaye ja sakte hain?",
        answer:
          "Nayi lines, projects aur seasonal demand ke liye additional workforce par aapki timing ke hisaab se baat hoti hai. Start date aur expected duration bataiye.",
        category: "commercial",
      },
    ],
  },
  {
    slug: "housekeeping",
    serviceId: "housekeeping-facility",
    name: "Housekeeping",
    metaTitle: "SIDCUL Haridwar mein Housekeeping Services",
    description:
      "SIDCUL aur poore Haridwar ki factories, offices aur campuses ke liye housekeeping, pantry aur facility support staff, premises ke hisaab se tay routine ke saath.",
    heading: "Plants, offices aur campuses ke liye housekeeping.",
    lede: "SIDCUL aur poore Haridwar mein housekeeping, pantry, washroom aur facility support teams, aapke premises ke hisaab se tay routine ke saath.",
    roles: [
      "Housekeeping staff",
      "Pantry aur cafeteria assistants",
      "Washroom attendants",
      "Shopfloor housekeeping",
      "Facility maintenance helpers",
      "Gardeners aur grounds crew",
    ],
    planning:
      "Premises, cover hone wale areas, timings aur hygiene standards bataiye. Hum team, routine aur supervision plan karte hain, aur housekeeping ko grounds ya shopfloor support ke saath combine kar sakte hain.",
    related: [
      { href: "/services/factory-labour", label: "Factory labour" },
      { href: "/services/warehouse-labour", label: "Warehouse labour" },
      { href: "/services#horticulture", label: "Horticulture aur grounds (English mein)" },
    ],
    faqs: [
      {
        question: "Kya aap SIDCUL factories ke liye housekeeping staff dete hain?",
        answer:
          "Haan. SIDCUL aur poore Haridwar ki industrial sites par shopfloor, office, canteen aur common areas ke liye housekeeping, shifts aur production areas ke hisaab se.",
        category: "operations",
      },
      {
        question: "Kya aap cleaning material aur equipment bhi de sakte hain?",
        answer:
          "Housekeeping equipment aur consumables engagement mein shamil kiye ja sakte hain. Bataiye ki aapki site kya deti hai aur humein kya arrange karna hai.",
        category: "commercial",
      },
      {
        question: "Kya housekeeping ko contract labour ke saath combine kiya ja sakta hai?",
        answer:
          "Haan. Kai sites housekeeping ko production, warehouse ya grounds support ke saath ek hi arrangement mein rakhti hain, jismein coordination ke liye ek hi contact hota hai.",
        category: "commercial",
      },
    ],
  },
];

export function getServicePageHiLatn(slug: string) {
  const page = servicePagesHiLatn.find((p) => p.slug === slug);
  if (!page) throw new Error(`Unknown hi-Latn-IN service page: ${slug}`);
  return page;
}
