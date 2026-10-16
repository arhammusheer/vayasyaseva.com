import Link from "@/components/i18n/link";
import { ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { Section } from "@/components/layout/section";
import { FaqSection } from "@/components/sections/faq-section";
import { QuickApply } from "@/components/jobs/quick-apply";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd, webPageSchema } from "@/lib/structured-data";
import { RELATED_ROLES, getJobRole, jobRoleLabels, jobRoles } from "@/content/pages/job-roles";
import { jobsCopy } from "@/content/pages/jobs";
import { localePath, locales, localesOf, type Locale } from "@/lib/i18n";
import type { JobRole } from "@/lib/talent-intake/rules";

export const jobRolePath = (slug: JobRole) => `/jobs/${slug}`;

/** Role pages built in this language (src/content/registry). */
export function jobRoleParams(locale: Locale) {
  return jobRoles["en-IN"].filter((r) => localesOf(jobRolePath(r.slug)).includes(locale)).map((r) => ({ role: r.slug }));
}

function roleOrThrow(slug: string, locale: Locale) {
  const role = getJobRole(slug, locale);
  if (!role) throw new Error(`Unknown job role: ${slug}`);
  return role;
}

export function jobRoleMetadata(slug: string, locale: Locale) {
  const role = roleOrThrow(slug, locale);
  return pageMetadata({
    title: { absolute: `${role.metaTitle} | Vayasya Seva` },
    description: role.description,
    alternates: { canonical: localePath(jobRolePath(role.slug), locale) },
    locale,
  });
}

/**
 * One kind of work: a one-sentence lede (the work and who it suits), the
 * jobs form tagged with the role, the duties as a numbered strip, two or
 * three questions about this work, then three related roles and All jobs.
 */
export function JobRolePage({ slug, locale }: { slug: string; locale: Locale }) {
  const role = roleOrThrow(slug, locale);
  const t = jobRoleLabels[locale];
  const url = localePath(jobRolePath(role.slug), locale);
  // Role names as /jobs lists them, so every row uses one naming.
  const title = (r: JobRole) => jobsCopy[locale].work.find((w) => w.role === r)?.title ?? roleOrThrow(r, locale).name;
  return (
    <>
      <JsonLd
        data={webPageSchema({ name: role.metaTitle, description: role.description, url, inLanguage: locales[locale].hreflang })}
      />
      <section className="quick-top">
        <div className="site-shell grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Breadcrumbs path={jobRolePath(role.slug)} locale={locale} name={role.name} />
            <h1 className="quick-title">{role.heading}</h1>
            <p className="quick-lede">{role.lede}</p>
          </div>
          {/* #apply: the header's Apply scrolls here instead of leaving the role. */}
          <div id="apply" className="quick-anchor">
            <QuickApply key={role.slug} locale={locale} role={role.slug} />
          </div>
        </div>
      </section>
      <Section variant="subtle">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.6fr]">
          <h2 className="text-4xl font-medium">{t.workHeading}</h2>
          <ol className="jobs-steps">
            {role.work.map((item, i) => (
              <li key={item}>
                <span className="jobs-step-number" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="jobs-step-title">{item}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>
      <FaqSection title={t.faqTitle} items={role.faqs} />
      <Section variant="subtle" className="py-10 sm:py-12 lg:py-12">
        <nav aria-label={t.related} className="jobs-related-row">
          <p>{t.related}</p>
          <ul>
            {RELATED_ROLES[role.slug].map((r) => (
              <li key={r}>
                <Link href={localePath(jobRolePath(r), locale)} className="text-link mt-0">
                  {title(r)} <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
              </li>
            ))}
            <li>
              <Link href={localePath("/jobs", locale)} className="text-link mt-0">
                {t.allJobs} <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </li>
          </ul>
        </nav>
      </Section>
    </>
  );
}
