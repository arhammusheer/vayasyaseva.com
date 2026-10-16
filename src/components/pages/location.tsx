import NextLink from "next/link";
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
import { linkable } from "@/content/registry";
import { JsonLd, pageUrl, webPageSchema } from "@/lib/structured-data";
import { areaSurfaces, jobsAreaHref } from "@/lib/intent/surfaces";
import { locationPages, type LocationCopy } from "@/content/locations";
import { estatePath, locationPath } from "@/content/registry/identifiers";

const pathOf = (p: LocationCopy) => (p.estate ? estatePath(p.cluster, p.estate) : locationPath(p.cluster));

/** The three crews, as on /haridwar-sidcul. */
const SERVICES = [
  { href: "/services/factory-labour", label: "Factory labour" },
  { href: "/services/loading-unloading-labour", label: "Loading and unloading" },
  { href: "/services/housekeeping", label: "Housekeeping and grounds" },
];

export function locationMetadata(p: LocationCopy) {
  return pageMetadata({ title: p.metaTitle, description: p.description, alternates: { canonical: pathOf(p) } });
}

/** "A, B and C", each a link, at the paragraph's {areas}. */
function Areas({ areas }: { areas: { href: string; name: string }[] }) {
  const live = areas.filter((a) => linkable(a.href, "en-IN"));
  return live.map((a, i) => (
    <span key={a.href}>
      {i > 0 && (i === live.length - 1 ? " and " : ", ")}
      <Link href={a.href} className="underline decoration-gold-500 underline-offset-4 hover:text-gold-700">
        {a.name}
      </Link>
    </span>
  ));
}

/**
 * A location page on the /haridwar-sidcul structure (owner direction,
 * 17 Oct 2026): the hero with Request a crew (prefilled with the place) and
 * a quiet jobs line where the cluster has a jobs hub; the client strip; one
 * paragraph on the place with its areas and the crews we supply; four
 * questions; the crew band. No phone (the (locations) layout).
 */
export function LocationPage({ page }: { page: LocationCopy }) {
  const url = pathOf(page);
  const hub = locationPages.get(locationPath(page.cluster));
  const crewHref = `/contact#location=${page.placeId}`;
  const jobsHub = areaSurfaces()[page.cluster]?.jobs;
  const [before, after] = page.areas ? page.paragraph.split("{areas}") : [page.paragraph, ""];
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
      <ClientStrip label="Our experience includes work with" afterRule />
      <Section className="border-t border-border">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.6fr]">
          <p className="eyebrow text-gold-700">{page.name.toUpperCase()}</p>
          <div>
            <p className="text-xl leading-relaxed sm:text-2xl">
              {before}
              {page.areas && <Areas areas={page.areas} />}
              {after}
            </p>
            <nav aria-label="Crews we supply" className="mt-10">
              <p className="text-sm text-muted-foreground">Crews we supply</p>
              <ul className="link-row mt-2">
                {SERVICES.map((s) => (
                  <li key={s.href}>
                    <Link href={s.href} className="text-link">
                      {s.label} <ArrowUpRight size={18} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </Section>
      <FaqSection title="Questions." variant="subtle" items={page.faqs} open more={{ href: FAQ_PATH, label: "More questions" }} />
      <CtaBlock href={crewHref} />
    </>
  );
}

/** /locations: SIDCUL Haridwar and every published region hub, one line each. */
export function LocationsIndex() {
  const hubs = [...locationPages.values()].filter((p) => !p.estate && linkable(pathOf(p), "en-IN"));
  return (
    <>
      <JsonLd data={webPageSchema({ name: "Locations", description: "Where Vayasya Seva supplies contract labour crews.", url: "/locations", type: "CollectionPage" })} />
      <PageHero title="Where we supply crews." lede="Uttarakhand, Bengaluru and Delhi NCR. Pick a region, or tell us where your site is." />
      <Section className="border-t border-border">
        <ul className="location-areas">
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
