import Link from "@/components/i18n/link";
import { ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { Section } from "@/components/layout/section";
import { FaqSection } from "@/components/sections/faq-section";
import { quickApplyCopy } from "@/content/pages/quick-apply";
import { jobHubs } from "@/content/pages/job-hubs";
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
 * Searchable overview of work and candidate categories, with a direct
 * action to the shared guided application.
 */
export function JobsPage({ locale }: { locale: Locale }) {
  const t = jobsCopy[locale];
  const url = localePath(PATH, locale);
  const quick = quickApplyCopy[locale];
  const apply = { "en-IN": "Apply now", "hi-IN": "आवेदन करें", "hi-Latn-IN": "Apply karein" }[locale];
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
      <section className="jobs-top">
        <div className="site-shell grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow text-gold-700">{t.eyebrow}</p>
            <h1 className="jobs-title">{t.heading}</h1>
            <p className="jobs-lede">{t.lede}</p>
          </div>
          <div className="lg:self-center">
            <h2 className="text-3xl font-medium">{quick.heading}</h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">{quick.lede}</p>
            <Link href={localePath("/jobs/apply", locale)} className="jobs-submit mt-6 inline-flex">
              {apply} <ArrowUpRight size={20} aria-hidden="true" />
            </Link>
            <p className="quick-note">{quick.noFee}</p>
          </div>
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
      <Section variant="subtle">
        <nav aria-label={t.breadcrumb.page} className="flex flex-wrap gap-x-10 gap-y-4">
          {jobHubs[locale].map((hub) => (
            <Link key={hub.slug} href={localePath(`/jobs/${hub.slug}`, locale)} className="text-link">
              {hub.name} <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          ))}
        </nav>
      </Section>
      <FaqSection eyebrow={t.faqEyebrow} title={t.faqTitle} items={t.faqs} />
    </>
  );
}
