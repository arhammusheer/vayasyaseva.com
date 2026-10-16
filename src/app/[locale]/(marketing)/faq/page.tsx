import { pageMetadata } from "@/lib/metadata";
import Link from "@/components/i18n/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { CtaBlock } from "@/components/sections/cta-block";
import { JsonLd, faqSchema, webPageSchema } from "@/lib/structured-data";
import { FAQ_PATH, faqGroups } from "@/content/faq";
import { localeParams } from "@/lib/i18n";
export const dynamicParams = false;
export const generateStaticParams = localeParams(FAQ_PATH);

const TITLE = "Contract Labour and Manpower Supply: Questions";
const DESCRIPTION =
  "Answers on pricing, crew size, supervision, payroll, EPF, ESIC, PT, LWF and labour licences, and on factory, loading and housekeeping crews.";

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: FAQ_PATH },
});

/**
 * Every buyer question, grouped. The topic chips are anchors: /faq#<topic>
 * shows that topic first with the shared groups and hides the other topics
 * (CSS :target, globals.css "FAQ page"), so a link from a service page
 * opens a filtered list with no script. "All" clears the filter.
 */
export default function FaqPage() {
  return (
    <>
      <JsonLd data={webPageSchema({ name: TITLE, description: DESCRIPTION, url: FAQ_PATH })} />
      <JsonLd data={faqSchema(faqGroups.flatMap((g) => g.items))} />
      <PageHero title="Questions, answered." lede="About working with us, payroll and compliance, and each kind of crew." />
      {/* The open topic's chip, marked while its anchor is the target. */}
      <style>{faqGroups.map((g) => `.faq-page:has(#${g.id}:target) .faq-topics a[href="#${g.id}"]`).join(",") + "{border-color:var(--gold-700);color:var(--gold-700)}"}</style>
      <div className="site-shell faq-page" id="all">
        <nav aria-label="Topics" className="faq-topics">
          <a href="#all">All</a>
          {faqGroups.map((g) => (
            <a key={g.id} href={`#${g.id}`}>
              {g.title}
            </a>
          ))}
        </nav>
        <div className="faq-groups">
          {faqGroups.map((g) => (
            <section key={g.id} id={g.id} className={g.topic ? "faq-group is-topic" : "faq-group"} aria-labelledby={`${g.id}-title`}>
              <h2 id={`${g.id}-title`}>{g.title}</h2>
              <div className="detail-list">
                {g.items.map((f) => (
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
            </section>
          ))}
        </div>
      </div>
      <CtaBlock />
    </>
  );
}
