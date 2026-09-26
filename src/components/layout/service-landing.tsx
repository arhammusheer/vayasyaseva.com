import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
import type { ServiceLandingContent } from "@/content/service-pages";
import { locales, type Locale } from "@/lib/i18n";

/** Service pages are translated into Hinglish only (see pageLocales). */
type ServiceLocale = Exclude<Locale, "hi">;

const labels = {
  en: {
    base: "/services",
    rolesEyebrow: "TYPICAL ROLES",
    rolesHeading: "Who we plan for.",
    planningHeading: "Planned around your site.",
    records:
      "Attendance, wage records and applicable EPF and ESIC contributions are maintained by us and available for your review.",
    complianceLink: "Our labour compliance approach",
    related: "RELATED",
    relatedAria: "Related services",
    local: { href: "/haridwar-sidcul", label: "Labour contractor in Haridwar & SIDCUL" },
    faqEyebrow: "QUESTIONS",
    faqTitle: "Common questions.",
    home: "Home",
    services: "Services",
  },
  hinglish: {
    base: "/hinglish/services",
    rolesEyebrow: "TYPICAL ROLES",
    rolesHeading: "Hum kinke liye plan karte hain.",
    planningHeading: "Aapki site ke hisaab se planning.",
    records:
      "Attendance, wage records aur applicable EPF aur ESIC contributions hum maintain karte hain, aur ye aapke review ke liye available hain.",
    complianceLink: "Hamara labour compliance approach (English mein)",
    related: "RELATED",
    relatedAria: "Related services",
    local: { href: "/hinglish/haridwar-sidcul", label: "Haridwar aur SIDCUL mein labour contractor" },
    faqEyebrow: "SAWAAL",
    faqTitle: "Aam sawaal.",
    home: "Home",
    services: "Services",
  },
} satisfies Record<ServiceLocale, unknown>;

export function serviceLandingMetadata(page: ServiceLandingContent, locale: ServiceLocale = "en") {
  return pageMetadata({
    title: page.metaTitle,
    description: page.description,
    alternates: { canonical: `${labels[locale].base}/${page.slug}` },
    locale,
  });
}

/** Short service page: roles, how it is planned, related services, FAQs. */
export function ServiceLanding({
  page,
  locale = "en",
}: {
  page: ServiceLandingContent;
  locale?: ServiceLocale;
}) {
  const t = labels[locale];
  const url = `${t.base}/${page.slug}`;
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
      <PageHero title={page.heading} lede={page.lede} />
      <Section>
        <div className="grid gap-10 md:grid-cols-[1fr_1.6fr]">
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
        <div className="grid gap-8 md:grid-cols-2">
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
      <FaqSection eyebrow={t.faqEyebrow} title={t.faqTitle} variant="subtle" items={page.faqs} />
      <CtaBlock locale={locale} />
    </>
  );
}
