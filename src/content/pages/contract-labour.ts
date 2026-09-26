import type { Locale } from "@/lib/i18n";

type Link = { href: string; label: string };

export interface ContractLabourCopy {
  title: string;
  description: string;
  breadcrumb: { home: string; services: string; page: string };
  hero: [string, string];
  lede: string;
  introEyebrow: string;
  introHeading: string;
  intro: string[];
  localLink: Link;
  areasEyebrow: string;
  workAreas: { title: string; text: string; href: string; link: string }[];
  stepsEyebrow: string;
  stepsHeading: string;
  steps: { title: string; text: string }[];
  complianceHeading: string;
  complianceText: string;
  complianceLink: string;
  contactHeading: string;
  contactText: string;
  contactLink: string;
}

/**
 * /services/contract-labour in every locale. Hindi and Hinglish are drafts
 * pending native-speaker review; keep all three in step when the English changes.
 */
export const contractLabourCopy: Record<Locale, ContractLabourCopy> = {
  en: {
    title: "Contract Labour & Manpower Services",
    description:
      "Contract labour and industrial manpower for factory, warehouse and facility operations in Haridwar and SIDCUL. Review roles, planning and workforce records.",
    breadcrumb: { home: "Home", services: "Services", page: "Contract labour" },
    hero: ["Contract labour for factory", "and warehouse operations."],
    lede: "Vayasya Seva brings workforce planning, site coordination and worker documentation together for industrial operations based in and around Haridwar and SIDCUL.",
    introEyebrow: "CONTRACT WORKFORCE",
    introHeading: "A service shaped by the work.",
    intro: [
      "Businesses may search for a labour supplier, manpower provider or contract staffing partner. The practical question is the same: which people are needed, where will they work, and how will the engagement be managed?",
      "We discuss those details with your plant, warehouse or facility team before planning the workforce. Ongoing needs, project work and seasonal changes can call for different arrangements.",
    ],
    localLink: { href: "/haridwar-sidcul", label: "Labour contractor in Haridwar and SIDCUL" },
    areasEyebrow: "WHERE WE SUPPORT OPERATIONS",
    workAreas: [
      {
        title: "Factory and production",
        text: "Production helpers, packers, line feeders, material handlers and quality check assistants for shopfloor work.",
        href: "/services/factory-labour",
        link: "Factory labour",
      },
      {
        title: "Warehouse and dispatch",
        text: "Teams for loading, unloading, picking, packing, stacking and dispatch, planned around warehouse activity.",
        href: "/services/warehouse-labour",
        link: "Warehouse labour",
      },
      {
        title: "Facilities and site support",
        text: "Housekeeping, pantry, grounds and other site support roles for industrial and business premises.",
        href: "/services/housekeeping",
        link: "Housekeeping services",
      },
    ],
    stepsEyebrow: "HOW AN ENGAGEMENT STARTS",
    stepsHeading: "From requirement to review.",
    steps: [
      {
        title: "Define the requirement",
        text: "Tell us the site, work, roles, headcount, shifts and intended start date. We discuss site procedures and the supervision needed.",
      },
      {
        title: "Plan the workforce",
        text: "We discuss sourcing, onboarding and working arrangements against the agreed scope and the readiness of your site.",
      },
      {
        title: "Coordinate on site",
        text: "Attendance, shift coordination and day-to-day communication are planned with your operations and HR teams.",
      },
      {
        title: "Keep records reviewable",
        text: "Relevant onboarding, attendance, wage and applicable EPF and ESIC records are coordinated for client review.",
      },
    ],
    complianceHeading: "Compliance in the engagement.",
    complianceText:
      "We are registered under EPF and ESIC. Worker onboarding, attendance, wage documentation and applicable statutory contribution records are part of the discussion with each client. Relevant records can be shared for vendor assessment and review.",
    complianceLink: "Review our labour compliance approach",
    contactHeading: "Discuss a workforce requirement.",
    contactText:
      "Send the site location, roles, approximate headcount, shift pattern and timing. We can then discuss the scope, supervision and documentation relevant to your operation.",
    contactLink: "Contact Vayasya Seva",
  },
  hi: {
    title: "हरिद्वार में कॉन्ट्रैक्ट लेबर और मैनपावर सप्लाई",
    description:
      "हरिद्वार और सिडकुल में फ़ैक्टरी, वेयरहाउस और फ़ैसिलिटी के लिए कॉन्ट्रैक्ट लेबर और औद्योगिक मैनपावर। रोल, योजना और वर्कफ़ोर्स रिकॉर्ड पर बात करें।",
    breadcrumb: { home: "होम", services: "सेवाएँ", page: "कॉन्ट्रैक्ट लेबर" },
    hero: ["फ़ैक्टरी और वेयरहाउस के लिए", "कॉन्ट्रैक्ट लेबर।"],
    lede: "Vayasya Seva हरिद्वार और सिडकुल के आसपास के औद्योगिक कामों के लिए वर्कफ़ोर्स प्लानिंग, साइट कोऑर्डिनेशन और कामगारों के दस्तावेज़ एक साथ संभालती है।",
    introEyebrow: "कॉन्ट्रैक्ट वर्कफ़ोर्स",
    introHeading: "काम के हिसाब से बनी सेवा।",
    intro: [
      "कोई लेबर सप्लायर खोजता है, कोई मैनपावर प्रोवाइडर या लेबर ठेकेदार। असल सवाल एक ही है: किन लोगों की ज़रूरत है, वे कहाँ काम करेंगे, और पूरी व्यवस्था कैसे संभाली जाएगी?",
      "वर्कफ़ोर्स की योजना बनाने से पहले हम आपकी प्लांट, वेयरहाउस या फ़ैसिलिटी टीम के साथ ये बातें तय करते हैं। लगातार चलने वाले काम, प्रोजेक्ट और सीज़नल बदलाव के लिए अलग-अलग व्यवस्था की ज़रूरत हो सकती है।",
    ],
    localLink: { href: "/hi/haridwar-sidcul", label: "हरिद्वार और सिडकुल में लेबर ठेकेदार" },
    areasEyebrow: "हम किन कामों में साथ देते हैं",
    workAreas: [
      {
        title: "फ़ैक्टरी और प्रोडक्शन",
        text: "शॉपफ़्लोर के काम के लिए प्रोडक्शन हेल्पर, पैकर, लाइन फ़ीडर, मटीरियल हैंडलर और क्वालिटी चेक असिस्टेंट।",
        href: "/hi/services/factory-labour",
        link: "फ़ैक्टरी लेबर",
      },
      {
        title: "वेयरहाउस और डिस्पैच",
        text: "लोडिंग, अनलोडिंग, पिकिंग, पैकिंग, स्टैकिंग और डिस्पैच के लिए टीमें, वेयरहाउस के काम के हिसाब से।",
        href: "/hi/services/warehouse-labour",
        link: "वेयरहाउस लेबर",
      },
      {
        title: "फ़ैसिलिटी और साइट सपोर्ट",
        text: "औद्योगिक और बिज़नेस परिसरों के लिए हाउसकीपिंग, पैंट्री, ग्राउंड्स और दूसरे सपोर्ट रोल।",
        href: "/hi/services/housekeeping",
        link: "हाउसकीपिंग सेवाएँ",
      },
    ],
    stepsEyebrow: "शुरुआत कैसे होती है",
    stepsHeading: "ज़रूरत से जाँच तक।",
    steps: [
      {
        title: "ज़रूरत बताइए",
        text: "साइट, काम, रोल, संख्या, शिफ्ट और शुरू करने की तारीख़ बताइए। हम साइट की प्रक्रियाओं और ज़रूरी सुपरविज़न पर बात करते हैं।",
      },
      {
        title: "वर्कफ़ोर्स की योजना",
        text: "तय दायरे और साइट की तैयारी के हिसाब से सोर्सिंग, ऑनबोर्डिंग और काम की व्यवस्था पर बात होती है।",
      },
      {
        title: "साइट पर कोऑर्डिनेशन",
        text: "हाज़िरी, शिफ्ट कोऑर्डिनेशन और रोज़ की बातचीत आपकी ऑपरेशंस और HR टीम के साथ तय की जाती है।",
      },
      {
        title: "रिकॉर्ड जाँच के लिए तैयार",
        text: "ऑनबोर्डिंग, हाज़िरी, वेतन और लागू EPF व ESIC रिकॉर्ड क्लाइंट की जाँच के लिए व्यवस्थित रखे जाते हैं।",
      },
    ],
    complianceHeading: "कॉन्ट्रैक्ट में कंप्लायंस।",
    complianceText:
      "हम EPF और ESIC में रजिस्टर्ड हैं। कामगारों की ऑनबोर्डिंग, हाज़िरी, वेतन दस्तावेज़ और लागू वैधानिक योगदान के रिकॉर्ड हर क्लाइंट के साथ बातचीत का हिस्सा हैं। वेंडर असेसमेंट और जाँच के लिए ज़रूरी रिकॉर्ड साझा किए जा सकते हैं।",
    complianceLink: "हमारा लेबर कंप्लायंस तरीका (अंग्रेज़ी में)",
    contactHeading: "अपनी वर्कफ़ोर्स ज़रूरत पर बात करें।",
    contactText:
      "साइट की जगह, रोल, अनुमानित संख्या, शिफ्ट पैटर्न और समय बताइए। फिर हम आपके काम के हिसाब से दायरे, सुपरविज़न और दस्तावेज़ों पर बात कर सकते हैं।",
    contactLink: "Vayasya Seva से संपर्क करें",
  },
  hinglish: {
    title: "Haridwar mein Contract Labour aur Manpower Supply",
    description:
      "Haridwar aur SIDCUL mein factory, warehouse aur facility ke liye contract labour aur industrial manpower. Roles, planning aur workforce records par baat karein.",
    breadcrumb: { home: "Home", services: "Services", page: "Contract labour" },
    hero: ["Factory aur warehouse ke liye", "contract labour."],
    lede: "Vayasya Seva Haridwar aur SIDCUL ke aas-paas ke industrial operations ke liye workforce planning, site coordination aur workers ke documents ek saath sambhalti hai.",
    introEyebrow: "CONTRACT WORKFORCE",
    introHeading: "Kaam ke hisaab se bani service.",
    intro: [
      "Koi labour supplier dhoondhta hai, koi manpower provider ya labour thekedar. Asli sawaal ek hi hai: kin logon ki zaroorat hai, woh kahan kaam karenge, aur poora arrangement kaise manage hoga?",
      "Workforce plan karne se pehle hum aapki plant, warehouse ya facility team ke saath ye baatein tay karte hain. Ongoing kaam, projects aur seasonal badlav ke liye alag arrangements ki zaroorat ho sakti hai.",
    ],
    localLink: { href: "/hinglish/haridwar-sidcul", label: "Haridwar aur SIDCUL mein labour contractor" },
    areasEyebrow: "HUM KIN KAAMON MEIN SAATH DETE HAIN",
    workAreas: [
      {
        title: "Factory aur production",
        text: "Shopfloor ke kaam ke liye production helpers, packers, line feeders, material handlers aur quality check assistants.",
        href: "/hinglish/services/factory-labour",
        link: "Factory labour",
      },
      {
        title: "Warehouse aur dispatch",
        text: "Loading, unloading, picking, packing, stacking aur dispatch ke liye teams, warehouse activity ke hisaab se.",
        href: "/hinglish/services/warehouse-labour",
        link: "Warehouse labour",
      },
      {
        title: "Facilities aur site support",
        text: "Industrial aur business premises ke liye housekeeping, pantry, grounds aur doosre support roles.",
        href: "/hinglish/services/housekeeping",
        link: "Housekeeping services",
      },
    ],
    stepsEyebrow: "SHURUAAT KAISE HOTI HAI",
    stepsHeading: "Requirement se review tak.",
    steps: [
      {
        title: "Requirement bataiye",
        text: "Site, kaam, roles, headcount, shifts aur start date bataiye. Hum site procedures aur zaroori supervision par baat karte hain.",
      },
      {
        title: "Workforce ki planning",
        text: "Tay scope aur site ki readiness ke hisaab se sourcing, onboarding aur working arrangements par baat hoti hai.",
      },
      {
        title: "Site par coordination",
        text: "Attendance, shift coordination aur roz ki baatcheet aapki operations aur HR team ke saath plan ki jaati hai.",
      },
      {
        title: "Records review ke liye ready",
        text: "Onboarding, attendance, wage aur applicable EPF aur ESIC records client review ke liye coordinate kiye jaate hain.",
      },
    ],
    complianceHeading: "Engagement mein compliance.",
    complianceText:
      "Hum EPF aur ESIC mein registered hain. Worker onboarding, attendance, wage documentation aur applicable statutory contribution records har client ke saath baatcheet ka hissa hain. Vendor assessment aur review ke liye zaroori records share kiye ja sakte hain.",
    complianceLink: "Hamara labour compliance approach (English mein)",
    contactHeading: "Apni workforce requirement par baat karein.",
    contactText:
      "Site location, roles, approximate headcount, shift pattern aur timing bataiye. Phir hum aapke operation ke hisaab se scope, supervision aur documentation par baat kar sakte hain.",
    contactLink: "Vayasya Seva se contact karein",
  },
};
