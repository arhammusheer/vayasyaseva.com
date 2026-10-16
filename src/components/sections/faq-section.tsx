import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "@/components/i18n/link";
import { Section } from "@/components/layout/section";
import { JsonLd, faqSchema } from "@/lib/structured-data";
import type { FaqItem } from "@/content/types";

/**
 * Page FAQ with matching FAQPage markup: the site's disclosure list, or
 * `open` prose (questions and answers all visible). `more` is the link to
 * the rest on /faq, under the heading.
 */
export function FaqSection({
  title = "Questions.",
  eyebrow,
  items,
  variant = "default",
  open = false,
  more,
}: {
  title?: string;
  eyebrow?: string;
  items: FaqItem[];
  variant?: "default" | "subtle";
  open?: boolean;
  more?: { href: string; label: string };
}) {
  return (
    <Section variant={variant} id="faq">
      <JsonLd data={faqSchema(items)} />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_2fr]">
        <div>
          {eyebrow && <p className="eyebrow text-gold-700">{eyebrow}</p>}
          <h2 className="mt-5 text-4xl font-medium">{title}</h2>
          {more && (
            <Link href={more.href} className="text-link" hrefLang="en-IN">
              {more.label} <ArrowRight size={18} aria-hidden="true" />
            </Link>
          )}
        </div>
        {open ? (
          <div className="faq-prose">
            {items.map((f) => (
              <div key={f.question}>
                <h3>{f.question}</h3>
                <p>{f.answer}</p>
                {f.link && (
                  <Link href={f.link.href} className="text-link mt-2">
                    {f.link.label} <ArrowUpRight size={18} aria-hidden="true" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="detail-list">
            {items.map((f) => (
              <details key={f.question}>
                <summary>{f.question}</summary>
                <div className="detail-body">
                  <p>{f.answer}</p>
                  {f.link && (
                    <Link href={f.link.href} className="text-link">
                      {f.link.label} <ArrowUpRight size={18} aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
