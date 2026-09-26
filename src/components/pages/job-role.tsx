import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { Section } from "@/components/layout/section";
import { FaqSection } from "@/components/sections/faq-section";
import { JobsForm } from "@/components/jobs/jobs-form";
import { JsonLd, breadcrumbSchema, webPageSchema } from "@/lib/structured-data";
import { jobsCopy } from "@/content/pages/jobs";
import { getJobRole, jobRoleLabels, jobRoles } from "@/content/pages/job-roles";
import { localePath, locales, type Locale } from "@/lib/i18n";
import type { JobRole } from "@/lib/talent-intake/rules";

export const jobRolePath = (slug: JobRole) => `/jobs/${slug}`;

export function jobRoleParams() {
  return jobRoles.en.map((r) => ({ role: r.slug }));
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
 * One kind of work: the jobs form (tagged with the role) on top, then what
 * the work is, who it suits, what to send, the other roles and FAQs.
 */
export function JobRolePage({ slug, locale }: { slug: string; locale: Locale }) {
  const role = roleOrThrow(slug, locale);
  const jobs = jobsCopy[locale];
  const t = jobRoleLabels[locale];
  const url = localePath(jobRolePath(role.slug), locale);
  return (
    <>
      <JsonLd
        data={webPageSchema({ name: role.metaTitle, description: role.description, url, inLanguage: locales[locale].hreflang })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: jobs.breadcrumb.home, href: "/" },
          { name: jobs.breadcrumb.page, href: localePath("/jobs", locale) },
          { name: role.name, href: url },
        ])}
      />
      <section className="jobs-top">
        <div className="site-shell grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow text-gold-700">
              <Link href={localePath("/jobs", locale)} className="hover:underline underline-offset-4">
                {jobs.eyebrow}
              </Link>
            </p>
            <h1 className="jobs-title">{role.heading}</h1>
            <p className="jobs-lede">{role.lede}</p>
          </div>
          <JobsForm locale={locale} role={role.slug} />
        </div>
      </section>
      <Section variant="subtle">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.6fr]">
          <div>
            <h2 className="text-4xl font-medium">{t.workHeading}</h2>
            <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">{role.setting}</p>
            <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">{t.records}</p>
          </div>
          <ul className="divide-y border-y">
            {role.work.map((item) => (
              <li key={item} className="py-4 text-lg">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Section>
      <Section>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-medium">{t.suitsHeading}</h2>
            <ul className="mt-6 divide-y border-y">
              {role.suits.map((item) => (
                <li key={item} className="py-3 leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-3xl font-medium">{t.sendHeading}</h2>
            <ul className="mt-6 divide-y border-y">
              {role.send.map((item) => (
                <li key={item} className="py-3 leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>
      <Section variant="subtle">
        <p className="eyebrow text-gold-700">{t.otherEyebrow}</p>
        <nav aria-label={t.otherEyebrow} className="mt-6 flex flex-wrap gap-x-10 gap-y-2">
          {jobRoles[locale]
            .filter((r) => r.slug !== role.slug)
            .map((r) => (
              <Link key={r.slug} href={localePath(jobRolePath(r.slug), locale)} className="text-link">
                {r.name} <ArrowUpRight size={18} />
              </Link>
            ))}
          <Link href={localePath("/jobs", locale)} className="text-link">
            {t.allJobs} <ArrowUpRight size={18} />
          </Link>
        </nav>
      </Section>
      <FaqSection eyebrow={t.faqEyebrow} title={t.faqTitle} items={[...role.faqs, jobs.faqs[0]]} />
    </>
  );
}
