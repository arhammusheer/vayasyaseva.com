import Link from "@/components/i18n/link";
import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";

const copy = {
  "en-IN": {
    eyebrow: "FOR BUSINESSES",
    heading: ["Need workers", "on your site?"],
    text: "Tell us the work, the headcount and the shifts. We aim to reply within two working days (Monday to Saturday, IST).",
    aria: "Request a crew from Vayasya Seva",
    link: "Request a crew",
  },
  // Drafts of the English band for native review: the same ask and the same
  // reply-time line (category A, docs/claims-register.md).
  "hi-IN": {
    eyebrow: "कंपनियों के लिए",
    heading: ["अपनी साइट पर", "कामगार चाहिए?"],
    text: "काम, कितने लोग और कौन-सी शिफ्ट, बताइए। हम दो कामकाजी दिनों में जवाब देने की कोशिश करते हैं (सोमवार से शनिवार, IST)।",
    aria: "Vayasya Seva से कामगार माँगें",
    link: "कामगार माँगें",
  },
  "hi-Latn-IN": {
    eyebrow: "Companies ke liye",
    heading: ["Apni site par", "workers chahiye?"],
    text: "Kaam, kitne log aur kaun-si shift, bataiye. Hum do working days mein jawaab dene ki koshish karte hain (Monday se Saturday, IST).",
    aria: "Vayasya Seva se workers maangein",
    link: "Workers maangein",
  },
} satisfies Record<Locale, unknown>;

/** The Setu product page: its next step is a Setu conversation, not a crew. */
const setuCopy = {
  eyebrow: "VAYASYA SETU",
  heading: ["Want to see", "Setu at work?"],
  text: "Ask how Setu reports attendance and records for your crew. We aim to reply within two working days (Monday to Saturday, IST).",
  aria: "Ask Vayasya Seva about Setu",
  link: "Ask about Setu",
};

/**
 * `href` lets a location page keep its prefill, e.g. "/contact#location=haridwar".
 * `variant="setu"` swaps the crew request for the Setu enquiry (English only).
 */
export function CtaBlock({
  locale = "en-IN",
  href = "/contact",
  variant = "crew",
}: { locale?: Locale; href?: string; variant?: "crew" | "setu" }) {
  const t = variant === "setu" ? setuCopy : copy[locale];
  return (
    <section className="contact-invitation">
      <div className="site-shell invitation-inner">
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h2>
            {t.heading[0]}
            <br />
            {t.heading[1]}
          </h2>
          <p>{t.text}</p>
        </div>
        <Link href={href} className="round-link" aria-label={t.aria}>
          <ArrowUpRight aria-hidden="true" />
          <span>{t.link}</span>
        </Link>
      </div>
    </section>
  );
}
