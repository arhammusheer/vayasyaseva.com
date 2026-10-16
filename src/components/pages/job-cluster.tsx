import Link from "@/components/i18n/link";
import { ArrowRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { Section } from "@/components/layout/section";
import { FaqSection } from "@/components/sections/faq-section";
import { QuickApply } from "@/components/jobs/quick-apply";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd, pageUrl, webPageSchema } from "@/lib/structured-data";
import { jobsCopy } from "@/content/pages/jobs";
import { getJobCluster, type JobClusterCopy } from "@/content/pages/job-clusters";
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

/** The areas line: "A, B and C" in place of {areas}. */
function AreasLine({ areas }: { areas: JobClusterCopy["areas"] }) {
  const [before, after] = areas.text.split("{areas}");
  const names = Object.values(areas.names);
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} ${areas.and} ${names.at(-1)}` : names.join("");
  return (
    <p className="jobs-areas">
      {before}
      {list}
      {after}
    </p>
  );
}

/**
 * The Haridwar jobs landing (PLAN §5.3): the form on the first screen, one
 * line on where the work is, the role names, what happens after you apply
 * and three questions. No phone anywhere: this is a jobs page.
 */
export function JobClusterPage({ slug, locale }: { slug: string; locale: Locale }) {
  const c = clusterOrThrow(slug, locale);
  const jobs = jobsCopy[locale];
  const url = localePath(clusterPath(c.slug), locale);
  const paused = isPaused(clusterPath(c.slug), locale);
  return (
    <>
      <JsonLd
        data={{
          ...webPageSchema({ name: c.metaTitle, description: c.description, url, type: "CollectionPage", inLanguage: locales[locale].hreflang }),
          mainEntity: {
            "@type": "ItemList",
            itemListElement: jobs.work.map((w, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: w.title,
              url: pageUrl(localePath(jobRolePath(w.role), locale)),
            })),
          },
        }}
      />
      <section className="quick-top">
        <div className="site-shell grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Breadcrumbs path={clusterPath(c.slug)} locale={locale} name={c.name} />
            <h1 className="quick-title">{c.heading}</h1>
            <p className="quick-lede">{c.lede}</p>
          </div>
          {/* #apply: the header's Apply scrolls here. A paused hub (PLAN §8.3)
              shows its notice there instead, with the national form. */}
          <div id="apply" className="quick-anchor">
            {paused ? <PausedNotice kind="jobs" locale={locale} /> : <QuickApply key={c.slug} locale={locale} cluster={c.slug} />}
          </div>
        </div>
      </section>

      <Section variant="subtle">
        <AreasLine areas={c.areas} />
        <nav aria-label={c.roles} className="jobs-role-row">
          <p>{c.roles}</p>
          <ul>
            {jobs.work.map((w) => (
              <li key={w.role}>
                <Link href={localePath(jobRolePath(w.role), locale)}>{w.title}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </Section>

      <section className="jobs-after" aria-label={c.after.label}>
        <div className="site-shell">
          <p className="jobs-after-label">{c.after.label}</p>
          <ol>
            {c.after.steps.map((step, i) => (
              <li key={step}>
                <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                {step}
                {i < c.after.steps.length - 1 && <ArrowRight className="jobs-after-arrow" size={22} aria-hidden="true" />}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <FaqSection title={c.faqTitle} items={c.faqs} open />
    </>
  );
}
