import { notFound } from "next/navigation";
import Link from "@/components/i18n/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { FaqSection } from "@/components/sections/faq-section";
import {
  JsonLd,
  breadcrumbSchema,
  serviceLandingSchema,
  webPageSchema,
} from "@/lib/structured-data";
import { getServicePage, type ServiceLandingContent } from "@/content/service-pages";
import { getServicePageHiLatn } from "@/content/hi-latn/service-pages";
import { localePath, locales, type Locale } from "@/lib/i18n";
import { AGENCY_FAQ } from "@/content/agency-faq";
import type { JobRole } from "@/lib/talent-intake/rules";

/** Service pages have English and hi-Latn-IN only (see pages in src/lib/i18n.ts). */
type ServiceLocale = Exclude<Locale, "hi-IN">;

/**
 * A job seeker who lands on a service page (searching "warehouse job
 * haridwar") gets one quiet line under the lede to the matching role page,
 * as on /haridwar-sidcul. No phone next to it.
 */
const JOBS_DOOR: Record<string, { role: JobRole; label: Record<ServiceLocale, string> }> = {
  "warehouse-labour": { role: "warehouse", label: { "en-IN": "Warehouse jobs", "hi-Latn-IN": "Warehouse job" } },
  "loading-unloading-labour": { role: "warehouse", label: { "en-IN": "Loading and unloading jobs", "hi-Latn-IN": "Loading-unloading job" } },
  "factory-labour": { role: "factory-helper", label: { "en-IN": "Factory helper jobs", "hi-Latn-IN": "Factory helper job" } },
  housekeeping: { role: "housekeeping", label: { "en-IN": "Housekeeping jobs", "hi-Latn-IN": "Housekeeping job" } },
};
const LOOKING: Record<ServiceLocale, string> = { "en-IN": "Looking for work?", "hi-Latn-IN": "Kaam dhoondh rahe hain?" };

const labels = {
  "en-IN": {
    rolesEyebrow: "TYPICAL ROLES",
    rolesHeading: "Who we plan for.",
    planningHeading: "Planned around your site.",
    records:
      "Attendance, wage records and applicable EPF and ESIC contributions are maintained by us and available for your review.",
    complianceLink: "Our labour compliance approach",
    related: "RELATED",
    relatedAria: "Related services",
    local: { href: "/haridwar-sidcul", label: "Labour contractor in SIDCUL Haridwar" },
    faqEyebrow: "QUESTIONS",
    faqTitle: "Common questions.",
    home: "Home",
    services: "Services",
  },
  "hi-Latn-IN": {
    rolesEyebrow: "Kaun-se kaam",
    rolesHeading: "Hum kinke liye plan karte hain.",
    planningHeading: "Aapki site ke hisaab se planning.",
    records:
      "Attendance, wage records aur applicable EPF aur ESIC contributions hum maintain karte hain, aur ye aapke review ke liye available hain.",
    complianceLink: "Hamara labour compliance approach (English mein)",
    related: "Related",
    relatedAria: "Related services",
    local: { href: "/haridwar-sidcul", label: "SIDCUL Haridwar mein labour contractor" },
    faqEyebrow: "Sawaal",
    faqTitle: "Aam sawaal.",
    home: "Home",
    services: "Services",
  },
} satisfies Record<ServiceLocale, unknown>;

/** A service page's content in a locale; there are no hi-IN service pages. */
export function serviceLanding(slug: string, locale: Locale) {
  if (locale === "hi-IN") notFound();
  const page = locale === "hi-Latn-IN" ? getServicePageHiLatn(slug) : getServicePage(slug);
  return { page, locale };
}

export function serviceLandingMetadata(page: ServiceLandingContent, locale: ServiceLocale = "en-IN") {
  return pageMetadata({
    title: page.metaTitle,
    description: page.description,
    alternates: { canonical: localePath(`/services/${page.slug}`, locale) },
    locale,
  });
}

/** Short service page: roles, how it is planned, related services, FAQs. */
export function ServiceLanding({
  page,
  locale = "en-IN",
}: {
  page: ServiceLandingContent;
  locale?: ServiceLocale;
}) {
  const t = labels[locale];
  const url = localePath(`/services/${page.slug}`, locale);
  return (
    <>
      <JsonLd
        data={webPageSchema({
          name: page.metaTitle,
          description: page.description,
          url,
          inLanguage: locales[locale].hreflang,
        })}
      />
      <JsonLd
        data={serviceLandingSchema({ name: page.name, description: page.description, url })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: t.home, href: "/" },
          { name: t.services, href: "/services" },
          { name: page.name, href: url },
        ])}
      />
      <PageHero
        title={page.heading}
        lede={page.lede}
        footnote={
          JOBS_DOOR[page.slug] && (
            <p className="seeker-line">
              {LOOKING[locale]}{" "}
              <Link href={localePath(`/jobs/${JOBS_DOOR[page.slug].role}`, locale)} className="text-link" prefetch={false}>
                {JOBS_DOOR[page.slug].label[locale]} <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </p>
          )
        }
      />
      <Section>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.6fr]">
          <div>
            <p className="eyebrow text-gold-700">{t.rolesEyebrow}</p>
            <h2 className="mt-5 text-3xl font-medium">{t.rolesHeading}</h2>
          </div>
          <ul className="divide-y border-y">
            {page.roles.map((role) => (
              <li key={role} className="py-4 text-lg">
                {role}
              </li>
            ))}
          </ul>
        </div>
      </Section>
      <Section variant="subtle">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <h2 className="text-3xl font-medium">{t.planningHeading}</h2>
          <div>
            <p className="leading-relaxed text-muted-foreground">{page.planning}</p>
            <p className="mt-4 leading-relaxed text-muted-foreground">{t.records}</p>
            <Link href="/compliance" className="text-link">
              {t.complianceLink} <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </Section>
      <Section>
        <p className="eyebrow text-gold-700">{t.related}</p>
        <nav aria-label={t.relatedAria} className="mt-6 flex flex-wrap gap-x-10 gap-y-2">
          {page.related.map((r) => (
            <Link key={r.href} href={r.href} className="text-link">
              {r.label} <ArrowUpRight size={18} />
            </Link>
          ))}
          <Link href={t.local.href} className="text-link">
            {t.local.label} <ArrowUpRight size={18} />
          </Link>
        </nav>
      </Section>
      <FaqSection eyebrow={t.faqEyebrow} title={t.faqTitle} variant="subtle" items={[...page.faqs, AGENCY_FAQ[locale]]} />
      <CtaBlock locale={locale} />
    </>
  );
}
