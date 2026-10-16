import { pageMetadata } from "@/lib/metadata";
import Link from "@/components/i18n/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { FaqSection } from "@/components/sections/faq-section";
import { complianceFaqs } from "@/content/faqs";
import { JsonLd, webPageSchema, breadcrumbSchema } from "@/lib/structured-data";
import { siteConfig } from "@/content/site";
import { localeParams } from "@/lib/i18n";
export const dynamicParams = false;
export const generateStaticParams = localeParams("/compliance");

const TITLE = "Contract Labour Compliance: EPF, ESIC, Wage Records";
const DESCRIPTION =
  "Contract labour compliance by the employer: we register workers for EPF and ESIC where they apply, deposit them monthly and keep registers open to you.";

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/compliance" },
});
/** What we do, in the home page's active voice: the workers are our employees. */
const records = [
  {
    title: "Worker onboarding and records",
    text: "We put each worker on our payroll with their identity and employment documents, and register them for EPF and ESIC where they apply.",
  },
  {
    title: "Attendance and wage registers",
    text: "We keep attendance for every shift and the wage register that follows from it, and pay wages from those records.",
  },
  {
    title: "EPF and ESIC contributions",
    text: "We deposit EPF and ESIC contributions every month for the workers they apply to, and give you the challans.",
  },
  {
    title: "Your reviews and audits",
    text: "Registers, wage slips, challans and our registration certificates are open for your monthly review, vendor assessment and audits.",
  },
];
export default function CompliancePage() {
  return (
    <>
      <JsonLd
        data={webPageSchema({
          type: "WebPage",
          name: TITLE,
          description: DESCRIPTION,
          url: "/compliance",
        })}
      />
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
            Labour compliance: EPF, ESIC,
            <br />
            wage registers and licences.
          </>
        }
        lede="Care for the workforce, and attention to the detail. The workers are on our payroll, so their EPF, ESIC and wage records are ours to keep, and open to you."
      />
      <Section>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1fr_1.6fr]">
          <div>
            <p className="eyebrow text-gold-700">COMPLIANCE IN PRACTICE</p>
            <h2 className="mt-5 text-4xl font-medium">
              The records behind
              <br />
              the relationship.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Your HR, operations and procurement teams can check every
              record for the workers on your site.
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
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
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
            <p className="mt-4 max-w-sm text-muted-foreground">
              Contract labour licence: before you sign, ask us for the
              registration and licence details that apply to your site.
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
            Request compliance documents <ArrowUpRight size={18} aria-hidden="true" />
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
      <FaqSection eyebrow="QUESTIONS" variant="subtle" items={complianceFaqs} />
      <CtaBlock />
    </>
  );
}
