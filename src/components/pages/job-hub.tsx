import Link from "@/components/i18n/link";
import { ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { Section } from "@/components/layout/section";
import { FaqSection } from "@/components/sections/faq-section";
import { JobsForm } from "@/components/jobs/jobs-form";
import { JsonLd, breadcrumbSchema, webPageSchema } from "@/lib/structured-data";
import { jobsCopy } from "@/content/pages/jobs";
import { getJobHub, jobHubLabels } from "@/content/pages/job-hubs";
import { getJobRole, jobRoleLabels } from "@/content/pages/job-roles";
import { localePath, locales, type Locale } from "@/lib/i18n";
import { JOB_HUB_SLUGS } from "@/lib/talent-intake/rules";
import { jobRolePath } from "@/components/pages/job-role";

export const jobHubParams = () => JOB_HUB_SLUGS.map((slug) => ({ role: slug }));

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
 * the role pages that fit, what to send and FAQs. Not linked from the rest of
 * the site; the links here go out to role pages only.
 */
export function JobHubPage({ slug, locale }: { slug: string; locale: Locale }) {
  const hub = hubOrThrow(slug, locale);
  const jobs = jobsCopy[locale];
  const t = jobHubLabels[locale];
  const url = localePath(`/jobs/${hub.slug}`, locale);
  return (
    <>
      <JsonLd
        data={webPageSchema({ name: hub.metaTitle, description: hub.description, url, inLanguage: locales[locale].hreflang })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: jobs.breadcrumb.home, href: "/" },
          { name: jobs.breadcrumb.page, href: localePath("/jobs", locale) },
          { name: hub.name, href: url },
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
            <h1 className="jobs-title">{hub.heading}</h1>
            <p className="jobs-lede">{hub.lede}</p>
          </div>
          <JobsForm locale={locale} hub={hub.slug} />
        </div>
      </section>
      <Section variant="subtle">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow text-gold-700">{t.rolesEyebrow}</p>
            <h2 className="mt-5 text-4xl font-medium">{t.rolesHeading}</h2>
            <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">{hub.intro}</p>
            <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">{jobRoleLabels[locale].records}</p>
          </div>
          <ul className="jobs-work">
            {hub.roles.map(({ role, note }) => (
              <li key={role}>
                <h3>
                  <Link href={localePath(jobRolePath(role), locale)} className="jobs-work-link">
                    {getJobRole(role, locale)?.name ?? role} <ArrowUpRight size={20} aria-hidden="true" />
                  </Link>
                </h3>
                <p>{note}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>
      <Section>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.6fr]">
          <h2 className="text-3xl font-medium">{t.sendHeading}</h2>
          <ul className="divide-y border-y">
            {hub.send.map((item) => (
              <li key={item} className="py-3 leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Section>
      <FaqSection eyebrow={t.faqEyebrow} title={t.faqTitle} variant="subtle" items={[...hub.faqs, jobs.faqs[0]]} />
    </>
  );
}
