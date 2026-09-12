import { pageMetadata } from "@/lib/metadata";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { JsonLd, breadcrumbSchema } from "@/lib/structured-data";
export const metadata = pageMetadata({
  title: "Vayasya Setu | Workforce Operations",
  description:
    "Vayasya Setu supports Vayasya Seva’s workforce operations with attendance, deployment information, payroll inputs and compliance records.",
  alternates: { canonical: "/vayasya-setu" },
});
export default function SetuPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Vayasya Setu", href: "/vayasya-setu" },
        ])}
      />
      <PageHero
        tone="dark"
        title="Vayasya Setu"
        lede="Our internal system for connecting the people on site with the information behind the operation."
      />
      <Section>
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <p className="eyebrow text-seva">SUPPORTING OUR PEOPLE</p>
            <h2 className="mt-5 text-4xl font-medium">
              Better information.
              <br />
              Closer coordination.
            </h2>
            <p className="mt-5 max-w-md text-muted-foreground leading-relaxed">
              Setu helps our teams work from a shared view of attendance,
              deployment and workforce records. It supports the service you
              receive from Vayasya Seva.
            </p>
          </div>
          <div className="detail-list">
            {[
              {
                title: "Attendance & deployment",
                text: "A record of who is working, where they are deployed and the attendance information used by the operations team.",
              },
              {
                title: "Payroll & compliance records",
                text: "Workforce records and payroll inputs brought together with EPF and ESIC information for administration and review.",
              },
              {
                title: "Reporting for your team",
                text: "Attendance, deployment and compliance information in reports suited to your engagement. Formats and delivery are discussed with your team.",
              },
            ].map((r, i) => (
              <details open={i === 0} key={r.title}>
                <summary>{r.title}</summary>
                <div className="detail-body">{r.text}</div>
              </details>
            ))}
          </div>
        </div>
      </Section>
      <Section variant="subtle">
        <h2 className="text-3xl font-medium">Part of how we work.</h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Our team manages Setu as part of day-to-day operations. We’ll discuss
          any reporting or system requirements as we plan the engagement.
        </p>
        <Link href="/how-we-operate" className="text-link">
          Our approach to your engagement <ArrowUpRight size={18} />
        </Link>
      </Section>
      <CtaBlock />
    </>
  );
}
