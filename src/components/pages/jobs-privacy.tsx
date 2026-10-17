import Link from "@/components/i18n/link";
import { ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { Section } from "@/components/layout/section";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { BackToApply } from "@/components/jobs/back-to-apply";
import { JsonLd, webPageSchema } from "@/lib/structured-data";
import { jobsPrivacyCopy } from "@/content/pages/jobs-privacy";
import { localePath, locales, type Locale } from "@/lib/i18n";

const PATH = "/jobs/privacy";

export function jobsPrivacyMetadata(locale: Locale) {
  const t = jobsPrivacyCopy[locale];
  return pageMetadata({
    title: { absolute: `${t.title} | Vayasya Seva` },
    description: t.description,
    alternates: { canonical: localePath(PATH, locale) },
    locale,
  });
}

/**
 * The applicant notice in plain words: four short lines, three details,
 * then the full English notice and the way back to the form. The only
 * place on the jobs side that talks about data.
 */
export function JobsPrivacyPage({ locale }: { locale: Locale }) {
  const t = jobsPrivacyCopy[locale];
  const url = localePath(PATH, locale);
  return (
    <>
      <JsonLd data={webPageSchema({ name: t.title, description: t.description, url, inLanguage: locales[locale].hreflang })} />
      <section className="quick-top">
        <div className="site-shell">
          <Breadcrumbs path={PATH} locale={locale} name={t.breadcrumb} />
          <h1 className="quick-title">{t.heading}</h1>
          <h2 className="eyebrow mt-12 text-gold-700">{t.shortLabel}</h2>
          <dl className="jobs-short">
            {t.short.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <Section variant="subtle">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          <h2 className="text-4xl font-medium">{t.detailsLabel}</h2>
          <div>
            <ul className="jobs-work">
              {t.details.map((d) => (
                <li key={d.title}>
                  <h3>{d.title}</h3>
                  <p>{d.text}</p>
                </li>
              ))}
            </ul>
            <div className="mt-10 flex flex-col items-start gap-6">
              <BackToApply href={localePath("/jobs/apply", locale)} label={t.back} />
              <Link href={`${localePath("/privacy", "en-IN")}#job-seekers`} hrefLang="en-IN" className="text-link mt-0">
                {t.full} <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
