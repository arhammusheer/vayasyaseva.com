import NextLink from "next/link";
import Link from "@/components/i18n/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { CtaBlock } from "@/components/sections/cta-block";
import { FaqSection } from "@/components/sections/faq-section";
import { FAQ_PATH } from "@/content/faq";
import { linkable } from "@/content/registry";
import { JsonLd, pageUrl, webPageSchema } from "@/lib/structured-data";
import { areaSurfaces, jobsAreaHref } from "@/lib/intent/surfaces";
import type { LocationCopy } from "@/content/locations";
import { LOCATION_ESTATES, estatePath, locationPath } from "@/content/registry/identifiers";
import { locationPages } from "@/content/locations";

const pathOf = (p: LocationCopy) => (p.estate ? estatePath(p.cluster, p.estate) : locationPath(p.cluster));

export function locationMetadata(p: LocationCopy) {
  return pageMetadata({ title: p.metaTitle, description: p.description, alternates: { canonical: pathOf(p) } });
}

/**
 * A location page (owner direction, 16 Oct 2026): a region hub or an
 * industrial area. One job: show a buyer we know the place and get the
 * requirement, through Request a crew prefilled with the place. The facts
 * come from the page's cited sources; nothing is claimed about tenants,
 * headcount or registrations. Jobs pages for the cluster, where they exist,
 * get one quiet line.
 */
export function LocationPage({ page }: { page: LocationCopy }) {
  const url = pathOf(page);
  const hub = locationPages.get(locationPath(page.cluster));
  const crewHref = `/contact#location=${page.placeId}`;
  const jobsHub = areaSurfaces()[page.cluster]?.jobs;
  const siblings = page.estate
    ? LOCATION_ESTATES[page.cluster]
        .filter((e) => e !== page.estate)
        .map((e) => locationPages.get(estatePath(page.cluster, e)))
        .filter((p): p is LocationCopy => Boolean(p) && linkable(pathOf(p!), "en-IN"))
    : [];
  const ruleLinks = page.rules.links.filter((l) => linkable(l.href, "en-IN"));
  return (
    <>
      <JsonLd data={webPageSchema({ name: page.metaTitle, description: page.description, url })} />
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
        crumbs={<Breadcrumbs path={url} locale="en-IN" name={page.name} />}
        title={page.heading}
        lede={page.lede}
        footnote={
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-2">
            <Button asChild size="lg">
              <Link href={crewHref}>
                Request a crew <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
            {jobsHub && (
              <p className="seeker-line">
                Looking for work?{" "}
                <NextLink href={jobsAreaHref(page.cluster, "en-IN")} className="text-link mt-0" prefetch={false}>
                  Jobs in {hub?.name ?? page.name} <ArrowRight size={18} aria-hidden="true" />
                </NextLink>
              </p>
            )}
          </div>
        }
      />
      <Section className="border-t border-border">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.6fr]">
          <dl className="location-facts">
            {page.facts.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
          <div>
            <p className="text-xl leading-relaxed">{page.intro}</p>
            {page.areas && page.areas.length > 0 && (
              <ul className="location-areas">
                {page.areas
                  .filter((a) => linkable(a.href, "en-IN"))
                  .map((a) => (
                    <li key={a.href}>
                      <Link href={a.href}>
                        <strong>
                          {a.name} <ArrowUpRight size={20} aria-hidden="true" />
                        </strong>
                        <span>{a.text}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </Section>
      {page.sections.map((s, i) => (
        <Section key={s.heading} variant={i % 2 === 0 ? "subtle" : "default"}>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.6fr]">
            <h2 className="text-3xl font-medium">{s.heading}</h2>
            <div className="location-prose">
              {s.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
        </Section>
      ))}
      <Section className="border-t border-border">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.6fr]">
          <h2 className="text-3xl font-medium">Wages and rules here</h2>
          <div>
            <p className="text-lg leading-relaxed text-muted-foreground">{page.rules.text}</p>
            {ruleLinks.length > 0 && (
              <p className="link-row mt-4">
                {ruleLinks.map((l) => (
                  <Link key={l.href} href={l.href} className="text-link">
                    {l.label} <ArrowUpRight size={18} aria-hidden="true" />
                  </Link>
                ))}
              </p>
            )}
          </div>
        </div>
      </Section>
      <FaqSection variant="subtle" items={page.faqs} open more={{ href: FAQ_PATH, label: "More questions" }} />
      {(siblings.length > 0 || (page.estate && hub)) && (
        <nav aria-label="Nearby areas" className="site-shell location-siblings">
          {page.estate && hub && (
            <Link href={locationPath(page.cluster)} className="text-link">
              All of {hub.name} <ArrowRight size={18} aria-hidden="true" />
            </Link>
          )}
          {siblings.map((s) => (
            <Link key={s.estate} href={pathOf(s)} className="text-link">
              {s.name} <ArrowRight size={18} aria-hidden="true" />
            </Link>
          ))}
        </nav>
      )}
      <Section className="border-t border-border">
        <details className="wage-more is-section">
          <summary>Sources ({page.sources.length})</summary>
          <ol className="wage-sources">
            {page.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url}>{s.label}</a>
              </li>
            ))}
          </ol>
        </details>
      </Section>
      <CtaBlock href={crewHref} />
    </>
  );
}

/** /locations: every published region hub, with its industrial areas. */
export function LocationsIndex() {
  const hubs = [...locationPages.values()].filter((p) => !p.estate && linkable(pathOf(p), "en-IN"));
  return (
    <>
      <JsonLd data={webPageSchema({ name: "Locations", description: "Where Vayasya Seva supplies contract labour crews.", url: "/locations", type: "CollectionPage" })} />
      <PageHero title="Where we supply crews." lede="Uttarakhand, Bengaluru and Delhi NCR. Pick a region, or tell us where your site is." />
      <Section className="border-t border-border">
        <ul className="location-areas is-index">
          {linkable("/haridwar-sidcul", "en-IN") && (
            <li>
              <Link href="/haridwar-sidcul">
                <strong>
                  SIDCUL Haridwar <ArrowUpRight size={20} aria-hidden="true" />
                </strong>
                <span>Our home base: SIDCUL, Bahadrabad, Bhagwanpur and Roorkee.</span>
              </Link>
            </li>
          )}
          {hubs.map((h) => (
            <li key={h.cluster}>
              <Link href={pathOf(h)}>
                <strong>
                  {h.name} <ArrowUpRight size={20} aria-hidden="true" />
                </strong>
                <span>{h.lede}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
      <CtaBlock />
    </>
  );
}
