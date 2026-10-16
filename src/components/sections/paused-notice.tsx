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
      heading: "अभी हम इस इलाके के लिए आवेदन नहीं ले रहे हैं।",
      text: "आप हमारे मुख्य फ़ॉर्म पर आवेदन कर सकते हैं। हम आपकी जानकारी रखते हैं और काम आने पर फ़ोन करते हैं।",
      link: "मुख्य फ़ॉर्म पर आवेदन करें",
    },
    "hi-Latn-IN": {
      heading: "Abhi hum is area ke liye applications nahi le rahe hain.",
      text: "Aap hamare main form par apply kar sakte hain. Hum aapki jaankari rakhte hain aur kaam aane par phone karte hain.",
      link: "Main form par apply karein",
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
      text: "कहीं और, या बाद में? साइट बताइए। हम साफ़ बताएँगे कि हम कामगार दे सकते हैं या नहीं।",
      link: "कामगार माँगें",
    },
    "hi-Latn-IN": {
      heading: "Abhi hum is area mein naya kaam nahi le rahe hain.",
      text: "Kahin aur, ya baad mein? Site bataiye. Hum saaf batayenge ki hum workers de sakte hain ya nahi.",
      link: "Workers maangein",
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
