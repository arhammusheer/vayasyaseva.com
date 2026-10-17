/**
 * The consent banner's words, per page language (moved verbatim from
 * components/analytics.tsx). Hindi, Hinglish, Kannada and Punjabi strings
 * are drafts for native review, like every hi-IN and hi-Latn-IN string. Two
 * sentences and a link: the detail is the table in the privacy notice (§3,
 * #analytics), which is English only, and the link says so. The sentences
 * keep what the consent version rests on (cookie-free counts, the ad-click
 * report, recordings with typed text, 30-day unsent forms, no remarketing);
 * dropping any of them needs owner or legal sign-off and a consent version
 * bump. Any change here changes the consent fingerprint (ledger.ts).
 */
export const BANNER = {
  "en-IN": {
    label: "Privacy choices",
    question: "Allow additional analytics?",
    more: "Learn more",
    less: "Show less",
    reject: "Required Only",
    accept: "Allow All",
    details:
      "Cookie-free page counts run on every visit, and if you apply for a job after clicking one of our ads, Google Ads learns which click it was unless you choose Required Only. Allow All adds Google Analytics, ad measurement (no remarketing) and recordings of your visit, including what you type in forms; a form you leave unsent is kept 30 days, only to fix the forms.",
    privacy: "How each one works",
    end: ".",
  },
  "hi-IN": {
    label: "गोपनीयता के विकल्प",
    question: "ज़्यादा एनालिटिक्स चालू करें?",
    more: "और जानें",
    less: "कम दिखाएँ",
    reject: "सिर्फ़ ज़रूरी",
    accept: "सब की अनुमति दें",
    details:
      "हर विज़िट पर बिना कुकी वाली पेज गिनती चलती है, और अगर आप हमारे विज्ञापन से आकर आवेदन करते हैं, तो Google Ads को बस यह पता चलता है कि कौन सा क्लिक था (“सिर्फ़ ज़रूरी” चुनने पर यह भी नहीं)। “सब की अनुमति दें” चुनने पर Google Analytics, विज्ञापन की गिनती (रीमार्केटिंग नहीं) और आपकी विज़िट की रिकॉर्डिंग भी चलती है, जिसमें फ़ॉर्म में लिखी बातें भी आती हैं; अधूरा छोड़ा फ़ॉर्म 30 दिन रखा जाता है, सिर्फ़ फ़ॉर्म ठीक करने के लिए।",
    privacy: "हर एक का ब्योरा (अंग्रेज़ी में)",
    end: "।",
  },
  "hi-Latn-IN": {
    label: "Privacy ke vikalp",
    question: "Extra analytics chalu karein?",
    more: "Aur jaanein",
    less: "Kam dikhayein",
    reject: "Sirf zaroori",
    accept: "Sab allow karein",
    details:
      "Har visit par bina cookie wali page ginti chalti hai, aur agar aap hamare ad se aakar apply karte hain, to Google Ads ko bas yeh pata chalta hai ki kaun sa click tha (“Sirf zaroori” chunne par yeh bhi nahi). “Sab allow karein” chunne par Google Analytics, ad ki ginti (remarketing nahi) aur aapki visit ki recording bhi chalti hai, jismein form mein likhi baatein bhi aati hain; adhoora chhoda form 30 din rakha jaata hai, sirf form theek karne ke liye.",
    privacy: "Poori jaankari (English mein)",
    end: ".",
  },
  // Same points as the Hindi text, sentence for sentence (drafts for native review).
  "kn-IN": {
    label: "ಗೌಪ್ಯತೆಯ ಆಯ್ಕೆಗಳು",
    question: "ಹೆಚ್ಚುವರಿ ಅನಾಲಿಟಿಕ್ಸ್ ಆನ್ ಮಾಡಬೇಕೇ?",
    more: "ಇನ್ನಷ್ಟು ತಿಳಿಯಿರಿ",
    less: "ಕಡಿಮೆ ತೋರಿಸಿ",
    reject: "ಅಗತ್ಯವಿರುವುದು ಮಾತ್ರ",
    accept: "ಎಲ್ಲವನ್ನೂ ಅನುಮತಿಸಿ",
    details:
      "ಪ್ರತಿ ಭೇಟಿಯಲ್ಲಿ ಕುಕೀ ಇಲ್ಲದ ಪುಟ ಎಣಿಕೆ ನಡೆಯುತ್ತದೆ, ಮತ್ತು ನೀವು ನಮ್ಮ ಜಾಹೀರಾತಿನಿಂದ ಬಂದು ಅರ್ಜಿ ಸಲ್ಲಿಸಿದರೆ, ಅದು ಯಾವ ಕ್ಲಿಕ್ ಎಂದು ಮಾತ್ರ Google Ads ಗೆ ತಿಳಿಯುತ್ತದೆ (“ಅಗತ್ಯವಿರುವುದು ಮಾತ್ರ” ಆರಿಸಿದರೆ ಅದೂ ಇಲ್ಲ). “ಎಲ್ಲವನ್ನೂ ಅನುಮತಿಸಿ” ಆರಿಸಿದರೆ Google Analytics, ಜಾಹೀರಾತಿನ ಎಣಿಕೆ (ರೀಮಾರ್ಕೆಟಿಂಗ್ ಅಲ್ಲ) ಮತ್ತು ನಿಮ್ಮ ಭೇಟಿಯ ರೆಕಾರ್ಡಿಂಗ್ ಕೂಡ ನಡೆಯುತ್ತದೆ, ಫಾರ್ಮ್‌ನಲ್ಲಿ ನೀವು ಬರೆದದ್ದೂ ಸೇರಿ; ಕಳುಹಿಸದೆ ಬಿಟ್ಟ ಫಾರ್ಮ್ ಅನ್ನು 30 ದಿನ ಇಡಲಾಗುತ್ತದೆ, ಫಾರ್ಮ್‌ಗಳನ್ನು ಸರಿಪಡಿಸಲು ಮಾತ್ರ.",
    privacy: "ಪ್ರತಿಯೊಂದರ ವಿವರ (ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ)",
    end: ".",
  },
  "pa-IN": {
    label: "ਨਿੱਜਤਾ ਦੇ ਵਿਕਲਪ",
    question: "ਹੋਰ ਐਨਾਲਿਟਿਕਸ ਚਾਲੂ ਕਰੀਏ?",
    more: "ਹੋਰ ਜਾਣੋ",
    less: "ਘੱਟ ਵਿਖਾਓ",
    reject: "ਸਿਰਫ਼ ਜ਼ਰੂਰੀ",
    accept: "ਸਭ ਦੀ ਇਜਾਜ਼ਤ ਦਿਓ",
    details:
      "ਹਰ ਵਿਜ਼ਿਟ 'ਤੇ ਬਿਨਾਂ ਕੁਕੀ ਵਾਲੀ ਪੇਜ ਗਿਣਤੀ ਚੱਲਦੀ ਹੈ, ਅਤੇ ਜੇ ਤੁਸੀਂ ਸਾਡੇ ਇਸ਼ਤਿਹਾਰ ਤੋਂ ਆ ਕੇ ਅਪਲਾਈ ਕਰਦੇ ਹੋ, ਤਾਂ Google Ads ਨੂੰ ਬੱਸ ਇਹ ਪਤਾ ਲੱਗਦਾ ਹੈ ਕਿ ਕਿਹੜਾ ਕਲਿੱਕ ਸੀ (“ਸਿਰਫ਼ ਜ਼ਰੂਰੀ” ਚੁਣਨ 'ਤੇ ਇਹ ਵੀ ਨਹੀਂ)। “ਸਭ ਦੀ ਇਜਾਜ਼ਤ ਦਿਓ” ਚੁਣਨ 'ਤੇ Google Analytics, ਇਸ਼ਤਿਹਾਰ ਦੀ ਗਿਣਤੀ (ਰੀਮਾਰਕੀਟਿੰਗ ਨਹੀਂ) ਅਤੇ ਤੁਹਾਡੀ ਵਿਜ਼ਿਟ ਦੀ ਰਿਕਾਰਡਿੰਗ ਵੀ ਚੱਲਦੀ ਹੈ, ਜਿਸ ਵਿੱਚ ਫ਼ਾਰਮ ਵਿੱਚ ਲਿਖੀਆਂ ਗੱਲਾਂ ਵੀ ਆਉਂਦੀਆਂ ਹਨ; ਅਧੂਰਾ ਛੱਡਿਆ ਫ਼ਾਰਮ 30 ਦਿਨ ਰੱਖਿਆ ਜਾਂਦਾ ਹੈ, ਸਿਰਫ਼ ਫ਼ਾਰਮ ਠੀਕ ਕਰਨ ਲਈ।",
    privacy: "ਹਰ ਇੱਕ ਦਾ ਵੇਰਵਾ (ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ)",
    end: "।",
  },
} as const;

export type BannerLocale = keyof typeof BANNER;
export type BannerCopy = (typeof BANNER)[BannerLocale];

/** The banner's words for a page language; English for any other. */
export const bannerCopy = (locale: string): BannerCopy => BANNER[locale as BannerLocale] ?? BANNER["en-IN"];
