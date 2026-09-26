import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";

const copy = {
  en: {
    eyebrow: "START A CONVERSATION",
    heading: ["What’s next for", "your business?"],
    text: "Tell us what you have in mind. We’ll take it from there.",
    aria: "Contact Vayasya Seva",
    link: "Let’s talk",
  },
  hi: {
    eyebrow: "बातचीत शुरू करें",
    heading: ["आपके बिज़नेस के लिए", "आगे क्या?"],
    text: "आपके मन में जो है, बताइए। आगे हम संभाल लेंगे।",
    aria: "Vayasya Seva से संपर्क करें",
    link: "बात करें",
  },
  hinglish: {
    eyebrow: "BAATCHEET SHURU KAREIN",
    heading: ["Aapke business ke liye", "aage kya?"],
    text: "Aapke mann mein jo hai, bataiye. Aage hum sambhal lenge.",
    aria: "Vayasya Seva se contact karein",
    link: "Baat karein",
  },
} satisfies Record<Locale, unknown>;

export function CtaBlock({ locale = "en" }: { locale?: Locale }) {
  const t = copy[locale];
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
        <Link href="/contact" className="round-link" aria-label={t.aria}>
          <ArrowUpRight aria-hidden="true" />
          <span>{t.link}</span>
        </Link>
      </div>
    </section>
  );
}
