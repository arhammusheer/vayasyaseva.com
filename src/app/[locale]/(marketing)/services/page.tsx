import { pageMetadata } from "@/lib/metadata";
import Link from "@/components/i18n/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { JsonLd, webPageSchema, breadcrumbSchema, servicePageSchema } from "@/lib/structured-data";
import { servicePages } from "@/content/service-pages";
import { ENGAGEMENT_STEPS, SECTORS } from "@/content/services";
import { localeParams } from "@/lib/i18n";

export const dynamicParams = false;
export const generateStaticParams = localeParams("/services");

const TITLE = "Contract Labour: Factory, Loading and Housekeeping";
const DESCRIPTION =
  "Factory, loading and unloading, and housekeeping crews in Bengaluru, Delhi NCR, Punjab and Uttarakhand, and how an engagement runs, site visit to records.";

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/services" },
});

/** The services hub: the three crews, the sectors we staff, and the four engagement steps. */
export default function ServicesPage() {
  return (
    <>
      <JsonLd data={webPageSchema({ type: "CollectionPage", name: TITLE, description: DESCRIPTION, url: "/services" })} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Services", href: "/services" },
        ])}
      />
      <JsonLd data={servicePageSchema(servicePages)} />
      <PageHero
        title="What we supply."
        lede="Supervised crews for shopfloors, docks and premises, wherever your site is."
      />
      <section className="capability-section">
        <div className="site-shell">
          <div className="capability-list">
            {servicePages.map((s) => (
              <Link className="capability-row" key={s.slug} href={`/services/${s.slug}`}>
                <h2>{s.name}</h2>
                <p>{s.summary}</p>
                <ArrowUpRight size={24} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Section id="sectors" className="scroll-mt-28">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.6fr]">
          <h2 className="text-4xl font-medium">Sites we staff.</h2>
          <p className="max-w-[40ch] text-xl leading-relaxed sm:text-2xl">{SECTORS}</p>
        </div>
      </Section>
      <Section variant="subtle" id="engagement">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.6fr]">
          <h2 className="text-4xl font-medium">How an engagement runs.</h2>
          <ol className="tracked-list is-steps">
            {ENGAGEMENT_STEPS.map((step, i) => (
              <li key={step.title}>
                <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>
      <CtaBlock />
    </>
  );
}
