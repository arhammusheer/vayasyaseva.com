import { ArrowUpRight } from "lucide-react";
import Link from "@/components/i18n/link";
import { Section } from "@/components/layout/section";
import { JsonLd, faqSchema } from "@/lib/structured-data";
import type { FaqItem } from "@/content/types";

/**
 * Page FAQ with matching FAQPage markup: the site's disclosure list, or
 * `open` prose (questions and answers all visible) for a page with only one
 * or two questions.
 */
export function FaqSection({
  title = "Questions.",
  eyebrow,
  items,
  variant = "default",
  open = false,
}: {
  title?: string;
  eyebrow?: string;
  items: FaqItem[];
  variant?: "default" | "subtle";
  open?: boolean;
}) {
  return (
    <Section variant={variant} id="faq">
      <JsonLd data={faqSchema(items)} />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_2fr]">
        <div>
          {eyebrow && <p className="eyebrow text-gold-700">{eyebrow}</p>}
          <h2 className="mt-5 text-4xl font-medium">{title}</h2>
        </div>
        {open ? (
          <div className="faq-prose">
            {items.map((f) => (
              <div key={f.question}>
                <h3>{f.question}</h3>
                <p>{f.answer}</p>
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
