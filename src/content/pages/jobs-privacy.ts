import type { Locale } from "@/lib/i18n";

/**
 * /jobs/privacy: the applicant notice in plain words, in each jobs
 * language. What we keep, who sees it, how long and how to remove it, then
 * three details. The jobs form's checkbox line links here (opening a new
 * tab, so the form stays put), and this is the one place on the jobs side
 * that talks about data. The English notice (/privacy#job-seekers) keeps
 * the full terms and governs; this page must not promise more than it does.
 * hi-IN, hi-Latn-IN and pa-IN are drafts pending native review.
 */
export interface JobsPrivacyCopy {
  title: string;
  description: string;
  breadcrumb: string;
  heading: string;
  shortLabel: string;
  short: { label: string; text: string }[];
  detailsLabel: string;
  details: { title: string; text: string }[];
  full: string;
  back: string;
}

/** The inbox job seekers already use: siteConfig.email and the privacy notice §10. */
const EMAIL = "help@vayasyaseva.com";

export const jobsPrivacyCopy: Record<Locale, JobsPrivacyCopy> = {
  "en-IN": {
    title: "What Happens to Your Details: Job Applications",
    description: "What we keep when you apply for work with Vayasya Seva, who sees it, how long we keep it and how to have it removed. In plain words, in your language.",
    breadcrumb: "Your details",
    heading: "What happens to your details.",
    shortLabel: "In short",
    short: [
      { label: "What we keep", text: "Your name, mobile number, your answers, and any photos or documents you send." },
      { label: "Who sees it", text: "Our team, and the services that run this site, our files, and our SMS and WhatsApp messages." },
      { label: "How long", text: "12 months after you last reply to us. Then we delete it." },
      { label: "To remove it", text: `Email ${EMAIL} with your mobile number, or tell us when we call.` },
    ],
    detailsLabel: "Details",
    details: [
      {
        title: "What not to send",
        text: "Aadhaar, PAN or bank details. We don't need them to apply. Numbers typed in a message are masked; files are kept as you send them.",
      },
      {
        title: "Automated checks",
        text: "A person reads every application; nothing is decided automatically. A browser check (Cloudflare Turnstile) keeps robots off the form.",
      },
      {
        title: "Who else receives it",
        text: "We don't sell your details or give them to another company. If that ever changes for a job you want, we ask you first. If you came from one of our Google ads, Google learns only that the click led to an application.",
      },
    ],
    full: "Full privacy notice (English)",
    back: "Back to Apply",
  },
  "hi-IN": {
    title: "आपकी जानकारी का क्या होता है: नौकरी का आवेदन",
    description: "नौकरी के आवेदन में हम क्या रखते हैं, कौन देखता है, कितने समय तक रखते हैं और इसे कैसे हटवाएँ।",
    breadcrumb: "आपकी जानकारी",
    heading: "आपकी जानकारी का क्या होता है।",
    shortLabel: "थोड़े में",
    short: [
      { label: "हम क्या रखते हैं", text: "आपका नाम, मोबाइल नंबर, आपके जवाब, और जो फ़ोटो या कागज़ आप भेजें।" },
      { label: "कौन देखता है", text: "हमारी टीम, और वे सेवाएँ जिन पर यह साइट, हमारी फ़ाइलें, और SMS और WhatsApp मैसेज चलते हैं।" },
      { label: "कब तक", text: "आपके आख़िरी जवाब के बाद 12 महीने तक। फिर हम इसे हटा देते हैं।" },
      { label: "हटवाना हो तो", text: `अपने मोबाइल नंबर के साथ ${EMAIL} पर ईमेल करें, या जब हम कॉल करें तब बता दें।` },
    ],
    detailsLabel: "और जानकारी",
    details: [
      {
        title: "क्या न भेजें",
        text: "आधार, PAN या बैंक की जानकारी। आवेदन के लिए इनकी ज़रूरत नहीं। मैसेज में लिखे नंबर छिपा दिए जाते हैं; फ़ाइलें जैसी भेजें, वैसी रहती हैं।",
      },
      {
        title: "मशीन से जाँच",
        text: "हर आवेदन हमारी टीम का कोई व्यक्ति पढ़ता है; कोई फ़ैसला अपने-आप नहीं होता। ब्राउज़र की एक जाँच (Cloudflare Turnstile) फ़ॉर्म को रोबोट से बचाती है।",
      },
      {
        title: "और किसे मिलती है",
        text: "हम आपकी जानकारी बेचते नहीं, न किसी दूसरी कंपनी को देते हैं। किसी नौकरी के लिए ऐसा करना हो, तो पहले आपसे पूछेंगे। अगर आप हमारे Google विज्ञापन से आए हैं, तो Google को सिर्फ़ इतना पता चलता है कि उस क्लिक से आवेदन हुआ।",
      },
    ],
    full: "पूरी गोपनीयता नीति (अंग्रेज़ी में)",
    back: "आवेदन पर वापस जाएँ",
  },
  "hi-Latn-IN": {
    title: "Aapki Jaankari ka Kya Hota Hai: Job Application",
    description: "Vayasya Seva mein job ke liye apply karne par hum kya rakhte hain, kaun dekhta hai, kitne samay tak rakhte hain aur ise kaise hatwayein. Aasaan shabdon mein.",
    breadcrumb: "Aapki jaankari",
    heading: "Aapki jaankari ka kya hota hai.",
    shortLabel: "Thode mein",
    short: [
      { label: "Hum kya rakhte hain", text: "Aapka naam, mobile number, aapke jawab, aur jo photo ya documents aap bhejein." },
      { label: "Kaun dekhta hai", text: "Hamari team, aur woh services jin par yeh site, hamari files, aur SMS aur WhatsApp messages chalte hain." },
      { label: "Kab tak", text: "Aapke aakhri jawab ke baad 12 mahine tak. Phir hum ise hata dete hain." },
      { label: "Hatwana ho to", text: `Apne mobile number ke saath ${EMAIL} par email karein, ya jab hum call karein tab bata dein.` },
    ],
    detailsLabel: "Aur jaankari",
    details: [
      {
        title: "Kya na bhejein",
        text: "Aadhaar, PAN ya bank ki jaankari. Apply karne ke liye inki zaroorat nahi. Message mein likhe number chhupa diye jaate hain; files jaisi bhejein, waisi rehti hain.",
      },
      {
        title: "Machine se jaanch",
        text: "Har application hamari team ka koi vyakti padhta hai; koi faisla apne-aap nahi hota. Browser ki ek jaanch (Cloudflare Turnstile) form ko robots se bachati hai.",
      },
      {
        title: "Aur kise milti hai",
        text: "Hum aapki jaankari bechte nahi, na kisi dusri company ko dete hain. Kisi job ke liye aisa karna ho, to pehle aapse poochhenge. Agar aap hamare Google ad se aaye hain, to Google ko sirf itna pata chalta hai ki us click se application hua.",
      },
    ],
    full: "Poori privacy policy (English mein)",
    back: "Apply par wapas jaayein",
  },
  "pa-IN": {
    title: "ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਦਾ ਕੀ ਹੁੰਦਾ ਹੈ: ਨੌਕਰੀ ਦੀ ਅਰਜ਼ੀ",
    description: "ਨੌਕਰੀ ਦੀ ਅਰਜ਼ੀ ਵਿੱਚ ਅਸੀਂ ਕੀ ਰੱਖਦੇ ਹਾਂ, ਕੌਣ ਵੇਖਦਾ ਹੈ, ਕਿੰਨੇ ਸਮੇਂ ਤੱਕ ਰੱਖਦੇ ਹਾਂ ਅਤੇ ਇਸ ਨੂੰ ਕਿਵੇਂ ਹਟਵਾਈਏ।",
    breadcrumb: "ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ",
    heading: "ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਦਾ ਕੀ ਹੁੰਦਾ ਹੈ।",
    shortLabel: "ਥੋੜ੍ਹੇ ਵਿੱਚ",
    short: [
      { label: "ਅਸੀਂ ਕੀ ਰੱਖਦੇ ਹਾਂ", text: "ਤੁਹਾਡਾ ਨਾਮ, ਮੋਬਾਈਲ ਨੰਬਰ, ਤੁਹਾਡੇ ਜਵਾਬ, ਅਤੇ ਜੋ ਫ਼ੋਟੋ ਜਾਂ ਕਾਗਜ਼ ਤੁਸੀਂ ਭੇਜੋ।" },
      { label: "ਕੌਣ ਵੇਖਦਾ ਹੈ", text: "ਸਾਡੀ ਟੀਮ, ਅਤੇ ਉਹ ਸੇਵਾਵਾਂ ਜਿਨ੍ਹਾਂ 'ਤੇ ਇਹ ਸਾਈਟ, ਸਾਡੀਆਂ ਫ਼ਾਈਲਾਂ, ਅਤੇ SMS ਅਤੇ WhatsApp ਮੈਸੇਜ ਚੱਲਦੇ ਹਨ।" },
      { label: "ਕਦੋਂ ਤੱਕ", text: "ਤੁਹਾਡੇ ਆਖ਼ਰੀ ਜਵਾਬ ਤੋਂ ਬਾਅਦ 12 ਮਹੀਨੇ ਤੱਕ। ਫਿਰ ਅਸੀਂ ਇਸ ਨੂੰ ਹਟਾ ਦਿੰਦੇ ਹਾਂ।" },
      { label: "ਹਟਵਾਉਣਾ ਹੋਵੇ ਤਾਂ", text: `ਆਪਣੇ ਮੋਬਾਈਲ ਨੰਬਰ ਦੇ ਨਾਲ ${EMAIL} 'ਤੇ ਈਮੇਲ ਕਰੋ, ਜਾਂ ਜਦੋਂ ਅਸੀਂ ਕਾਲ ਕਰੀਏ ਤਾਂ ਦੱਸ ਦਿਓ।` },
    ],
    detailsLabel: "ਹੋਰ ਜਾਣਕਾਰੀ",
    details: [
      {
        title: "ਕੀ ਨਾ ਭੇਜੋ",
        text: "ਆਧਾਰ, PAN ਜਾਂ ਬੈਂਕ ਦੀ ਜਾਣਕਾਰੀ। ਅਪਲਾਈ ਕਰਨ ਲਈ ਇਨ੍ਹਾਂ ਦੀ ਲੋੜ ਨਹੀਂ। ਮੈਸੇਜ ਵਿੱਚ ਲਿਖੇ ਨੰਬਰ ਲੁਕਾ ਦਿੱਤੇ ਜਾਂਦੇ ਹਨ; ਫ਼ਾਈਲਾਂ ਜਿਵੇਂ ਭੇਜੋ, ਉਵੇਂ ਹੀ ਰਹਿੰਦੀਆਂ ਹਨ।",
      },
      {
        title: "ਮਸ਼ੀਨ ਨਾਲ ਜਾਂਚ",
        text: "ਹਰ ਅਰਜ਼ੀ ਸਾਡੀ ਟੀਮ ਦਾ ਕੋਈ ਵਿਅਕਤੀ ਪੜ੍ਹਦਾ ਹੈ; ਕੋਈ ਫ਼ੈਸਲਾ ਆਪਣੇ-ਆਪ ਨਹੀਂ ਹੁੰਦਾ। ਬ੍ਰਾਊਜ਼ਰ ਦੀ ਇੱਕ ਜਾਂਚ (Cloudflare Turnstile) ਫ਼ਾਰਮ ਨੂੰ ਰੋਬੋਟਾਂ ਤੋਂ ਬਚਾਉਂਦੀ ਹੈ।",
      },
      {
        title: "ਹੋਰ ਕਿਸ ਨੂੰ ਮਿਲਦੀ ਹੈ",
        text: "ਅਸੀਂ ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਵੇਚਦੇ ਨਹੀਂ ਅਤੇ ਕਿਸੇ ਹੋਰ ਕੰਪਨੀ ਨੂੰ ਨਹੀਂ ਦਿੰਦੇ। ਜੇ ਤੁਹਾਡੀ ਮਨਪਸੰਦ ਨੌਕਰੀ ਲਈ ਕਦੇ ਇਹ ਬਦਲੇ, ਤਾਂ ਅਸੀਂ ਪਹਿਲਾਂ ਤੁਹਾਨੂੰ ਪੁੱਛਾਂਗੇ। ਜੇ ਤੁਸੀਂ ਸਾਡੇ Google ਇਸ਼ਤਿਹਾਰ ਤੋਂ ਆਏ ਹੋ, ਤਾਂ Google ਨੂੰ ਸਿਰਫ਼ ਇਹ ਪਤਾ ਲੱਗਦਾ ਹੈ ਕਿ ਕਲਿੱਕ ਤੋਂ ਅਰਜ਼ੀ ਆਈ।",
      },
    ],
    full: "ਪੂਰਾ ਪ੍ਰਾਈਵੇਸੀ ਨੋਟਿਸ (English)",
    back: "ਅਪਲਾਈ 'ਤੇ ਵਾਪਸ",
  },
  "kn-IN": {
    title: "ನಿಮ್ಮ ಮಾಹಿತಿಗೆ ಏನಾಗುತ್ತದೆ: ಉದ್ಯೋಗ ಅರ್ಜಿ",
    description: "ಉದ್ಯೋಗ ಅರ್ಜಿಯಲ್ಲಿ ನಾವು ಏನು ಇಟ್ಟುಕೊಳ್ಳುತ್ತೇವೆ, ಯಾರು ನೋಡುತ್ತಾರೆ, ಎಷ್ಟು ಕಾಲ ಇಡುತ್ತೇವೆ ಮತ್ತು ಅದನ್ನು ಹೇಗೆ ಅಳಿಸಿಸುವುದು, ಸರಳ ಪದಗಳಲ್ಲಿ, ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ.",
    breadcrumb: "ನಿಮ್ಮ ಮಾಹಿತಿ",
    heading: "ನಿಮ್ಮ ಮಾಹಿತಿಗೆ ಏನಾಗುತ್ತದೆ.",
    shortLabel: "ಸಂಕ್ಷಿಪ್ತವಾಗಿ",
    short: [
      { label: "ನಾವು ಏನು ಇಟ್ಟುಕೊಳ್ಳುತ್ತೇವೆ", text: "ನಿಮ್ಮ ಹೆಸರು, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ, ನಿಮ್ಮ ಉತ್ತರಗಳು, ಮತ್ತು ನೀವು ಕಳುಹಿಸುವ ಫೋಟೋ ಅಥವಾ ದಾಖಲೆಗಳು." },
      { label: "ಯಾರು ನೋಡುತ್ತಾರೆ", text: "ನಮ್ಮ ತಂಡ, ಮತ್ತು ಈ ಸೈಟ್, ನಮ್ಮ ಫೈಲ್‌ಗಳು, ಮತ್ತು SMS ಹಾಗೂ WhatsApp ಸಂದೇಶಗಳನ್ನು ನಡೆಸುವ ಸೇವೆಗಳು." },
      { label: "ಎಷ್ಟು ಕಾಲ", text: "ನೀವು ನಮಗೆ ಕೊನೆಯ ಬಾರಿ ಉತ್ತರಿಸಿದ 12 ತಿಂಗಳವರೆಗೆ. ನಂತರ ನಾವು ಅದನ್ನು ಅಳಿಸುತ್ತೇವೆ." },
      { label: "ಅಳಿಸಲು", text: `ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯೊಂದಿಗೆ ${EMAIL} ಗೆ ಇಮೇಲ್ ಮಾಡಿ, ಅಥವಾ ನಾವು ಕರೆ ಮಾಡಿದಾಗ ತಿಳಿಸಿ.` },
    ],
    detailsLabel: "ಇನ್ನಷ್ಟು ಮಾಹಿತಿ",
    details: [
      { title: "ಏನು ಕಳುಹಿಸಬಾರದು", text: "ಆಧಾರ್, PAN ಅಥವಾ ಬ್ಯಾಂಕ್ ವಿವರಗಳು. ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಅವು ಬೇಕಿಲ್ಲ. ಸಂದೇಶದಲ್ಲಿ ಬರೆದ ಸಂಖ್ಯೆಗಳನ್ನು ಮರೆಮಾಡಲಾಗುತ್ತದೆ; ಫೈಲ್‌ಗಳು ನೀವು ಕಳುಹಿಸಿದಂತೆಯೇ ಉಳಿಯುತ್ತವೆ." },
      { title: "ಸ್ವಯಂಚಾಲಿತ ಪರಿಶೀಲನೆ", text: "ಪ್ರತಿ ಅರ್ಜಿಯನ್ನು ನಮ್ಮ ತಂಡದ ಒಬ್ಬ ವ್ಯಕ್ತಿ ಓದುತ್ತಾರೆ; ಯಾವುದೂ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ನಿರ್ಧಾರವಾಗುವುದಿಲ್ಲ. ಬ್ರೌಸರ್ ಪರಿಶೀಲನೆ (Cloudflare Turnstile) ಫಾರ್ಮ್ ಅನ್ನು ರೋಬೋಟ್‌ಗಳಿಂದ ರಕ್ಷಿಸುತ್ತದೆ." },
      { title: "ಬೇರೆ ಯಾರಿಗೆ ಸಿಗುತ್ತದೆ", text: "ನಾವು ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ಮಾರುವುದಿಲ್ಲ ಅಥವಾ ಬೇರೆ ಕಂಪನಿಗೆ ಕೊಡುವುದಿಲ್ಲ. ನೀವು ಬಯಸುವ ಕೆಲಸಕ್ಕಾಗಿ ಇದು ಎಂದಾದರೂ ಬದಲಾದರೆ, ಮೊದಲು ನಿಮ್ಮನ್ನು ಕೇಳುತ್ತೇವೆ. ನೀವು ನಮ್ಮ Google ಜಾಹೀರಾತಿನಿಂದ ಬಂದಿದ್ದರೆ, ಆ ಕ್ಲಿಕ್‌ನಿಂದ ಅರ್ಜಿ ಬಂತು ಎಂದು ಮಾತ್ರ Google ಗೆ ತಿಳಿಯುತ್ತದೆ." },
    ],
    full: "ಪೂರ್ಣ ಗೌಪ್ಯತಾ ಸೂಚನೆ (English)",
    back: "ಅರ್ಜಿಗೆ ಹಿಂತಿರುಗಿ",
  },
};
