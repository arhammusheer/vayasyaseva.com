import type { JobRole } from "@/lib/talent-intake/rules";
import type { FaqItem } from "../types";
import type { Locale } from "@/lib/i18n";

/** Strings the jobs form shows while it works (client component). */
export interface JobsFormCopy {
  steps: {
    files: { title: string; hint: string; warning: string };
    /** One checkbox: 18 or older, and consent to be contacted. */
    phone: { title: string; placeholder: string; agree: string; privacyLink: string; keepNote: string };
  };
  files: { camera: string; choose: string; remove: string; tooLarge: string; wrongType: string; tooMany: string };
  next: string;
  retry: string;
  retryNotice: string;
  submit: string;
  sending: string;
  sendingFile: (n: number, total: number, percent: number) => string;
  errors: {
    phone: string;
    agree: string;
    verification: string;
    network: string;
    server: string;
    expired: string;
  };
  /** `fraud`: the link to the fees and fraud page under the confirmation. */
  done: { title: string; refLabel: string; body: string; fraud: string; again: string };
  labels: { photo: string; document: string };
  /** Labels for details filled in from a prefilled link (src/lib/prefill.ts). */
  prefill: { name: string; work: string; experience: string; location: string; start: string };
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
  /** `role`: links the row to its page under /jobs/<slug>. */
  work: { title: string; text: string; role?: JobRole }[];
  faqEyebrow: string;
  faqTitle: string;
  /** The overview's FAQs: the shared ones first, then its own. */
  faqs: FaqItem[];
  /** Fee and part-time questions, also shown on every role and category page. */
  sharedFaqs: FaqItem[];
}

/** The fees and fraud page, linked from the fee question on every job page. */
const FRAUD_PATH = "/jobs/fees-and-fraud";

/**
 * The no-fee line (PLAN §5.3), used wherever a page says there is no fee.
 * It replaces the old "never charges" lines.
 */
export const NO_FEE: Record<Locale, string> = {
  "en-IN": "There is no fee to apply. If anyone asks you for money in our name, don't pay.",
  "hi-IN": "आवेदन की कोई फ़ीस नहीं है। अगर कोई हमारे नाम पर पैसे माँगे, तो मत दीजिए।",
  "hi-Latn-IN": "Apply karne ki koi fee nahi hai. Agar koi hamare naam par paise maange, to mat dijiye.",
};

/** Work is shift-wise only: say so plainly (owner, 16 October 2026). */
export const SHIFTS_LINE: Record<Locale, string> = {
  "en-IN": "Work is in full 8-hour shifts. There is no part-time work.",
  "hi-IN": "काम पूरी 8 घंटे की शिफ्ट में होता है। पार्ट-टाइम काम नहीं है।",
  "hi-Latn-IN": "Kaam poori 8 ghante ki shift mein hota hai. Part-time kaam nahi hai.",
};

const SHARED_FAQS: Record<Locale, FaqItem[]> = {
  "en-IN": [
    {
      question: "Is there any fee?",
      answer: "No. There is no fee to apply. If anyone asks you for money, don't pay. Tell us.",
      link: { href: `/en-in${FRAUD_PATH}`, label: "Fees and fraud" },
      category: "operations",
    },
    {
      question: "Is there part-time work?",
      answer: "No. All our work is in full 8-hour shifts. Some sites run day, night or rotating shifts. We tell you the shift before you join.",
      category: "operations",
    },
  ],
  "hi-IN": [
    {
      question: "क्या कोई फ़ीस है?",
      answer: "नहीं। आवेदन की कोई फ़ीस नहीं है। अगर कोई पैसे माँगे, तो मत दीजिए। हमें बताइए।",
      link: { href: `/hi-in${FRAUD_PATH}`, label: "फ़ीस और धोखा" },
      category: "operations",
    },
    {
      question: "क्या पार्ट-टाइम काम है?",
      answer: "नहीं। हमारा सारा काम पूरी 8 घंटे की शिफ्ट में होता है। कुछ साइटों पर दिन, रात या बदलती शिफ्ट होती है। जॉइन करने से पहले हम शिफ्ट बताते हैं।",
      category: "operations",
    },
  ],
  "hi-Latn-IN": [
    {
      question: "Kya koi fee hai?",
      answer: "Nahi. Apply karne ki koi fee nahi hai. Agar koi paise maange, to mat dijiye. Humein bataiye.",
      link: { href: `/hi-latn-in${FRAUD_PATH}`, label: "Fee aur fraud" },
      category: "operations",
    },
    {
      question: "Kya part-time kaam hai?",
      answer: "Nahi. Hamara saara kaam poori 8 ghante ki shift mein hota hai. Kuch sites par din, raat ya badalti shift hoti hai. Join karne se pehle hum shift batate hain.",
      category: "operations",
    },
  ],
};

/**
 * /jobs in every locale. hi-IN is the page most job seekers use; en-IN and
 * hi-Latn-IN mirror it. hi-IN and hi-Latn-IN are drafts pending native review.
 * Claims discipline: no promised call-back times, no guarantees of work.
 */
export const jobsCopy: Record<Locale, JobsCopy> = {
  "en-IN": {
    title: "SIDCUL Haridwar Vacancy: Factory, Warehouse, ITI Jobs",
    description:
      "SIDCUL Haridwar jobs. No fee to apply. Full 8-hour shifts. Factory, packing, warehouse, housekeeping and ITI work. Apply online with a few short answers.",
    breadcrumb: { home: "Home", page: "Jobs" },
    eyebrow: "JOBS · SIDCUL HARIDWAR",
    heading: "Find work in SIDCUL Haridwar.",
    lede: "Factory, packing, warehouse, housekeeping and ITI work.",
    noFee: NO_FEE["en-IN"],
    form: {
      steps: {
        files: {
          title: "Add photos or documents",
          hint: "Certificates, ITI, licence, salary slip or resume.",
          warning: "Please don't send Aadhaar or bank documents.",
        },
        phone: {
          title: "Your mobile number",
          placeholder: "98765 43210",
          agree: "I am 18 or older. Vayasya Seva may keep my details and contact me about work.",
          privacyLink: "Privacy Policy",
          keepNote: "We keep your details for 12 months after you last reply. We call when a site near you needs people. To remove them, email help@vayasyaseva.com.",
        },
      },
      files: {
        camera: "Take a photo",
        choose: "Choose files",
        remove: "Remove",
        tooLarge: "is too large",
        wrongType: "can't be sent (use a photo, PDF or Word file)",
        tooMany: "You can send up to 7 files.",
      },
      next: "Next",
      retry: "Retry submission",
      retryNotice: "Retry this application to confirm receipt. Your reference:",
      submit: "Send",
      sending: "Sending…",
      sendingFile: (n, total, percent) => `Sending file ${n} of ${total}… ${percent}%`,
      errors: {
        phone: "Enter a 10-digit mobile number.",
        agree: "Please tick the box: you are 18 or older and agree that we can contact you.",
        verification: "Please wait a few seconds, then press Send again.",
        network: "The connection dropped. Check your signal and press Send again.",
        server: "Something went wrong on our side. Please try again in a few minutes.",
        expired: "This form timed out. Please apply again. We match applications by mobile number, so sending twice is fine.",
      },
      done: {
        title: "Received. Thank you.",
        refLabel: "Your reference",
        body: `We will SMS this reference from VAYSPL. Keep the SMS. We typically call within a few days when there is suitable work, on the mobile number you gave. ${NO_FEE["en-IN"]}`,
        fraud: "How to spot a fake job offer",
        again: "Send another",
      },
      labels: { photo: "Photo", document: "Document" },
      prefill: { name: "Name", work: "Work I want", experience: "Experience", location: "Area", start: "Can start" },
    },
    workEyebrow: "WHO WE HIRE",
    workHeading: "The work we hire for.",
    work: [
      { title: "Production helpers", text: "Work on the factory line: putting parts in, helping operators.", role: "factory-helper" },
      { title: "Packing", text: "Packing, labelling and quality checks.", role: "packing" },
      { title: "Loading and unloading", text: "Warehouse and dispatch work, including stacking.", role: "warehouse" },
      { title: "Forklift operators", text: "Loading and stacking by forklift, for experienced operators.", role: "forklift-operator" },
      { title: "Housekeeping", text: "Factories, offices, canteens and campuses.", role: "housekeeping" },
      { title: "Machine operators", text: "For those with experience on a machine or line.", role: "machine-operator" },
      { title: "Electricians", text: "Plant maintenance, wiring, motors and panels.", role: "electrician" },
      { title: "Welders", text: "Arc, MIG and TIG welding and gas cutting.", role: "welder" },
      { title: "Fitters", text: "Mechanical maintenance and machine fitting.", role: "fitter" },
      { title: "Other ITI trades", text: "Other trades, and helper or trainee roles for ITI freshers.", role: "iti-trades" },
      { title: "Data entry operators", text: "Computer work in ERP or SAP: stores, dispatch and production entries.", role: "data-entry-operator" },
      { title: "Supervisors", text: "Shift and site supervision." },
    ],
    faqEyebrow: "QUESTIONS",
    faqTitle: "Before you send.",
    sharedFaqs: SHARED_FAQS["en-IN"],
    faqs: [
      ...SHARED_FAQS["en-IN"],
      {
        question: "When will you call?",
        answer: "Our team reviews every submission and typically calls within a few days when there is suitable work. We may not be able to call everyone.",
        category: "operations",
      },
      {
        question: "I don't have a resume. Can I still apply?",
        answer: "Yes. The short form is enough. Tell us the work you know, where you live and when you can start.",
        category: "operations",
      },
      {
        question: "Where is the work?",
        answer: "Mostly in the SIDCUL industrial area and across Haridwar, with some work around Roorkee, Bhagwanpur and Bahadrabad.",
        link: { href: "/en-in/jobs/haridwar", label: "Jobs in Haridwar" },
        category: "operations",
      },
    ],
  },
  "hi-IN": {
    title: "सिडकुल हरिद्वार वैकेंसी: फ़ैक्टरी, वेयरहाउस और ITI की नौकरी",
    description:
      "सिडकुल हरिद्वार में नौकरी। आवेदन की कोई फ़ीस नहीं। पूरी 8 घंटे की शिफ्ट। फ़ैक्टरी, पैकिंग, वेयरहाउस, हाउसकीपिंग और ITI का काम। कुछ आसान सवालों से ऑनलाइन आवेदन करें।",
    breadcrumb: { home: "होम", page: "नौकरी" },
    eyebrow: "नौकरी · सिडकुल हरिद्वार",
    heading: "सिडकुल हरिद्वार में काम ढूँढें।",
    lede: "फ़ैक्टरी, पैकिंग, वेयरहाउस, हाउसकीपिंग और ITI का काम।",
    noFee: NO_FEE["hi-IN"],
    form: {
      steps: {
        files: {
          title: "फ़ोटो या कागज़ जोड़ें",
          hint: "सर्टिफ़िकेट, ITI, लाइसेंस, सैलरी स्लिप या रिज़्यूमे।",
          warning: "आधार या बैंक के कागज़ न भेजें।",
        },
        phone: {
          title: "आपका मोबाइल नंबर",
          placeholder: "98765 43210",
          agree: "मेरी उम्र 18 साल या उससे ज़्यादा है। Vayasya Seva मेरी जानकारी रख सकती है और काम के लिए मुझसे संपर्क कर सकती है।",
          privacyLink: "गोपनीयता नीति (अंग्रेज़ी में)",
          keepNote: "आपके आख़िरी जवाब के बाद हम आपकी जानकारी 12 महीने तक रखते हैं। पास की साइट पर काम आए तो कॉल करेंगे। हटवानी हो तो help@vayasyaseva.com पर लिखें।",
        },
      },
      files: {
        camera: "फ़ोटो खींचें",
        choose: "फ़ाइल चुनें",
        remove: "हटाएँ",
        tooLarge: "बहुत बड़ी है",
        wrongType: "नहीं भेजी जा सकती (फ़ोटो, PDF या Word फ़ाइल भेजें)",
        tooMany: "ज़्यादा से ज़्यादा 7 फ़ाइलें भेज सकते हैं।",
      },
      next: "आगे",
      retry: "फिर से भेजें",
      retryNotice: "इस आवेदन की पुष्टि के लिए फिर से भेजें। आपका रेफ़रेंस नंबर:",
      submit: "भेजें",
      sending: "भेज रहे हैं…",
      sendingFile: (n, total, percent) => `फ़ाइल ${n} / ${total} भेज रहे हैं… ${percent}%`,
      errors: {
        phone: "10 अंकों का मोबाइल नंबर लिखें।",
        agree: "कृपया बॉक्स पर टिक करें: आपकी उम्र 18 साल या उससे ज़्यादा है और आप संपर्क के लिए सहमत हैं।",
        verification: "कुछ सेकंड रुकिए, फिर भेजें दबाइए।",
        network: "नेटवर्क टूट गया। सिग्नल देखकर फिर से भेजें दबाएँ।",
        server: "हमारी तरफ़ से कुछ गड़बड़ हुई। कुछ मिनट बाद फिर से कोशिश करें।",
        expired: "फ़ॉर्म का समय ख़त्म हो गया। कृपया फिर से आवेदन करें। हम आवेदन मोबाइल नंबर से मिलाते हैं, इसलिए दोबारा भेजना ठीक है।",
      },
      done: {
        title: "मिल गया, धन्यवाद।",
        refLabel: "आपका रेफ़रेंस नंबर",
        body: `हम यह रेफ़रेंस VAYSPL से SMS करेंगे। यह SMS संभालकर रखिए। आपके लायक काम होने पर हम आम तौर पर कुछ दिनों में आपके दिए मोबाइल नंबर पर फ़ोन करते हैं। ${NO_FEE["hi-IN"]}`,
        fraud: "नकली नौकरी के ऑफ़र कैसे पहचानें",
        again: "एक और भेजें",
      },
      labels: { photo: "फ़ोटो", document: "कागज़" },
      prefill: { name: "नाम", work: "कौन-सा काम चाहिए", experience: "अनुभव", location: "इलाका", start: "कब से शुरू कर सकते हैं" },
    },
    workEyebrow: "किन कामों के लिए",
    workHeading: "हम इन कामों के लिए लोग रखते हैं।",
    work: [
      { title: "प्रोडक्शन हेल्पर", text: "फ़ैक्टरी की लाइन पर काम: पार्ट लगाना, ऑपरेटर की मदद करना।", role: "factory-helper" },
      { title: "पैकिंग", text: "पैकिंग, लेबलिंग और क्वालिटी चेक।", role: "packing" },
      { title: "लोडिंग-अनलोडिंग", text: "वेयरहाउस और डिस्पैच का काम, स्टैकिंग समेत।", role: "warehouse" },
      { title: "फ़ोर्कलिफ़्ट ऑपरेटर", text: "फ़ोर्कलिफ़्ट से लोडिंग और स्टैकिंग, अनुभवी ऑपरेटरों के लिए।", role: "forklift-operator" },
      { title: "हाउसकीपिंग", text: "फ़ैक्टरी, ऑफ़िस, कैंटीन और कैंपस।", role: "housekeeping" },
      { title: "मशीन ऑपरेटर", text: "जिन्हें किसी मशीन या लाइन पर काम का अनुभव है।", role: "machine-operator" },
      { title: "इलेक्ट्रीशियन", text: "प्लांट मेंटेनेंस, वायरिंग, मोटर और पैनल।", role: "electrician" },
      { title: "वेल्डर", text: "आर्क, MIG और TIG वेल्डिंग और गैस कटिंग।", role: "welder" },
      { title: "फ़िटर", text: "मैकेनिकल मेंटेनेंस और मशीन फ़िटिंग।", role: "fitter" },
      { title: "दूसरे ITI ट्रेड", text: "दूसरे ट्रेड, और ITI फ़्रेशर के लिए हेल्पर या ट्रेनी का काम।", role: "iti-trades" },
      { title: "डेटा एंट्री ऑपरेटर", text: "कंप्यूटर पर ERP या SAP में एंट्री: स्टोर, डिस्पैच और प्रोडक्शन।", role: "data-entry-operator" },
      { title: "सुपरवाइज़र", text: "शिफ्ट और साइट की देखरेख।" },
    ],
    faqEyebrow: "सवाल",
    faqTitle: "भेजने से पहले।",
    sharedFaqs: SHARED_FAQS["hi-IN"],
    faqs: [
      ...SHARED_FAQS["hi-IN"],
      {
        question: "फ़ोन कब आएगा?",
        answer: "हमारी टीम हर जानकारी देखती है और सही काम होने पर आमतौर पर कुछ दिनों में फ़ोन करती है। हर किसी को फ़ोन करना मुमकिन नहीं हो सकता।",
        category: "operations",
      },
      {
        question: "मेरे पास रिज़्यूमे नहीं है, क्या फिर भी भेज सकते हैं?",
        answer: "हाँ। छोटा फ़ॉर्म काफ़ी है। कौन-सा काम आता है, कहाँ रहते हैं और कब से शुरू कर सकते हैं, बताइए।",
        category: "operations",
      },
      {
        question: "काम किन इलाकों में है?",
        answer: "ज़्यादातर सिडकुल औद्योगिक क्षेत्र और पूरे हरिद्वार में, और कुछ काम रुड़की, भगवानपुर और बहादराबाद के आसपास।",
        link: { href: "/hi-in/jobs/haridwar", label: "हरिद्वार में नौकरी" },
        category: "operations",
      },
    ],
  },
  "hi-Latn-IN": {
    title: "SIDCUL Haridwar Vacancy: Factory, Warehouse, ITI Naukri",
    description:
      "SIDCUL Haridwar job. Koi fee nahi. Poori 8 ghante ki shift. Factory, packing, warehouse, housekeeping aur ITI ka kaam. Kuch aasaan sawaal, phir online apply.",
    breadcrumb: { home: "Home", page: "Jobs" },
    eyebrow: "Jobs · SIDCUL Haridwar",
    heading: "SIDCUL Haridwar mein kaam dhoondhein.",
    lede: "Factory, packing, warehouse, housekeeping aur ITI ka kaam.",
    noFee: NO_FEE["hi-Latn-IN"],
    form: {
      steps: {
        files: {
          title: "Photo ya documents jodein",
          hint: "Certificate, ITI, licence, salary slip ya resume.",
          warning: "Aadhaar ya bank ke documents na bhejein.",
        },
        phone: {
          title: "Aapka mobile number",
          placeholder: "98765 43210",
          agree: "Meri umar 18 saal ya usse zyada hai. Vayasya Seva meri jaankari rakh sakti hai aur kaam ke liye mujhse contact kar sakti hai.",
          privacyLink: "Privacy Policy (English mein)",
          keepNote: "Aapke aakhri jawab ke baad hum aapki jaankari 12 mahine tak rakhte hain. Paas ki site par kaam aaye to call karenge. Hatwani ho to help@vayasyaseva.com par likhiye.",
        },
      },
      files: {
        camera: "Photo khichein",
        choose: "File chunein",
        remove: "Hatayein",
        tooLarge: "bahut badi hai",
        wrongType: "nahi bheji ja sakti (photo, PDF ya Word file bhejein)",
        tooMany: "Zyada se zyada 7 files bhej sakte hain.",
      },
      next: "Aage",
      retry: "Phir se bhejein",
      retryNotice: "Isi application ki pushti ke liye phir se bhejein. Aapka reference number:",
      submit: "Bhejein",
      sending: "Bhej rahe hain…",
      sendingFile: (n, total, percent) => `File ${n} / ${total} bhej rahe hain… ${percent}%`,
      errors: {
        phone: "10 digit ka mobile number likhein.",
        agree: "Please box par tick karein: aapki umar 18 saal ya usse zyada hai aur aap contact ke liye sehmat hain.",
        verification: "Kuch second rukiye, phir Bhejein dabaiye.",
        network: "Network toot gaya. Signal dekhkar phir se Bhejein dabaiye.",
        server: "Hamari taraf se kuch gadbad hui. Kuch minute baad phir se try karein.",
        expired: "Form ka samay khatam ho gaya. Please phir se apply karein. Hum application mobile number se milaate hain, isliye dobara bhejna theek hai.",
      },
      done: {
        title: "Mil gaya, dhanyavaad.",
        refLabel: "Aapka reference number",
        body: `Hum yeh reference VAYSPL se SMS karenge. Yeh SMS sambhaal kar rakhiye. Aapke laayak kaam hone par hum aam taur par kuch dinon mein aapke diye mobile number par phone karte hain. ${NO_FEE["hi-Latn-IN"]}`,
        fraud: "Nakli job offer kaise pehchanein",
        again: "Ek aur bhejein",
      },
      labels: { photo: "Photo", document: "Document" },
      prefill: { name: "Naam", work: "Kaunsa kaam chahiye", experience: "Anubhav", location: "Ilaaka", start: "Kab se shuru kar sakte hain" },
    },
    workEyebrow: "Kin kaamon ke liye",
    workHeading: "Hum in kaamon ke liye log rakhte hain.",
    work: [
      { title: "Production helper", text: "Factory ki line par kaam: part lagana, operator ki madad karna.", role: "factory-helper" },
      { title: "Packing", text: "Packing, labelling aur quality check.", role: "packing" },
      { title: "Loading-unloading", text: "Warehouse aur dispatch ka kaam, stacking samet.", role: "warehouse" },
      { title: "Forklift operator", text: "Forklift se loading aur stacking, experienced operators ke liye.", role: "forklift-operator" },
      { title: "Housekeeping", text: "Factory, office, canteen aur campus.", role: "housekeeping" },
      { title: "Machine operator", text: "Jinhe kisi machine ya line par kaam ka experience hai.", role: "machine-operator" },
      { title: "Electrician", text: "Plant maintenance, wiring, motor aur panel.", role: "electrician" },
      { title: "Welder", text: "Arc, MIG aur TIG welding aur gas cutting.", role: "welder" },
      { title: "Fitter", text: "Mechanical maintenance aur machine fitting.", role: "fitter" },
      { title: "Dusre ITI trade", text: "Dusre trade, aur ITI fresher ke liye helper ya trainee ka kaam.", role: "iti-trades" },
      { title: "Data entry operator", text: "Computer par ERP ya SAP mein entry: stores, dispatch aur production.", role: "data-entry-operator" },
      { title: "Supervisor", text: "Shift aur site ki dekhrekh." },
    ],
    faqEyebrow: "Sawaal",
    faqTitle: "Bhejne se pehle.",
    sharedFaqs: SHARED_FAQS["hi-Latn-IN"],
    faqs: [
      ...SHARED_FAQS["hi-Latn-IN"],
      {
        question: "Phone kab aayega?",
        answer: "Hamari team har submission dekhti hai aur sahi kaam hone par aam taur par kuch dinon mein phone karti hai. Har kisi ko phone karna mumkin nahi ho sakta.",
        category: "operations",
      },
      {
        question: "Mere paas resume nahi hai, kya phir bhi bhej sakte hain?",
        answer: "Haan. Chhota form kaafi hai. Kaun-sa kaam aata hai, kahan rehte hain aur kab se shuru kar sakte hain, bataiye.",
        category: "operations",
      },
      {
        question: "Kaam kin areas mein hai?",
        answer: "Zyadatar SIDCUL industrial area aur poore Haridwar mein, aur kuch kaam Roorkee, Bhagwanpur aur Bahadrabad ke aas-paas.",
        link: { href: "/hi-latn-in/jobs/haridwar", label: "Haridwar mein job" },
        category: "operations",
      },
    ],
  },
};
