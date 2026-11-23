import type { FaqItem } from "../types";
import type { LocationCopy } from "./types";

/**
 * Dehradun district, Uttarakhand: the hub and Selaqui (moved here from the
 * Uttarakhand hub when Dehradun became a market, 18 Oct 2026), on the
 * location page structure. Facts from SIIDCUL's estate pages and allottee
 * list, the MSME-DI district profile (2010–12 data, named as such where a
 * figure is used), the revised Schedule M and the draft OSH rules, each in
 * `sources`. No tenant names (the profile lists some), registrations,
 * headcount or shift claims. Titles say "SIDCUL", the spelling people
 * search; the corporation is SIIDCUL.
 */

const WAGES_LINK = { href: "/minimum-wages/uttarakhand", label: "Uttarakhand minimum wages" };

const wagesFaq = (place: string): FaqItem => ({
  question: `Is the minimum wage in ${place} different from the rest of the state?`,
  answer:
    "No. Uttarakhand has one rate for the whole state, by skill and type of work. There is no Professional Tax, and the state's OSH Code rules are still in draft.",
  link: WAGES_LINK,
  category: "compliance",
});

// The shared questions in hi-IN and hi-Latn-IN, same facts as wagesFaq and the site-visit question.
const wagesFaqHi = (place: string): FaqItem => ({
  question: `क्या ${place} में न्यूनतम मजदूरी बाकी राज्य से अलग है?`,
  answer:
    "नहीं। उत्तराखंड में पूरे राज्य के लिए एक ही दर है, स्किल और काम के प्रकार के हिसाब से। यहाँ प्रोफ़ेशनल टैक्स नहीं है, और राज्य के OSH कोड नियम अभी ड्राफ़्ट में हैं।",
  link: { href: WAGES_LINK.href, label: "उत्तराखंड न्यूनतम मजदूरी (English)" },
  category: "compliance",
});

const wagesFaqLatn = (place: string): FaqItem => ({
  question: `Kya ${place} mein minimum wage baaki state se alag hai?`,
  answer:
    "Nahi. Uttarakhand mein poore state ke liye ek hi rate hai, skill aur kaam ke type ke hisaab se. Yahan Professional Tax nahi hai, aur state ke OSH Code rules abhi draft mein hain.",
  link: { href: WAGES_LINK.href, label: "Uttarakhand minimum wages (English)" },
  category: "compliance",
});

const VISIT_HI: FaqItem = {
  question: "क्या आप पहले हमारी साइट देखने आएँगे?",
  answer: "हाँ। टीम शुरू होने से पहले हम साइट पर आकर काम, शिफ़्ट और आपके हाइजीन और सेफ़्टी नियम देखते हैं।",
  category: "operations",
};

const VISIT_LATN: FaqItem = {
  question: "Kya aap pehle hamari site dekhne aayenge?",
  answer: "Haan. Team shuru hone se pehle hum site par aakar kaam, shifts aur aapke hygiene aur safety rules dekhte hain.",
  category: "operations",
};

const SRC = {
  pharmaCity: { label: "SIIDCUL: Integrated Industrial Estate Pharma City, Selaqui", url: "https://siidcul.com/integrated-industrial-estate-pharma-city-selaqui" },
  sidcSelaqui: { label: "SIIDCUL: SIDC Selaqui allottee list (21 July 2023)", url: "https://siidcul.com/UserFiles/files/SIDC_Selaqui21072023.pdf" },
  msme: { label: "MSME-DI: Dehradun district industrial profile (2010–12 data)", url: "https://dcmsme.gov.in/old/dips/DIPSR%20-%20DEHRADUN.pdf" },
  // CDSCO's own copy (paras 3.4 and 11.4.6: cleaning and contract staff); the Puducherry copy's certificate expired (Oct 2026).
  scheduleM: { label: "Revised Schedule M, Drugs Rules, G.S.R. 922(E), 28 December 2023 (CDSCO copy)", url: "https://cdsco.gov.in/opencms/resources/UploadCDSCOWeb/2018/UploadGazette_NotificationsFiles/2023.12.28_DR_Final%20G.S.R.%20922(E)_Notification%20of%20Schedule%20M%20of.pdf" },
  osh: { label: "Draft Uttarakhand OSH Code rules (22 May 2026)", url: "https://cdnbbsr.s3waas.gov.in/s36547884cea64550284728eb26b0947ef/uploads/2026/07/20260725686982897.pdf" },
};

export const dehradunPages: LocationCopy[] = [
  {
    cluster: "dehradun",
    name: "Dehradun",
    placeId: "dehradun",
    metaTitle: "Labour Contractor and Manpower Supply in Dehradun",
    description:
      "Supervised contract labour crews for factories in Dehradun: SIDCUL Selaqui's pharma and industrial estates, Langha Road, Mohabbewala, Laltappar and Rishikesh.",
    heading: "Labour contractor in Dehradun and Selaqui.",
    lede: "Supervised crews for pharma, food, packaging and engineering units across Dehradun district.",
    paragraph:
      "Dehradun's factories sit in a few industrial areas. Selaqui, about 25 km from the city, is the largest: SIIDCUL's Pharma City beside the older Selaqui industrial area, with pharma, electronics, footwear and packaging units. Closer to the city are the Langha Road, Mohabbewala and Laltappar industrial areas and the Patel Nagar estate, and units near Rishikesh and Doiwala make drugs, glass and sugar. We take requirements from units in {areas}.",
    areas: [
      { href: "/locations/dehradun/selaqui", name: "Selaqui" },
      { name: "Langha Road" },
      { name: "Mohabbewala" },
      { name: "Laltappar" },
    ],
    faqs: [
      {
        question: "Do you supply contract labour in Dehradun?",
        answer: "Yes. Supervised packing, factory, loading and unloading, and housekeeping crews, on our payroll and run on your site by our supervisor.",
        category: "commercial",
      },
      {
        question: "Where do your workers come from?",
        answer: "Job seekers across Dehradun, Selaqui, Vikasnagar and Rishikesh apply on our jobs page for the district. We build each crew from them, close to your site.",
        category: "operations",
      },
      wagesFaq("Dehradun"),
      {
        question: "Will you visit our site first?",
        answer: "Yes. We visit before a crew starts, to see the work, the shifts and your hygiene and safety rules.",
        category: "operations",
      },
    ],
    sources: [SRC.pharmaCity, SRC.sidcSelaqui, SRC.msme, SRC.osh],
    // Drafts pending native review (docs/hindi-glossary.md).
    translations: {
      "hi-IN": {
        name: "देहरादून",
        metaTitle: "देहरादून, सेलाकुई में लेबर ठेकेदार (Labour Contractor)",
        description:
          "देहरादून की फ़ैक्टरियों में सुपरवाइज़र के साथ कॉन्ट्रैक्ट लेबर टीम: सिडकुल सेलाकुई के फ़ार्मा और औद्योगिक क्षेत्र, लांघा रोड, मोहब्बेवाला, लालतप्पड़ और ऋषिकेश।",
        heading: "देहरादून और सेलाकुई में लेबर ठेकेदार।",
        lede: "पूरे देहरादून ज़िले में दवा, फ़ूड, पैकेजिंग और इंजीनियरिंग यूनिटों के लिए सुपरवाइज़र के साथ कामगारों की टीम।",
        paragraph:
          "देहरादून की फ़ैक्टरियाँ कुछ औद्योगिक क्षेत्रों में हैं। शहर से करीब 25 किलोमीटर दूर सेलाकुई सबसे बड़ा है: पुराने सेलाकुई औद्योगिक क्षेत्र के बगल में SIIDCUL की फ़ार्मा सिटी, जहाँ दवा, इलेक्ट्रॉनिक्स, फ़ुटवियर और पैकेजिंग की यूनिटें हैं। शहर के पास लांघा रोड, मोहब्बेवाला और लालतप्पड़ औद्योगिक क्षेत्र और पटेल नगर एस्टेट हैं, और ऋषिकेश और डोईवाला के पास की यूनिटें दवा, काँच और चीनी बनाती हैं। हम {areas} की यूनिटों से ज़रूरतें लेते हैं।",
        areas: [
          { href: "/locations/dehradun/selaqui", name: "सेलाकुई" },
          { name: "लांघा रोड" },
          { name: "मोहब्बेवाला" },
          { name: "लालतप्पड़" },
        ],
        faqs: [
          {
            question: "क्या आप देहरादून में कॉन्ट्रैक्ट लेबर देते हैं?",
            answer:
              "हाँ। पैकिंग, फ़ैक्टरी, लोडिंग और अनलोडिंग, और हाउसकीपिंग के लिए सुपरवाइज़र के साथ टीमें, हमारे पेरोल पर, और आपकी साइट पर हमारे सुपरवाइज़र की देखरेख में।",
            category: "commercial",
          },
          {
            question: "आपके कामगार कहाँ से आते हैं?",
            answer:
              "देहरादून, सेलाकुई, विकासनगर और ऋषिकेश में काम ढूँढने वाले लोग ज़िले के हमारे जॉब्स पेज पर अप्लाई करते हैं। हर टीम हम उन्हीं में से, आपकी साइट के पास, बनाते हैं।",
            category: "operations",
          },
          wagesFaqHi("देहरादून"),
          VISIT_HI,
        ],
      },
      "hi-Latn-IN": {
        name: "Dehradun",
        metaTitle: "Dehradun aur SIDCUL Selaqui mein Labour Thekedar",
        description:
          "Dehradun ki factories mein supervised contract labour teams: SIDCUL Selaqui ke pharma aur industrial estates, Langha Road, Mohabbewala, Laltappar aur Rishikesh.",
        heading: "Dehradun aur Selaqui mein labour contractor.",
        lede: "Poore Dehradun district mein pharma, food, packaging aur engineering units ke liye supervisor ke saath workers ki team.",
        paragraph:
          "Dehradun ki factories kuch industrial areas mein hain. Shehar se kareeb 25 km door Selaqui sabse bada hai: purane Selaqui industrial area ke bagal mein SIIDCUL ki Pharma City, jahan pharma, electronics, footwear aur packaging ki units hain. Shehar ke paas Langha Road, Mohabbewala aur Laltappar industrial areas aur Patel Nagar estate hain, aur Rishikesh aur Doiwala ke paas ki units dawaiyan, kaanch aur cheeni banati hain. Hum {areas} ki units se requirements lete hain.",
        areas: [
          { href: "/locations/dehradun/selaqui", name: "Selaqui" },
          { name: "Langha Road" },
          { name: "Mohabbewala" },
          { name: "Laltappar" },
        ],
        faqs: [
          {
            question: "Kya aap Dehradun mein contract labour dete hain?",
            answer:
              "Haan. Packing, factory, loading aur unloading, aur housekeeping ke liye supervisor ke saath teams, hamare payroll par, aur aapki site par hamare supervisor ki dekhrekh mein.",
            category: "commercial",
          },
          {
            question: "Aapke workers kahan se aate hain?",
            answer:
              "Dehradun, Selaqui, Vikasnagar aur Rishikesh ke job seekers district ke liye hamare jobs page par apply karte hain. Har team hum unhi mein se, aapki site ke paas, banate hain.",
            category: "operations",
          },
          wagesFaqLatn("Dehradun"),
          VISIT_LATN,
        ],
      },
    },
  },
  {
    cluster: "dehradun",
    estate: "selaqui",
    name: "Selaqui",
    placeId: "selaqui",
    metaTitle: "SIDCUL Selaqui: Contract Labour in Dehradun",
    description:
      "Contract labour crews for Selaqui industrial area in Dehradun: SIIDCUL's Pharma City and SIDC Selaqui. GMP-trained helpers, packers and housekeeping.",
    heading: "Contract labour in SIDCUL Selaqui.",
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
      wagesFaq("Selaqui"),
      {
        question: "Will you visit our site first?",
        answer: "Yes. We visit before a crew starts, to see the work, the shifts and your hygiene and safety rules.",
        category: "operations",
      },
    ],
    sources: [SRC.pharmaCity, SRC.sidcSelaqui, SRC.scheduleM, SRC.osh, SRC.msme],
    // Drafts pending native review (docs/hindi-glossary.md).
    translations: {
      "hi-IN": {
        name: "सेलाकुई",
        metaTitle: "सिडकुल सेलाकुई में कॉन्ट्रैक्ट लेबर (Contract Labour)",
        description:
          "देहरादून के सेलाकुई औद्योगिक क्षेत्र के लिए कॉन्ट्रैक्ट लेबर टीम: SIIDCUL की फ़ार्मा सिटी और SIDC सेलाकुई। GMP ट्रेनिंग वाले हेल्पर, पैकर और हाउसकीपिंग स्टाफ़।",
        heading: "सिडकुल सेलाकुई में कॉन्ट्रैक्ट लेबर।",
        lede: "सेलाकुई, देहरादून की दवा, FMCG और पैकेजिंग यूनिटों के लिए सुपरवाइज़र के साथ कामगारों की टीम, आपके प्लांट के हाइजीन नियमों की ट्रेनिंग के साथ।",
        paragraph:
          "सेलाकुई में SIIDCUL के दो औद्योगिक क्षेत्र अगल-बगल हैं, देहरादून से करीब 25 किलोमीटर दूर। फ़ार्मा सिटी 50 एकड़ का क्षेत्र है, दवाओं, कैप्सूल और मेडिकल डिवाइस के लिए। पुराने SIDC सेलाकुई में इलेक्ट्रॉनिक्स, अप्लायंस, फ़ुटवियर, कपड़े, प्रिंटिंग, पैकेजिंग और फ़ूड की यूनिटें मिली-जुली हैं।",
        faqs: [
          {
            question: "क्या आप सेलाकुई की यूनिटों को कॉन्ट्रैक्ट लेबर देते हैं?",
            answer:
              "हाँ। प्रोडक्शन सपोर्ट, पैकिंग, स्टोर और डिस्पैच, और हाउसकीपिंग के लिए टीमें, आपकी साइट टीम के साथ प्लान की हुई और हमारे सुपरवाइज़र की देखरेख में।",
            category: "operations",
          },
          {
            question: "क्या आपकी टीमें GMP ट्रेनिंग के नियम पूरे कर सकती हैं?",
            answer:
              "हाँ। संशोधित Schedule M में कॉन्ट्रैक्ट स्टाफ़ का नाम है, सफ़ाई कर्मचारी भी शामिल हैं। हम हर टीम आपके प्लांट की ट्रेनिंग, गाउनिंग और हेल्थ चेक के हिसाब से प्लान करते हैं, और ट्रेनिंग रिकॉर्ड रखते हैं।",
            category: "operations",
          },
          wagesFaqHi("सेलाकुई"),
          VISIT_HI,
        ],
      },
      "hi-Latn-IN": {
        name: "Selaqui",
        metaTitle: "SIDCUL Selaqui, Dehradun mein Contract Labour",
        description:
          "Dehradun ke Selaqui industrial area ke liye contract labour teams: SIIDCUL ki Pharma City aur SIDC Selaqui. GMP-trained helpers, packers aur housekeeping staff.",
        heading: "SIDCUL Selaqui mein contract labour.",
        lede: "Selaqui, Dehradun ki pharma, FMCG aur packaging units ke liye supervisor ke saath workers ki team, aapke plant ke hygiene rules ki training ke saath.",
        paragraph:
          "Selaqui mein SIIDCUL ke do estates agal-bagal hain, Dehradun se kareeb 25 km door. Pharma City 50 acre ka estate hai, dawaiyon, capsules aur medical devices ke liye. Purane SIDC Selaqui mein electronics, appliances, footwear, apparel, printing, packaging aur food ki units mili-juli hain.",
        faqs: [
          {
            question: "Kya aap Selaqui ki units ko contract labour dete hain?",
            answer:
              "Haan. Production support, packing, stores aur dispatch, aur housekeeping ke liye teams, aapki site team ke saath plan ki hui aur hamare supervisor ki dekhrekh mein.",
            category: "operations",
          },
          {
            question: "Kya aapki teams GMP training ke rules poore kar sakti hain?",
            answer:
              "Haan. Revised Schedule M mein contract staff ka naam hai, cleaners bhi shamil hain. Hum har team aapke plant ki training, gowning aur health checks ke hisaab se plan karte hain, aur training records rakhte hain.",
            category: "operations",
          },
          wagesFaqLatn("Selaqui"),
          VISIT_LATN,
        ],
      },
    },
  },
];
