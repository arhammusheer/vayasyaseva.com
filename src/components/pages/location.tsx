import Link from "@/components/i18n/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { CtaBlock } from "@/components/sections/cta-block";
import { ClientStrip } from "@/components/sections/client-strip";
import { FaqSection } from "@/components/sections/faq-section";
import { FAQ_PATH } from "@/content/faq";
import { isPaused, linkable } from "@/content/registry";
import { JsonLd, pageUrl, webPageSchema } from "@/lib/structured-data";
import { JOBS_AREA_LABEL, marketSurfaces } from "@/context/surfaces";
import { locationCopyIn, locationPages, type LocationCopy } from "@/content/locations";
import { estatePath, jobsHubPath, locationPath } from "@/content/registry/identifiers";
import { JobsLink } from "@/components/i18n/jobs-link";
import { localePath, localizeHref, locales, type Locale } from "@/lib/i18n";
import { MARKET_IDS as MARKET_ORDER } from "@/markets/index";
import { MarketList, type MarketItem } from "@/components/sections/market-list";
import { PausedNotice } from "@/components/sections/paused-notice";

const pathOf = (p: LocationCopy) => (p.estate ? estatePath(p.cluster, p.estate) : locationPath(p.cluster));

const SERVICE_HREFS = ["/services/factory-labour", "/services/loading-unloading-labour", "/services/housekeeping"] as const;

/**
 * The page's own words in each language a location page can have. The
 * service landings and /faq are English, so their links say so elsewhere.
 */
const UI: Partial<Record<Locale, { crew: string; seeker: string; clients: string; servicesLabel: string; services: readonly [string, string, string]; faqHeading: string; moreFaqs: string; and: string }>> = {
  "en-IN": { crew: "Request a crew", seeker: "Looking for work?", clients: "Our experience includes work with", servicesLabel: "Crews we supply", services: ["Factory labour", "Loading and unloading", "Housekeeping and grounds"], faqHeading: "Questions.", moreFaqs: "More questions", and: "and" },
  "hi-IN": { crew: "कामगार माँगें", seeker: "काम चाहिए?", clients: "हमारे अनुभव में इनके साथ काम शामिल है", servicesLabel: "हमारी टीमें (अंग्रेज़ी में)", services: ["फ़ैक्टरी लेबर", "लोडिंग और अनलोडिंग", "हाउसकीपिंग और ग्राउंड्स"], faqHeading: "सवाल।", moreFaqs: "और सवाल (English)", and: "और" },
  "hi-Latn-IN": { crew: "Workers maangein", seeker: "Kaam chahiye?", clients: "Hamare experience mein inke saath kaam", servicesLabel: "Hamari teams (English mein)", services: ["Factory labour", "Loading aur unloading", "Housekeeping aur grounds"], faqHeading: "Sawaal.", moreFaqs: "Aur sawaal (English)", and: "aur" },
};
const uiIn = (locale: Locale) => UI[locale] ?? UI["en-IN"]!;

export function locationMetadata(p: LocationCopy, locale: Locale = "en-IN") {
  const t = locationCopyIn(p, locale);
  return pageMetadata({ title: t.metaTitle, description: t.description, alternates: { canonical: localePath(pathOf(p), locale) }, locale });
}

/** "A, B and C" at the paragraph's {areas}: a link where the area has a page, else its name. */
function Areas({ areas, and }: { areas: NonNullable<LocationCopy["areas"]>; and: string }) {
  const shown = areas.filter((a) => !a.href || linkable(a.href, "en-IN"));
  return shown.map((a, i) => (
    <span key={a.href ?? a.name}>
      {i > 0 && (i === shown.length - 1 ? ` ${and} ` : ", ")}
      {a.href ? (
        <Link href={a.href} className="underline decoration-gold-500 underline-offset-4 hover:text-gold-700">
          {a.name}
        </Link>
      ) : (
        a.name
      )}
    </span>
  ));
}

/**
 * Every market's location page (owner direction, 17 Oct 2026): the hero
 * with Request a crew (prefilled with the place) and a quiet jobs line where
 * the cluster has a jobs hub; the client strip; one paragraph on the place
 * with its areas and the crews we supply; four questions; the crew band. No
 * phone (the (locations) layout). In Hindi the jobs door comes first, as a
 * button: most hi-IN visitors to a place page are job seekers. Elsewhere
 * both orders are in the HTML and the visitor context shows the jobs-first
 * one to a visitor it reads as a job seeker (src/context/css.ts).
 */
export function LocationPage({ page: source, locale = "en-IN" }: { page: LocationCopy; locale?: Locale }) {
  const page = locationCopyIn(source, locale);
  const ui = uiIn(locale);
  const path = pathOf(page);
  const url = localePath(path, locale);
  const crewHref = `/contact#location=${page.placeId}`;
  // The jobs market for this page's job seekers: the region's, unless the
  // estate lies in a jobs market of its own (Kapurthala in the Jalandhar region).
  const jobsMarket = page.jobsMarket ?? page.cluster;
  const jobsHub = marketSurfaces()[jobsMarket]?.jobs;
  const hub = locationPages.get(locationPath(page.cluster));
  const jobsLabel = JOBS_AREA_LABEL[locale]?.[jobsMarket] ?? `Jobs in ${hub ? locationCopyIn(hub, locale).name : page.name}`;
  const jobsFirst = locale === "hi-IN" && Boolean(jobsHub);
  const englishOnly = locale === "en-IN" ? undefined : "en-IN";
  const [before, after] = page.areas ? page.paragraph.split("{areas}") : [page.paragraph, ""];
  const crewButton = (second: boolean) => (
    <Button asChild size="lg" variant={second ? "outline" : "default"}>
      <Link href={crewHref}>
        {ui.crew} <ArrowUpRight aria-hidden="true" />
      </Link>
    </Button>
  );
  return (
    <>
      <JsonLd data={webPageSchema({ name: page.metaTitle, description: page.description, url, inLanguage: locales[locale].hreflang })} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          "@id": `${pageUrl(url)}#service`,
          name: page.heading.replace(/\.$/, ""),
          serviceType: "Contract labour supply",
          description: page.description,
          provider: { "@id": `${pageUrl("/")}#organization` },
          areaServed: { "@type": "Place", name: page.name },
          url: pageUrl(url),
        }}
      />
      <PageHero
        crumbs={<Breadcrumbs path={path} locale={locale} name={page.name} />}
        title={page.heading}
        lede={page.lede}
        footnote={
          <>
            {/* Jobs first: always in Hindi; for a visitor the context reads as a job seeker,
                CSS shows this one before paint (owner decision, 18 Oct 2026; src/context/css.ts). */}
            {jobsHub && (
              <div className={`flex flex-wrap gap-3 pt-2 ${jobsFirst ? "" : "ctx-aud-jobs"}`}>
                <Button asChild size="lg">
                  <JobsLink path={jobsHubPath(jobsMarket)} locale={locale}>
                    {jobsLabel} <ArrowRight aria-hidden="true" />
                  </JobsLink>
                </Button>
                {crewButton(true)}
              </div>
            )}
            {!jobsFirst && (
              <div className={`flex flex-wrap items-center gap-x-8 gap-y-4 pt-2 ${jobsHub ? "ctx-aud-default" : ""}`}>
                {crewButton(false)}
                {jobsHub && (
                  <p className="seeker-line">
                    {ui.seeker}{" "}
                    <JobsLink path={jobsHubPath(jobsMarket)} locale={locale} className="text-link mt-0">
                      {jobsLabel} <ArrowRight size={18} aria-hidden="true" />
                    </JobsLink>
                  </p>
                )}
              </div>
            )}
          </>
        }
      />
      <ClientStrip label={ui.clients} afterRule />
      {isPaused(path, locale) && (
        <div className="site-shell pb-10">
          <PausedNotice kind="business" locale={locale} />
        </div>
      )}
      <Section className="border-t border-border">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.6fr]">
          <p className="eyebrow text-gold-700">{locale === "en-IN" ? page.name.toUpperCase() : page.name}</p>
          <div>
            <p className="text-xl leading-relaxed sm:text-2xl">
              {before}
              {page.areas && <Areas areas={page.areas} and={ui.and} />}
              {after}
            </p>
            <nav aria-label={ui.servicesLabel} className="mt-10">
              <p className="text-sm text-muted-foreground">{ui.servicesLabel}</p>
              <ul className="link-row mt-2">
                {SERVICE_HREFS.map((href, i) => (
                  <li key={href}>
                    <Link href={href} className="text-link" hrefLang={englishOnly}>
                      {ui.services[i]} <ArrowUpRight size={18} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </Section>
      <FaqSection title={ui.faqHeading} variant="subtle" items={page.faqs} open more={{ href: FAQ_PATH, label: ui.moreFaqs }} />
      <CtaBlock locale={locale} href={crewHref} />
    </>
  );
}

/**
 * /locations: every market's buyer page, one line each, in MARKET_ORDER
 * (no market first, owner direction 17 Oct 2026); MarketList moves the
 * visitor's market(s) to the front after load.
 */
export function LocationsIndex() {
  const hubs = new Map(
    [...locationPages.values()].filter((p) => !p.estate && linkable(pathOf(p), "en-IN")).map((p) => [p.cluster as string, p]),
  );
  const items: MarketItem[] = MARKET_ORDER.flatMap((id) => {
    const h = hubs.get(id);
    return h ? [{ cluster: id, href: localizeHref(pathOf(h), "en-IN"), title: h.name, text: h.lede }] : [];
  });
  return (
    <>
      <JsonLd data={webPageSchema({ name: "Locations", description: "Where Vayasya Seva supplies contract labour crews.", url: "/locations", type: "CollectionPage" })} />
      <PageHero title="Where we supply crews." lede="Andhra Pradesh, Bengaluru, Delhi NCR, Punjab, Telangana and Uttarakhand. Pick a region, or tell us where your site is." />
      <Section className="border-t border-border">
        <MarketList items={items} side="business" surface="locations-index" className="location-areas" />
      </Section>
      <CtaBlock />
    </>
  );
}
