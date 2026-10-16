import Link from "@/components/i18n/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pageMetadata } from "@/lib/metadata";
import { Section } from "@/components/layout/section";
import { FaqSection } from "@/components/sections/faq-section";
import { QuickApply } from "@/components/jobs/quick-apply";
import { JsonLd, breadcrumbSchema, pageUrl, webPageSchema } from "@/lib/structured-data";
import { jobsCopy } from "@/content/pages/jobs";
import { getJobCluster } from "@/content/pages/job-clusters";
import { jobHubs } from "@/content/pages/job-hubs";
import { isPaused, pageEntries } from "@/content/registry";
import { PausedNotice } from "@/components/sections/paused-notice";
import { localePath, locales, localesOf, type Locale } from "@/lib/i18n";
import { jobRolePath } from "@/components/pages/job-role";

const clusterPath = (slug: string) => `/jobs/${slug}`;

/** Cluster jobs hubs built in this language (kind "jobs-city" in src/content/registry). */
export const jobClusterParams = (locale: Locale) =>
  pageEntries
    .filter((p) => p.kind === "jobs-city" && p.cluster && localesOf(p.path).includes(locale))
    .map((p) => ({ role: p.path.slice("/jobs/".length) }));

export function isJobClusterSlug(slug: string) {
  return pageEntries.some((p) => p.kind === "jobs-city" && p.path === clusterPath(slug));
}

function clusterOrThrow(slug: string, locale: Locale) {
  const cluster = getJobCluster(slug, locale);
  if (!cluster) throw new Error(`Unknown jobs hub: ${slug}`);
  return cluster;
}

export function jobClusterMetadata(slug: string, locale: Locale) {
  const c = clusterOrThrow(slug, locale);
  return pageMetadata({
    title: { absolute: `${c.metaTitle} | Vayasya Seva` },
    description: c.description,
    alternates: { canonical: localePath(clusterPath(c.slug), locale) },
    locale,
  });
}

/**
 * The jobs hub for one cluster (PLAN §5.3): the guided form prefilled with
 * the cluster on the first screen, then where the work is, the work we hire
 * for (the role pages), the fresher and class hubs, what happens after you
 * apply and the FAQ. No phone anywhere: this is a jobs page.
 */
export function JobClusterPage({ slug, locale }: { slug: string; locale: Locale }) {
  const c = clusterOrThrow(slug, locale);
  const jobs = jobsCopy[locale];
  const url = localePath(clusterPath(c.slug), locale);
  const roles = jobs.work.filter((w) => w.role);
  const number = (i: number) => String(i + 1).padStart(2, "0");
  const paused = isPaused(clusterPath(c.slug), locale);
  return (
    <>
      <JsonLd
        data={{
          ...webPageSchema({ name: c.metaTitle, description: c.description, url, type: "CollectionPage", inLanguage: locales[locale].hreflang }),
          mainEntity: {
            "@type": "ItemList",
            itemListElement: roles.map((w, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: w.title,
              url: pageUrl(localePath(jobRolePath(w.role!), locale)),
            })),
          },
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: jobs.breadcrumb.home, href: "/" },
          { name: jobs.breadcrumb.page, href: localePath("/jobs", locale) },
          { name: c.name, href: url },
        ])}
      />
      <section className="quick-top">
        <div className="site-shell grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow text-gold-700">{c.eyebrow}</p>
            <h1 className="quick-title">{c.heading}</h1>
            <p className="quick-lede">{c.lede}</p>
          </div>
          {/* #apply: the header's Apply and the button after the FAQ scroll back here.
              A paused hub (PLAN §8.3) shows its notice there instead, with the national form. */}
          <div id="apply" className="quick-anchor">
            {paused ? <PausedNotice kind="jobs" locale={locale} /> : <QuickApply key={c.slug} locale={locale} cluster={c.slug} />}
          </div>
        </div>
      </section>

      <Section variant="subtle">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div>
            <p className="eyebrow text-gold-700">{c.where.eyebrow}</p>
            <h2 className="mt-5 text-4xl font-medium">{c.where.heading}</h2>
            <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">{c.where.intro}</p>
          </div>
          <div>
            <ul className="jobs-work">
              {c.where.places.map((place) => (
                <li key={place.name}>
                  <h3>{place.name}</h3>
                  <p>{place.text}</p>
                </li>
              ))}
            </ul>
            <p className="mt-8 border-t pt-6 leading-relaxed text-muted-foreground">{c.where.outside}</p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div>
            <p className="eyebrow text-gold-700">{c.roles.eyebrow}</p>
            <h2 className="mt-5 text-4xl font-medium">{c.roles.heading}</h2>
            <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">{c.roles.intro}</p>
          </div>
          <ul className="jobs-work is-linked">
            {roles.map((w) => (
              <li key={w.role}>
                <h3>
                  <Link href={localePath(jobRolePath(w.role!), locale)} className="jobs-work-link">
                    {w.title} <ArrowUpRight size={20} aria-hidden="true" />
                  </Link>
                </h3>
                <p>{w.text}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-6 border-t pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12">
          <div>
            <h2 className="text-3xl font-medium">{c.hubs.heading}</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">{c.hubs.text}</p>
          </div>
          <nav aria-label={c.hubs.heading}>
            <ul className="jobs-work is-linked">
              {jobHubs[locale].map((hub) => (
                <li key={hub.slug}>
                  <h3>
                    <Link href={localePath(`/jobs/${hub.slug}`, locale)} className="jobs-work-link">
                      {hub.name} <ArrowUpRight size={20} aria-hidden="true" />
                    </Link>
                  </h3>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Section>

      <section className="fraud-band">
        <div className="site-shell grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-20">
          <div>
            <p className="eyebrow">{c.after.eyebrow}</p>
            <h2>{c.after.heading}</h2>
          </div>
          <ol className="fraud-steps">
            {c.after.steps.map((step, i) => (
              <li key={step.title}>
                <span aria-hidden="true">{number(i)}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <FaqSection eyebrow={c.faqEyebrow} title={c.faqTitle} items={[...c.faqs, ...jobs.sharedFaqs]} />
      {/* Back to the form at the end of the page, not nine screens up. */}
      <section className="pb-16 sm:pb-20">
        <div className="site-shell grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-10">
          <div className="lg:col-start-2">
            <Button asChild size="lg" className="h-12 text-base">
              <a href="#apply">
                {c.applyAgain} <ArrowDown size={18} aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
