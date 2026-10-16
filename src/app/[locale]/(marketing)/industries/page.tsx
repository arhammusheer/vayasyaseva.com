import { pageMetadata } from "@/lib/metadata";
import Link from "@/components/i18n/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { FaqSection } from "@/components/sections/faq-section";
import { industriesFaqs } from "@/content/faqs";
import { JsonLd, webPageSchema, breadcrumbSchema } from "@/lib/structured-data";
import { industries } from "@/content/industries";
import { localeParams } from "@/lib/i18n";
export const dynamicParams = false;
export const generateStaticParams = localeParams("/industries");

export const metadata = pageMetadata({
  title: "Industries We Supply Contract Labour To",
  description:
    "Contract labour for manufacturing, warehousing, FMCG, institutional campuses and hospitality sites, on full 8-hour shifts. Workers on our payroll, not yours.",
  alternates: { canonical: "/industries" },
});
export default function IndustriesPage() {
  return (
    <>
      <JsonLd
        data={webPageSchema({
          type: "CollectionPage",
          name: "Industries We Supply Contract Labour To",
          description:
            "Contract labour for manufacturing, warehousing, FMCG, institutional campuses and hospitality sites, on full 8-hour shifts. Workers on our payroll, not yours.",
          url: "/industries",
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Industries", href: "/industries" },
        ])}
      />
      <PageHero
        title={
          <>
            Industries we supply
            <br />
            contract labour to.
          </>
        }
        lede="Different businesses, each understood on its own terms: production demands, site conditions and the people who do the work."
      />
      <Section>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_2fr]">
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
      <FaqSection eyebrow="QUESTIONS" variant="subtle" items={industriesFaqs} />
      <CtaBlock />
    </>
  );
}
