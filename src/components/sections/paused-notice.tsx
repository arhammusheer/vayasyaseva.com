import Link from "@/components/i18n/link";
import { ArrowRight } from "lucide-react";
import { localePath, type Locale } from "@/lib/i18n";

/**
 * The paused notice (PLAN §1a, §8.3). A person sets a cluster's hub to
 * `paused` in src/content/registry/pages.ts when callbacks fall behind; the
 * page stays up (noindex) and says so plainly. Jobs hubs send people to the
 * national form at /jobs/apply instead of their own form; buyer hubs keep the
 * Request a crew door. Hindi and Hinglish are drafts for native review.
 */
const COPY = {
  jobs: {
    "en-IN": {
      heading: "We’re not taking applications for this area right now.",
      text: "You can still apply on our main form. We keep your details and call when there is work.",
      link: "Apply on the main form",
    },
    "hi-IN": {
      heading: "अभी हम इस इलाके के लिए फ़ॉर्म नहीं ले रहे हैं।",
      text: "आप फिर भी हमारे मेन फ़ॉर्म पर अप्लाई कर सकते हैं। हम आपकी जानकारी रखते हैं और काम आने पर फ़ोन करते हैं।",
      link: "मेन फ़ॉर्म पर अप्लाई करें",
    },
    "hi-Latn-IN": {
      heading: "Abhi hum is area ke liye applications nahi le rahe hain.",
      text: "Aap hamare main form par apply kar sakte hain. Hum aapki jaankari rakhte hain aur kaam aane par phone karte hain.",
      link: "Main form par apply karein",
    },
    "kn-IN": {
      heading: "ಈಗ ಈ ಪ್ರದೇಶಕ್ಕೆ ನಾವು ಅರ್ಜಿ ತೆಗೆದುಕೊಳ್ಳುತ್ತಿಲ್ಲ.",
      text: "ನೀವು ನಮ್ಮ ಮುಖ್ಯ ಫಾರ್ಮ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಹಾಕಬಹುದು. ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ನಾವು ಇಟ್ಟುಕೊಂಡು, ಕೆಲಸ ಬಂದಾಗ ಕರೆ ಮಾಡುತ್ತೇವೆ.",
      link: "ಮುಖ್ಯ ಫಾರ್ಮ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಹಾಕಿ",
    },
    "te-IN": {
      heading: "ప్రస్తుతం ఈ ప్రాంతానికి మేము దరఖాస్తులు తీసుకోవడం లేదు.",
      text: "మీరు మా ప్రధాన ఫారంలో దరఖాస్తు చేయవచ్చు. మీ వివరాలు మేము ఉంచుకుని, పని వచ్చినప్పుడు ఫోన్ చేస్తాము.",
      link: "ప్రధాన ఫారంలో దరఖాస్తు చేయండి",
    },
    "pa-IN": {
      heading: "ਹੁਣ ਅਸੀਂ ਇਸ ਇਲਾਕੇ ਲਈ ਅਰਜ਼ੀਆਂ ਨਹੀਂ ਲੈ ਰਹੇ।",
      text: "ਤੁਸੀਂ ਸਾਡੇ ਮੁੱਖ ਫ਼ਾਰਮ 'ਤੇ ਅਪਲਾਈ ਕਰ ਸਕਦੇ ਹੋ। ਅਸੀਂ ਤੁਹਾਡੀ ਜਾਣਕਾਰੀ ਰੱਖਦੇ ਹਾਂ ਅਤੇ ਕੰਮ ਆਉਣ 'ਤੇ ਫ਼ੋਨ ਕਰਦੇ ਹਾਂ।",
      link: "ਮੁੱਖ ਫ਼ਾਰਮ 'ਤੇ ਅਪਲਾਈ ਕਰੋ",
    },
  },
  business: {
    "en-IN": {
      heading: "We’re not taking new work in this area right now.",
      text: "Elsewhere, or later? Send us the site. We’ll tell you plainly whether we can staff it.",
      link: "Request a crew",
    },
    "hi-IN": {
      heading: "अभी हम इस इलाके में नया काम नहीं ले रहे हैं।",
      text: "किसी और इलाके में साइट है, या काम बाद में शुरू होना है? साइट बताइए। हम साफ़ बताएँगे कि कामगार दे सकते हैं या नहीं।",
      link: "कामगार माँगें",
    },
    "hi-Latn-IN": {
      heading: "Abhi hum is area mein naya kaam nahi le rahe hain.",
      text: "Kahin aur, ya baad mein? Site bataiye. Hum saaf batayenge ki hum workers de sakte hain ya nahi.",
      link: "Workers maangein",
    },
    "kn-IN": {
      heading: "ಈಗ ನಾವು ಈ ಪ್ರದೇಶದಲ್ಲಿ ಹೊಸ ಕೆಲಸ ತೆಗೆದುಕೊಳ್ಳುತ್ತಿಲ್ಲ.",
      text: "ಸೈಟ್ ಬೇರೆ ಕಡೆ ಇದೆಯೇ, ಅಥವಾ ಕೆಲಸಗಾರರು ನಂತರ ಬೇಕೇ? ಸೈಟ್ ವಿವರ ಕಳುಹಿಸಿ. ಕೆಲಸಗಾರರನ್ನು ಕೊಡಲು ಆಗುತ್ತದೆಯೇ ಇಲ್ಲವೇ ಎಂದು ನೇರವಾಗಿ ಹೇಳುತ್ತೇವೆ.",
      link: "ಕೆಲಸಗಾರರು ಬೇಕು",
    },
    "te-IN": {
      heading: "ప్రస్తుతం ఈ ప్రాంతంలో మేము కొత్త పని తీసుకోవడం లేదు.",
      text: "వేరే చోట కావాలా, లేదా తర్వాత కావాలా? సైట్ వివరాలు పంపండి. వర్కర్లను ఇవ్వగలమో లేదో స్పష్టంగా చెబుతాం.",
      link: "వర్కర్ల కోసం అడగండి",
    },
    "pa-IN": {
      heading: "ਹੁਣ ਅਸੀਂ ਇਸ ਇਲਾਕੇ ਵਿੱਚ ਨਵਾਂ ਕੰਮ ਨਹੀਂ ਲੈ ਰਹੇ।",
      text: "ਕਿਸੇ ਹੋਰ ਥਾਂ ਜਾਂ ਕੁਝ ਸਮੇਂ ਬਾਅਦ ਕਾਮੇ ਚਾਹੀਦੇ ਹਨ? ਸਾਈਟ ਬਾਰੇ ਦੱਸੋ। ਅਸੀਂ ਸਾਫ਼ ਦੱਸ ਦਿਆਂਗੇ ਕਿ ਕਾਮੇ ਦੇ ਸਕਦੇ ਹਾਂ ਜਾਂ ਨਹੀਂ।",
      link: "ਕਾਮੇ ਮੰਗੋ",
    },
  },
} satisfies Record<"jobs" | "business", Record<Locale, { heading: string; text: string; link: string }>>;

export function PausedNotice({ kind, locale }: { kind: "jobs" | "business"; locale: Locale }) {
  const t = COPY[kind][locale];
  const href = kind === "jobs" ? localePath("/jobs/apply", locale) : "/contact";
  return (
    <div className="paused-notice" role="status">
      <p className="paused-notice-heading">{t.heading}</p>
      <p>{t.text}</p>
      <Link href={href} className={kind === "jobs" ? "jobs-submit mt-5 inline-flex" : "text-link"}>
        {t.link} <ArrowRight size={18} aria-hidden="true" />
      </Link>
    </div>
  );
}
