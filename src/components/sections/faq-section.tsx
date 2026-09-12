import { Section } from "@/components/layout/section";
import { JsonLd, faqSchema } from "@/lib/structured-data";
import type { FaqItem } from "@/content/types";

/** Page FAQ in the site's disclosure list, with matching FAQPage markup. */
export function FaqSection({
  title = "Common questions.",
  eyebrow,
  items,
  variant = "default",
}: {
  title?: string;
  eyebrow?: string;
  items: FaqItem[];
  variant?: "default" | "subtle";
}) {
  return (
    <Section variant={variant} id="faq">
      <JsonLd data={faqSchema(items)} />
      <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
        <div>
          {eyebrow && <p className="eyebrow text-gold-700">{eyebrow}</p>}
          <h2 className="mt-5 text-4xl font-medium">{title}</h2>
        </div>
        <div className="detail-list">
          {items.map((f) => (
            <details key={f.question}>
              <summary>{f.question}</summary>
              <div className="detail-body">
                <p>{f.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}
