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
import { StateReference } from "@/components/sections/state-reference";
import { JobsLink } from "@/components/i18n/jobs-link";
import { faqHref } from "@/content/faq";
import { linkable } from "@/content/registry";
import { locationPages } from "@/content/locations";
import { locationPath } from "@/content/registry/identifiers";
import { getServicePage } from "@/content/service-pages";
import { serviceMarketPages, serviceMarketPath, type ServiceMarketCopy } from "@/content/service-markets";
import { JsonLd, pageUrl, serviceLandingSchema, webPageSchema } from "@/lib/structured-data";

export function serviceMarketMetadata(p: ServiceMarketCopy) {
  return pageMetadata({ title: p.metaTitle, description: p.description, alternates: { canonical: serviceMarketPath(p.service, p.market) } });
}

/** The published markets of a service, for the service landing and the location pages. */
export function serviceMarketLinks(service: ServiceMarketCopy["service"]) {
  return serviceMarketPages
    .filter((p) => p.service === service && linkable(serviceMarketPath(p.service, p.market), "en-IN"))
    .map((p) => ({ href: serviceMarketPath(p.service, p.market), name: p.name }));
}

/**
 * A service in one market (owner direction, 24 Nov 2026): the service's
 * roles, where the teams work in the market (its location page and areas),
 * the state's reference pages as links, four questions and the crew band.
 * English only. Request a crew carries the market's place, as on the
 * location page.
 */
export function ServiceMarketPage({ page }: { page: ServiceMarketCopy }) {
  const url = serviceMarketPath(page.service, page.market);
  const service = getServicePage(page.service);
  const hubPath = locationPath(page.market);
  const hub = locationPages.get(hubPath);
  const crewHref = hub ? `/contact#location=${hub.placeId}` : "/contact";
  const areaLinks = (hub?.areas ?? []).filter((a): a is typeof a & { href: string } => Boolean(a.href) && linkable(a.href!, "en-IN"));
  return (
    <>
      <JsonLd data={webPageSchema({ name: page.metaTitle, description: page.description, url })} />
      <JsonLd
        data={{
          ...serviceLandingSchema({ name: `${service.name}, ${page.name}`, description: page.description, url }),
          areaServed: { "@type": "Place", name: page.name },
          "@id": `${pageUrl(url)}#service`,
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
            <p className="seeker-line">
              Looking for work?{" "}
              <JobsLink path={`/jobs/${service.jobs.role}`} locale="en-IN" className="text-link mt-0">
                {service.jobs.label} <ArrowRight size={18} aria-hidden="true" />
              </JobsLink>
            </p>
          </div>
        }
      />
      <ClientStrip label="Our experience includes work with" afterRule />
      <Section className="border-t border-border">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.6fr]">
          <h2 className="text-4xl font-medium">{service.rolesHeading}</h2>
          <div>
            <ul className="jobs-work">
              {service.roles.map((role) => (
                <li key={role.name}>
                  <h3>{role.name}</h3>
                  <p>{role.task}</p>
                </li>
              ))}
            </ul>
            <p className="mt-10 border-t pt-8 text-lg leading-relaxed">{page.paragraph}</p>
            <nav aria-label={`Contract labour in ${page.name}`} className="mt-8">
              <p className="text-sm text-muted-foreground">{page.name}</p>
              <ul className="link-row mt-2">
                {hub && linkable(hubPath, "en-IN") && (
                  <li>
                    <Link href={hubPath} className="text-link">
                      All crews in {page.name} <ArrowRight size={18} aria-hidden="true" />
                    </Link>
                  </li>
                )}
                {areaLinks.map((a) => (
                  <li key={a.href}>
                    <Link href={a.href} className="text-link">
                      {a.name} <ArrowRight size={18} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <StateReference market={page.market} />
          </div>
        </div>
      </Section>
      <FaqSection variant="subtle" items={page.faqs} open more={{ href: faqHref(page.service), label: "More questions" }} />
      <CtaBlock href={crewHref} />
    </>
  );
}
