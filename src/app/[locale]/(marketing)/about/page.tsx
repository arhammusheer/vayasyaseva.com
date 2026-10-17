import { pageMetadata } from "@/lib/metadata";
import Link from "@/components/i18n/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { JsonLd, webPageSchema, breadcrumbSchema } from "@/lib/structured-data";
import { siteConfig } from "@/content/site";
import { localeParams } from "@/lib/i18n";
export const dynamicParams = false;
export const generateStaticParams = localeParams("/about");

// The search phrase stays in the title; the page itself is who we are: one
// sentence, then the facts. The contractor point stays on home and the
// records on /compliance.
const TITLE = "About Us: Labour Contractor and Manpower Supplier";
const DESCRIPTION =
  "Vayasya Seva Private Limited is a contract labour company incorporated in Haridwar, Uttarakhand, in 2023. The company's CIN, GSTIN and Udyam numbers.";

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
});

/**
 * Company facts with a number only. EPF and ESIC codes join once the owner
 * approves publishing them (docs/claims-register.md).
 */
const facts = [
  { label: "CIN", value: siteConfig.cin },
  { label: "GSTIN", value: siteConfig.gstin },
  { label: "MSME / UDYAM", value: siteConfig.msme },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd data={webPageSchema({ type: "AboutPage", name: TITLE, description: DESCRIPTION, url: "/about" })} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "About", href: "/about" },
        ])}
      />
      <PageHero
        title={
          <>
            A company built
            <br />
            around the work.
          </>
        }
        lede="Incorporated in Haridwar in 2023, we supply supervised crews to factories, warehouses and facilities in Bengaluru, Delhi NCR, Punjab and Uttarakhand."
      />
      <Section variant="subtle">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div>
            <p className="eyebrow text-gold-700">COMPANY INFORMATION</p>
            <h2 className="mt-5 text-4xl font-medium">
              Vayasya Seva
              <br />
              Private Limited
            </h2>
            <Link href="/locations" className="text-link">
              Where we supply crews <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <div>
            <dl className="divide-y border-y">
              {facts.map((d) => (
                <div key={d.label} className="py-5">
                  <dt className="mb-2 text-xs text-muted-foreground">{d.label}</dt>
                  <dd className="font-data text-sm">{d.value}</dd>
                </div>
              ))}
            </dl>
            <Link href="/vayasya-setu" className="text-link">
              Vayasya Setu, our workforce system <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Section>
      <CtaBlock />
    </>
  );
}
