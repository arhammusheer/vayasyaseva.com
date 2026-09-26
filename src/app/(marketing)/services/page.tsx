import { pageMetadata } from "@/lib/metadata";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { FaqSection } from "@/components/sections/faq-section";
import { servicesFaqs } from "@/content/faqs";
import { JsonLd, webPageSchema, breadcrumbSchema } from "@/lib/structured-data";
import { services } from "@/content/services";
import { servicePageSchema } from "@/lib/structured-data";
import { servicePages } from "@/content/service-pages";

const servicePageFor = new Map(servicePages.map((p) => [p.serviceId, p]));
export const metadata = pageMetadata({
  title: "Contract Labour & Industrial Services in Haridwar",
  description:
    "Explore contract labour, factory and warehouse manpower, housekeeping, civil works and maintenance services for Haridwar and SIDCUL sites.",
  alternates: { canonical: "/services" },
});
export default function ServicesPage() {
  return (
    <>
      <JsonLd
        data={webPageSchema({
          type: "CollectionPage",
          name: "Contract Labour & Industrial Services in Haridwar",
          description:
            "Explore contract labour, factory and warehouse manpower, housekeeping, civil works and maintenance services for Haridwar and SIDCUL sites.",
          url: "/services",
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Services", href: "/services" },
        ])}
      />
      <JsonLd data={servicePageSchema(services)} />
      <PageHero
        title={
          <>
            Contract labour and industrial services.
            <br />
            Planned around your site.
          </>
        }
        lede="Contract workers for factory, warehouse and facility operations in Haridwar and SIDCUL, alongside civil, fabrication and maintenance support."
      />
      <Section>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_2fr]">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="eyebrow text-gold-700">OUR CAPABILITIES</p>
            <h2 className="mt-5 text-3xl font-medium">
              Built around
              <br />
              your requirement.
            </h2>
            <p className="mt-5 max-w-xs text-muted-foreground">
              These are some of the ways we support our clients across{" "}
              <Link href="/industries" className="underline underline-offset-4">
                manufacturing, logistics and facilities
              </Link>{" "}
              in{" "}
              <Link
                href="/haridwar-sidcul"
                className="underline underline-offset-4"
              >
                Haridwar and SIDCUL
              </Link>
              . Tell us about your site, your priorities and the work you need
              done.
            </p>
            <Link href="/contact" className="text-link">
              Discuss your requirement <ArrowUpRight size={18} />
            </Link>
            <p className="mt-6 max-w-xs text-sm text-muted-foreground">
              Looking for a manpower supplier or labour provider? See how our{" "}
              <Link href="/services/contract-labour" className="underline underline-offset-4">
                contract labour service
              </Link>{" "}
              handles roles, site coordination and workforce records.
            </p>
          </div>
          <div>
            {services.map((service) => (
              <article
                id={service.id}
                key={service.id}
                className="scroll-mt-28 border-t py-8 first:pt-0 first:border-0"
              >
                <h2 className="text-3xl font-medium">{service.title}</h2>
                <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
                <details className="mt-4">
                  <summary className="cursor-pointer py-2 text-sm text-gold-700">
                    Typical roles &amp; support
                  </summary>
                  <div className="pt-3 text-sm text-muted-foreground leading-relaxed">
                    <p>{service.roles.join(", ")}.</p>
                    <p className="mt-3">
                      We plan the team, supervision and working arrangements
                      around your site.
                    </p>
                  </div>
                </details>
                {servicePageFor.has(service.id) && (
                  <Link
                    href={`/services/${servicePageFor.get(service.id)!.slug}`}
                    className="text-link"
                  >
                    {servicePageFor.get(service.id)!.name} in Haridwar &amp; SIDCUL{" "}
                    <ArrowUpRight size={16} />
                  </Link>
                )}
              </article>
            ))}
          </div>
        </div>
      </Section>
      <Section variant="subtle">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <h2 className="text-4xl font-medium">
            Compliance stays
            <br />
            part of the conversation.
          </h2>
          <div>
            <p className="text-muted-foreground leading-relaxed">
              Worker onboarding, attendance, wage records and statutory
              contributions are an important part of a labour engagement. Our
              compliance page explains the records and registrations available
              for review.
            </p>
            <Link href="/compliance" className="text-link">
              Labour compliance at Vayasya Seva <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </Section>
      <FaqSection eyebrow="QUESTIONS" items={servicesFaqs} />
      <CtaBlock />
    </>
  );
}
