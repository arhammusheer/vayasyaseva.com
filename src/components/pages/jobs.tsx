import { pageMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/layout/page-hero";
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
      <PageHero
        tone="dark"
        title={t.heading}
        lede={t.lede}
        aside={
          <p className="jobs-no-fee">
            <span aria-hidden="true">₹0</span>
            {t.noFee}
          </p>
        }
      />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <p className="eyebrow text-gold-700 lg:sticky lg:top-32 lg:self-start">{t.eyebrow}</p>
          <JobsForm locale={locale} />
        </div>
      </Section>
      <Section variant="subtle">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow text-gold-700">{t.workEyebrow}</p>
            <h2 className="mt-5 text-4xl font-medium">{t.workHeading}</h2>
          </div>
          <ul className="jobs-work">
            {t.work.map((w) => (
              <li key={w.title}>
                <h3>{w.title}</h3>
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
