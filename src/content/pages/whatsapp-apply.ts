import type { Locale } from "@/lib/i18n";
import { NO_FEE } from "@/content/pages/jobs";
import { WHATSAPP_APPLY_NUMBER } from "@/content/whatsapp-apply-number";

/**
 * Applying on WhatsApp (19 Oct 2026). +91 78958 50598 is the apply number:
 * a WhatsApp Business number on Fast2SMS with co-existence, so the same
 * number also runs in the Business app. The site shows it only as a wa.me
 * link labelled "message to apply", never as digits or a tel: link
 * (scripts/check-jobs-phone.mjs): the app still rings for WhatsApp calls and
 * the API cannot turn them off, so every reply also says calls are not
 * answered. The business line (business-contact.ts) stays off every jobs page.
 *
 * The chat itself runs in Windmill (f/talent/whatsapp, talent/lib/whatsapp.ts),
 * which reads this copy, the quick form's questions and answer labels
 * (quick-apply.ts) and the jobs form's consent line (jobs.ts) through
 * integrations/windmill/talent/lib/whatsapp-copy.json, written by
 * `pnpm whatsapp:copy`. pa-IN and kn-IN are drafts pending native review, like
 * the other jobs pages in those languages.
 */
export { WHATSAPP_APPLY_NUMBER };

/** The consent recorded with a WhatsApp application: the chat's own wording, so its own version. */
export const WHATSAPP_CONSENT_VERSION = "2026-10-19-wa1";

/**
 * The code at the end of a prefilled message: [VS|<locale>|<work or trade>|<area>].
 * The chat reads the ids it knows and asks for the rest; the person can edit
 * or delete the text and still apply.
 */
export const PREFILL_TAG = "VS";

export interface WhatsAppApplyCopy {
  /** The link beside the jobs form. */
  link: { label: string; note: string };
  /** The message the link prefills, before the code. */
  greeting: string;
  /** The first reply: who we are, and messages only. */
  welcome: string;
  /** Asked once: 18 or older, and consent (the jobs form's line), with the notice and how to answer. */
  consent: { privacy: string; reply: string };
  declined: string;
  /** How to answer a list: "Reply with the number." */
  pick: { one: string; many: string };
  name: { question: string; skip: string };
  /** A reply the chat cannot read: then the question again. */
  invalid: string;
  /** A voice note, photo or file: kept for the team, then the question again. */
  media: string;
  /** After applying: anything sent later. {ref} is the reference. */
  already: string;
  /** "NEW": answer again. */
  restart: string;
  stopped: string;
  /** Under the confirmation. */
  calls: string;
}

export const whatsappApplyCopy: Record<Locale, WhatsAppApplyCopy> = {
  "en-IN": {
    link: { label: "Apply on WhatsApp", note: "Messages only. This number does not take calls." },
    greeting: "Hello, I want to apply for work.",
    welcome: "Namaste! This chat takes job applications for Vayasya Seva. Messages only: this number does not take calls.",
    consent: { privacy: "How we use your details", reply: "Reply 1 for YES, 2 for NO." },
    declined: "Okay. We have not kept your details. Send any message if you change your mind.",
    pick: { one: "Reply with the number.", many: "Reply with the numbers, for example 1 3." },
    name: { question: "Your name?", skip: "Reply 0 to skip." },
    invalid: "Sorry, we could not read that. Please reply with a number from the list.",
    media: "Thank you, our team will see this. Please also answer the question:",
    already: "We have your application, reference {ref}. If the work fits, we call you. To apply again, send NEW.",
    restart: "Let's start again.",
    stopped: "Okay, we will stop. Send any message to apply later.",
    calls: "This number does not take calls. Our team calls you on this number.",
  },
  "hi-IN": {
    link: { label: "WhatsApp पर आवेदन करें", note: "सिर्फ़ मैसेज। इस नंबर पर कॉल नहीं ली जाती।" },
    greeting: "नमस्ते, मुझे काम के लिए आवेदन करना है।",
    welcome: "नमस्ते! इस चैट में Vayasya Seva के लिए नौकरी के आवेदन लिए जाते हैं। सिर्फ़ मैसेज: इस नंबर पर कॉल नहीं ली जाती।",
    consent: { privacy: "हम आपकी जानकारी कैसे इस्तेमाल करते हैं", reply: "हाँ के लिए 1, ना के लिए 2 भेजें।" },
    declined: "ठीक है। हमने आपकी जानकारी नहीं रखी है। मन बदले तो कोई भी मैसेज भेजें।",
    pick: { one: "नंबर भेजें।", many: "नंबर भेजें, जैसे 1 3।" },
    name: { question: "आपका नाम?", skip: "छोड़ने के लिए 0 भेजें।" },
    invalid: "माफ़ कीजिए, हम समझ नहीं पाए। कृपया सूची में से नंबर भेजें।",
    media: "धन्यवाद, हमारी टीम इसे देखेगी। कृपया सवाल का जवाब भी दीजिए:",
    already: "आपका आवेदन हमारे पास है, रेफ़रेंस {ref}। काम आपके लायक हुआ, तो हम कॉल करेंगे। दोबारा आवेदन के लिए NEW भेजें।",
    restart: "चलिए, फिर से शुरू करते हैं।",
    stopped: "ठीक है, हम रुक जाते हैं। बाद में आवेदन के लिए कोई भी मैसेज भेजें।",
    calls: "इस नंबर पर कॉल नहीं ली जाती। हमारी टीम आपको इसी नंबर पर कॉल करेगी।",
  },
  "hi-Latn-IN": {
    link: { label: "WhatsApp par apply karein", note: "Sirf message. Is number par call nahi li jaati." },
    greeting: "Namaste, mujhe kaam ke liye apply karna hai.",
    welcome: "Namaste! Is chat mein Vayasya Seva ke liye job applications li jaati hain. Sirf message: is number par call nahi li jaati.",
    consent: { privacy: "Hum aapki jaankari kaise use karte hain", reply: "Haan ke liye 1, na ke liye 2 bhejein." },
    declined: "Theek hai. Humne aapki jaankari nahi rakhi hai. Mann badle to koi bhi message bhejein.",
    pick: { one: "Number bhejein.", many: "Number bhejein, jaise 1 3." },
    name: { question: "Aapka naam?", skip: "Chhodne ke liye 0 bhejein." },
    invalid: "Maaf kijiye, hum samajh nahi paaye. Please list mein se number bhejein.",
    media: "Dhanyavaad, hamari team ise dekhegi. Please sawaal ka jawaab bhi dijiye:",
    already: "Aapka application hamare paas hai, reference {ref}. Kaam aapke laayak hua, to hum call karenge. Dobara apply ke liye NEW bhejein.",
    restart: "Chaliye, phir se shuru karte hain.",
    stopped: "Theek hai, hum ruk jaate hain. Baad mein apply ke liye koi bhi message bhejein.",
    calls: "Is number par call nahi li jaati. Hamari team aapko isi number par call karegi.",
  },
  "pa-IN": {
    link: { label: "WhatsApp 'ਤੇ ਅਪਲਾਈ ਕਰੋ", note: "ਸਿਰਫ਼ ਮੈਸੇਜ। ਇਸ ਨੰਬਰ 'ਤੇ ਕਾਲ ਨਹੀਂ ਲਈ ਜਾਂਦੀ।" },
    greeting: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ ਕੰਮ ਲਈ ਅਪਲਾਈ ਕਰਨਾ ਚਾਹੁੰਦਾ/ਚਾਹੁੰਦੀ ਹਾਂ।",
    welcome: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਇਸ ਚੈਟ ਵਿੱਚ Vayasya Seva ਲਈ ਨੌਕਰੀ ਦੀਆਂ ਅਰਜ਼ੀਆਂ ਲਈਆਂ ਜਾਂਦੀਆਂ ਹਨ। ਸਿਰਫ਼ ਮੈਸੇਜ: ਇਸ ਨੰਬਰ 'ਤੇ ਕਾਲ ਨਹੀਂ ਲਈ ਜਾਂਦੀ।",
    consent: { privacy: "ਅਸੀਂ ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਕਿਵੇਂ ਵਰਤਦੇ ਹਾਂ", reply: "ਹਾਂ ਲਈ 1, ਨਾਂਹ ਲਈ 2 ਭੇਜੋ।" },
    declined: "ਠੀਕ ਹੈ। ਅਸੀਂ ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਨਹੀਂ ਰੱਖੀ। ਮਨ ਬਦਲੇ ਤਾਂ ਕੋਈ ਵੀ ਮੈਸੇਜ ਭੇਜੋ।",
    pick: { one: "ਨੰਬਰ ਭੇਜੋ।", many: "ਨੰਬਰ ਭੇਜੋ, ਜਿਵੇਂ 1 3।" },
    name: { question: "ਤੁਹਾਡਾ ਨਾਮ?", skip: "ਛੱਡਣ ਲਈ 0 ਭੇਜੋ।" },
    invalid: "ਮਾਫ਼ ਕਰਨਾ, ਅਸੀਂ ਸਮਝ ਨਹੀਂ ਸਕੇ। ਕਿਰਪਾ ਕਰਕੇ ਸੂਚੀ ਵਿੱਚੋਂ ਨੰਬਰ ਭੇਜੋ।",
    media: "ਧੰਨਵਾਦ, ਸਾਡੀ ਟੀਮ ਇਸ ਨੂੰ ਦੇਖੇਗੀ। ਕਿਰਪਾ ਕਰਕੇ ਸਵਾਲ ਦਾ ਜਵਾਬ ਵੀ ਦਿਓ:",
    already: "ਤੁਹਾਡੀ ਅਰਜ਼ੀ ਸਾਡੇ ਕੋਲ ਹੈ, ਰੈਫ਼ਰੈਂਸ {ref}। ਕੰਮ ਤੁਹਾਡੇ ਲਾਇਕ ਹੋਇਆ ਤਾਂ ਅਸੀਂ ਕਾਲ ਕਰਾਂਗੇ। ਦੁਬਾਰਾ ਅਪਲਾਈ ਕਰਨ ਲਈ NEW ਭੇਜੋ।",
    restart: "ਚਲੋ, ਫਿਰ ਤੋਂ ਸ਼ੁਰੂ ਕਰੀਏ।",
    stopped: "ਠੀਕ ਹੈ, ਅਸੀਂ ਰੁਕ ਜਾਂਦੇ ਹਾਂ। ਬਾਅਦ ਵਿੱਚ ਅਪਲਾਈ ਕਰਨ ਲਈ ਕੋਈ ਵੀ ਮੈਸੇਜ ਭੇਜੋ।",
    calls: "ਇਸ ਨੰਬਰ 'ਤੇ ਕਾਲ ਨਹੀਂ ਲਈ ਜਾਂਦੀ। ਸਾਡੀ ਟੀਮ ਤੁਹਾਨੂੰ ਇਸੇ ਨੰਬਰ 'ਤੇ ਕਾਲ ਕਰੇਗੀ।",
  },
  "kn-IN": {
    link: { label: "WhatsApp ನಲ್ಲಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ", note: "ಮೆಸೇಜ್ ಮಾತ್ರ. ಈ ನಂಬರ್‌ಗೆ ಕರೆಗಳನ್ನು ಸ್ವೀಕರಿಸುವುದಿಲ್ಲ." },
    greeting: "ನಮಸ್ಕಾರ, ನಾನು ಕೆಲಸಕ್ಕೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಬೇಕು.",
    welcome: "ನಮಸ್ಕಾರ! ಈ ಚಾಟ್‌ನಲ್ಲಿ Vayasya Seva ಗಾಗಿ ಕೆಲಸದ ಅರ್ಜಿಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಲಾಗುತ್ತದೆ. ಮೆಸೇಜ್ ಮಾತ್ರ: ಈ ನಂಬರ್‌ಗೆ ಕರೆಗಳನ್ನು ಸ್ವೀಕರಿಸುವುದಿಲ್ಲ.",
    consent: { privacy: "ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ನಾವು ಹೇಗೆ ಬಳಸುತ್ತೇವೆ", reply: "ಹೌದು ಎಂದರೆ 1, ಇಲ್ಲ ಎಂದರೆ 2 ಕಳುಹಿಸಿ." },
    declined: "ಸರಿ. ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ನಾವು ಇಟ್ಟುಕೊಂಡಿಲ್ಲ. ಮನಸ್ಸು ಬದಲಾದರೆ ಯಾವುದೇ ಮೆಸೇಜ್ ಕಳುಹಿಸಿ.",
    pick: { one: "ನಂಬರ್ ಕಳುಹಿಸಿ.", many: "ನಂಬರ್‌ಗಳನ್ನು ಕಳುಹಿಸಿ, ಉದಾಹರಣೆಗೆ 1 3." },
    name: { question: "ನಿಮ್ಮ ಹೆಸರು?", skip: "ಬಿಡಲು 0 ಕಳುಹಿಸಿ." },
    invalid: "ಕ್ಷಮಿಸಿ, ನಮಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಪಟ್ಟಿಯಿಂದ ನಂಬರ್ ಕಳುಹಿಸಿ.",
    media: "ಧನ್ಯವಾದಗಳು, ನಮ್ಮ ತಂಡ ಇದನ್ನು ನೋಡುತ್ತದೆ. ದಯವಿಟ್ಟು ಪ್ರಶ್ನೆಗೂ ಉತ್ತರಿಸಿ:",
    already: "ನಿಮ್ಮ ಅರ್ಜಿ ನಮ್ಮ ಬಳಿ ಇದೆ, ರೆಫರೆನ್ಸ್ {ref}. ಕೆಲಸ ಸರಿಹೊಂದಿದರೆ, ನಾವು ಕರೆ ಮಾಡುತ್ತೇವೆ. ಮತ್ತೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು NEW ಕಳುಹಿಸಿ.",
    restart: "ಮತ್ತೆ ಮೊದಲಿನಿಂದ ಶುರು ಮಾಡೋಣ.",
    stopped: "ಸರಿ, ನಾವು ನಿಲ್ಲಿಸುತ್ತೇವೆ. ನಂತರ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಯಾವುದೇ ಮೆಸೇಜ್ ಕಳುಹಿಸಿ.",
    calls: "ಈ ನಂಬರ್‌ಗೆ ಕರೆಗಳನ್ನು ಸ್ವೀಕರಿಸುವುದಿಲ್ಲ. ನಮ್ಮ ತಂಡ ನಿಮಗೆ ಇದೇ ನಂಬರ್‌ಗೆ ಕರೆ ಮಾಡುತ್ತದೆ.",
  },
};

/** The language question, before a language is known: each choice in its own words. */
export const WHATSAPP_LANGUAGE_MENU: { locale: Locale; label: string }[] = [
  { locale: "en-IN", label: "English" },
  { locale: "hi-IN", label: "हिंदी" },
  { locale: "hi-Latn-IN", label: "Hindi (English letters)" },
  { locale: "pa-IN", label: "ਪੰਜਾਬੀ" },
  { locale: "kn-IN", label: "ಕನ್ನಡ" },
];
export const WHATSAPP_LANGUAGE_PROMPT = "Namaste! Vayasya Seva job applications. Choose your language, reply with the number:";

/** The no-fee line, for the confirmation. */
export const whatsappNoFee = (locale: Locale) => NO_FEE[locale].text;

/** A wa.me link that opens the chat with the greeting and the code filled in. */
export function whatsappApplyHref(locale: Locale, prefill: { work?: string | null; area?: string | null } = {}) {
  const code = [PREFILL_TAG, locale, prefill.work, prefill.area].filter(Boolean).join("|");
  const text = `${whatsappApplyCopy[locale].greeting} [${code}]`;
  return `https://wa.me/${WHATSAPP_APPLY_NUMBER}?text=${encodeURIComponent(text)}`;
}
