import { pageMetadata } from "@/lib/metadata";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { JsonLd, breadcrumbSchema } from "@/lib/structured-data";
import { siteConfig } from "@/content/site";
export const metadata = pageMetadata({
  title: "Labour Compliance, EPF & ESIC Support",
  description:
    "Vayasya Seva’s approach to contract labour compliance: worker documentation, attendance, wage records, EPF and ESIC contributions, and support for client reviews.",
  alternates: { canonical: "/compliance" },
});
const records = [
  {
    title: "Worker onboarding & records",
    text: "Worker identification, employment documentation and applicable EPF and ESIC enrolment form the basis of workforce administration.",
  },
  {
    title: "Attendance & wage documentation",
    text: "Site attendance and wage records help connect the work performed with payroll inputs and statutory reporting.",
  },
  {
    title: "EPF & ESIC contributions",
    text: "Contribution records and challans support the review of statutory payments for eligible workers.",
  },
  {
    title: "Client reviews & audit support",
    text: "Registration certificates, contribution records and workforce documentation can be shared for due diligence and review. Our team helps coordinate the documents relevant to your engagement.",
  },
];
export default function CompliancePage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Compliance", href: "/compliance" },
        ])}
      />
      <PageHero
        tone="dark"
        title={
          <>
            Care for the workforce.
            <br />
            Attention to the detail.
          </>
        }
        lede="Labour compliance is central to how we manage an engagement, from worker onboarding to the records your team needs to review."
      />
      <Section>
        <div className="grid gap-12 md:grid-cols-[1fr_1.6fr]">
          <div>
            <p className="eyebrow text-gold-700">COMPLIANCE IN PRACTICE</p>
            <h2 className="mt-5 text-4xl font-medium">
              The records behind
              <br />
              the relationship.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              We coordinate documentation with your HR, operations and
              procurement teams, keeping the requirements of the site and the
              workforce in view.
            </p>
          </div>
          <div className="detail-list">
            {records.map((r, i) => (
              <details key={r.title} open={i === 0}>
                <summary>{r.title}</summary>
                <div className="detail-body">
                  <p>{r.text}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </Section>
      <Section variant="subtle">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-4xl font-medium">
              Registered.
              <br />
              Open to review.
            </h2>
            <p className="mt-5 max-w-sm text-muted-foreground">
              Our registration documents are available during vendor onboarding
              and due diligence.
            </p>
          </div>
          <dl className="divide-y border-y">
            {[
              { label: "EPF", value: "Registered" },
              { label: "ESIC", value: "Registered" },
              { label: "GSTIN", value: siteConfig.gstin },
              { label: "MSME / UDYAM", value: siteConfig.msme },
            ].map((r) => (
              <div
                key={r.label}
                className="flex flex-wrap justify-between gap-3 py-5"
              >
                <dt>{r.label}</dt>
                <dd className="font-data text-sm text-muted-foreground break-all">
                  {r.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>
      <Section>
        <div className="max-w-2xl">
          <h2 className="text-4xl font-medium">Need a closer look?</h2>
          <p className="mt-4 text-muted-foreground">
            Tell us which documents your team needs for vendor assessment or an
            engagement review.
          </p>
          <a
            href={`mailto:${siteConfig.email}?subject=Compliance%20documentation`}
            className="text-link"
          >
            Request compliance documents <ArrowUpRight size={18} />
          </a>
          <p className="mt-8 text-sm text-muted-foreground">
            See how compliance fits into{" "}
            <Link href="/services" className="underline underline-offset-4">
              our workforce and industrial services
            </Link>
            .
          </p>
        </div>
      </Section>
      <CtaBlock />
    </>
  );
}
