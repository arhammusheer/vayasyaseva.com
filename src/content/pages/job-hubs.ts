import type { FaqItem } from "../types";
import type { Locale } from "@/lib/i18n";
import type { JobHub, JobRole } from "@/lib/talent-intake/rules";

/**
 * Hub pages under /jobs/<slug> for who is searching (freshers, 10th or 12th
 * pass), each pointing to the role pages that fit. Listed in the sitemap but
 * not linked from the site (JOB_HUBS in src/lib/talent-intake/rules.ts).
 *
 * Same claims discipline as job-roles.ts: no pay figures, no promised
 * call-back times, no guarantee of work, no employer names. hi-IN and
 * hi-Latn-IN are drafts pending native review.
 */
export interface JobHubCopy {
  slug: JobHub;
  /** Short name for breadcrumbs. */
  name: string;
  metaTitle: string;
  description: string;
  heading: string;
  lede: string;
  /** Who is hired at this level, and what matters more than the marksheet. */
  intro: string;
  roles: { role: JobRole; note: string }[];
  send: string[];
  faqs: FaqItem[];
}

export interface JobHubLabels {
  rolesEyebrow: string;
  rolesHeading: string;
  sendHeading: string;
  faqEyebrow: string;
  faqTitle: string;
}

export const jobHubLabels: Record<Locale, JobHubLabels> = {
  "en-IN": {
    rolesEyebrow: "WORK THAT FITS",
    rolesHeading: "Where you can start.",
    sendHeading: "Useful to send",
    faqEyebrow: "QUESTIONS",
    faqTitle: "Common questions.",
  },
  "hi-IN": {
    rolesEyebrow: "कौन-सा काम ठीक रहेगा",
    rolesHeading: "आप कहाँ से शुरू कर सकते हैं।",
    sendHeading: "भेज सकें तो अच्छा",
    faqEyebrow: "सवाल",
    faqTitle: "आम सवाल।",
  },
  "hi-Latn-IN": {
    rolesEyebrow: "KAUN-SA KAAM THEEK RAHEGA",
    rolesHeading: "Aap kahan se shuru kar sakte hain.",
    sendHeading: "Bhej sakein to achha",
    faqEyebrow: "SAWAAL",
    faqTitle: "Aam sawaal.",
  },
};

const AGE_FAQ: Record<Locale, FaqItem> = {
  "en-IN": {
    question: "Is there an age limit?",
    answer:
      "You must be 18 or older to apply. Some sites set their own upper limit for physical work; we tell you before you join.",
    category: "operations",
  },
  "hi-IN": {
    question: "क्या उम्र की कोई सीमा है?",
    answer:
      "अप्लाई करने के लिए आपकी उम्र 18 साल या ज़्यादा होनी चाहिए। मेहनत वाले काम के लिए कुछ साइटें अपनी ऊपरी सीमा रखती हैं; जॉइन करने से पहले हम बताते हैं।",
    category: "operations",
  },
  "hi-Latn-IN": {
    question: "Kya umar ki koi seema hai?",
    answer:
      "Apply karne ke liye aapki umar 18 saal ya zyada honi chahiye. Mehnat wale kaam ke liye kuch sites apni upar ki seema rakhti hain; join karne se pehle hum batate hain.",
    category: "operations",
  },
};

export const jobHubs: Record<Locale, JobHubCopy[]> = {
  "en-IN": [
    {
      slug: "freshers",
      name: "Fresher jobs",
      metaTitle: "SIDCUL Haridwar Vacancy for Freshers: Factory, Packing, Warehouse",
      description:
        "Jobs for freshers in SIDCUL and across Haridwar: factory helper, packing, warehouse and housekeeping work that needs no experience. Tell us by voice. No fee, ever.",
      heading: "Jobs for freshers in SIDCUL Haridwar.",
      lede: "No experience yet? Many factory and warehouse jobs in SIDCUL are open to freshers. Tell us about yourself in your own voice and we'll call you when there's suitable work.",
      intro:
        "Plants in SIDCUL and across Haridwar take freshers for helper, packing, warehouse and housekeeping work, and teach the job at induction. ITI freshers can start as helpers or trainees in their trade. We tell you the site, the shift and the work before you join.",
      roles: [
        { role: "factory-helper", note: "Line work and moving material. The most common first job in a factory." },
        { role: "packing", note: "Packing, labelling and checks, taught on the line." },
        { role: "warehouse", note: "Loading, picking and packing, for people fit for physical work." },
        { role: "housekeeping", note: "Factories, offices, canteens and campuses." },
        { role: "data-entry-operator", note: "For freshers who can use a computer and type." },
        { role: "iti-trades", note: "For ITI freshers: helper and trainee roles in your trade." },
      ],
      send: ["10th or 12th marksheet", "ITI certificate, if you have one", "A resume, if you have one"],
      faqs: [
        {
          question: "Can I get a job in SIDCUL without experience?",
          answer:
            "Yes, for many roles. Helper, packing, warehouse and housekeeping work is commonly open to freshers. Tell us what interests you and whether you can work night shifts.",
          category: "operations",
        },
        {
          question: "What documents do freshers need?",
          answer:
            "Your 10th or 12th marksheet, your ITI certificate if you have one, and the ID the site asks for at joining. We tell you exactly what to bring before you join.",
          category: "operations",
        },
        AGE_FAQ["en-IN"],
      ],
    },
    {
      slug: "10th-pass",
      name: "10th pass jobs",
      metaTitle: "10th Pass Jobs in SIDCUL Haridwar: Helper, Packing, Warehouse",
      description:
        "Jobs for 10th pass candidates in SIDCUL and across Haridwar: factory helper, packing, warehouse and housekeeping work. Tell us by voice. No fee, ever.",
      heading: "10th pass jobs in SIDCUL Haridwar.",
      lede: "Factory and warehouse work in SIDCUL for people who have passed 10th. Tell us about yourself in your own voice and we'll call you when there's suitable work.",
      intro:
        "For most helper, packing, warehouse and housekeeping work, 10th pass is enough. What matters more is being ready for shift work and the site's safety rules. If you did an ITI after 10th, apply for the work in your trade.",
      roles: [
        { role: "factory-helper", note: "Line work and moving material on the shopfloor." },
        { role: "packing", note: "Packing, labelling and checks at pharma and FMCG plants." },
        { role: "warehouse", note: "Loading, unloading, picking and dispatch." },
        { role: "housekeeping", note: "Factories, offices, canteens and campuses." },
        { role: "forklift-operator", note: "If you have forklift experience and a driving licence." },
        { role: "iti-trades", note: "If you did an ITI after 10th: welder, fitter, electrician." },
      ],
      send: ["10th marksheet", "ITI certificate, if you have one", "Any experience letter or salary slip"],
      faqs: [
        {
          question: "What jobs can I get after 10th in SIDCUL?",
          answer:
            "Mostly factory helper, packing, warehouse and housekeeping work. With experience, machine operator and forklift roles open up, and an ITI after 10th opens trade jobs.",
          category: "operations",
        },
        {
          question: "I did not pass 10th. Can I still apply?",
          answer:
            "Yes, tell us. Some helper and housekeeping roles do not ask for a marksheet. We tell you which work fits.",
          category: "operations",
        },
        AGE_FAQ["en-IN"],
      ],
    },
    {
      slug: "12th-pass",
      name: "12th pass jobs",
      metaTitle: "12th Pass Jobs in SIDCUL Haridwar: Data Entry, Operator, Packing",
      description:
        "Jobs for 12th pass candidates in SIDCUL and across Haridwar: data entry, trainee machine operator, packing and warehouse work. Tell us by voice. No fee, ever.",
      heading: "12th pass jobs in SIDCUL Haridwar.",
      lede: "Factory, warehouse and computer work in SIDCUL for people who have passed 12th. Tell us about yourself in your own voice and we'll call you when there's suitable work.",
      intro:
        "12th pass opens a few more doors than 10th: data entry and store work if you can use a computer, and trainee operator roles on production machines. Helper, packing and warehouse work is open too. Tell us your stream and any computer skills.",
      roles: [
        { role: "data-entry-operator", note: "Entries in ERP or SAP for stores, dispatch and production." },
        { role: "machine-operator", note: "Trainee operator roles on packing and production machines." },
        { role: "packing", note: "Packing, labelling and checks at pharma and FMCG plants." },
        { role: "factory-helper", note: "Line work and moving material on the shopfloor." },
        { role: "warehouse", note: "Loading, picking, packing and dispatch." },
      ],
      send: ["12th marksheet", "Computer course certificate, if you have one", "Any experience letter or salary slip"],
      faqs: [
        {
          question: "What jobs can I get after 12th in SIDCUL?",
          answer:
            "Data entry and store work if you are comfortable with computers, trainee machine operator roles, and helper, packing and warehouse work. Tell us your stream and what you would like to do.",
          category: "operations",
        },
        {
          question: "Do I need computer skills for data entry?",
          answer:
            "Basic typing and comfort with a computer, and Excel if you know it. Experience in ERP or SAP helps, but not every site asks for it.",
          category: "operations",
        },
        AGE_FAQ["en-IN"],
      ],
    },
  ],
  "hi-IN": [
    {
      slug: "freshers",
      name: "फ़्रेशर की नौकरी",
      metaTitle: "सिडकुल हरिद्वार में फ़्रेशर के लिए वैकेंसी: फ़ैक्टरी, पैकिंग, वेयरहाउस",
      description:
        "सिडकुल और पूरे हरिद्वार में फ़्रेशर के लिए नौकरी: फ़ैक्टरी हेल्पर, पैकिंग, वेयरहाउस और हाउसकीपिंग का काम, बिना अनुभव के। बोलकर बताइए। कोई फ़ीस नहीं।",
      heading: "सिडकुल हरिद्वार में फ़्रेशर के लिए नौकरी।",
      lede: "अभी अनुभव नहीं है? सिडकुल में फ़ैक्टरी और वेयरहाउस की कई नौकरियाँ फ़्रेशर के लिए हैं। अपनी आवाज़ में अपने बारे में बताइए, सही काम होने पर हम आपको फ़ोन करेंगे।",
      intro:
        "सिडकुल और पूरे हरिद्वार के प्लांट हेल्पर, पैकिंग, वेयरहाउस और हाउसकीपिंग के काम के लिए फ़्रेशर रखते हैं, और इंडक्शन में काम सिखाते हैं। ITI फ़्रेशर अपने ट्रेड में हेल्पर या ट्रेनी के तौर पर शुरू कर सकते हैं। जॉइन करने से पहले हम साइट, शिफ्ट और काम बताते हैं।",
      roles: [
        { role: "factory-helper", note: "लाइन का काम और माल उठाना-रखना। फ़ैक्टरी में सबसे आम पहली नौकरी।" },
        { role: "packing", note: "पैकिंग, लेबलिंग और चेकिंग, लाइन पर सिखाई जाती है।" },
        { role: "warehouse", note: "लोडिंग, पिकिंग और पैकिंग, मेहनत का काम कर सकने वालों के लिए।" },
        { role: "housekeeping", note: "फ़ैक्टरी, ऑफ़िस, कैंटीन और कैंपस।" },
        { role: "data-entry-operator", note: "उन फ़्रेशर के लिए जो कंप्यूटर चला सकें और टाइप कर सकें।" },
        { role: "iti-trades", note: "ITI फ़्रेशर के लिए: अपने ट्रेड में हेल्पर और ट्रेनी का काम।" },
      ],
      send: ["10वीं या 12वीं की मार्कशीट", "ITI सर्टिफ़िकेट, अगर हो", "रिज़्यूमे, अगर हो"],
      faqs: [
        {
          question: "क्या बिना अनुभव के सिडकुल में नौकरी मिल सकती है?",
          answer:
            "हाँ, कई कामों में। हेल्पर, पैकिंग, वेयरहाउस और हाउसकीपिंग का काम आम तौर पर फ़्रेशर के लिए खुला रहता है। बताइए आपको क्या पसंद है और क्या आप रात की शिफ्ट कर सकते हैं।",
          category: "operations",
        },
        {
          question: "फ़्रेशर को कौन-से कागज़ चाहिए?",
          answer:
            "10वीं या 12वीं की मार्कशीट, ITI सर्टिफ़िकेट अगर हो, और जॉइनिंग पर साइट जो पहचान पत्र माँगे। जॉइन करने से पहले हम ठीक-ठीक बताते हैं कि क्या लाना है।",
          category: "operations",
        },
        AGE_FAQ["hi-IN"],
      ],
    },
    {
      slug: "10th-pass",
      name: "10वीं पास नौकरी",
      metaTitle: "सिडकुल हरिद्वार में 10वीं पास नौकरी: हेल्पर, पैकिंग, वेयरहाउस",
      description:
        "सिडकुल और पूरे हरिद्वार में 10वीं पास के लिए नौकरी: फ़ैक्टरी हेल्पर, पैकिंग, वेयरहाउस और हाउसकीपिंग का काम। बोलकर बताइए। कोई फ़ीस नहीं।",
      heading: "सिडकुल हरिद्वार में 10वीं पास नौकरी।",
      lede: "10वीं पास लोगों के लिए सिडकुल में फ़ैक्टरी और वेयरहाउस का काम। अपनी आवाज़ में अपने बारे में बताइए, सही काम होने पर हम आपको फ़ोन करेंगे।",
      intro:
        "हेल्पर, पैकिंग, वेयरहाउस और हाउसकीपिंग के ज़्यादातर कामों के लिए 10वीं पास काफ़ी है। इससे ज़्यादा ज़रूरी है शिफ्ट में काम करने और साइट के सेफ़्टी नियम मानने के लिए तैयार रहना। 10वीं के बाद ITI किया है तो अपने ट्रेड के काम के लिए अप्लाई कीजिए।",
      roles: [
        { role: "factory-helper", note: "शॉपफ़्लोर पर लाइन का काम और माल उठाना-रखना।" },
        { role: "packing", note: "फ़ार्मा और FMCG प्लांट में पैकिंग, लेबलिंग और चेकिंग।" },
        { role: "warehouse", note: "लोडिंग, अनलोडिंग, पिकिंग और डिस्पैच।" },
        { role: "housekeeping", note: "फ़ैक्टरी, ऑफ़िस, कैंटीन और कैंपस।" },
        { role: "forklift-operator", note: "अगर फ़ोर्कलिफ़्ट का अनुभव और ड्राइविंग लाइसेंस है।" },
        { role: "iti-trades", note: "10वीं के बाद ITI किया है तो: वेल्डर, फ़िटर, इलेक्ट्रीशियन।" },
      ],
      send: ["10वीं की मार्कशीट", "ITI सर्टिफ़िकेट, अगर हो", "अनुभव का कोई पत्र या सैलरी स्लिप"],
      faqs: [
        {
          question: "सिडकुल में 10वीं के बाद कौन-सी नौकरी मिल सकती है?",
          answer:
            "ज़्यादातर फ़ैक्टरी हेल्पर, पैकिंग, वेयरहाउस और हाउसकीपिंग का काम। अनुभव के साथ मशीन ऑपरेटर और फ़ोर्कलिफ़्ट का काम मिलता है, और 10वीं के बाद ITI से ट्रेड की नौकरियाँ।",
          category: "operations",
        },
        {
          question: "10वीं पास नहीं है तो क्या फिर भी अप्लाई कर सकते हैं?",
          answer: "हाँ, हमें बताइए। हेल्पर और हाउसकीपिंग के कुछ कामों में मार्कशीट नहीं माँगी जाती। हम बताते हैं कि कौन-सा काम ठीक रहेगा।",
          category: "operations",
        },
        AGE_FAQ["hi-IN"],
      ],
    },
    {
      slug: "12th-pass",
      name: "12वीं पास नौकरी",
      metaTitle: "सिडकुल हरिद्वार में 12वीं पास नौकरी: डेटा एंट्री, ऑपरेटर, पैकिंग",
      description:
        "सिडकुल और पूरे हरिद्वार में 12वीं पास के लिए नौकरी: डेटा एंट्री, ट्रेनी मशीन ऑपरेटर, पैकिंग और वेयरहाउस का काम। बोलकर बताइए। कोई फ़ीस नहीं।",
      heading: "सिडकुल हरिद्वार में 12वीं पास नौकरी।",
      lede: "12वीं पास लोगों के लिए सिडकुल में फ़ैक्टरी, वेयरहाउस और कंप्यूटर का काम। अपनी आवाज़ में अपने बारे में बताइए, सही काम होने पर हम आपको फ़ोन करेंगे।",
      intro:
        "12वीं पास से 10वीं के मुक़ाबले कुछ और रास्ते खुलते हैं: कंप्यूटर चला सकें तो डेटा एंट्री और स्टोर का काम, और प्रोडक्शन मशीनों पर ट्रेनी ऑपरेटर का काम। हेल्पर, पैकिंग और वेयरहाउस का काम भी है। अपनी स्ट्रीम और कंप्यूटर की जानकारी बताइए।",
      roles: [
        { role: "data-entry-operator", note: "स्टोर, डिस्पैच और प्रोडक्शन के लिए ERP या SAP में एंट्री।" },
        { role: "machine-operator", note: "पैकिंग और प्रोडक्शन मशीनों पर ट्रेनी ऑपरेटर का काम।" },
        { role: "packing", note: "फ़ार्मा और FMCG प्लांट में पैकिंग, लेबलिंग और चेकिंग।" },
        { role: "factory-helper", note: "शॉपफ़्लोर पर लाइन का काम और माल उठाना-रखना।" },
        { role: "warehouse", note: "लोडिंग, पिकिंग, पैकिंग और डिस्पैच।" },
      ],
      send: ["12वीं की मार्कशीट", "कंप्यूटर कोर्स का सर्टिफ़िकेट, अगर हो", "अनुभव का कोई पत्र या सैलरी स्लिप"],
      faqs: [
        {
          question: "सिडकुल में 12वीं के बाद कौन-सी नौकरी मिल सकती है?",
          answer:
            "कंप्यूटर आता हो तो डेटा एंट्री और स्टोर का काम, ट्रेनी मशीन ऑपरेटर, और हेल्पर, पैकिंग और वेयरहाउस का काम। अपनी स्ट्रीम और आप क्या करना चाहते हैं, बताइए।",
          category: "operations",
        },
        {
          question: "क्या डेटा एंट्री के लिए कंप्यूटर आना ज़रूरी है?",
          answer:
            "बेसिक टाइपिंग और कंप्यूटर चलाना, और Excel आता हो तो अच्छा। ERP या SAP का अनुभव काम आता है, पर हर साइट इसे नहीं माँगती।",
          category: "operations",
        },
        AGE_FAQ["hi-IN"],
      ],
    },
  ],
  "hi-Latn-IN": [
    {
      slug: "freshers",
      name: "Fresher job",
      metaTitle: "SIDCUL Haridwar Vacancy for Freshers: Factory, Packing, Warehouse",
      description:
        "SIDCUL aur poore Haridwar mein fresher ke liye naukri: factory helper, packing, warehouse aur housekeeping ka kaam, bina experience ke. Bolkar bataiye. Koi fee nahi.",
      heading: "SIDCUL Haridwar mein fresher ke liye naukri.",
      lede: "Abhi experience nahi hai? SIDCUL mein factory aur warehouse ki kai naukriyan fresher ke liye hain. Apni awaaz mein apne baare mein bataiye, sahi kaam hone par hum aapko phone karenge.",
      intro:
        "SIDCUL aur poore Haridwar ke plants helper, packing, warehouse aur housekeeping ke kaam ke liye fresher rakhte hain, aur induction mein kaam sikhate hain. ITI fresher apne trade mein helper ya trainee ke taur par shuru kar sakte hain. Join karne se pehle hum site, shift aur kaam batate hain.",
      roles: [
        { role: "factory-helper", note: "Line ka kaam aur maal uthana-rakhna. Factory mein sabse aam pehli naukri." },
        { role: "packing", note: "Packing, labelling aur checking, line par sikhayi jaati hai." },
        { role: "warehouse", note: "Loading, picking aur packing, mehnat ka kaam kar sakne walon ke liye." },
        { role: "housekeeping", note: "Factory, office, canteen aur campus." },
        { role: "data-entry-operator", note: "Un fresher ke liye jo computer chala sakein aur type kar sakein." },
        { role: "iti-trades", note: "ITI fresher ke liye: apne trade mein helper aur trainee ka kaam." },
      ],
      send: ["10th ya 12th ki marksheet", "ITI certificate, agar ho", "Resume, agar ho"],
      faqs: [
        {
          question: "Kya bina experience ke SIDCUL mein naukri mil sakti hai?",
          answer:
            "Haan, kai kaamon mein. Helper, packing, warehouse aur housekeeping ka kaam aam taur par fresher ke liye khula rehta hai. Bataiye aapko kya pasand hai aur kya aap raat ki shift kar sakte hain.",
          category: "operations",
        },
        {
          question: "Fresher ko kaun-se kaagaz chahiye?",
          answer:
            "10th ya 12th ki marksheet, ITI certificate agar ho, aur joining par site jo ID maange. Join karne se pehle hum theek-theek batate hain ki kya lana hai.",
          category: "operations",
        },
        AGE_FAQ["hi-Latn-IN"],
      ],
    },
    {
      slug: "10th-pass",
      name: "10th pass job",
      metaTitle: "SIDCUL Haridwar mein 10th Pass Job: Helper, Packing, Warehouse",
      description:
        "SIDCUL aur poore Haridwar mein 10th pass ke liye naukri: factory helper, packing, warehouse aur housekeeping ka kaam. Bolkar bataiye. Koi fee nahi.",
      heading: "SIDCUL Haridwar mein 10th pass naukri.",
      lede: "10th pass logon ke liye SIDCUL mein factory aur warehouse ka kaam. Apni awaaz mein apne baare mein bataiye, sahi kaam hone par hum aapko phone karenge.",
      intro:
        "Helper, packing, warehouse aur housekeeping ke zyada kaamon ke liye 10th pass kaafi hai. Isse zyada zaroori hai shift mein kaam karne aur site ke safety rules maanne ke liye taiyaar rehna. 10th ke baad ITI kiya hai to apne trade ke kaam ke liye apply kijiye.",
      roles: [
        { role: "factory-helper", note: "Shopfloor par line ka kaam aur maal uthana-rakhna." },
        { role: "packing", note: "Pharma aur FMCG plants mein packing, labelling aur checking." },
        { role: "warehouse", note: "Loading, unloading, picking aur dispatch." },
        { role: "housekeeping", note: "Factory, office, canteen aur campus." },
        { role: "forklift-operator", note: "Agar forklift ka experience aur driving licence hai." },
        { role: "iti-trades", note: "10th ke baad ITI kiya hai to: welder, fitter, electrician." },
      ],
      send: ["10th ki marksheet", "ITI certificate, agar ho", "Experience ka koi letter ya salary slip"],
      faqs: [
        {
          question: "SIDCUL mein 10th ke baad kaun-si naukri mil sakti hai?",
          answer:
            "Zyadatar factory helper, packing, warehouse aur housekeeping ka kaam. Experience ke saath machine operator aur forklift ka kaam milta hai, aur 10th ke baad ITI se trade ki naukriyan.",
          category: "operations",
        },
        {
          question: "10th pass nahi hai to kya phir bhi apply kar sakte hain?",
          answer: "Haan, humein bataiye. Helper aur housekeeping ke kuch kaamon mein marksheet nahi maangi jaati. Hum batate hain ki kaun-sa kaam theek rahega.",
          category: "operations",
        },
        AGE_FAQ["hi-Latn-IN"],
      ],
    },
    {
      slug: "12th-pass",
      name: "12th pass job",
      metaTitle: "SIDCUL Haridwar mein 12th Pass Job: Data Entry, Operator, Packing",
      description:
        "SIDCUL aur poore Haridwar mein 12th pass ke liye naukri: data entry, trainee machine operator, packing aur warehouse ka kaam. Bolkar bataiye. Koi fee nahi.",
      heading: "SIDCUL Haridwar mein 12th pass naukri.",
      lede: "12th pass logon ke liye SIDCUL mein factory, warehouse aur computer ka kaam. Apni awaaz mein apne baare mein bataiye, sahi kaam hone par hum aapko phone karenge.",
      intro:
        "12th pass se 10th ke muqable kuch aur raaste khulte hain: computer chala sakein to data entry aur store ka kaam, aur production machines par trainee operator ka kaam. Helper, packing aur warehouse ka kaam bhi hai. Apni stream aur computer ki jaankari bataiye.",
      roles: [
        { role: "data-entry-operator", note: "Store, dispatch aur production ke liye ERP ya SAP mein entry." },
        { role: "machine-operator", note: "Packing aur production machines par trainee operator ka kaam." },
        { role: "packing", note: "Pharma aur FMCG plants mein packing, labelling aur checking." },
        { role: "factory-helper", note: "Shopfloor par line ka kaam aur maal uthana-rakhna." },
        { role: "warehouse", note: "Loading, picking, packing aur dispatch." },
      ],
      send: ["12th ki marksheet", "Computer course ka certificate, agar ho", "Experience ka koi letter ya salary slip"],
      faqs: [
        {
          question: "SIDCUL mein 12th ke baad kaun-si naukri mil sakti hai?",
          answer:
            "Computer aata ho to data entry aur store ka kaam, trainee machine operator, aur helper, packing aur warehouse ka kaam. Apni stream aur aap kya karna chahte hain, bataiye.",
          category: "operations",
        },
        {
          question: "Kya data entry ke liye computer aana zaroori hai?",
          answer:
            "Basic typing aur computer chalana, aur Excel aata ho to achha. ERP ya SAP ka experience kaam aata hai, par har site ise nahi maangti.",
          category: "operations",
        },
        AGE_FAQ["hi-Latn-IN"],
      ],
    },
  ],
};

export function getJobHub(slug: string, locale: Locale) {
  return jobHubs[locale].find((h) => h.slug === slug);
}
