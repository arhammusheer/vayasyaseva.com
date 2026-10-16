import { pageMetadata } from "@/lib/metadata";
import Link from "@/components/i18n/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { JsonLd, webPageSchema, breadcrumbSchema } from "@/lib/structured-data";
import { siteConfig } from "@/content/site";
import { businessPhone, businessPhoneHref } from "@/content/business-contact";
import { localeParams } from "@/lib/i18n";
import { editorialPolicy } from "@/content/editorial";
export const dynamicParams = false;
export const generateStaticParams = localeParams("/about");

const TITLE = "About Us: Labour Contractor in Haridwar";
const DESCRIPTION =
  "Vayasya Seva Private Limited is a labour contractor based in Haridwar. We employ the workers we deploy: wages, EPF, ESIC and supervision are ours.";

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
});
export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={webPageSchema({
          type: "AboutPage",
          name: TITLE,
          description: DESCRIPTION,
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
            About us: a labour
            <br />
            contractor in Haridwar.
          </>
        }
        lede="Vayasya Seva Private Limited is based in Haridwar, Uttarakhand. We employ the workers we deploy: wages, EPF, ESIC and supervision are ours."
      />
      <Section>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <h2 className="text-4xl font-medium">
            Close to the people.
            <br />
            Close to the operation.
          </h2>
          <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">
            <p>
              We supply contract labour to factories, warehouses and
              facilities. The workers are our employees, on our payroll: we
              pay their wages, deposit EPF and ESIC where they apply,
              supervise them on site and replace absentees. Our work also
              covers data entry operators, housekeeping, site services, civil
              works, fabrication and maintenance.
            </p>
            <p>
              Careful compliance is part of the job. We keep the attendance
              and wage registers and the EPF and ESIC challans alongside the
              daily work, and open them to each client for review.
            </p>
            <Link href="/how-we-operate" className="text-link text-foreground">
              How we work with you <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </Section>
      <Section variant="subtle">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div>
            <p className="eyebrow text-gold-700">COMPANY INFORMATION</p>
            <h2 className="mt-5 text-4xl font-medium">
              Company facts
            </h2>
            <p className="mt-5 text-muted-foreground">
              Based in Haridwar, Uttarakhand.
            </p>
            <Link href="/haridwar-sidcul" className="text-link">
              Our work in SIDCUL Haridwar <ArrowUpRight size={18} />
            </Link>
          </div>
          <dl className="divide-y border-y">
            {[
              { label: "CIN", value: siteConfig.cin },
              { label: "EPF", value: "Registered" },
              { label: "ESIC", value: "Registered" },
              { label: "GSTIN", value: siteConfig.gstin },
              { label: "MSME / UDYAM", value: siteConfig.msme },
              {
                label: "Email",
                value: siteConfig.email,
                href: `mailto:${siteConfig.email}`,
              },
              {
                label: "Phone",
                value: businessPhone.display,
                href: businessPhoneHref,
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
      <Section id="editorial">
        <div className="wage-split">
          <div>
            <p className="eyebrow text-gold-700">{editorialPolicy.eyebrow}</p>
            <h2 className="wage-h2">{editorialPolicy.heading}</h2>
          </div>
          <div className="wage-prose">
            <p>{editorialPolicy.intro}</p>
            <ul className="jobs-work guide-rows">
              {editorialPolicy.items.map((item) => (
                <li key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </li>
              ))}
            </ul>
            <p>
              Write to{" "}
              <a href={`mailto:${siteConfig.email}`} className="font-data">
                {siteConfig.email}
              </a>
            </p>
          </div>
        </div>
      </Section>
      <CtaBlock />
    </>
  );
}
