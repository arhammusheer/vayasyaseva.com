import Link from "@/components/i18n/link";
import { ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { Section } from "@/components/layout/section";
import { FaqSection } from "@/components/sections/faq-section";
import { JobsForm } from "@/components/jobs/jobs-form";
import { JsonLd, breadcrumbSchema, webPageSchema } from "@/lib/structured-data";
import { jobsCopy } from "@/content/pages/jobs";
import { localePath, locales, type Locale } from "@/lib/i18n";

const PATH = "/jobs";

export function jobsMetadata(locale: Locale) {
  const t = jobsCopy[locale];
  return pageMetadata({
    title: { absolute: `${t.title} | Vayasya Seva` },
    description: t.description,
    alternates: { canonical: localePath(PATH, locale) },
    locale,
  });
}

/**
 * The job seeker page: one form (voice, files, text, number) and the kinds
 * of work we hire for. Submissions go through /api/jobs/* to n8n and on to
 * Chatwoot (integrations/n8n/README.md).
 */
export function JobsPage({ locale }: { locale: Locale }) {
  const t = jobsCopy[locale];
  const url = localePath(PATH, locale);
  return (
    <>
      <JsonLd
        data={webPageSchema({ name: t.title, description: t.description, url, inLanguage: locales[locale].hreflang })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: t.breadcrumb.home, href: "/" },
          { name: t.breadcrumb.page, href: url },
        ])}
      />
      {/* Compact top: on a phone the headline, one line and the record
          button all show on the first screen. */}
      <section className="jobs-top">
        <div className="site-shell grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow text-gold-700">{t.eyebrow}</p>
            <h1 className="jobs-title">{t.heading}</h1>
            <p className="jobs-lede">{t.lede}</p>
          </div>
          <JobsForm locale={locale} />
        </div>
      </section>
      <Section variant="subtle">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow text-gold-700">{t.workEyebrow}</p>
            <h2 className="mt-5 text-4xl font-medium">{t.workHeading}</h2>
          </div>
          <ul className="jobs-work">
            {t.work.map((w) => (
              <li key={w.title}>
                <h3>
                  {w.role ? (
                    <Link href={localePath(`/jobs/${w.role}`, locale)} className="jobs-work-link">
                      {w.title} <ArrowUpRight size={20} aria-hidden="true" />
                    </Link>
                  ) : (
                    w.title
                  )}
                </h3>
                <p>{w.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>
      <FaqSection eyebrow={t.faqEyebrow} title={t.faqTitle} items={t.faqs} />
    </>
  );
}
