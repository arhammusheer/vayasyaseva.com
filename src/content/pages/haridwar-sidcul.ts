import type { FaqItem } from "../types";
import type { Locale } from "@/lib/i18n";

type Link = { href: string; label: string };

export interface HaridwarCopy {
  title: string;
  description: string;
  breadcrumb: { home: string; page: string };
  hero: [string, string];
  lede: string;
  introHeading: [string, string];
  intro: string[];
  links: Link[];
  supportEyebrow: string;
  support: { title: string; text: string; href: string; link: string }[];
  faqHeading: string;
  faqs: FaqItem[];
}

/**
 * /haridwar-sidcul in every locale. hi-IN and hi-Latn-IN are drafts pending
 * native-speaker review; keep all three in step when the English changes.
 */
export const haridwarCopy: Record<Locale, HaridwarCopy> = {
  "en-IN": {
    title: "Labour Contractor in SIDCUL Haridwar",
    description:
      "Haridwar-based labour contractor for factories and warehouses in SIDCUL and across the city. Discuss contract manpower, site coordination and EPF/ESIC workforce records.",
    breadcrumb: { home: "Home", page: "SIDCUL Haridwar" },
    hero: ["Labour contractor in Haridwar.", "Supporting SIDCUL industry."],
    lede: "Contract labour and manpower for factories, warehouses and facilities in SIDCUL and across Haridwar, with site coordination and applicable workforce documentation.",
    introHeading: ["A local conversation.", "A practical way forward."],
    intro: [
      "SIDCUL Haridwar is the State's Integrated Industrial Estate in the city's Ranipur and BHEL area. We work with factories and warehouses there, and with businesses across the rest of Haridwar.",
      "Based in Haridwar, Vayasya Seva works with the needs of the surrounding industrial community: factory shifts, warehouse activity, facility upkeep and project work.",
      "We bring workforce coordination and labour compliance into the same engagement, helping your operations and HR teams work with a common understanding.",
      "If you are comparing labour suppliers or manpower providers, share the roles, headcount, shift pattern and site location. We can discuss a suitable contract labour arrangement and the records your team will need to review.",
    ],
    links: [
      { href: "/services/contract-labour", label: "How our contract labour service works" },
      { href: "/services/warehouse-labour", label: "Warehouse labour in SIDCUL" },
      { href: "/contact", label: "Tell us about your site" },
    ],
    supportEyebrow: "SUPPORT FOR YOUR SITE",
    support: [
      {
        title: "Factory & warehouse labour",
        text: "Production helpers, packers, loaders and material handlers for daily operations and changing workloads.",
        href: "/services/factory-labour",
        link: "Read about factory & warehouse labour",
      },
      {
        title: "Facilities & contract works",
        text: "Housekeeping, grounds, civil repairs, fabrication and maintenance support for business premises.",
        href: "/services/housekeeping",
        link: "Read about facilities & contract works",
      },
      {
        title: "Labour compliance",
        text: "Worker records, attendance, wage documentation and applicable EPF and ESIC contributions.",
        href: "/compliance",
        link: "Read about labour compliance",
      },
    ],
    faqHeading: "Before we talk.",
    faqs: [
      {
        question: "Do you supply contract labour for SIDCUL factories?",
        answer:
          "Yes. We support factory and warehouse operations with workers for production, packing, material handling, dispatch and related roles. We plan the workforce and supervision with your site team.",
        category: "operations",
      },
      {
        question: "Can you support labour compliance documentation?",
        answer:
          "We maintain workforce records and coordinate applicable EPF and ESIC documentation as part of our labour engagements. Registration certificates and relevant records can be shared for review.",
        category: "compliance",
      },
      {
        question: "Can an engagement include work beyond manpower supply?",
        answer:
          "Yes. Our capabilities include data entry operators for ERP and SAP, housekeeping, civil work, fabrication, maintenance and other site support. We can discuss a combined requirement with your team.",
        category: "commercial",
      },
      {
        question: "How do we discuss a site or a start date?",
        answer:
          "Share the location, the kind of work and your intended timing. Our team will discuss the requirement and mobilisation plan with you, including enquiries for sites beyond Haridwar.",
        category: "commercial",
      },
    ],
  },
  "hi-IN": {
    title: "सिडकुल हरिद्वार में लेबर ठेकेदार (Labour Contractor)",
    description:
      "हरिद्वार में स्थित लेबर ठेकेदार। सिडकुल और पूरे हरिद्वार की फ़ैक्टरियों और वेयरहाउस के लिए कॉन्ट्रैक्ट लेबर, मैनपावर, साइट कोऑर्डिनेशन और EPF/ESIC रिकॉर्ड।",
    breadcrumb: { home: "होम", page: "सिडकुल हरिद्वार" },
    hero: ["हरिद्वार में लेबर ठेकेदार।", "सिडकुल उद्योग के साथ।"],
    lede: "सिडकुल और पूरे हरिद्वार की फ़ैक्टरियों, वेयरहाउस और फ़ैसिलिटी के लिए कॉन्ट्रैक्ट लेबर और मैनपावर, साइट कोऑर्डिनेशन और ज़रूरी वर्कफ़ोर्स रिकॉर्ड के साथ।",
    introHeading: ["स्थानीय बातचीत।", "व्यावहारिक रास्ता।"],
    intro: [
      "सिडकुल हरिद्वार, शहर के रानीपुर और BHEL क्षेत्र में राज्य का एकीकृत औद्योगिक क्षेत्र (Integrated Industrial Estate) है। हम वहाँ की फ़ैक्टरियों और वेयरहाउस के साथ, और बाकी पूरे हरिद्वार के कारोबारों के साथ काम करते हैं।",
      "हरिद्वार में स्थित Vayasya Seva आसपास के औद्योगिक क्षेत्र की ज़रूरतों के साथ काम करती है: फ़ैक्टरी की शिफ्टें, वेयरहाउस का काम, फ़ैसिलिटी की देखरेख और प्रोजेक्ट का काम।",
      "हम वर्कफ़ोर्स कोऑर्डिनेशन और लेबर कंप्लायंस को एक ही व्यवस्था में रखते हैं, ताकि आपकी ऑपरेशंस और HR टीम एक ही समझ के साथ काम कर सकें।",
      "अगर आप लेबर सप्लायर या मैनपावर प्रोवाइडर की तुलना कर रहे हैं, तो ज़रूरी रोल, संख्या, शिफ्ट और साइट की जगह बताइए। हम सही कॉन्ट्रैक्ट लेबर व्यवस्था और उन रिकॉर्ड पर बात करेंगे जो आपकी टीम देखना चाहेगी।",
    ],
    links: [
      { href: "/services/contract-labour", label: "हमारी कॉन्ट्रैक्ट लेबर सेवा कैसे काम करती है" },
      { href: "/services/warehouse-labour", label: "सिडकुल में वेयरहाउस लेबर (अंग्रेज़ी में)" },
      { href: "/contact", label: "अपनी साइट के बारे में बताइए" },
    ],
    supportEyebrow: "आपकी साइट के लिए सहायता",
    support: [
      {
        title: "फ़ैक्टरी और वेयरहाउस लेबर",
        text: "रोज़ के काम और बदलते वर्कलोड के लिए प्रोडक्शन हेल्पर, पैकर, लोडर और मटीरियल हैंडलर।",
        href: "/services/factory-labour",
        link: "फ़ैक्टरी लेबर के बारे में पढ़ें (अंग्रेज़ी में)",
      },
      {
        title: "फ़ैसिलिटी और कॉन्ट्रैक्ट वर्क्स",
        text: "बिज़नेस परिसरों के लिए हाउसकीपिंग, ग्राउंड्स, सिविल मरम्मत, फ़ैब्रिकेशन और मेंटेनेंस।",
        href: "/services/housekeeping",
        link: "हाउसकीपिंग के बारे में पढ़ें (अंग्रेज़ी में)",
      },
      {
        title: "लेबर कंप्लायंस",
        text: "कामगारों के रिकॉर्ड, हाज़िरी, वेतन दस्तावेज़ और लागू EPF व ESIC योगदान।",
        href: "/compliance",
        link: "कंप्लायंस के बारे में पढ़ें (अंग्रेज़ी में)",
      },
    ],
    faqHeading: "बात करने से पहले।",
    faqs: [
      {
        question: "क्या आप सिडकुल की फ़ैक्टरियों के लिए कॉन्ट्रैक्ट लेबर सप्लाई करते हैं?",
        answer:
          "हाँ। हम फ़ैक्टरी और वेयरहाउस के कामों के लिए प्रोडक्शन, पैकिंग, मटीरियल हैंडलिंग, डिस्पैच और इनसे जुड़े रोल में कामगार उपलब्ध कराते हैं। वर्कफ़ोर्स और सुपरविज़न की योजना आपकी साइट टीम के साथ बनाई जाती है।",
        category: "operations",
      },
      {
        question: "क्या आप लेबर कंप्लायंस के दस्तावेज़ों में मदद करते हैं?",
        answer:
          "हम अपनी लेबर व्यवस्थाओं में वर्कफ़ोर्स रिकॉर्ड रखते हैं और लागू EPF व ESIC दस्तावेज़ों का समन्वय करते हैं। रजिस्ट्रेशन सर्टिफ़िकेट और ज़रूरी रिकॉर्ड जाँच के लिए दिखाए जा सकते हैं।",
        category: "compliance",
      },
      {
        question: "क्या मैनपावर सप्लाई के अलावा दूसरे काम भी शामिल हो सकते हैं?",
        answer:
          "हाँ। ERP और SAP पर काम करने वाले डेटा एंट्री ऑपरेटर, हाउसकीपिंग, सिविल वर्क, फ़ैब्रिकेशन, मेंटेनेंस और साइट से जुड़ी दूसरी सेवाएँ भी हम देते हैं। मिली-जुली ज़रूरत पर आपकी टीम के साथ बात की जा सकती है।",
        category: "commercial",
      },
      {
        question: "साइट या शुरू करने की तारीख़ पर बात कैसे करें?",
        answer:
          "जगह, काम का प्रकार और आपकी समय-सीमा बताइए। हमारी टीम आपके साथ ज़रूरत और मोबिलाइज़ेशन की योजना पर बात करेगी, हरिद्वार के बाहर की साइटों के लिए भी।",
        category: "commercial",
      },
    ],
  },
  "hi-Latn-IN": {
    title: "SIDCUL Haridwar mein Labour Contractor (Labour Thekedar)",
    description:
      "Haridwar based labour contractor. SIDCUL aur poore Haridwar ki factories aur warehouses ke liye contract labour, manpower, site coordination aur EPF/ESIC records.",
    breadcrumb: { home: "Home", page: "SIDCUL Haridwar" },
    hero: ["Haridwar mein labour contractor.", "SIDCUL industry ke saath."],
    lede: "SIDCUL aur poore Haridwar ki factories, warehouses aur facilities ke liye contract labour aur manpower, site coordination aur zaroori workforce records ke saath.",
    introHeading: ["Local baatcheet.", "Practical raasta."],
    intro: [
      "SIDCUL Haridwar, shehar ke Ranipur aur BHEL area mein State ka Integrated Industrial Estate hai. Hum wahan ki factories aur warehouses ke saath, aur baaki poore Haridwar ke businesses ke saath kaam karte hain.",
      "Haridwar mein based Vayasya Seva aas-paas ke industrial area ki zarooraton ke saath kaam karti hai: factory shifts, warehouse ka kaam, facility ki dekhrekh aur project work.",
      "Hum workforce coordination aur labour compliance ko ek hi arrangement mein rakhte hain, taaki aapki operations aur HR team ek hi samajh ke saath kaam kar sake.",
      "Agar aap labour supplier, manpower provider ya labour thekedar compare kar rahe hain, to zaroori roles, headcount, shift aur site location bataiye. Hum sahi contract labour arrangement aur un records par baat karenge jo aapki team dekhna chahegi.",
    ],
    links: [
      { href: "/services/contract-labour", label: "Hamari contract labour service kaise kaam karti hai" },
      { href: "/services/warehouse-labour", label: "SIDCUL mein warehouse labour" },
      { href: "/contact", label: "Apni site ke baare mein bataiye" },
    ],
    supportEyebrow: "AAPKI SITE KE LIYE SUPPORT",
    support: [
      {
        title: "Factory aur warehouse labour",
        text: "Roz ke kaam aur badalte workload ke liye production helpers, packers, loaders aur material handlers.",
        href: "/services/factory-labour",
        link: "Factory labour ke baare mein padhein",
      },
      {
        title: "Facilities aur contract works",
        text: "Business premises ke liye housekeeping, grounds, civil repairs, fabrication aur maintenance.",
        href: "/services/housekeeping",
        link: "Housekeeping ke baare mein padhein",
      },
      {
        title: "Labour compliance",
        text: "Workers ke records, attendance, wage documents aur applicable EPF aur ESIC contributions.",
        href: "/compliance",
        link: "Compliance ke baare mein padhein (English mein)",
      },
    ],
    faqHeading: "Baat karne se pehle.",
    faqs: [
      {
        question: "Kya aap SIDCUL ki factories ke liye contract labour supply karte hain?",
        answer:
          "Haan. Hum factory aur warehouse operations ke liye production, packing, material handling, dispatch aur related roles mein workers provide karte hain. Workforce aur supervision ki planning aapki site team ke saath hoti hai.",
        category: "operations",
      },
      {
        question: "Kya aap labour compliance documents mein help karte hain?",
        answer:
          "Hum apne labour engagements mein workforce records rakhte hain aur applicable EPF aur ESIC documents coordinate karte hain. Registration certificates aur zaroori records review ke liye share kiye ja sakte hain.",
        category: "compliance",
      },
      {
        question: "Kya manpower supply ke alawa doosre kaam bhi shamil ho sakte hain?",
        answer:
          "Haan. ERP aur SAP par kaam karne wale data entry operators, housekeeping, civil work, fabrication, maintenance aur site se jude doosre kaam bhi hum karte hain. Combined requirement par aapki team ke saath baat ho sakti hai.",
        category: "commercial",
      },
      {
        question: "Site ya start date par baat kaise karein?",
        answer:
          "Location, kaam ka type aur aapki timing bataiye. Hamari team aapke saath requirement aur mobilisation plan par baat karegi, Haridwar ke bahar ki sites ke liye bhi.",
        category: "commercial",
      },
    ],
  },
};
