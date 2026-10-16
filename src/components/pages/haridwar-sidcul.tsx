import NextLink from "next/link";
import Link from "@/components/i18n/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { CtaBlock } from "@/components/sections/cta-block";
import { ClientStrip } from "@/components/sections/client-strip";
import { FaqSection } from "@/components/sections/faq-section";
import { JsonLd, breadcrumbSchema, webPageSchema } from "@/lib/structured-data";
import { haridwarCopy } from "@/content/pages/haridwar-sidcul";
import { jobsDoorHref } from "@/components/layout/nav-links";
import { HARIDWAR_SECTION_ANCHORS } from "@/content/registry/identifiers";
import { localePath, locales, type Locale } from "@/lib/i18n";
import { isPaused } from "@/content/registry";
import { PausedNotice } from "@/components/sections/paused-notice";

const PATH = "/haridwar-sidcul";
const CREW_HREF = "/contact#location=haridwar";
const AND: Record<Locale, string> = { "en-IN": "and", "hi-IN": "और", "hi-Latn-IN": "aur" };

export function haridwarMetadata(locale: Locale) {
  const t = haridwarCopy[locale];
  return pageMetadata({
    title: t.title,
    description: t.description,
    alternates: { canonical: localePath(PATH, locale) },
    locale,
  });
}

/** "A, B and C", each area name carrying its anchor (/haridwar-sidcul#bhagwanpur). */
function Areas({ locale }: { locale: Locale }) {
  const names = haridwarCopy[locale].areas;
  return HARIDWAR_SECTION_ANCHORS.map((id, i) => (
    <span key={id}>
      {i > 0 && (i === HARIDWAR_SECTION_ANCHORS.length - 1 ? ` ${AND[locale]} ` : ", ")}
      <span id={id} className="scroll-mt-28">
        {names[id]}
      </span>
    </span>
  ));
}

/**
 * The Haridwar buyer hub: the hero, client proof, one SIDCUL paragraph, the
 * three services and one FAQ. Most hi-IN visitors are job seekers, so there
 * the jobs door is a button with Request a crew beside it; elsewhere the hero
 * carries only a quiet jobs line and the band takes the crew request.
 */
export function HaridwarPage({ locale }: { locale: Locale }) {
  const t = haridwarCopy[locale];
  const url = localePath(PATH, locale);
  const [before, after] = t.sidcul.split("{areas}");
  const jobsFirst = locale === "hi-IN";
  const crewButton = t.crew && (
    <Button asChild size="lg" variant="outline">
      <Link href={CREW_HREF}>
        {t.crew} <ArrowUpRight aria-hidden="true" />
      </Link>
    </Button>
  );
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
          jobsFirst ? (
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg">
                <NextLink href={jobsDoorHref(locale)} prefetch={false}>
                  {t.jobs.label} <ArrowRight aria-hidden="true" />
                </NextLink>
              </Button>
              {crewButton}
            </div>
          ) : (
            // A quiet door for job seekers, away from the business phone (PLAN §5.2).
            // Request a crew stays in the header and the prefilled band only.
            <p className="seeker-line pt-2">
              {t.jobs.text}{" "}
              <NextLink href={jobsDoorHref(locale)} className="text-link" prefetch={false}>
                {t.jobs.label} <ArrowRight size={18} aria-hidden="true" />
              </NextLink>
            </p>
          )
        }
      />
      <ClientStrip label={t.clients} afterRule />
      {isPaused(PATH, locale) && (
        <div className="site-shell pb-10">
          <PausedNotice kind="business" locale={locale} />
        </div>
      )}
      <Section className="border-t border-border">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.6fr]">
          <p className="eyebrow text-gold-700">{locale === "en-IN" ? t.breadcrumb.page.toUpperCase() : t.breadcrumb.page}</p>
          <div>
            <p className="text-xl leading-relaxed sm:text-2xl">
              {before}
              <Areas locale={locale} />
              {after}
            </p>
            <nav aria-label={t.servicesLabel} className="mt-10">
              <p className="text-sm text-muted-foreground">{t.servicesLabel}</p>
              <ul className="link-row mt-2">
                {t.services.map((s) => (
                  <li key={s.href}>
                    <Link href={s.href} className="text-link" hrefLang="en-IN">
                      {s.label} <ArrowUpRight size={18} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </Section>
      <FaqSection title={t.faqHeading} variant="subtle" items={t.faqs} open />
      <CtaBlock locale={locale} href={CREW_HREF} />
    </>
  );
}
