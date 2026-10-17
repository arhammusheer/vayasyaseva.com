import { JobsLink } from "@/components/i18n/jobs-link";
import Link from "@/components/i18n/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { FaqSection } from "@/components/sections/faq-section";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd, serviceLandingSchema, webPageSchema } from "@/lib/structured-data";
import { nextServicePage, type ServiceLandingContent } from "@/content/service-pages";
import { faqHref } from "@/content/faq";

export function serviceLandingMetadata(page: ServiceLandingContent) {
  return pageMetadata({
    title: page.metaTitle,
    description: page.description,
    alternates: { canonical: `/services/${page.slug}` },
  });
}

/**
 * A service landing (English only): roles, one planning paragraph, its
 * FAQs (more on /faq#<slug>), the next sibling and the gold band. Request a crew sits in the
 * header and the band; the hero's one action is the quiet jobs line, to the
 * matching role page (neutral URL, so a seeker picks a language first).
 */
export function ServiceLanding({ page }: { page: ServiceLandingContent }) {
  const url = `/services/${page.slug}`;
  const next = nextServicePage(page.slug);
  return (
    <>
      <JsonLd data={webPageSchema({ name: page.metaTitle, description: page.description, url })} />
      <JsonLd data={serviceLandingSchema({ name: page.name, description: page.description, url })} />
      <PageHero
        crumbs={<Breadcrumbs path={url} locale="en-IN" name={page.name} />}
        title={page.heading}
        lede={page.lede}
        footnote={
          <p className="seeker-line">
            Looking for work?{" "}
            <JobsLink path={`/jobs/${page.jobs.role}`} locale="en-IN" className="text-link">
              {page.jobs.label} <ArrowRight size={18} aria-hidden="true" />
            </JobsLink>
          </p>
        }
      />
      <Section>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.6fr]">
          <h2 className="text-4xl font-medium">{page.rolesHeading}</h2>
          <div>
            <ul className="jobs-work">
              {page.roles.map((role) => (
                <li key={role.name}>
                  <h3>{role.name}</h3>
                  <p>{role.task}</p>
                </li>
              ))}
            </ul>
            <p className="mt-10 border-t pt-8 text-lg leading-relaxed text-muted-foreground">{page.planning}</p>
          </div>
        </div>
      </Section>
      <FaqSection variant="subtle" items={page.faqs} open more={{ href: faqHref(page.slug), label: "More questions" }} />
      <nav aria-label="Next service" className="service-next">
        <div className="site-shell">
          <Link href={`/services/${next.slug}`}>
            <span>NEXT</span>
            <strong>
              {next.name} <ArrowUpRight size={26} aria-hidden="true" />
            </strong>
          </Link>
        </div>
      </nav>
      <CtaBlock />
    </>
  );
}
