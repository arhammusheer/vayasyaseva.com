import Link from "@/components/i18n/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { Section } from "@/components/layout/section";
import { QuickApply } from "@/components/jobs/quick-apply";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd, webPageSchema } from "@/lib/structured-data";
import { getJobHub, jobHubLabels } from "@/content/pages/job-hubs";
import { getJobRole } from "@/content/pages/job-roles";
import { jobsCopy } from "@/content/pages/jobs";
import { localePath, locales, localesOf, type Locale } from "@/lib/i18n";
import { JOB_HUB_SLUGS } from "@/lib/talent-intake/rules";
import { jobRolePath } from "@/components/pages/job-role";

/** Hub pages built in this language (src/content/registry). */
export const jobHubParams = (locale: Locale) =>
  JOB_HUB_SLUGS.filter((slug) => localesOf(`/jobs/${slug}`).includes(locale)).map((slug) => ({ role: slug }));

function hubOrThrow(slug: string, locale: Locale) {
  const hub = getJobHub(slug, locale);
  if (!hub) throw new Error(`Unknown job hub: ${slug}`);
  return hub;
}

export function jobHubMetadata(slug: string, locale: Locale) {
  const hub = hubOrThrow(slug, locale);
  return pageMetadata({
    title: { absolute: `${hub.metaTitle} | Vayasya Seva` },
    description: hub.description,
    alternates: { canonical: localePath(`/jobs/${hub.slug}`, locale) },
    locale,
  });
}

/**
 * Who is searching (freshers, 10th or 12th pass): the jobs form on top, then
 * the role pages that take you, each with its note for this qualification.
 * No FAQ: the rows are the page. Ends with the jobs index (every market).
 */
export function JobHubPage({ slug, locale }: { slug: string; locale: Locale }) {
  const hub = hubOrThrow(slug, locale);
  const t = jobHubLabels[locale];
  const url = localePath(`/jobs/${hub.slug}`, locale);
  return (
    <>
      <JsonLd
        data={webPageSchema({ name: hub.metaTitle, description: hub.description, url, inLanguage: locales[locale].hreflang })}
      />
      <section className="quick-top">
        <div className="site-shell grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Breadcrumbs path={`/jobs/${hub.slug}`} locale={locale} name={hub.name} />
            <h1 className="quick-title">{hub.heading}</h1>
            <p className="quick-lede">{hub.lede}</p>
          </div>
          <div id="apply" className="quick-anchor">
            <QuickApply key={hub.slug} locale={locale} hub={hub.slug} />
          </div>
        </div>
      </section>
      <Section variant="subtle">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_2fr]">
          <h2 className="text-4xl font-medium">{t.rolesHeading}</h2>
          <div>
            <ul className="jobs-work is-linked">
              {hub.roles.map(({ role, note }) => (
                <li key={role}>
                  <h3>
                    <Link href={localePath(jobRolePath(role), locale)} className="jobs-work-link">
                      {jobsCopy[locale].work.find((w) => w.role === role)?.title ?? getJobRole(role, locale)?.name ?? role} <ArrowUpRight size={20} aria-hidden="true" />
                    </Link>
                  </h3>
                  <p>{note}</p>
                </li>
              ))}
            </ul>
            <Link href={localePath("/jobs", locale)} className="text-link mt-10">
              {jobsCopy[locale].heading} <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
