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
  "hi-IN": {
    eyebrow: "बातचीत शुरू करें",
    heading: ["आपके बिज़नेस के लिए", "आगे क्या?"],
    text: "आपके मन में जो है, बताइए। आगे हम संभाल लेंगे।",
    aria: "Vayasya Seva से संपर्क करें",
    link: "बात करें",
  },
  "hi-Latn-IN": {
    eyebrow: "BAATCHEET SHURU KAREIN",
    heading: ["Aapke business ke liye", "aage kya?"],
    text: "Aapke mann mein jo hai, bataiye. Aage hum sambhal lenge.",
    aria: "Vayasya Seva se contact karein",
    link: "Baat karein",
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
