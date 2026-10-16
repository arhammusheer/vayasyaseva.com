import type { FaqItem } from "../types";
import type { Locale } from "@/lib/i18n";
import { wageStatePath, type HARIDWAR_SECTION_ANCHORS } from "@/content/registry/identifiers";

type Area = (typeof HARIDWAR_SECTION_ANCHORS)[number];

export interface HaridwarCopy {
  title: string;
  description: string;
  /** The page's breadcrumb name (the trail comes from src/lib/breadcrumbs.ts). */
  breadcrumb: string;
  /** The H1, one line each. */
  hero: [string] | [string, string];
  lede: string;
  /** The hero's Request a crew button (prefilled for Haridwar). */
  crew: string;
  /** The jobs door: a quiet line in English and Hinglish, a button first in Hindi. */
  jobs: { text: string; label: string };
  clients: string;
  /**
   * One paragraph on SIDCUL Haridwar. The three nearby areas are named in
   * `areas` and carry their anchors (/haridwar-sidcul#bhagwanpur etc.,
   * HARIDWAR_SECTION_ANCHORS); `{areas}` in the text is where they go.
   */
  sidcul: string;
  areas: Record<Area, string>;
  /** One row of the three service landings, which are in English. */
  servicesLabel: string;
  services: { href: string; label: string }[];
  faqHeading: string;
  faqs: FaqItem[];
  /** The link to /faq, which is in English. */
  moreFaqs: string;
}

const UTTARAKHAND_WAGES = wageStatePath("uttarakhand");

const SERVICE_HREFS = ["/services/factory-labour", "/services/loading-unloading-labour", "/services/housekeeping"];

/**
 * /haridwar-sidcul in every locale. hi-IN and hi-Latn-IN are drafts pending
 * native-speaker review; keep all three in step when the English changes.
 * The hi-IN H1 leads with the literal search term (most hi-IN visitors look
 * up SIDCUL itself), and its paragraph opens with the full form.
 */
export const haridwarCopy: Record<Locale, HaridwarCopy> = {
  "en-IN": {
    title: "Labour Contractor in SIDCUL Haridwar",
    description:
      "Labour contractor for factories and warehouses in SIDCUL Haridwar, Bahadrabad, Bhagwanpur and Roorkee. Supervised crews with EPF and ESIC records.",
    breadcrumb: "SIDCUL Haridwar",
    hero: ["Labour contractor in SIDCUL Haridwar."],
    lede: "Supervised crews for factories, warehouses and facilities in SIDCUL and across Haridwar.",
    crew: "Request a crew",
    jobs: { text: "Looking for work?", label: "Jobs in Haridwar" },
    clients: "Our experience includes work with",
    sidcul:
      "SIDCUL Haridwar is the State’s Integrated Industrial Estate in the city’s Ranipur and BHEL area, with FMCG, pharma and engineering plants and their warehouses. We also take requirements from units in {areas}.",
    areas: { bhagwanpur: "Bhagwanpur", bahadrabad: "Bahadrabad", roorkee: "Roorkee" },
    servicesLabel: "Crews we supply",
    services: [
      { href: SERVICE_HREFS[0], label: "Factory labour" },
      { href: SERVICE_HREFS[1], label: "Loading and unloading" },
      { href: SERVICE_HREFS[2], label: "Housekeeping and grounds" },
    ],
    faqHeading: "Questions.",
    moreFaqs: "More questions",
    faqs: [
      {
        question: "Do you supply contract labour to SIDCUL units?",
        answer:
          "Yes. Crews for production, packing, material handling, loading and dispatch, and housekeeping, planned with your site team and run by our supervisor.",
        category: "operations",
      },
      {
        question: "Do you cover Bhagwanpur, Bahadrabad and Roorkee?",
        answer: "Yes. We take requirements from units there as well as in SIDCUL.",
        category: "operations",
      },
      {
        question: "Do you pay the Uttarakhand minimum wage?",
        answer: "Yes. We pay at least the notified rate for the employment and skill.",
        link: { href: UTTARAKHAND_WAGES, label: "Uttarakhand minimum wages" },
        category: "compliance",
      },
      {
        question: "Will you visit our site first?",
        answer: "Yes. We visit before a crew starts, to see the work, the shifts and your safety rules.",
        category: "operations",
      },
    ],
  },
  "hi-IN": {
    title: "सिडकुल हरिद्वार में लेबर ठेकेदार (Labour Contractor)",
    description:
      "सिडकुल हरिद्वार, बहादराबाद, भगवानपुर और रुड़की की फ़ैक्टरियों और वेयरहाउस के लिए लेबर ठेकेदार। सुपरवाइज़र के साथ टीम, EPF और ESIC रिकॉर्ड के साथ।",
    breadcrumb: "सिडकुल हरिद्वार",
    hero: ["सिडकुल हरिद्वार:", "फ़ैक्टरी का काम और लेबर ठेकेदार।"],
    lede: "सिडकुल और पूरे हरिद्वार की फ़ैक्टरियों, वेयरहाउस और फ़ैसिलिटी के लिए सुपरवाइज़र के साथ कामगारों की टीम।",
    crew: "कामगार माँगें",
    jobs: { text: "काम चाहिए?", label: "हरिद्वार में नौकरी" },
    clients: "हमारे अनुभव में इनके साथ काम शामिल है",
    sidcul:
      "सिडकुल का पूरा नाम State Infrastructure and Industrial Development Corporation of Uttarakhand है। सिडकुल हरिद्वार, शहर के रानीपुर और BHEL इलाके में राज्य का एकीकृत औद्योगिक क्षेत्र है, जहाँ FMCG, दवा और इंजीनियरिंग की फ़ैक्टरियाँ और उनके वेयरहाउस हैं। हम {areas} की यूनिटों से भी ज़रूरतें लेते हैं।",
    areas: { bhagwanpur: "भगवानपुर", bahadrabad: "बहादराबाद", roorkee: "रुड़की" },
    servicesLabel: "हमारी टीमें (अंग्रेज़ी में)",
    services: [
      { href: SERVICE_HREFS[0], label: "फ़ैक्टरी लेबर" },
      { href: SERVICE_HREFS[1], label: "लोडिंग और अनलोडिंग" },
      { href: SERVICE_HREFS[2], label: "हाउसकीपिंग और ग्राउंड्स" },
    ],
    faqHeading: "सवाल।",
    moreFaqs: "और सवाल (English)",
    faqs: [
      {
        question: "क्या आप सिडकुल की यूनिटों को कॉन्ट्रैक्ट लेबर देते हैं?",
        answer:
          "हाँ। प्रोडक्शन, पैकिंग, मटीरियल हैंडलिंग, लोडिंग और डिस्पैच, और हाउसकीपिंग के लिए टीमें, आपकी साइट टीम के साथ प्लान की हुई और हमारे सुपरवाइज़र की देखरेख में।",
        category: "operations",
      },
      {
        question: "क्या आप भगवानपुर, बहादराबाद और रुड़की में भी काम करते हैं?",
        answer: "हाँ। सिडकुल के साथ-साथ वहाँ की यूनिटों से भी ज़रूरतें लेते हैं।",
        category: "operations",
      },
      {
        question: "क्या आप उत्तराखंड की न्यूनतम मजदूरी देते हैं?",
        answer: "हाँ। काम और स्किल के लिए तय की गई दर से कम नहीं।",
        link: { href: UTTARAKHAND_WAGES, label: "उत्तराखंड न्यूनतम मजदूरी (English)" },
        category: "compliance",
      },
      {
        question: "क्या आप पहले हमारी साइट देखने आएँगे?",
        answer: "हाँ। टीम शुरू होने से पहले हम साइट पर आकर काम, शिफ़्ट और आपके सेफ़्टी नियम देखते हैं।",
        category: "operations",
      },
    ],
  },
  "hi-Latn-IN": {
    title: "SIDCUL Haridwar mein Labour Thekedar (Contractor)",
    description:
      "SIDCUL Haridwar, Bahadrabad, Bhagwanpur aur Roorkee ki factories aur warehouses ke liye labour contractor. Supervisor ke saath team, EPF/ESIC records ke saath.",
    breadcrumb: "SIDCUL Haridwar",
    hero: ["SIDCUL Haridwar mein labour contractor."],
    lede: "SIDCUL aur poore Haridwar ki factories, warehouses aur facilities ke liye supervisor ke saath workers ki team.",
    crew: "Workers maangein",
    jobs: { text: "Kaam chahiye?", label: "Haridwar mein job" },
    clients: "Hamare experience mein inke saath kaam",
    sidcul:
      "SIDCUL Haridwar, shehar ke Ranipur aur BHEL area mein State ka Integrated Industrial Estate hai, jahan FMCG, pharma aur engineering ki factories aur unke warehouses hain. Hum {areas} ki units se bhi requirements lete hain.",
    areas: { bhagwanpur: "Bhagwanpur", bahadrabad: "Bahadrabad", roorkee: "Roorkee" },
    servicesLabel: "Hamari teams (English mein)",
    services: [
      { href: SERVICE_HREFS[0], label: "Factory labour" },
      { href: SERVICE_HREFS[1], label: "Loading aur unloading" },
      { href: SERVICE_HREFS[2], label: "Housekeeping aur grounds" },
    ],
    faqHeading: "Sawaal.",
    moreFaqs: "Aur sawaal (English)",
    faqs: [
      {
        question: "Kya aap SIDCUL ki units ko contract labour dete hain?",
        answer:
          "Haan. Production, packing, material handling, loading aur dispatch, aur housekeeping ke liye teams, aapki site team ke saath plan ki hui aur hamare supervisor ki dekhrekh mein.",
        category: "operations",
      },
      {
        question: "Kya aap Bhagwanpur, Bahadrabad aur Roorkee mein bhi kaam karte hain?",
        answer: "Haan. SIDCUL ke saath-saath wahan ki units se bhi requirements lete hain.",
        category: "operations",
      },
      {
        question: "Kya aap Uttarakhand ki minimum wage dete hain?",
        answer: "Haan. Kaam aur skill ke liye notified rate se kam nahi.",
        link: { href: UTTARAKHAND_WAGES, label: "Uttarakhand minimum wages (English)" },
        category: "compliance",
      },
      {
        question: "Kya aap pehle hamari site dekhne aayenge?",
        answer: "Haan. Team shuru hone se pehle hum site par aakar kaam, shifts aur aapke safety rules dekhte hain.",
        category: "operations",
      },
    ],
  },
};
