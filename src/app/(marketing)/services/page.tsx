import { pageMetadata } from "@/lib/metadata";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { JsonLd, breadcrumbSchema } from "@/lib/structured-data";
import { services } from "@/content/services";
import { servicePageSchema } from "@/lib/structured-data";
export const metadata = pageMetadata({
  title: "Contract Labour, Workforce & Industrial Services",
  description:
    "Explore Vayasya Seva’s contract labour, manpower supply, housekeeping, civil works, fabrication and maintenance services in Haridwar and SIDCUL.",
  alternates: { canonical: "/services" },
});
export default function ServicesPage() {
  return (
    <>
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
            People for your operations.
            <br />
            Support for what comes next.
          </>
        }
        lede="Contract labour is at the heart of our work. Alongside it, we support the facilities, projects and everyday operations that keep a business running."
      />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="eyebrow text-seva">OUR CAPABILITIES</p>
            <h2 className="mt-5 text-3xl font-medium">
              Built around
              <br />
              your requirement.
            </h2>
            <p className="mt-5 max-w-xs text-muted-foreground">
              These are some of the ways we support our clients. Tell us about
              your site, your priorities and the work you need done.
            </p>
            <Link href="/contact" className="text-link">
              Discuss your requirement <ArrowUpRight size={18} />
            </Link>
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
                  <summary className="cursor-pointer py-2 text-sm text-seva">
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
              </article>
            ))}
          </div>
        </div>
      </Section>
      <Section variant="subtle">
        <div className="grid gap-6 md:grid-cols-2">
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
      <CtaBlock />
    </>
  );
}
