import type { JobsLocale } from "@/lib/i18n";

/**
 * The jobs section's 404 (src/app/[locale]/(jobs)/jobs/not-found.tsx): a
 * job seeker who mistypes a jobs URL stays in their language, with the jobs
 * hub as the way on. hi-IN, hi-Latn-IN, pa-IN and kn-IN are drafts pending
 * native review.
 */
export interface JobsNotFoundCopy {
  title: string;
  heading: string;
  body: string;
  hub: string;
}

export const jobsNotFoundCopy: Record<JobsLocale, JobsNotFoundCopy> = {
  "en-IN": {
    title: "Page not found | Vayasya Seva Jobs",
    heading: "Page not found.",
    body: "There is no jobs page at this address. The link may be mistyped or out of date. The jobs page lists the work we are hiring for.",
    hub: "See jobs",
  },
  "hi-IN": {
    title: "पेज नहीं मिला | Vayasya Seva नौकरी",
    heading: "यह पेज नहीं मिला।",
    body: "इस पते पर नौकरी का कोई पेज नहीं है। लिंक गलत लिखा हो सकता है या पुराना हो सकता है। जिन कामों के लिए भर्ती चल रही है, वे नौकरी वाले पेज पर हैं।",
    hub: "नौकरियाँ देखें",
  },
  "hi-Latn-IN": {
    title: "Page nahin mila | Vayasya Seva Jobs",
    heading: "Ye page nahin mila.",
    body: "Is address par naukri ka koi page nahin hai. Link galat likha ho sakta hai ya purana ho sakta hai. Jin kaamon ke liye bharti chal rahi hai, woh jobs page par hain.",
    hub: "Naukriyan dekhein",
  },
  "pa-IN": {
    title: "ਪੰਨਾ ਨਹੀਂ ਮਿਲਿਆ | Vayasya Seva ਨੌਕਰੀਆਂ",
    heading: "ਇਹ ਪੰਨਾ ਨਹੀਂ ਮਿਲਿਆ।",
    body: "ਇਸ ਪਤੇ 'ਤੇ ਨੌਕਰੀ ਦਾ ਕੋਈ ਪੰਨਾ ਨਹੀਂ ਹੈ। ਲਿੰਕ ਗਲਤ ਲਿਖਿਆ ਹੋ ਸਕਦਾ ਹੈ ਜਾਂ ਪੁਰਾਣਾ ਹੋ ਸਕਦਾ ਹੈ। ਜਿਨ੍ਹਾਂ ਕੰਮਾਂ ਲਈ ਭਰਤੀ ਚੱਲ ਰਹੀ ਹੈ, ਉਹ ਨੌਕਰੀਆਂ ਵਾਲੇ ਪੰਨੇ 'ਤੇ ਹਨ।",
    hub: "ਨੌਕਰੀਆਂ ਵੇਖੋ",
  },
  "kn-IN": {
    title: "ಪುಟ ಸಿಗಲಿಲ್ಲ | Vayasya Seva ಉದ್ಯೋಗಗಳು",
    heading: "ಈ ಪುಟ ಸಿಗಲಿಲ್ಲ.",
    body: "ಈ ವಿಳಾಸದಲ್ಲಿ ಯಾವುದೇ ಉದ್ಯೋಗ ಪುಟವಿಲ್ಲ. ಲಿಂಕ್ ತಪ್ಪಾಗಿ ಟೈಪ್ ಆಗಿರಬಹುದು ಅಥವಾ ಹಳೆಯದಾಗಿರಬಹುದು. ನಾವು ನೇಮಕ ಮಾಡುತ್ತಿರುವ ಕೆಲಸಗಳು ಉದ್ಯೋಗಗಳ ಪುಟದಲ್ಲಿವೆ.",
    hub: "ಉದ್ಯೋಗಗಳನ್ನು ನೋಡಿ",
  },
};
