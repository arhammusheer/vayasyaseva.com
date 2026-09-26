import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { JsonLd, breadcrumbSchema, webPageSchema } from "@/lib/structured-data";

const description =
  "Contract labour and industrial manpower for factory, warehouse and facility operations in Haridwar and SIDCUL. Review roles, planning and workforce records.";

export const metadata = pageMetadata({
  title: "Contract Labour & Manpower Services",
  description,
  alternates: { canonical: "/services/contract-labour" },
});

const workAreas = [
  {
    title: "Factory and production",
    text: "Production helpers, packers, line feeders, material handlers and quality check assistants for shopfloor work.",
    href: "/services/factory-labour",
    link: "Factory labour",
  },
  {
    title: "Warehouse and dispatch",
    text: "Teams for loading, unloading, picking, packing, stacking and dispatch, planned around warehouse activity.",
    href: "/services/warehouse-labour",
    link: "Warehouse labour",
  },
  {
    title: "Facilities and site support",
    text: "Housekeeping, pantry, grounds and other site support roles for industrial and business premises.",
    href: "/services/housekeeping",
    link: "Housekeeping services",
  },
];

const steps = [
  {
    title: "Define the requirement",
    text: "Tell us the site, work, roles, headcount, shifts and intended start date. We discuss site procedures and the supervision needed.",
  },
  {
    title: "Plan the workforce",
    text: "We discuss sourcing, onboarding and working arrangements against the agreed scope and the readiness of your site.",
  },
  {
    title: "Coordinate on site",
    text: "Attendance, shift coordination and day-to-day communication are planned with your operations and HR teams.",
  },
  {
    title: "Keep records reviewable",
    text: "Relevant onboarding, attendance, wage and applicable EPF and ESIC records are coordinated for client review.",
  },
];

export default function ContractLabourPage() {
  return (
    <>
      <JsonLd
        data={webPageSchema({
          name: "Contract Labour & Manpower Services",
          description,
          url: "/services/contract-labour",
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Services", href: "/services" },
          { name: "Contract labour", href: "/services/contract-labour" },
        ])}
      />
      <PageHero
        title={
          <>
            Contract labour for factory
            <br />
            and warehouse operations.
          </>
        }
        lede="Vayasya Seva brings workforce planning, site coordination and worker documentation together for industrial operations based in and around Haridwar and SIDCUL."
      />
      <Section>
        <div className="grid gap-10 md:grid-cols-[1fr_1.5fr]">
          <div>
            <p className="eyebrow text-gold-700">CONTRACT WORKFORCE</p>
            <h2 className="mt-5 text-3xl font-medium">A service shaped by the work.</h2>
          </div>
          <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
            <p>
              Businesses may search for a labour supplier, manpower provider or
              contract staffing partner. The practical question is the same:
              which people are needed, where will they work, and how will the
              engagement be managed?
            </p>
            <p>
              We discuss those details with your plant, warehouse or facility
              team before planning the workforce. Ongoing needs, project work
              and seasonal changes can call for different arrangements.
            </p>
            <Link href="/haridwar-sidcul" className="text-link">
              Labour contractor in Haridwar and SIDCUL <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </Section>
      <Section variant="subtle">
        <p className="eyebrow text-gold-700">WHERE WE SUPPORT OPERATIONS</p>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {workAreas.map((area) => (
            <article key={area.title}>
              <h2 className="text-2xl font-medium">{area.title}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{area.text}</p>
              <Link href={area.href} className="text-link">
                {area.link} <ArrowUpRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </Section>
      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow text-gold-700">HOW AN ENGAGEMENT STARTS</p>
            <h2 className="mt-5 text-3xl font-medium">From requirement to review.</h2>
          </div>
          <ol className="grid gap-7 sm:grid-cols-2">
            {steps.map((step, index) => (
              <li key={step.title} className="border-t pt-5">
                <span className="font-data text-sm text-gold-700">0{index + 1}</span>
                <h3 className="mt-3 text-xl font-medium">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>
      <Section variant="subtle">
        <div className="grid gap-8 md:grid-cols-2">
          <h2 className="text-3xl font-medium">Compliance in the engagement.</h2>
          <div>
            <p className="leading-relaxed text-muted-foreground">
              We are registered under EPF and ESIC. Worker onboarding,
              attendance, wage documentation and applicable statutory
              contribution records are part of the discussion with each client.
              Relevant records can be shared for vendor assessment and review.
            </p>
            <Link href="/compliance" className="text-link">
              Review our labour compliance approach <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </Section>
      <Section>
        <div className="max-w-2xl">
          <h2 className="text-3xl font-medium">Discuss a workforce requirement.</h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Send the site location, roles, approximate headcount, shift pattern
            and timing. We can then discuss the scope, supervision and
            documentation relevant to your operation.
          </p>
          <Link href="/contact" className="text-link">
            Contact Vayasya Seva <ArrowUpRight size={18} />
          </Link>
        </div>
      </Section>
      <CtaBlock />
    </>
  );
}
