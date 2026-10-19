import Link from "@/components/i18n/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { Section } from "@/components/layout/section";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JOB_GROUPS, JOB_HUB_LINKS } from "@/components/layout/nav-links";
import { getJobCluster } from "@/content/pages/job-clusters";
import { jobsLinkLabel } from "@/markets/labels";
import { JsonLd, webPageSchema } from "@/lib/structured-data";
import { JOB_GROUP_ROLES, jobsCopy } from "@/content/pages/jobs";
import { jobRolePath } from "@/components/pages/job-role";
import { localePath, locales, nearestLocalePath, type Locale } from "@/lib/i18n";
import { orderedJobMarkets } from "@/context/surfaces";
import { DecidedApplyLink, MarketList, type MarketItem } from "@/components/sections/market-list";

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
 * A router, not a market's landing (no form, no shifts line: those are on
 * the hubs and /jobs/apply). Apply opens the visitor's market (src/context),
 * else /jobs/apply; then every market, the visitor's first once decided
 * (alphabetical before that); then pick your work (four groups, names only,
 * each a #id the jobs menu links to) or your qualification. No FAQ: the form
 * pages carry the rest.
 */
export function JobsPage({ locale }: { locale: Locale }) {
  const t = jobsCopy[locale];
  const url = localePath(PATH, locale);
  // Every market's hub in MARKET_ORDER; the visitor context's CSS orders them before paint.
  const markets: MarketItem[] = orderedJobMarkets().flatMap((id) => {
    const hub = getJobCluster(id, locale);
    return hub ? [{ cluster: id, href: nearestLocalePath(`/jobs/${id}`, locale), title: jobsLinkLabel(id, locale) ?? hub.name }] : [];
  });
  const hubs = Object.fromEntries(markets.map((m) => [m.cluster, m.href]));
  const title = (role: string) => t.work.find((w) => w.role === role)?.title ?? role;
  return (
    <>
      <JsonLd
        data={webPageSchema({ name: t.title, description: t.description, url, inLanguage: locales[locale].hreflang })}
      />
      <Breadcrumbs path={PATH} locale={locale} name={t.breadcrumb} />
      <section className="jobs-top">
        <div className="site-shell grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-16">
          <div>
            <h1 className="jobs-title">{t.heading}</h1>
            <p className="jobs-lede">{t.lede}</p>
          </div>
          <div>
            <DecidedApplyLink hubs={hubs} fallback={localePath("/jobs/apply", locale)} label={t.apply} className="jobs-submit" />
            <p className="jobs-markets-label">{t.markets}</p>
            <MarketList items={markets} side="jobs" surface="jobs-index" className="location-areas jobs-markets" />
          </div>
        </div>
      </section>
      <Section variant="subtle">
        <div>
          {JOB_GROUPS[locale].map((group) => (
            <section key={group.id} id={group.id} className="jobs-group">
              <h2>{group.label}</h2>
              <ul>
                {JOB_GROUP_ROLES[group.id].map((role) => (
                  <li key={role}>
                    <Link href={nearestLocalePath(jobRolePath(role), locale)} className="jobs-work-link">
                      {title(role)} <ArrowUpRight size={20} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <dl className="jobs-lines">
          <div>
            <dt>{t.who}</dt>
            <dd>
              {JOB_HUB_LINKS[locale].map((hub) => (
                <Link key={hub.slug} href={nearestLocalePath(`/jobs/${hub.slug}`, locale)} className="text-link mt-0">
                  {hub.label} <ArrowRight size={18} aria-hidden="true" />
                </Link>
              ))}
            </dd>
          </div>
        </dl>
      </Section>
    </>
  );
}
