import { pageMetadata } from "@/lib/metadata";
import Link from "@/components/i18n/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { JsonLd, webPageSchema, breadcrumbSchema } from "@/lib/structured-data";
import { siteConfig } from "@/content/site";
import { COMPLIANCE_HELP, COMPLIANCE_RECORDS, CONTRACTOR_CHECKS } from "@/content/compliance";
import { linkable } from "@/content/registry";
import { LWF_PATH, WAGE_HUB_PATH, guidePath } from "@/content/registry/identifiers";
import { localeParams } from "@/lib/i18n";
export const dynamicParams = false;
export const generateStaticParams = localeParams("/compliance");

const TITLE = "Labour Law Compliance: PF, ESIC, LWF, Contract Licence";
const DESCRIPTION =
  "Registers, payroll, EPF, ESIC, Professional Tax, Labour Welfare Fund and the contract labour licence: what we run for each worker, and the documents you get.";

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/compliance" },
});

/** Reference pages, in the resources line once published. */
const resources = [
  { href: WAGE_HUB_PATH, label: "Minimum wages by state" },
  { href: LWF_PATH, label: "Labour Welfare Fund by state" },
  { href: guidePath("new-labour-codes"), label: "New labour codes guide" },
].filter((r) => linkable(r.href, "en-IN"));

/** Ruled rows: a title and one line each, all visible. */
function Rows({ items }: { items: { title: string; text: string }[] }) {
  return (
    <ul className="jobs-work">
      {items.map((r) => (
        <li key={r.title}>
          <h3>{r.title}</h3>
          <p>{r.text}</p>
        </li>
      ))}
    </ul>
  );
}

export default function CompliancePage() {
  return (
    <>
      <JsonLd data={webPageSchema({ name: TITLE, description: DESCRIPTION, url: "/compliance" })} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Compliance", href: "/compliance" },
        ])}
      />
      <PageHero
        title="Labour compliance: the records we keep."
        lede="What we keep for every worker on your site, what to check with any contractor, and how to get the documents."
      />
      <Section>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.6fr]">
          <h2 className="text-4xl font-medium">For every worker.</h2>
          <div>
            <Rows items={COMPLIANCE_RECORDS} />
            <p className="compliance-line">
              <span>Registered under EPF and ESIC.</span>
              <Link href="/about" className="text-link">
                Company details on About <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
              <a href={`mailto:${siteConfig.email}?subject=Compliance%20documents`} className="text-link">
                Request compliance documents <ArrowUpRight size={18} aria-hidden="true" />
              </a>
            </p>
          </div>
        </div>
      </Section>
      <Section variant="subtle">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.6fr]">
          <h2 className="text-4xl font-medium">Before you sign with any contractor.</h2>
          <div>
            <Rows items={CONTRACTOR_CHECKS} />
            {resources.length > 0 && (
              <p className="link-row mt-10 border-t pt-4">
                {resources.map((r) => (
                  <Link key={r.href} href={r.href} className="text-link">
                    {r.label} <ArrowUpRight size={18} aria-hidden="true" />
                  </Link>
                ))}
              </p>
            )}
          </div>
        </div>
      </Section>
      <Section id="help">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.6fr]">
          <h2 className="text-4xl font-medium">{COMPLIANCE_HELP.heading}</h2>
          <div>
            <p className="text-lg leading-relaxed text-muted-foreground">{COMPLIANCE_HELP.text}</p>
            <Link href={COMPLIANCE_HELP.href} className="text-link">
              {COMPLIANCE_HELP.label} <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Section>
      <CtaBlock />
    </>
  );
}
