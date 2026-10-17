import type { FaqItem } from "../types";
import type { LocationCopy } from "./types";
import { wageStatePath } from "@/content/registry/identifiers";

/**
 * Haridwar: the region hub, on the same structure as every market's
 * (owner direction, 17 Oct 2026; it was /haridwar-sidcul until then). Its
 * industrial areas are named in the paragraph and get pages when their copy
 * is written and checked, like Jalandhar's. hi-IN and hi-Latn-IN are drafts
 * pending native-speaker review; keep all three in step when the English
 * changes. The hi-IN H1 leads with the literal search term (most hi-IN
 * visitors look up SIDCUL itself), and its paragraph opens with the full form.
 */

const WAGES = wageStatePath("uttarakhand");

const wagesFaq = (question: string, answer: string, label: string): FaqItem => ({
  question,
  answer,
  link: { href: WAGES, label },
  category: "compliance",
});

export const haridwarPages: LocationCopy[] = [
  {
    cluster: "haridwar",
    name: "SIDCUL Haridwar",
    placeId: "haridwar",
    metaTitle: "Labour Contractor in SIDCUL Haridwar",
    description:
      "Labour contractor for factories and warehouses in SIDCUL Haridwar, Bahadrabad, Bhagwanpur and Roorkee. Supervised crews with EPF and ESIC records.",
    heading: "Labour contractor in SIDCUL Haridwar.",
    lede: "Supervised crews for factories, warehouses and facilities in SIDCUL and across Haridwar.",
    paragraph:
      "SIDCUL Haridwar is the State’s Integrated Industrial Estate in the city’s Ranipur and BHEL area, with FMCG, pharma and engineering plants and their warehouses. We also take requirements from units in {areas}.",
    areas: [{ name: "Bhagwanpur" }, { name: "Bahadrabad" }, { name: "Roorkee" }],
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
      wagesFaq("Do you pay the Uttarakhand minimum wage?", "Yes. We pay at least the notified rate for the employment and skill.", "Uttarakhand minimum wages"),
      {
        question: "Will you visit our site first?",
        answer: "Yes. We visit before a crew starts, to see the work, the shifts and your safety rules.",
        category: "operations",
      },
    ],
    sources: [
      { label: "SIIDCUL: Integrated Industrial Estate Haridwar", url: "https://siidcul.com/integrated-industrial-estate-haridwar" },
    ],
    translations: {
      "hi-IN": {
        name: "सिडकुल हरिद्वार",
        metaTitle: "सिडकुल हरिद्वार में लेबर ठेकेदार (Labour Contractor)",
        description:
          "सिडकुल हरिद्वार, बहादराबाद, भगवानपुर और रुड़की की फ़ैक्टरियों और वेयरहाउस के लिए लेबर ठेकेदार। सुपरवाइज़र के साथ टीम, EPF और ESIC रिकॉर्ड के साथ।",
        heading: "सिडकुल हरिद्वार: फ़ैक्टरी का काम और लेबर ठेकेदार।",
        lede: "सिडकुल और पूरे हरिद्वार की फ़ैक्टरियों, वेयरहाउस और फ़ैसिलिटी के लिए सुपरवाइज़र के साथ कामगारों की टीम।",
        paragraph:
          "सिडकुल का पूरा नाम State Infrastructure and Industrial Development Corporation of Uttarakhand है। सिडकुल हरिद्वार, शहर के रानीपुर और BHEL इलाके में राज्य का एकीकृत औद्योगिक क्षेत्र है, जहाँ FMCG, दवा और इंजीनियरिंग की फ़ैक्टरियाँ और उनके वेयरहाउस हैं। हम {areas} की यूनिटों से भी ज़रूरतें लेते हैं।",
        areas: [{ name: "भगवानपुर" }, { name: "बहादराबाद" }, { name: "रुड़की" }],
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
          wagesFaq("क्या आप उत्तराखंड की न्यूनतम मजदूरी देते हैं?", "हाँ। काम और स्किल के लिए तय की गई दर से कम नहीं।", "उत्तराखंड न्यूनतम मजदूरी (English)"),
          {
            question: "क्या आप पहले हमारी साइट देखने आएँगे?",
            answer: "हाँ। टीम शुरू होने से पहले हम साइट पर आकर काम, शिफ़्ट और आपके सेफ़्टी नियम देखते हैं।",
            category: "operations",
          },
        ],
      },
      "hi-Latn-IN": {
        name: "SIDCUL Haridwar",
        metaTitle: "SIDCUL Haridwar mein Labour Thekedar (Contractor)",
        description:
          "SIDCUL Haridwar, Bahadrabad, Bhagwanpur aur Roorkee ki factories aur warehouses ke liye labour contractor. Supervisor ke saath team, EPF/ESIC records ke saath.",
        heading: "SIDCUL Haridwar mein labour contractor.",
        lede: "SIDCUL aur poore Haridwar ki factories, warehouses aur facilities ke liye supervisor ke saath workers ki team.",
        paragraph:
          "SIDCUL Haridwar, shehar ke Ranipur aur BHEL area mein State ka Integrated Industrial Estate hai, jahan FMCG, pharma aur engineering ki factories aur unke warehouses hain. Hum {areas} ki units se bhi requirements lete hain.",
        areas: [{ name: "Bhagwanpur" }, { name: "Bahadrabad" }, { name: "Roorkee" }],
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
          wagesFaq("Kya aap Uttarakhand ki minimum wage dete hain?", "Haan. Kaam aur skill ke liye notified rate se kam nahi.", "Uttarakhand minimum wages (English)"),
          {
            question: "Kya aap pehle hamari site dekhne aayenge?",
            answer: "Haan. Team shuru hone se pehle hum site par aakar kaam, shifts aur aapke safety rules dekhte hain.",
            category: "operations",
          },
        ],
      },
    },
  },
];
