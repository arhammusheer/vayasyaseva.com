import { pageMetadata } from "@/lib/metadata";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { JsonLd, webPageSchema, breadcrumbSchema } from "@/lib/structured-data";
import { siteConfig } from "@/content/site";
export const metadata = pageMetadata({
  title: "About Vayasya Seva, Labour Contractor in Haridwar",
  description:
    "Meet Vayasya Seva Private Limited, a Haridwar-based contract labour and industrial services company with a focus on people, site operations and labour compliance.",
  alternates: { canonical: "/about" },
});
export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={webPageSchema({
          type: "AboutPage",
          name: "About Vayasya Seva, Labour Contractor in Haridwar",
          description:
            "Meet Vayasya Seva Private Limited, a Haridwar-based contract labour and industrial services company with a focus on people, site operations and labour compliance.",
          url: "/about",
        })}
      />
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
        lede="Vayasya Seva brings people and practical support to business operations. Our roots are in Haridwar. Our approach starts with understanding what each client needs."
      />
      <Section>
        <div className="grid gap-10 md:grid-cols-2">
          <h2 className="text-4xl font-medium">
            Close to the people.
            <br />
            Close to the operation.
          </h2>
          <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
            <p>
              As a contract labour provider, we work with businesses to source,
              onboard and manage the people their operations need. Our work
              extends into housekeeping, site services, civil works, fabrication
              and maintenance.
            </p>
            <p>
              Careful compliance is a core part of that relationship. Our site
              teams and office coordinate worker documentation, attendance and
              statutory records alongside the daily work.
            </p>
            <Link href="/how-we-operate" className="text-link text-foreground">
              How we work with you <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </Section>
      <Section variant="subtle">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="eyebrow text-gold-700">COMPANY INFORMATION</p>
            <h2 className="mt-5 text-4xl font-medium">
              Vayasya Seva
              <br />
              Private Limited
            </h2>
            <p className="mt-5 text-muted-foreground">
              Based in Haridwar, Uttarakhand.
            </p>
            <Link href="/haridwar-sidcul" className="text-link">
              Our work in Haridwar &amp; SIDCUL <ArrowUpRight size={18} />
            </Link>
          </div>
          <dl className="divide-y border-y">
            {[
              { label: "GSTIN", value: siteConfig.gstin },
              { label: "MSME / UDYAM", value: siteConfig.msme },
              {
                label: "Email",
                value: siteConfig.email,
                href: `mailto:${siteConfig.email}`,
              },
              {
                label: "Phone",
                value: siteConfig.phone,
                href: `tel:${siteConfig.phone.replace(/\s/g, "")}`,
              },
            ].map((d) => (
              <div key={d.label} className="py-5">
                <dt className="text-xs text-muted-foreground mb-2">
                  {d.label}
                </dt>
                <dd className={d.href ? undefined : "font-data text-sm"}>
                  {d.href ? <a href={d.href}>{d.value}</a> : d.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>
      <CtaBlock />
    </>
  );
}
