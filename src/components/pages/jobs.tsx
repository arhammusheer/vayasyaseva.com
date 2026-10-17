import Link from "@/components/i18n/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { Section } from "@/components/layout/section";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JOB_GROUPS, JOB_HUB_LINKS } from "@/components/layout/nav-links";
import { getJobCluster } from "@/content/pages/job-clusters";
import { JsonLd, webPageSchema } from "@/lib/structured-data";
import { JOB_GROUP_ROLES, jobsCopy } from "@/content/pages/jobs";
import { jobRolePath } from "@/components/pages/job-role";
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
 * A router, not a second Haridwar landing (no form, no shifts line: those
 * are on /jobs/haridwar, where Apply goes): Apply, or pick your work (four
 * groups, names only, each a #id the jobs menu links to) or your
 * qualification. No FAQ: the form pages and /jobs/fees-and-fraud carry the
 * rest.
 */
export function JobsPage({ locale }: { locale: Locale }) {
  const t = jobsCopy[locale];
  const url = localePath(PATH, locale);
  const haridwar = getJobCluster("haridwar", locale)!;
  // The other hubs, each as a quiet line under Apply.
  const others = (["jalandhar", "bengaluru"] as const).flatMap((slug) => {
    const hub = getJobCluster(slug, locale);
    return hub ? [{ hub, line: t[slug] }] : [];
  });
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
            <Link href={localePath(`/jobs/${haridwar.slug}`, locale)} className="jobs-submit">
              {t.apply} <ArrowRight size={20} aria-hidden="true" />
            </Link>
            {others.map(({ hub, line }) => (
              <p key={hub.slug} className="jobs-also">
                {line}{" "}
                <Link href={localePath(`/jobs/${hub.slug}`, locale)} className="text-link mt-0">
                  {hub.linkLabel} <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </p>
            ))}
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
                    <Link href={localePath(jobRolePath(role), locale)} className="jobs-work-link">
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
                <Link key={hub.slug} href={localePath(`/jobs/${hub.slug}`, locale)} className="text-link mt-0">
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
