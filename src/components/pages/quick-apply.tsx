import { getShareContent, quickShareVariant } from "@/lib/share-content";
import { pageMetadata } from "@/lib/metadata";
import { QuickApply } from "@/components/jobs/quick-apply";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd, webPageSchema } from "@/lib/structured-data";
import { quickApplyCopy } from "@/content/pages/quick-apply";
import { localePath, locales, type Locale } from "@/lib/i18n";
import type { JobsMarketId } from "@/markets/index";

const PATH = "/jobs/apply";

/**
 * The guided application page: noindex and out of the sitemap, but the
 * Google Ads, SMS and header Apply landing. Role, hub and market pages
 * embed the same guided form.
 */
/** The heading and title for ?cluster=<id>, when that cluster has its own (quick-apply.ts inCluster). */
const inCluster = (locale: Locale, cluster?: string) =>
  cluster && Object.hasOwn(quickApplyCopy[locale].inCluster, cluster) ? quickApplyCopy[locale].inCluster[cluster as JobsMarketId] : undefined;

export function quickApplyMetadata(locale: Locale, query: { role?: string; hub?: string; work?: string; cluster?: string } = {}) {
  const t = quickApplyCopy[locale];
  const local = inCluster(locale, query.cluster);
  // Role share variants name Haridwar, so another cluster keeps the default image.
  const variant = local ? undefined : quickShareVariant(query);
  const share = getShareContent(PATH, locale, variant);
  return pageMetadata({
    title: { absolute: `${local?.title ?? (variant ? share.heading.replaceAll("\n", " ") : t.title)} | Vayasya Seva` },
    description: t.description,
    alternates: { canonical: localePath(PATH, locale) },
    locale,
    shareVariant: variant,
  });
}

/** An H1, one line and the guided form; nothing else competes for attention. */
export function QuickApplyPage({ locale, prefillKey = "", cluster }: { locale: Locale; prefillKey?: string; cluster?: string }) {
  const t = quickApplyCopy[locale];
  const heading = inCluster(locale, cluster)?.heading ?? t.heading;
  const url = localePath(PATH, locale);
  return (
    <>
      <JsonLd data={webPageSchema({ name: t.title, description: t.description, url, inLanguage: locales[locale].hreflang })} />
      <Breadcrumbs path={PATH} locale={locale} name={t.breadcrumb} visible={false} />
      <section className="quick-top">
        <div className="site-shell grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h1 className="quick-title">{heading}</h1>
            <p className="quick-lede">{t.lede}</p>
          </div>
          <QuickApply key={prefillKey} locale={locale} />
        </div>
      </section>
    </>
  );
}
