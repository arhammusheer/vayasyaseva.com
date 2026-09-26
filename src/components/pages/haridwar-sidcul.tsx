import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
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
      />
      <Section>
        <div className="grid gap-10 md:grid-cols-2">
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
      <Section variant="subtle">
        <p className="eyebrow text-gold-700">{t.supportEyebrow}</p>
        <div className="grid gap-8 mt-8 md:grid-cols-3">
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
      <Section>
        <div className="grid gap-10 md:grid-cols-[1fr_1.6fr]">
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
