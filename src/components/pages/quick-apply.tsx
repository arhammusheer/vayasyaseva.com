import { getShareContent, quickShareVariant } from "@/lib/share-content";
import { pageMetadata } from "@/lib/metadata";
import { QuickApply } from "@/components/jobs/quick-apply";
import { JsonLd, breadcrumbSchema, webPageSchema } from "@/lib/structured-data";
import { jobsCopy } from "@/content/pages/jobs";
import { quickApplyCopy } from "@/content/pages/quick-apply";
import { localePath, locales, type Locale } from "@/lib/i18n";

const PATH = "/jobs/apply";

/**
 * The guided application page, in the sitemap and llms.txt and used as a
 * Google Ads landing page. The header and footer "Jobs" links open it;
 * role and category landing pages embed the same guided form.
 */
export function quickApplyMetadata(locale: Locale, query: { role?: string; hub?: string; work?: string } = {}) {
  const t = quickApplyCopy[locale];
  const variant = quickShareVariant(query);
  const share = getShareContent(PATH, locale, variant);
  return pageMetadata({
    title: { absolute: `${variant ? share.heading.replaceAll("\n", " ") : t.title} | Vayasya Seva` },
    description: t.description,
    alternates: { canonical: localePath(PATH, locale) },
    locale,
    shareVariant: variant,
  });
}

/** A short top and the guided form; nothing else competes for attention. */
export function QuickApplyPage({ locale, prefillKey = "" }: { locale: Locale; prefillKey?: string }) {
  const t = quickApplyCopy[locale];
  const jobs = jobsCopy[locale];
  const url = localePath(PATH, locale);
  return (
    <>
      <JsonLd data={webPageSchema({ name: t.title, description: t.description, url, inLanguage: locales[locale].hreflang })} />
      <JsonLd
        data={breadcrumbSchema([
          { name: jobs.breadcrumb.home, href: "/" },
          { name: jobs.breadcrumb.page, href: localePath("/jobs", locale) },
          { name: t.breadcrumb, href: url },
        ])}
      />
    <section className="quick-top">
      <div className="site-shell grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow text-gold-700">{t.eyebrow}</p>
          <h1 className="quick-title">{t.heading}</h1>
          <p className="quick-lede">{t.lede}</p>
        </div>
        <QuickApply key={prefillKey} locale={locale} />
      </div>
    </section>
    </>
  );
}
