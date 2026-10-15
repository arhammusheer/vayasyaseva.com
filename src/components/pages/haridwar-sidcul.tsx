import Link from "@/components/i18n/link";
import { ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { WhatWeHold } from "@/components/sections/what-we-hold";
import {
  JsonLd,
  breadcrumbSchema,
  faqSchema,
  webPageSchema,
} from "@/lib/structured-data";
import { haridwarCopy } from "@/content/pages/haridwar-sidcul";
import { localePath, locales, type Locale } from "@/lib/i18n";

const PATH = "/haridwar-sidcul";

export function haridwarMetadata(locale: Locale) {
  const t = haridwarCopy[locale];
  return pageMetadata({
    title: t.title,
    description: t.description,
    alternates: { canonical: localePath(PATH, locale) },
    locale,
  });
}

export function HaridwarPage({ locale }: { locale: Locale }) {
  const t = haridwarCopy[locale];
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
      <JsonLd data={faqSchema(t.faqs)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: t.breadcrumb.home, href: "/" },
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
        footnote={
          // A quiet door for job seekers, above the fold and away from the
          // business phone (PLAN §5.2): Search sends seekers here too.
          <p className="seeker-line">
            {t.jobs.text}
            <Link href={t.jobs.link.href} className="text-link">
              {t.jobs.link.label} <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </p>
        }
      />
      <Section>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <h2 className="text-4xl font-medium">
            {t.introHeading[0]}
            <br />
            {t.introHeading[1]}
          </h2>
          <div className="text-lg text-muted-foreground leading-relaxed space-y-5">
            {t.intro.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {t.links.map((l) => (
              <Link key={l.href} href={l.href} className="text-link text-foreground">
                {l.label} <ArrowUpRight size={18} />
              </Link>
            ))}
          </div>
        </div>
      </Section>
      <Section variant="subtle" id="areas">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div>
            <p className="eyebrow text-gold-700">{t.areas.eyebrow}</p>
            <h2 className="mt-5 text-4xl font-medium">{t.areas.heading}</h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">{t.areas.intro}</p>
          </div>
          <div>
            {/* One anchored row per area: /haridwar-sidcul#bhagwanpur etc. */}
            <ul className="jobs-work">
              {t.areas.items.map((area) => (
                <li key={area.id} id={area.id} className="scroll-mt-28">
                  <h3>{area.name}</h3>
                  <p>{area.text}</p>
                </li>
              ))}
            </ul>
            <p className="mt-8 border-t pt-6 leading-relaxed text-muted-foreground">{t.areas.wages}</p>
            <Link href={t.areas.hire.href} className="text-link text-foreground">
              {t.areas.hire.label} <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Section>
      <Section>
        <p className="eyebrow text-gold-700">{t.supportEyebrow}</p>
        <div className="grid grid-cols-1 gap-8 mt-8 md:grid-cols-3">
          {t.support.map((s) => (
            <div key={s.title}>
              <h2 className="text-2xl font-medium">{s.title}</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">{s.text}</p>
              <Link href={s.href} className="text-link">
                {s.link} <ArrowUpRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </Section>
      <WhatWeHold cluster="haridwar" locale={locale} eyebrow={t.holdEyebrow} heading={t.holdHeading} />
      <Section variant="subtle">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.6fr]">
          <h2 className="text-4xl font-medium">{t.faqHeading}</h2>
          <div className="detail-list">
            {t.faqs.map((f) => (
              <details key={f.question}>
                <summary>{f.question}</summary>
                <div className="detail-body">{f.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </Section>
      <CtaBlock locale={locale} />
    </>
  );
}
