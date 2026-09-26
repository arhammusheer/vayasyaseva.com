import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { JsonLd, breadcrumbSchema, webPageSchema } from "@/lib/structured-data";
import { contractLabourCopy } from "@/content/pages/contract-labour";
import { localePath, locales, type Locale } from "@/lib/i18n";

const PATH = "/services/contract-labour";

export function contractLabourMetadata(locale: Locale) {
  const t = contractLabourCopy[locale];
  return pageMetadata({
    title: t.title,
    description: t.description,
    alternates: { canonical: localePath(PATH, locale) },
    locale,
  });
}

export function ContractLabourPage({ locale }: { locale: Locale }) {
  const t = contractLabourCopy[locale];
  const url = localePath(PATH, locale);
  return (
    <>
      <JsonLd
        data={webPageSchema({
          name: t.title,
          description: t.description,
          url,
          inLanguage: locales[locale].hreflang,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: t.breadcrumb.home, href: "/" },
          { name: t.breadcrumb.services, href: "/services" },
          { name: t.breadcrumb.page, href: url },
        ])}
      />
      <PageHero
        title={
          <>
            {t.hero[0]}
            <br />
            {t.hero[1]}
          </>
        }
        lede={t.lede}
      />
      <Section>
        <div className="grid gap-10 md:grid-cols-[1fr_1.5fr]">
          <div>
            <p className="eyebrow text-gold-700">{t.introEyebrow}</p>
            <h2 className="mt-5 text-3xl font-medium">{t.introHeading}</h2>
          </div>
          <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
            {t.intro.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <Link href={t.localLink.href} className="text-link">
              {t.localLink.label} <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </Section>
      <Section variant="subtle">
        <p className="eyebrow text-gold-700">{t.areasEyebrow}</p>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {t.workAreas.map((area) => (
            <article key={area.title}>
              <h2 className="text-2xl font-medium">{area.title}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{area.text}</p>
              <Link href={area.href} className="text-link">
                {area.link} <ArrowUpRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </Section>
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow text-gold-700">{t.stepsEyebrow}</p>
            <h2 className="mt-5 text-3xl font-medium">{t.stepsHeading}</h2>
          </div>
          <ol className="grid gap-7 sm:grid-cols-2">
            {t.steps.map((step, index) => (
              <li key={step.title} className="border-t pt-5">
                <span className="font-data text-sm text-gold-700">0{index + 1}</span>
                <h3 className="mt-3 text-xl font-medium">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>
      <Section variant="subtle">
        <div className="grid gap-8 md:grid-cols-2">
          <h2 className="text-3xl font-medium">{t.complianceHeading}</h2>
          <div>
            <p className="leading-relaxed text-muted-foreground">{t.complianceText}</p>
            <Link href="/compliance" className="text-link">
              {t.complianceLink} <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </Section>
      <Section>
        <div className="max-w-2xl">
          <h2 className="text-3xl font-medium">{t.contactHeading}</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">{t.contactText}</p>
          <Link href="/contact" className="text-link">
            {t.contactLink} <ArrowUpRight size={18} />
          </Link>
        </div>
      </Section>
      <CtaBlock locale={locale} />
    </>
  );
}
