import type { JobRole } from "@/lib/talent-intake/rules";
import type { Locale } from "@/lib/i18n";

/** Strings the jobs form shows while it works (client component). */
export interface JobsFormCopy {
  steps: {
    files: { title: string; hint: string; warning: string };
    /**
     * One checkbox: 18 or older, and consent to be contacted. `keep` and
     * `details` are the one line beside it: retention, and a link to
     * /jobs/privacy that opens in a new tab so the form stays put.
     */
    phone: { title: string; placeholder: string; agree: string; keep: string; details: string };
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
  /** `fraud`: the link to the fees and fraud page under the confirmation (the form's no-fee line is gone by then). */
  done: { title: string; refLabel: string; body: string; fraud: string; again: string };
  labels: { photo: string; document: string };
  /** Labels for details filled in from a prefilled link (src/lib/prefill.ts). */
  prefill: { name: string; work: string; experience: string; location: string; start: string };
}

export interface JobsCopy {
  title: string;
  description: string;
  /** The page's breadcrumb name (the trail comes from src/lib/breadcrumbs.ts). */
  breadcrumb: string;
  /** The share image's label only: the page itself has no eyebrow. */
  eyebrow: string;
  heading: string;
  lede: string;
  apply: string;
  /** The label over the list of markets (every jobs hub, the visitor's first). */
  markets: string;
  form: JobsFormCopy;
  /** Role names, as the /jobs groups and related-role rows show them. */
  work: { title: string; role: JobRole }[];
  /** The labelled line under the groups: "Who can apply". */
  who: string;
}

/**
 * The four work groups on /jobs, by the #id the jobs menu links to
 * (JOB_GROUPS in src/components/layout/nav-links.ts holds their labels).
 */
export type JobGroupId = "helper" | "machine" | "iti" | "office";
export const JOB_GROUP_ROLES: Record<JobGroupId, JobRole[]> = {
  helper: ["factory-helper", "packing", "warehouse", "housekeeping"],
  machine: ["machine-operator", "forklift-operator"],
  iti: ["electrician", "welder", "fitter", "iti-trades"],
  office: ["data-entry-operator"],
};

/**
 * The no-fee line (PLAN §5.3): the jobs form's footer, the one in-page
 * no-fee mention on a jobs page, linking /jobs/fees-and-fraud. `link` is
 * the same label the done screen uses.
 */
export const NO_FEE: Record<Locale, { text: string; link: string }> = {
  "en-IN": { text: "No fee to apply.", link: "Spot a fake offer" },
  "hi-IN": { text: "आवेदन की कोई फ़ीस नहीं।", link: "नकली ऑफ़र पहचानें" },
  "hi-Latn-IN": { text: "Apply ki koi fee nahi.", link: "Nakli offer pehchanein" },
  "pa-IN": { text: "ਅਪਲਾਈ ਕਰਨ ਦੀ ਕੋਈ ਫ਼ੀਸ ਨਹੀਂ।", link: "ਨਕਲੀ ਆਫ਼ਰ ਪਛਾਣੋ" },
  "kn-IN": { text: "ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಯಾವುದೇ ಶುಲ್ಕವಿಲ್ಲ.", link: "ನಕಲಿ ಆಫರ್ ಗುರುತಿಸಿ" },
};

/** Work is shift-wise only: say so plainly (owner, 16 October 2026). The form's header line. */
export const SHIFTS_LINE: Record<Locale, string> = {
  "en-IN": "Work is in full 8-hour shifts. There is no part-time work.",
  "hi-IN": "काम पूरी 8 घंटे की शिफ्ट में होता है। पार्ट-टाइम काम नहीं है।",
  "hi-Latn-IN": "Kaam poori 8 ghante ki shift mein hota hai. Part-time kaam nahi hai.",
  "pa-IN": "ਕੰਮ ਪੂਰੀ 8 ਘੰਟੇ ਦੀ ਸ਼ਿਫ਼ਟ ਵਿੱਚ ਹੁੰਦਾ ਹੈ। ਪਾਰਟ-ਟਾਈਮ ਕੰਮ ਨਹੀਂ ਹੈ।",
  "kn-IN": "ಕೆಲಸ ಪೂರ್ಣ 8 ಗಂಟೆಗಳ ಶಿಫ್ಟ್‌ನಲ್ಲಿ ಇರುತ್ತದೆ. ಪಾರ್ಟ್-ಟೈಮ್ ಕೆಲಸ ಇಲ್ಲ.",
};

/**
 * /jobs in every locale, and the jobs form's strings. /jobs is a router:
 * Apply (to the visitor's market, else /jobs/apply), every market, the four
 * work groups and Who can apply. No market is named first (owner direction,
 * 17 Oct 2026); the title and description list them alphabetically. It had
 * about 60 search impressions a month before the change. hi-IN is the page most job seekers use; en-IN and hi-Latn-IN
 * mirror it. hi-IN, hi-Latn-IN and pa-IN are drafts pending native review;
 * /jobs itself is not built in pa-IN, but its form strings are used on the
 * Punjabi jobs pages.
 * Claims discipline: no promised call-back times, no guarantees of work.
 */
export const jobsCopy: Record<Locale, JobsCopy> = {
  "en-IN": {
    title: "Factory, Packing and Warehouse Jobs: No Fee to Apply",
    description:
      "Factory, packing and warehouse work in Bengaluru, Dehradun, Haridwar, Jalandhar–Kapurthala, Punjab and Uttarakhand. No fee, full 8-hour shifts. Apply online.",
    breadcrumb: "Jobs",
    eyebrow: "JOBS",
    heading: "Find factory and warehouse work.",
    lede: "Factory, packing, warehouse, housekeeping and ITI work.",
    apply: "Apply now",
    markets: "Where do you want to work?",
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
          keep: "We keep your details for 12 months.",
          details: "Details",
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
        body: "We will SMS this reference from VAYSPL. Keep the SMS. If the work fits, we call you.",
        fraud: NO_FEE["en-IN"].link,
        again: "Send another",
      },
      labels: { photo: "Photo", document: "Document" },
      prefill: { name: "Name", work: "Work I want", experience: "Experience", location: "Area", start: "Can start" },
    },
    work: [
      { title: "Production helper", role: "factory-helper" },
      { title: "Packing", role: "packing" },
      { title: "Loading and unloading", role: "warehouse" },
      { title: "Housekeeping", role: "housekeeping" },
      { title: "Machine operator", role: "machine-operator" },
      { title: "Forklift operator", role: "forklift-operator" },
      { title: "Electrician", role: "electrician" },
      { title: "Welder", role: "welder" },
      { title: "Fitter", role: "fitter" },
      { title: "Other ITI trades", role: "iti-trades" },
      { title: "Data entry operator", role: "data-entry-operator" },
    ],
    who: "Who can apply",
  },
  "hi-IN": {
    title: "फ़ैक्टरी, पैकिंग और वेयरहाउस की नौकरी: आवेदन की कोई फ़ीस नहीं",
    description:
      "बेंगलुरु, देहरादून, हरिद्वार, जालंधर–कपूरथला, पंजाब और उत्तराखंड में फ़ैक्टरी, पैकिंग और वेयरहाउस का काम। कोई फ़ीस नहीं, पूरी 8 घंटे की शिफ्ट। ऑनलाइन आवेदन करें।",
    breadcrumb: "नौकरी",
    eyebrow: "नौकरी",
    heading: "फ़ैक्टरी और वेयरहाउस का काम ढूँढें।",
    lede: "फ़ैक्टरी, पैकिंग, वेयरहाउस, हाउसकीपिंग और ITI का काम।",
    apply: "आवेदन करें",
    markets: "आप कहाँ काम करना चाहते हैं?",
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
          keep: "हम आपकी जानकारी 12 महीने तक रखते हैं।",
          details: "पूरी जानकारी",
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
        body: "हम यह रेफ़रेंस VAYSPL से SMS करेंगे। यह SMS संभालकर रखिए। काम आपके लायक हुआ, तो हम कॉल करेंगे।",
        fraud: NO_FEE["hi-IN"].link,
        again: "एक और भेजें",
      },
      labels: { photo: "फ़ोटो", document: "कागज़" },
      prefill: { name: "नाम", work: "कौन-सा काम चाहिए", experience: "अनुभव", location: "इलाका", start: "कब से शुरू कर सकते हैं" },
    },
    work: [
      { title: "प्रोडक्शन हेल्पर", role: "factory-helper" },
      { title: "पैकिंग", role: "packing" },
      { title: "लोडिंग-अनलोडिंग", role: "warehouse" },
      { title: "हाउसकीपिंग", role: "housekeeping" },
      { title: "मशीन ऑपरेटर", role: "machine-operator" },
      { title: "फ़ोर्कलिफ़्ट ऑपरेटर", role: "forklift-operator" },
      { title: "इलेक्ट्रीशियन", role: "electrician" },
      { title: "वेल्डर", role: "welder" },
      { title: "फ़िटर", role: "fitter" },
      { title: "दूसरे ITI ट्रेड", role: "iti-trades" },
      { title: "डेटा एंट्री ऑपरेटर", role: "data-entry-operator" },
    ],
    who: "कौन आवेदन कर सकता है",
  },
  "hi-Latn-IN": {
    title: "Factory, Packing, Warehouse Job: Apply ki Koi Fee Nahi",
    description:
      "Bengaluru, Dehradun, Haridwar, Jalandhar–Kapurthala, Punjab aur Uttarakhand mein factory, packing aur warehouse ka kaam. Koi fee nahi, 8 ghante ki shift.",
    breadcrumb: "Jobs",
    eyebrow: "Jobs",
    heading: "Factory aur warehouse ka kaam dhoondhein.",
    lede: "Factory, packing, warehouse, housekeeping aur ITI ka kaam.",
    apply: "Apply karein",
    markets: "Aap kahan kaam karna chahte hain?",
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
          keep: "Hum aapki jaankari 12 mahine tak rakhte hain.",
          details: "Poori jaankari",
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
        body: "Hum yeh reference VAYSPL se SMS karenge. Yeh SMS sambhaal kar rakhiye. Kaam aapke laayak hua, to hum call karenge.",
        fraud: NO_FEE["hi-Latn-IN"].link,
        again: "Ek aur bhejein",
      },
      labels: { photo: "Photo", document: "Document" },
      prefill: { name: "Naam", work: "Kaunsa kaam chahiye", experience: "Anubhav", location: "Ilaaka", start: "Kab se shuru kar sakte hain" },
    },
    work: [
      { title: "Production helper", role: "factory-helper" },
      { title: "Packing", role: "packing" },
      { title: "Loading-unloading", role: "warehouse" },
      { title: "Housekeeping", role: "housekeeping" },
      { title: "Machine operator", role: "machine-operator" },
      { title: "Forklift operator", role: "forklift-operator" },
      { title: "Electrician", role: "electrician" },
      { title: "Welder", role: "welder" },
      { title: "Fitter", role: "fitter" },
      { title: "Dusre ITI trade", role: "iti-trades" },
      { title: "Data entry operator", role: "data-entry-operator" },
    ],
    who: "Kaun apply kar sakta hai",
  },
  "pa-IN": {
    title: "ਫ਼ੈਕਟਰੀ, ਪੈਕਿੰਗ ਅਤੇ ਵੇਅਰਹਾਊਸ ਦੀ ਨੌਕਰੀ: ਕੋਈ ਫ਼ੀਸ ਨਹੀਂ",
    description:
      "ਬੈਂਗਲੁਰੂ, ਦੇਹਰਾਦੂਨ, ਹਰਿਦੁਆਰ, ਜਲੰਧਰ–ਕਪੂਰਥਲਾ, ਪੰਜਾਬ ਅਤੇ ਉੱਤਰਾਖੰਡ ਵਿੱਚ ਫ਼ੈਕਟਰੀ, ਪੈਕਿੰਗ ਅਤੇ ਵੇਅਰਹਾਊਸ ਦਾ ਕੰਮ। ਕੋਈ ਫ਼ੀਸ ਨਹੀਂ, ਪੂਰੀ 8 ਘੰਟੇ ਦੀ ਸ਼ਿਫ਼ਟ। ਆਨਲਾਈਨ ਅਪਲਾਈ ਕਰੋ।",
    breadcrumb: "ਨੌਕਰੀਆਂ",
    eyebrow: "ਨੌਕਰੀ",
    heading: "ਫ਼ੈਕਟਰੀ ਅਤੇ ਵੇਅਰਹਾਊਸ ਦਾ ਕੰਮ ਲੱਭੋ।",
    lede: "ਫ਼ੈਕਟਰੀ, ਪੈਕਿੰਗ, ਵੇਅਰਹਾਊਸ, ਹਾਊਸਕੀਪਿੰਗ ਅਤੇ ITI ਦਾ ਕੰਮ।",
    apply: "ਅਪਲਾਈ ਕਰੋ",
    markets: "ਤੁਸੀਂ ਕਿੱਥੇ ਕੰਮ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?",
    form: {
      steps: {
        files: {
          title: "ਫ਼ੋਟੋ ਜਾਂ ਕਾਗਜ਼ ਜੋੜੋ",
          hint: "ਸਰਟੀਫ਼ਿਕੇਟ, ITI, ਲਾਇਸੈਂਸ, ਸੈਲਰੀ ਸਲਿੱਪ ਜਾਂ ਰਿਜ਼ਿਊਮ।",
          warning: "ਆਧਾਰ ਜਾਂ ਬੈਂਕ ਦੇ ਕਾਗਜ਼ ਨਾ ਭੇਜੋ।",
        },
        phone: {
          title: "ਤੁਹਾਡਾ ਮੋਬਾਈਲ ਨੰਬਰ",
          placeholder: "98765 43210",
          agree: "ਮੇਰੀ ਉਮਰ 18 ਸਾਲ ਜਾਂ ਇਸ ਤੋਂ ਵੱਧ ਹੈ। Vayasya Seva ਮੇਰੀ ਜਾਣਕਾਰੀ ਰੱਖ ਸਕਦੀ ਹੈ ਅਤੇ ਕੰਮ ਲਈ ਮੇਰੇ ਨਾਲ ਸੰਪਰਕ ਕਰ ਸਕਦੀ ਹੈ।",
          keep: "ਅਸੀਂ ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ 12 ਮਹੀਨੇ ਤੱਕ ਰੱਖਦੇ ਹਾਂ।",
          details: "ਪੂਰੀ ਜਾਣਕਾਰੀ",
        },
      },
      files: {
        camera: "ਫ਼ੋਟੋ ਖਿੱਚੋ",
        choose: "ਫ਼ਾਈਲ ਚੁਣੋ",
        remove: "ਹਟਾਓ",
        tooLarge: "ਬਹੁਤ ਵੱਡੀ ਹੈ",
        wrongType: "ਨਹੀਂ ਭੇਜੀ ਜਾ ਸਕਦੀ (ਫ਼ੋਟੋ, PDF ਜਾਂ Word ਫ਼ਾਈਲ ਭੇਜੋ)",
        tooMany: "ਵੱਧ ਤੋਂ ਵੱਧ 7 ਫ਼ਾਈਲਾਂ ਭੇਜ ਸਕਦੇ ਹੋ।",
      },
      next: "ਅੱਗੇ",
      retry: "ਦੁਬਾਰਾ ਭੇਜੋ",
      retryNotice: "ਇਸ ਅਰਜ਼ੀ ਦੀ ਪੁਸ਼ਟੀ ਲਈ ਦੁਬਾਰਾ ਭੇਜੋ। ਤੁਹਾਡਾ ਰੈਫ਼ਰੈਂਸ ਨੰਬਰ:",
      submit: "ਭੇਜੋ",
      sending: "ਭੇਜ ਰਹੇ ਹਾਂ…",
      sendingFile: (n, total, percent) => `ਫ਼ਾਈਲ ${n} / ${total} ਭੇਜ ਰਹੇ ਹਾਂ… ${percent}%`,
      errors: {
        phone: "10 ਅੰਕਾਂ ਦਾ ਮੋਬਾਈਲ ਨੰਬਰ ਲਿਖੋ।",
        agree: "ਕਿਰਪਾ ਕਰਕੇ ਬਾਕਸ 'ਤੇ ਟਿੱਕ ਕਰੋ: ਤੁਹਾਡੀ ਉਮਰ 18 ਸਾਲ ਜਾਂ ਵੱਧ ਹੈ ਅਤੇ ਤੁਸੀਂ ਸੰਪਰਕ ਲਈ ਸਹਿਮਤ ਹੋ।",
        verification: "ਕੁਝ ਸਕਿੰਟ ਰੁਕੋ, ਫਿਰ ਦੁਬਾਰਾ ਭੇਜੋ ਦਬਾਓ।",
        network: "ਨੈੱਟਵਰਕ ਟੁੱਟ ਗਿਆ। ਸਿਗਨਲ ਵੇਖ ਕੇ ਦੁਬਾਰਾ ਭੇਜੋ ਦਬਾਓ।",
        server: "ਸਾਡੇ ਵੱਲੋਂ ਕੁਝ ਗੜਬੜ ਹੋ ਗਈ। ਕੁਝ ਮਿੰਟਾਂ ਬਾਅਦ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
        expired: "ਫ਼ਾਰਮ ਦਾ ਸਮਾਂ ਖ਼ਤਮ ਹੋ ਗਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਅਪਲਾਈ ਕਰੋ। ਅਸੀਂ ਅਰਜ਼ੀਆਂ ਮੋਬਾਈਲ ਨੰਬਰ ਨਾਲ ਮਿਲਾਉਂਦੇ ਹਾਂ, ਇਸ ਲਈ ਦੋ ਵਾਰ ਭੇਜਣਾ ਠੀਕ ਹੈ।",
      },
      done: {
        title: "ਮਿਲ ਗਿਆ, ਧੰਨਵਾਦ।",
        refLabel: "ਤੁਹਾਡਾ ਰੈਫ਼ਰੈਂਸ ਨੰਬਰ",
        body: "ਅਸੀਂ ਇਹ ਰੈਫ਼ਰੈਂਸ VAYSPL ਤੋਂ SMS ਕਰਾਂਗੇ। ਇਹ SMS ਸੰਭਾਲ ਕੇ ਰੱਖੋ। ਕੰਮ ਤੁਹਾਡੇ ਲਾਇਕ ਹੋਇਆ ਤਾਂ ਅਸੀਂ ਕਾਲ ਕਰਾਂਗੇ।",
        fraud: NO_FEE["pa-IN"].link,
        again: "ਇੱਕ ਹੋਰ ਭੇਜੋ",
      },
      labels: { photo: "ਫ਼ੋਟੋ", document: "ਕਾਗਜ਼" },
      prefill: { name: "ਨਾਮ", work: "ਕਿਹੜਾ ਕੰਮ ਚਾਹੀਦਾ ਹੈ", experience: "ਤਜਰਬਾ", location: "ਇਲਾਕਾ", start: "ਕਦੋਂ ਤੋਂ ਸ਼ੁਰੂ ਕਰ ਸਕਦੇ ਹੋ" },
    },
    work: [
      { title: "ਪ੍ਰੋਡਕਸ਼ਨ ਹੈਲਪਰ", role: "factory-helper" },
      { title: "ਪੈਕਿੰਗ", role: "packing" },
      { title: "ਲੋਡਿੰਗ-ਅਨਲੋਡਿੰਗ", role: "warehouse" },
      { title: "ਹਾਊਸਕੀਪਿੰਗ", role: "housekeeping" },
      { title: "ਮਸ਼ੀਨ ਆਪਰੇਟਰ", role: "machine-operator" },
      { title: "ਫ਼ੋਰਕਲਿਫ਼ਟ ਆਪਰੇਟਰ", role: "forklift-operator" },
      { title: "ਇਲੈਕਟ੍ਰੀਸ਼ੀਅਨ", role: "electrician" },
      { title: "ਵੈਲਡਰ", role: "welder" },
      { title: "ਫ਼ਿਟਰ", role: "fitter" },
      { title: "ਹੋਰ ITI ਟ੍ਰੇਡ", role: "iti-trades" },
      { title: "ਡਾਟਾ ਐਂਟਰੀ ਆਪਰੇਟਰ", role: "data-entry-operator" },
    ],
    who: "ਕੌਣ ਅਪਲਾਈ ਕਰ ਸਕਦਾ ਹੈ",
  },
  "kn-IN": {
    title: "ಫ್ಯಾಕ್ಟರಿ ಮತ್ತು ವೇರ್‌ಹೌಸ್ ಉದ್ಯೋಗಗಳು: ಶುಲ್ಕವಿಲ್ಲ",
    description:
      "ಬೆಂಗಳೂರು, ಡೆಹ್ರಾಡೂನ್, ಹರಿದ್ವಾರ, ಜಲಂಧರ್–ಕಪೂರ್ಥಲಾ, ಪಂಜಾಬ್ ಮತ್ತು ಉತ್ತರಾಖಂಡದಲ್ಲಿ ಫ್ಯಾಕ್ಟರಿ, ಪ್ಯಾಕಿಂಗ್ ಮತ್ತು ವೇರ್‌ಹೌಸ್ ಕೆಲಸ. ಯಾವುದೇ ಶುಲ್ಕವಿಲ್ಲ, 8 ಗಂಟೆಗಳ ಶಿಫ್ಟ್.",
    breadcrumb: "ಉದ್ಯೋಗಗಳು",
    eyebrow: "ಉದ್ಯೋಗಗಳು",
    heading: "ಫ್ಯಾಕ್ಟರಿ ಮತ್ತು ವೇರ್‌ಹೌಸ್ ಕೆಲಸ ಹುಡುಕಿ.",
    lede: "ಫ್ಯಾಕ್ಟರಿ, ಪ್ಯಾಕಿಂಗ್, ವೇರ್‌ಹೌಸ್, ಹೌಸ್‌ಕೀಪಿಂಗ್ ಮತ್ತು ITI ಕೆಲಸ.",
    apply: "ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
    markets: "ನೀವು ಎಲ್ಲಿ ಕೆಲಸ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?",
    form: {
      steps: {
        files: {
          title: "ಫೋಟೋ ಅಥವಾ ದಾಖಲೆಗಳನ್ನು ಸೇರಿಸಿ",
          hint: "ಪ್ರಮಾಣಪತ್ರಗಳು, ITI, ಲೈಸೆನ್ಸ್, ಸಂಬಳದ ಚೀಟಿ ಅಥವಾ ರೆಸ್ಯೂಮೆ.",
          warning: "ಆಧಾರ್ ಅಥವಾ ಬ್ಯಾಂಕ್ ದಾಖಲೆಗಳನ್ನು ಕಳುಹಿಸಬೇಡಿ.",
        },
        phone: {
          title: "ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
          placeholder: "98765 43210",
          agree: "ನನಗೆ 18 ವರ್ಷ ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚು. Vayasya Seva ನನ್ನ ಮಾಹಿತಿಯನ್ನು ಇಟ್ಟುಕೊಂಡು ಕೆಲಸದ ಬಗ್ಗೆ ನನ್ನನ್ನು ಸಂಪರ್ಕಿಸಬಹುದು.",
          keep: "ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ನಾವು 12 ತಿಂಗಳು ಇಟ್ಟುಕೊಳ್ಳುತ್ತೇವೆ.",
          details: "ಪೂರ್ಣ ಮಾಹಿತಿ",
        },
      },
      files: {
        camera: "ಫೋಟೋ ತೆಗೆಯಿರಿ",
        choose: "ಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ",
        remove: "ತೆಗೆದುಹಾಕಿ",
        tooLarge: "ತುಂಬಾ ದೊಡ್ಡದಾಗಿದೆ",
        wrongType: "ಕಳುಹಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ (ಫೋಟೋ, PDF ಅಥವಾ Word ಫೈಲ್ ಕಳುಹಿಸಿ)",
        tooMany: "ಗರಿಷ್ಠ 7 ಫೈಲ್‌ಗಳನ್ನು ಕಳುಹಿಸಬಹುದು.",
      },
      next: "ಮುಂದೆ",
      retry: "ಮತ್ತೆ ಕಳುಹಿಸಿ",
      retryNotice: "ಈ ಅರ್ಜಿಯನ್ನು ಖಚಿತಪಡಿಸಲು ಮತ್ತೆ ಕಳುಹಿಸಿ. ನಿಮ್ಮ ರೆಫರೆನ್ಸ್ ಸಂಖ್ಯೆ:",
      submit: "ಕಳುಹಿಸಿ",
      sending: "ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ…",
      sendingFile: (n, total, percent) => `ಫೈಲ್ ${n} / ${total} ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ… ${percent}%`,
      errors: {
        phone: "10 ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಬರೆಯಿರಿ.",
        agree: "ದಯವಿಟ್ಟು ಬಾಕ್ಸ್ ಟಿಕ್ ಮಾಡಿ: ನಿಮಗೆ 18 ವರ್ಷ ಅಥವಾ ಹೆಚ್ಚು, ಮತ್ತು ನಾವು ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಲು ನೀವು ಒಪ್ಪುತ್ತೀರಿ.",
        verification: "ಕೆಲವು ಸೆಕೆಂಡುಗಳು ಕಾಯಿರಿ, ನಂತರ ಮತ್ತೆ ಕಳುಹಿಸಿ ಒತ್ತಿರಿ.",
        network: "ಸಂಪರ್ಕ ಕಡಿತವಾಯಿತು. ಸಿಗ್ನಲ್ ನೋಡಿ, ಮತ್ತೆ ಕಳುಹಿಸಿ ಒತ್ತಿರಿ.",
        server: "ನಮ್ಮ ಕಡೆ ಏನೋ ತಪ್ಪಾಗಿದೆ. ಕೆಲವು ನಿಮಿಷಗಳ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
        expired: "ಫಾರ್ಮ್‌ನ ಸಮಯ ಮುಗಿದಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ. ನಾವು ಅರ್ಜಿಗಳನ್ನು ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯಿಂದ ಹೊಂದಿಸುತ್ತೇವೆ, ಹಾಗಾಗಿ ಎರಡು ಬಾರಿ ಕಳುಹಿಸಿದರೂ ಪರವಾಗಿಲ್ಲ.",
      },
      done: {
        title: "ಸ್ವೀಕರಿಸಲಾಗಿದೆ, ಧನ್ಯವಾದಗಳು.",
        refLabel: "ನಿಮ್ಮ ರೆಫರೆನ್ಸ್ ಸಂಖ್ಯೆ",
        body: "ಈ ರೆಫರೆನ್ಸ್ ಅನ್ನು ನಾವು VAYSPL ಇಂದ SMS ಮಾಡುತ್ತೇವೆ. ಆ SMS ಅನ್ನು ಉಳಿಸಿಕೊಳ್ಳಿ. ಕೆಲಸ ಸರಿಹೊಂದಿದರೆ, ನಾವು ಕರೆ ಮಾಡುತ್ತೇವೆ.",
        fraud: NO_FEE["kn-IN"].link,
        again: "ಇನ್ನೊಂದು ಕಳುಹಿಸಿ",
      },
      labels: { photo: "ಫೋಟೋ", document: "ದಾಖಲೆ" },
      prefill: { name: "ಹೆಸರು", work: "ಬೇಕಾದ ಕೆಲಸ", experience: "ಅನುಭವ", location: "ಪ್ರದೇಶ", start: "ಯಾವಾಗ ಸೇರಬಹುದು" },
    },
    work: [
      { title: "ಪ್ರೊಡಕ್ಷನ್ ಹೆಲ್ಪರ್", role: "factory-helper" },
      { title: "ಪ್ಯಾಕಿಂಗ್", role: "packing" },
      { title: "ಲೋಡಿಂಗ್ ಮತ್ತು ಅನ್‌ಲೋಡಿಂಗ್", role: "warehouse" },
      { title: "ಹೌಸ್‌ಕೀಪಿಂಗ್", role: "housekeeping" },
      { title: "ಮೆಷಿನ್ ಆಪರೇಟರ್", role: "machine-operator" },
      { title: "ಫೋರ್ಕ್‌ಲಿಫ್ಟ್ ಆಪರೇಟರ್", role: "forklift-operator" },
      { title: "ಎಲೆಕ್ಟ್ರಿಷಿಯನ್", role: "electrician" },
      { title: "ವೆಲ್ಡರ್", role: "welder" },
      { title: "ಫಿಟ್ಟರ್", role: "fitter" },
      { title: "ಇತರ ITI ಟ್ರೇಡ್‌ಗಳು", role: "iti-trades" },
      { title: "ಡೇಟಾ ಎಂಟ್ರಿ ಆಪರೇಟರ್", role: "data-entry-operator" },
    ],
    who: "ಯಾರು ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು",
  },
};
