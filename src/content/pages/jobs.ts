import type { FaqItem } from "../types";
import type { Locale } from "@/lib/i18n";

/** Strings the jobs form shows while it works (client component). */
export interface JobsFormCopy {
  steps: {
    record: { title: string; lead: string; points: string[] };
    files: { title: string; hint: string; warning: string };
    /** The word between the voice note and the text box. */
    or: string;
    text: { title: string; placeholder: string };
    phone: { title: string; placeholder: string; adult: string; consent: string; privacyLink: string };
  };
  record: {
    start: string;
    stop: string;
    again: string;
    remove: string;
    recording: string;
    recorded: string;
    noMic: string;
    unsupported: string;
  };
  files: { camera: string; choose: string; remove: string; tooLarge: string; wrongType: string; tooMany: string };
  submit: string;
  sending: string;
  sendingFile: (n: number, total: number, percent: number) => string;
  errors: {
    empty: string;
    phone: string;
    adult: string;
    consent: string;
    verification: string;
    network: string;
    server: string;
  };
  done: { title: string; refLabel: string; body: string; again: string };
  labels: { voice: string; photo: string; document: string };
}

export interface JobsCopy {
  title: string;
  description: string;
  breadcrumb: { home: string; page: string };
  eyebrow: string;
  heading: string;
  lede: string;
  noFee: string;
  form: JobsFormCopy;
  workEyebrow: string;
  workHeading: string;
  work: { title: string; text: string }[];
  faqEyebrow: string;
  faqTitle: string;
  faqs: FaqItem[];
}

/**
 * /jobs in every locale. Hindi is the page most job seekers use; English and
 * Hinglish mirror it. Hindi and Hinglish are drafts pending native review.
 * Claims discipline: no promised call-back times, no guarantees of work.
 */
export const jobsCopy: Record<Locale, JobsCopy> = {
  en: {
    title: "Jobs in SIDCUL Haridwar: Factory, Warehouse, Housekeeping",
    description:
      "Looking for work in SIDCUL or anywhere in Haridwar? Send a voice note, a photo of your certificates or a few lines about yourself. Vayasya Seva never charges a fee for a job.",
    breadcrumb: { home: "Home", page: "Jobs" },
    eyebrow: "JOBS · SIDCUL HARIDWAR",
    heading: "Looking for work? Just tell us.",
    lede: "Factory, warehouse, housekeeping or other work. No long form: say it in your own voice and we'll call you.",
    noFee: "Vayasya Seva never charges a fee for a job. If anyone asks you for money, tell us.",
    form: {
      steps: {
        record: {
          title: "Tell us about yourself",
          lead: "Just say:",
          points: ["Your name", "Where you live", "Work you know", "Your experience", "When you can start"],
        },
        files: {
          title: "Add photos or documents",
          hint: "Certificates, ITI, licence, salary slip or resume.",
          warning: "Please don't send Aadhaar or bank documents.",
        },
        or: "Or",
        text: {
          title: "type it instead",
          placeholder: "For example: I know packing work and have two years of experience…",
        },
        phone: {
          title: "Your mobile number",
          placeholder: "98765 43210",
          adult: "I am 18 or older",
          consent: "I agree that Vayasya Seva may use my details to contact me about work.",
          privacyLink: "Privacy Policy",
        },
      },
      record: {
        start: "Record",
        stop: "Stop",
        again: "Record again",
        remove: "Remove",
        recording: "Recording",
        recorded: "Voice note ready",
        noMic: "We couldn't use your microphone. Allow it in your browser, or type your message instead.",
        unsupported: "This browser can't record. Type your message or add a file instead.",
      },
      files: {
        camera: "Take a photo",
        choose: "Choose files",
        remove: "Remove",
        tooLarge: "is too large",
        wrongType: "can't be sent (use a photo, PDF or Word file)",
        tooMany: "You can send up to 7 files.",
      },
      submit: "Send",
      sending: "Sending…",
      sendingFile: (n, total, percent) => `Sending file ${n} of ${total}… ${percent}%`,
      errors: {
        empty: "Record a voice note, add a file or type a few words about yourself.",
        phone: "Enter a 10-digit mobile number.",
        adult: "Please confirm you are 18 or older.",
        consent: "Please agree so we can contact you.",
        verification: "We couldn't verify this browser. Please try again.",
        network: "The connection dropped. Check your signal and press Send again.",
        server: "Something went wrong on our side. Please try again in a few minutes.",
      },
      done: {
        title: "Received. Thank you.",
        refLabel: "Your reference",
        body: "Our team will call you on this number. Remember: we never charge a fee.",
        again: "Send another",
      },
      labels: { voice: "Voice note", photo: "Photo", document: "Document" },
    },
    workEyebrow: "WHO WE HIRE",
    workHeading: "The work we hire for.",
    work: [
      { title: "Production helpers", text: "Line work, feeding and assisting on factory shopfloors." },
      { title: "Packing", text: "Packing, labelling and quality checks." },
      { title: "Loading and unloading", text: "Warehouse and dispatch work, including stacking." },
      { title: "Housekeeping", text: "Factories, offices, canteens and campuses." },
      { title: "Machine operators", text: "For those with experience on a machine or line." },
      { title: "ITI trades", text: "Welders, fitters and electricians." },
      { title: "Data entry operators", text: "Computer work in ERP or SAP: stores, dispatch and production entries." },
      { title: "Supervisors", text: "Shift and site supervision." },
    ],
    faqEyebrow: "QUESTIONS",
    faqTitle: "Before you send.",
    faqs: [
      {
        question: "Is there any fee?",
        answer: "No. Vayasya Seva never charges job seekers anything. If anyone asks you for money in our name, do not pay, and tell us.",
        category: "operations",
      },
      {
        question: "When will you call?",
        answer: "Our team reviews every submission and typically calls within a few days when there is suitable work. We may not be able to call everyone.",
        category: "operations",
      },
      {
        question: "I don't have a resume. Can I still apply?",
        answer: "Yes. A voice note is enough. Tell us your name, area, the work you know and when you can start.",
        category: "operations",
      },
      {
        question: "Where is the work?",
        answer: "Mostly in the SIDCUL industrial area and across Haridwar, with some work around Roorkee, Bhagwanpur and Bahadrabad.",
        category: "operations",
      },
    ],
  },
  hi: {
    title: "सिडकुल हरिद्वार में नौकरी: फ़ैक्टरी, वेयरहाउस, हाउसकीपिंग",
    description:
      "सिडकुल या हरिद्वार में कहीं भी काम चाहिए? अपनी आवाज़ में बताइए, सर्टिफ़िकेट की फ़ोटो भेजिए या दो लाइन लिखिए। Vayasya Seva नौकरी के लिए कोई फ़ीस नहीं लेती।",
    breadcrumb: { home: "होम", page: "नौकरी" },
    eyebrow: "नौकरी · सिडकुल हरिद्वार",
    heading: "काम चाहिए? बोलकर बताइए।",
    lede: "फ़ैक्टरी, वेयरहाउस, हाउसकीपिंग या कोई और काम। फ़ॉर्म भरने की ज़रूरत नहीं: अपनी आवाज़ में बताइए, हम आपको फ़ोन करेंगे।",
    noFee: "Vayasya Seva नौकरी के लिए कभी कोई फ़ीस नहीं लेती। कोई पैसे माँगे तो हमें बताइए।",
    form: {
      steps: {
        record: {
          title: "अपने बारे में बताइए",
          lead: "बस इतना बताइए:",
          points: ["आपका नाम", "कहाँ रहते हैं", "कौन-सा काम आता है", "कितना अनुभव है", "कब से शुरू कर सकते हैं"],
        },
        files: {
          title: "फ़ोटो या कागज़ जोड़ें",
          hint: "सर्टिफ़िकेट, ITI, लाइसेंस, सैलरी स्लिप या रिज़्यूमे।",
          warning: "आधार या बैंक के कागज़ न भेजें।",
        },
        or: "या",
        text: {
          title: "लिखकर बताइए",
          placeholder: "जैसे: मैं पैकिंग का काम जानता हूँ, दो साल का अनुभव है…",
        },
        phone: {
          title: "आपका मोबाइल नंबर",
          placeholder: "98765 43210",
          adult: "मेरी उम्र 18 साल या उससे ज़्यादा है",
          consent: "मैं सहमत हूँ कि Vayasya Seva नौकरी के लिए मुझसे संपर्क करने में मेरी जानकारी इस्तेमाल करे।",
          privacyLink: "गोपनीयता नीति",
        },
      },
      record: {
        start: "रिकॉर्ड करें",
        stop: "रोकें",
        again: "फिर से रिकॉर्ड करें",
        remove: "हटाएँ",
        recording: "रिकॉर्ड हो रहा है",
        recorded: "आवाज़ तैयार है",
        noMic: "माइक्रोफ़ोन नहीं चला। ब्राउज़र में माइक्रोफ़ोन की अनुमति दीजिए, या लिखकर बताइए।",
        unsupported: "इस ब्राउज़र में रिकॉर्डिंग नहीं होती। लिखकर बताइए या फ़ाइल जोड़िए।",
      },
      files: {
        camera: "फ़ोटो खींचें",
        choose: "फ़ाइल चुनें",
        remove: "हटाएँ",
        tooLarge: "बहुत बड़ी है",
        wrongType: "नहीं भेजी जा सकती (फ़ोटो, PDF या Word फ़ाइल भेजें)",
        tooMany: "ज़्यादा से ज़्यादा 7 फ़ाइलें भेज सकते हैं।",
      },
      submit: "भेजें",
      sending: "भेज रहे हैं…",
      sendingFile: (n, total, percent) => `फ़ाइल ${n} / ${total} भेज रहे हैं… ${percent}%`,
      errors: {
        empty: "आवाज़ रिकॉर्ड करें, फ़ाइल जोड़ें या अपने बारे में कुछ लिखें।",
        phone: "10 अंकों का मोबाइल नंबर लिखें।",
        adult: "कृपया पुष्टि करें कि आपकी उम्र 18 साल या उससे ज़्यादा है।",
        consent: "संपर्क के लिए कृपया सहमति दें।",
        verification: "ब्राउज़र की जाँच नहीं हो पाई। कृपया फिर से कोशिश करें।",
        network: "नेटवर्क टूट गया। सिग्नल देखकर फिर से भेजें दबाएँ।",
        server: "हमारी तरफ़ से कुछ गड़बड़ हुई। कुछ मिनट बाद फिर से कोशिश करें।",
      },
      done: {
        title: "मिल गया, धन्यवाद।",
        refLabel: "आपका नंबर",
        body: "हमारी टीम आपको इसी मोबाइल नंबर पर फ़ोन करेगी। याद रखें, हम कोई फ़ीस नहीं लेते।",
        again: "एक और भेजें",
      },
      labels: { voice: "आवाज़", photo: "फ़ोटो", document: "कागज़" },
    },
    workEyebrow: "किन कामों के लिए",
    workHeading: "हम इन कामों के लिए लोग रखते हैं।",
    work: [
      { title: "प्रोडक्शन हेल्पर", text: "फ़ैक्टरी के शॉपफ़्लोर पर लाइन का काम और मदद।" },
      { title: "पैकिंग", text: "पैकिंग, लेबलिंग और क्वालिटी चेक।" },
      { title: "लोडिंग-अनलोडिंग", text: "वेयरहाउस और डिस्पैच का काम, स्टैकिंग समेत।" },
      { title: "हाउसकीपिंग", text: "फ़ैक्टरी, ऑफ़िस, कैंटीन और कैंपस।" },
      { title: "मशीन ऑपरेटर", text: "जिन्हें किसी मशीन या लाइन पर काम का अनुभव है।" },
      { title: "ITI ट्रेड", text: "वेल्डर, फ़िटर और इलेक्ट्रीशियन।" },
      { title: "डेटा एंट्री ऑपरेटर", text: "कंप्यूटर पर ERP या SAP में एंट्री: स्टोर, डिस्पैच और प्रोडक्शन।" },
      { title: "सुपरवाइज़र", text: "शिफ्ट और साइट की देखरेख।" },
    ],
    faqEyebrow: "सवाल",
    faqTitle: "भेजने से पहले।",
    faqs: [
      {
        question: "क्या कोई फ़ीस है?",
        answer: "नहीं। Vayasya Seva नौकरी चाहने वालों से कभी कोई पैसा नहीं लेती। अगर कोई हमारे नाम पर पैसे माँगे तो न दें, और हमें बताएँ।",
        category: "operations",
      },
      {
        question: "फ़ोन कब आएगा?",
        answer: "हमारी टीम हर जानकारी देखती है और सही काम होने पर आमतौर पर कुछ दिनों में फ़ोन करती है। हर किसी को फ़ोन करना मुमकिन नहीं हो सकता।",
        category: "operations",
      },
      {
        question: "मेरे पास रिज़्यूमे नहीं है, क्या फिर भी भेज सकते हैं?",
        answer: "हाँ। आवाज़ में बताना काफ़ी है। अपना नाम, इलाका, कौन-सा काम आता है और कब से शुरू कर सकते हैं, बताइए।",
        category: "operations",
      },
      {
        question: "काम किन इलाकों में है?",
        answer: "ज़्यादातर सिडकुल औद्योगिक क्षेत्र और पूरे हरिद्वार में, और कुछ काम रुड़की, भगवानपुर और बहादराबाद के आसपास।",
        category: "operations",
      },
    ],
  },
  hinglish: {
    title: "SIDCUL Haridwar mein Naukri: Factory, Warehouse, Housekeeping",
    description:
      "SIDCUL ya Haridwar mein kahin bhi kaam chahiye? Apni awaaz mein bataiye, certificate ki photo bhejiye ya do line likhiye. Vayasya Seva naukri ke liye koi fee nahi leti.",
    breadcrumb: { home: "Home", page: "Jobs" },
    eyebrow: "JOBS · SIDCUL HARIDWAR",
    heading: "Kaam chahiye? Bolkar bataiye.",
    lede: "Factory, warehouse, housekeeping ya koi aur kaam. Form bharne ki zaroorat nahi: apni awaaz mein bataiye, hum aapko phone karenge.",
    noFee: "Vayasya Seva naukri ke liye kabhi koi fee nahi leti. Koi paise maange to humein bataiye.",
    form: {
      steps: {
        record: {
          title: "Apne baare mein bataiye",
          lead: "Bas itna bataiye:",
          points: ["Aapka naam", "Kahan rehte hain", "Kaun-sa kaam aata hai", "Kitna experience hai", "Kab se shuru kar sakte hain"],
        },
        files: {
          title: "Photo ya documents jodein",
          hint: "Certificate, ITI, licence, salary slip ya resume.",
          warning: "Aadhaar ya bank ke documents na bhejein.",
        },
        or: "Ya",
        text: {
          title: "likhkar bataiye",
          placeholder: "Jaise: main packing ka kaam jaanta hoon, do saal ka experience hai…",
        },
        phone: {
          title: "Aapka mobile number",
          placeholder: "98765 43210",
          adult: "Meri umar 18 saal ya usse zyada hai",
          consent: "Main sehmat hoon ki Vayasya Seva naukri ke liye mujhse contact karne mein meri jaankari use kare.",
          privacyLink: "Privacy Policy",
        },
      },
      record: {
        start: "Record karein",
        stop: "Rokein",
        again: "Phir se record karein",
        remove: "Hatayein",
        recording: "Record ho raha hai",
        recorded: "Awaaz taiyaar hai",
        noMic: "Microphone nahi chala. Browser mein microphone ki permission dijiye, ya likhkar bataiye.",
        unsupported: "Is browser mein recording nahi hoti. Likhkar bataiye ya file jodiye.",
      },
      files: {
        camera: "Photo khichein",
        choose: "File chunein",
        remove: "Hatayein",
        tooLarge: "bahut badi hai",
        wrongType: "nahi bheji ja sakti (photo, PDF ya Word file bhejein)",
        tooMany: "Zyada se zyada 7 files bhej sakte hain.",
      },
      submit: "Bhejein",
      sending: "Bhej rahe hain…",
      sendingFile: (n, total, percent) => `File ${n} / ${total} bhej rahe hain… ${percent}%`,
      errors: {
        empty: "Awaaz record karein, file jodein ya apne baare mein kuch likhein.",
        phone: "10 digit ka mobile number likhein.",
        adult: "Please confirm karein ki aapki umar 18 saal ya usse zyada hai.",
        consent: "Contact ke liye please sehmati dein.",
        verification: "Browser ki jaanch nahi ho paayi. Please phir se try karein.",
        network: "Network toot gaya. Signal dekhkar phir se Bhejein dabayein.",
        server: "Hamari taraf se kuch gadbad hui. Kuch minute baad phir se try karein.",
      },
      done: {
        title: "Mil gaya, dhanyavaad.",
        refLabel: "Aapka number",
        body: "Hamari team aapko isi mobile number par phone karegi. Yaad rakhein, hum koi fee nahi lete.",
        again: "Ek aur bhejein",
      },
      labels: { voice: "Awaaz", photo: "Photo", document: "Document" },
    },
    workEyebrow: "KIN KAAMON KE LIYE",
    workHeading: "Hum in kaamon ke liye log rakhte hain.",
    work: [
      { title: "Production helper", text: "Factory shopfloor par line ka kaam aur madad." },
      { title: "Packing", text: "Packing, labelling aur quality check." },
      { title: "Loading-unloading", text: "Warehouse aur dispatch ka kaam, stacking samet." },
      { title: "Housekeeping", text: "Factory, office, canteen aur campus." },
      { title: "Machine operator", text: "Jinhe kisi machine ya line par kaam ka experience hai." },
      { title: "ITI trade", text: "Welder, fitter aur electrician." },
      { title: "Data entry operator", text: "Computer par ERP ya SAP mein entry: stores, dispatch aur production." },
      { title: "Supervisor", text: "Shift aur site ki dekhrekh." },
    ],
    faqEyebrow: "SAWAAL",
    faqTitle: "Bhejne se pehle.",
    faqs: [
      {
        question: "Kya koi fee hai?",
        answer: "Nahi. Vayasya Seva naukri chahne walon se kabhi koi paisa nahi leti. Agar koi hamare naam par paise maange to na dein, aur humein bataiye.",
        category: "operations",
      },
      {
        question: "Phone kab aayega?",
        answer: "Hamari team har submission dekhti hai aur sahi kaam hone par aam taur par kuch dinon mein phone karti hai. Har kisi ko phone karna mumkin nahi ho sakta.",
        category: "operations",
      },
      {
        question: "Mere paas resume nahi hai, kya phir bhi bhej sakte hain?",
        answer: "Haan. Awaaz mein bataana kaafi hai. Apna naam, area, kaun-sa kaam aata hai aur kab se shuru kar sakte hain, bataiye.",
        category: "operations",
      },
      {
        question: "Kaam kin areas mein hai?",
        answer: "Zyadatar SIDCUL industrial area aur poore Haridwar mein, aur kuch kaam Roorkee, Bhagwanpur aur Bahadrabad ke aas-paas.",
        category: "operations",
      },
    ],
  },
};
