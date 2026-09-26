import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { FaqSection } from "@/components/sections/faq-section";
import {
  JsonLd,
  breadcrumbSchema,
  serviceLandingSchema,
  webPageSchema,
} from "@/lib/structured-data";
import type { ServiceLandingContent } from "@/content/service-pages";

export function serviceLandingMetadata(page: ServiceLandingContent) {
  return pageMetadata({
    title: page.metaTitle,
    description: page.description,
    alternates: { canonical: `/services/${page.slug}` },
  });
}

/** Short service page: roles, how it is planned, related services, FAQs. */
export function ServiceLanding({ page }: { page: ServiceLandingContent }) {
  const url = `/services/${page.slug}`;
  return (
    <>
      <JsonLd
        data={webPageSchema({ name: page.metaTitle, description: page.description, url })}
      />
      <JsonLd
        data={serviceLandingSchema({ name: page.name, description: page.description, url })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Services", href: "/services" },
          { name: page.name, href: url },
        ])}
      />
      <PageHero title={page.heading} lede={page.lede} />
      <Section>
        <div className="grid gap-10 md:grid-cols-[1fr_1.6fr]">
          <div>
            <p className="eyebrow text-gold-700">TYPICAL ROLES</p>
            <h2 className="mt-5 text-3xl font-medium">Who we plan for.</h2>
          </div>
          <ul className="divide-y border-y">
            {page.roles.map((role) => (
              <li key={role} className="py-4 text-lg">
                {role}
              </li>
            ))}
          </ul>
        </div>
      </Section>
      <Section variant="subtle">
        <div className="grid gap-8 md:grid-cols-2">
          <h2 className="text-3xl font-medium">Planned around your site.</h2>
          <div>
            <p className="leading-relaxed text-muted-foreground">{page.planning}</p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Attendance, wage records and applicable EPF and ESIC contributions
              are maintained by us and available for your review.
            </p>
            <Link href="/compliance" className="text-link">
              Our labour compliance approach <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </Section>
      <Section>
        <p className="eyebrow text-gold-700">RELATED</p>
        <nav aria-label="Related services" className="mt-6 flex flex-wrap gap-x-10 gap-y-2">
          {page.related.map((r) => (
            <Link key={r.href} href={r.href} className="text-link">
              {r.label} <ArrowUpRight size={18} />
            </Link>
          ))}
          <Link href="/haridwar-sidcul" className="text-link">
            Labour contractor in Haridwar &amp; SIDCUL <ArrowUpRight size={18} />
          </Link>
        </nav>
      </Section>
      <FaqSection eyebrow="QUESTIONS" variant="subtle" items={page.faqs} />
      <CtaBlock />
    </>
  );
}
