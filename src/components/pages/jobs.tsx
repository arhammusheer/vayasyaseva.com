import Link from "@/components/i18n/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { Section } from "@/components/layout/section";
import { JOB_GROUPS, JOB_HUB_LINKS } from "@/components/layout/nav-links";
import { quickApplyCopy } from "@/content/pages/quick-apply";
import { getJobCluster } from "@/content/pages/job-clusters";
import { JsonLd, breadcrumbSchema, webPageSchema } from "@/lib/structured-data";
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
 * A router, not a second Haridwar landing: Apply, or pick your work (four
 * groups, names only, each a #id the jobs menu links to), your area or your
 * qualification. No FAQ: the form pages and /jobs/fees-and-fraud carry the
 * rest.
 */
export function JobsPage({ locale }: { locale: Locale }) {
  const t = jobsCopy[locale];
  const url = localePath(PATH, locale);
  const haridwar = getJobCluster("haridwar", locale)!;
  const title = (role: string) => t.work.find((w) => w.role === role)?.title ?? role;
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
        <div className="site-shell grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-16">
          <div>
            <h1 className="jobs-title">{t.heading}</h1>
            <p className="jobs-lede">{t.lede}</p>
          </div>
          <div>
            <p className="quick-shifts">{quickApplyCopy[locale].shifts}</p>
            <Link href={localePath("/jobs/apply", locale)} className="jobs-submit">
              {t.apply} <ArrowRight size={20} aria-hidden="true" />
            </Link>
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
            <dt>{t.where}</dt>
            <dd>
              <Link href={localePath(`/jobs/${haridwar.slug}`, locale)} className="text-link mt-0">
                {haridwar.linkLabel} <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </dd>
          </div>
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
