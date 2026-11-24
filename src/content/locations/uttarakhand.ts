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
    // Drafts pending native review (docs/hindi-glossary.md).
    translations: {
      "hi-IN": {
        name: "उत्तराखंड",
        metaTitle: "उत्तराखंड सिडकुल में लेबर ठेकेदार (Labour Contractor)",
        description:
          "उत्तराखंड के सिडकुल क्षेत्रों की फ़ैक्टरियों और वेयरहाउस के लिए सुपरवाइज़र के साथ कॉन्ट्रैक्ट लेबर टीमें: हरिद्वार, देहरादून का सेलाकुई, पंतनगर और काशीपुर।",
        heading: "उत्तराखंड में लेबर ठेकेदार।",
        lede: "सिडकुल हरिद्वार और सेलाकुई से लेकर ऊधम सिंह नगर के इंडस्ट्रियल एरिया तक, फ़ैक्टरियों, वेयरहाउस और फ़ैसिलिटी के लिए सुपरवाइज़र के साथ कामगारों की टीम।",
        paragraph:
          "उत्तराखंड की ज़्यादातर फ़ैक्टरियाँ SIIDCUL (राज्य का इंडस्ट्रियल डेवलपमेंट कॉरपोरेशन) के इंडस्ट्रियल एस्टेट में हैं: हरिद्वार, पंतनगर, सितारगंज, काशीपुर, कोटद्वार और सेलाकुई। इनमें दवा, ऑटो कंपोनेंट, इलेक्ट्रॉनिक्स, प्लास्टिक और पैकेजिंग की यूनिटें सबसे आगे हैं। हम {areas} की यूनिटों से रिक्वायरमेंट लेते हैं।",
        areas: [
          { href: "/locations/haridwar", name: "सिडकुल हरिद्वार" },
          { href: "/locations/dehradun", name: "देहरादून और सेलाकुई" },
        ],
        faqs: [
          {
            question: "क्या आप पूरे उत्तराखंड में कॉन्ट्रैक्ट लेबर देते हैं?",
            answer:
              "हाँ, सिडकुल हरिद्वार, देहरादून और सेलाकुई में, और उनके आसपास के इलाकों में। प्रोडक्शन, पैकिंग, लोडिंग और डिस्पैच, और हाउसकीपिंग के लिए टीमें, हमारे सुपरवाइज़र की देखरेख में।",
            category: "operations",
          },
          {
            question: "क्या 70% स्थानीय रोज़गार का नियम कॉन्ट्रैक्ट कामगारों पर भी लागू होता है?",
            answer:
              "यह Mega Industrial and Investment Policy 2025 में इंसेंटिव की एक शर्त है, जो पक्की नौकरियों पर लागू होती है। अस्थायी काम के लिए गाइडलाइंस में रजिस्टर्ड ठेकेदार के साथ कॉन्ट्रैक्ट मान्य है।",
            category: "compliance",
          },
          {
            question: "क्या न्यूनतम मज़दूरी हर शहर में अलग होती है?",
            answer:
              "नहीं। उत्तराखंड में पूरे राज्य के लिए एक ही दर है, स्किल और काम के प्रकार के हिसाब से। यहाँ प्रोफ़ेशनल टैक्स नहीं है, और राज्य के OSH कोड नियम अभी ड्राफ़्ट में हैं।",
            link: { href: "/minimum-wages/uttarakhand", label: "उत्तराखंड न्यूनतम मज़दूरी (अंग्रेज़ी में)" },
            category: "compliance",
          },
          {
            question: "राज्य में किसी और जगह साइट हो तो?",
            answer: "हमें बताइए कि साइट कहाँ है और काम क्या है। हम साफ़ बता देंगे कि वहाँ टीम दे सकते हैं या नहीं।",
            category: "operations",
          },
        ],
      },
      "hi-Latn-IN": {
        name: "Uttarakhand",
        metaTitle: "Uttarakhand SIDCUL mein Labour Thekedar (Contractor)",
        description:
          "Uttarakhand ke SIDCUL estates ki factories aur warehouses ke liye supervised contract labour teams: Haridwar, Dehradun ka Selaqui, Pantnagar aur Kashipur.",
        heading: "Uttarakhand mein labour contractor.",
        lede: "SIDCUL Haridwar aur Selaqui se lekar Udham Singh Nagar ke estates tak, factories, warehouses aur facilities ke liye supervisor ke saath workers ki team.",
        paragraph:
          "Uttarakhand ki zyadatar factories SIIDCUL (state ki industrial development corporation) ke integrated industrial estates mein hain: Haridwar, Pantnagar, Sitarganj, Kashipur, Kotdwar aur Selaqui. Sabse zyada units pharma, auto components, electronics, plastics aur packaging ki hain. Hum {areas} ki units se requirements lete hain.",
        areas: [
          { href: "/locations/haridwar", name: "SIDCUL Haridwar" },
          { href: "/locations/dehradun", name: "Dehradun aur Selaqui" },
        ],
        faqs: [
          {
            question: "Kya aap poore Uttarakhand mein contract labour dete hain?",
            answer:
              "Haan, SIDCUL Haridwar, Dehradun aur Selaqui mein, aur unke aas-paas ke areas mein. Production, packing, loading aur dispatch, aur housekeeping ke liye teams, jinhe hamara supervisor chalata hai.",
            category: "operations",
          },
          {
            question: "Kya 70% local employment wala rule contract workers par bhi lagta hai?",
            answer:
              "Ye Mega Industrial and Investment Policy 2025 mein incentive ki ek shart hai, aur permanent jobs par lagti hai. Temporary kaam ke liye guidelines registered contractor ke saath contract ko sahi maanti hain.",
            category: "compliance",
          },
          {
            question: "Kya minimum wage har shehar mein alag hoti hai?",
            answer:
              "Nahi. Uttarakhand mein poore state ke liye ek hi rate hai, skill aur kaam ke type ke hisaab se. Yahan Professional Tax nahi hai, aur state ke OSH Code rules abhi draft mein hain.",
            link: { href: "/minimum-wages/uttarakhand", label: "Uttarakhand minimum wages (English)" },
            category: "compliance",
          },
          {
            question: "State mein kisi aur jagah site ho to?",
            answer: "Hamein bataiye ki site kahan hai aur kaam kya hai. Hum saaf bata denge ki wahan team de sakte hain ya nahi.",
            category: "operations",
          },
        ],
      },
    },
  },
];
