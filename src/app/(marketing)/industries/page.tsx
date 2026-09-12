import { pageMetadata } from "@/lib/metadata";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { JsonLd, breadcrumbSchema } from "@/lib/structured-data";
import { industries } from "@/content/industries";
export const metadata = pageMetadata({
  title: "Workforce Support for Manufacturing, Logistics & Facilities",
  description:
    "Contract labour and site support for manufacturing, warehousing, FMCG, institutional facilities and hospitality operations. Discuss your sector with Vayasya Seva.",
  alternates: { canonical: "/industries" },
});
export default function IndustriesPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Industries", href: "/industries" },
        ])}
      />
      <PageHero
        title={
          <>
            Different businesses.
            <br />A personal understanding.
          </>
        }
        lede="The right workforce arrangement starts with the realities of your industry: production demands, site conditions and the people who do the work."
      />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow text-gold-700">WHERE WE CAN HELP</p>
            <p className="mt-5 max-w-sm text-lg text-muted-foreground leading-relaxed">
              From factory floors to business campuses, we support a range of
              working environments. We welcome a conversation about yours.
            </p>
            <Link href="/services" className="text-link">
              Our services <ArrowUpRight size={18} />
            </Link>
          </div>
          <div>
            {industries.map((i) => (
              <article
                key={i.id}
                id={i.id}
                className="scroll-mt-28 border-t py-7 first:border-0 first:pt-0"
              >
                <h2 className="text-3xl font-medium">{i.title}</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  {i.description}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {i.staffingPattern}
                </p>
              </article>
            ))}
          </div>
        </div>
      </Section>
      <CtaBlock />
    </>
  );
}
