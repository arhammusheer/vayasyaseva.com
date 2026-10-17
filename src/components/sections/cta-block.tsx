import Link from "@/components/i18n/link";
import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";

type BandCopy = { heading: [string, string]; aria: string; link: string };

/**
 * The crew band: heading and button only. The ask (roles, headcount,
 * shifts) is in the home hero, and the reply time on /contact. Hindi and
 * Hinglish are drafts for native review.
 */
const copy = {
  "en-IN": {
    heading: ["Need workers", "on your site?"],
    aria: "Request a crew from Vayasya Seva",
    link: "Request a crew",
  },
  "hi-IN": {
    heading: ["अपनी साइट पर", "कामगार चाहिए?"],
    aria: "Vayasya Seva से कामगार माँगें",
    link: "कामगार माँगें",
  },
  "hi-Latn-IN": {
    heading: ["Apni site par", "workers chahiye?"],
    aria: "Vayasya Seva se workers maangein",
    link: "Workers maangein",
  },
  "kn-IN": {
    heading: ["ನಿಮ್ಮ ಸೈಟ್‌ನಲ್ಲಿ", "ಕಾರ್ಮಿಕರು ಬೇಕೇ?"],
    aria: "Vayasya Seva ಇಂದ ಕಾರ್ಮಿಕರನ್ನು ಕೇಳಿ",
    link: "ಕಾರ್ಮಿಕರನ್ನು ಕೇಳಿ",
  },
  "pa-IN": {
    heading: ["ਆਪਣੀ ਸਾਈਟ 'ਤੇ", "ਕਾਮੇ ਚਾਹੀਦੇ ਹਨ?"],
    aria: "Vayasya Seva ਤੋਂ ਕਾਮੇ ਮੰਗੋ",
    link: "ਕਾਮੇ ਮੰਗੋ",
  },
} satisfies Record<Locale, BandCopy>;

/** The Setu product page: its next step is a Setu conversation, not a crew. */
const setuCopy: BandCopy = {
  heading: ["Want to see", "Setu at work?"],
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
  const t: BandCopy = variant === "setu" ? setuCopy : copy[locale];
  return (
    <section className="contact-invitation">
      <div className="site-shell invitation-inner">
        <div>
          <h2>
            {t.heading[0]}
            <br />
            {t.heading[1]}
          </h2>
        </div>
        <Link href={href} className="round-link" aria-label={t.aria}>
          <ArrowUpRight aria-hidden="true" />
          <span>{t.link}</span>
        </Link>
      </div>
    </section>
  );
}
