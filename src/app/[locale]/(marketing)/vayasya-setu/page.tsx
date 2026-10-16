import { pageMetadata } from "@/lib/metadata";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { CtaBlock } from "@/components/sections/cta-block";
import { JsonLd, webPageSchema } from "@/lib/structured-data";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SETU_LOGIN } from "@/components/layout/nav-links";
import { localeParams } from "@/lib/i18n";
export const dynamicParams = false;
export const generateStaticParams = localeParams("/vayasya-setu");

const TITLE = "Vayasya Setu, Workforce Management System";
const DESCRIPTION =
  "Vayasya Setu keeps the attendance, payroll inputs and EPF and ESIC records for each site we staff. Log in to Setu, or ask how it reports for your crew.";

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/vayasya-setu" },
});

const rows = [
  { title: "Attendance and deployment", text: "Who is working, where, and on which shift." },
  { title: "Payroll and compliance records", text: "Payroll inputs with the EPF and ESIC records, ready for review." },
  { title: "Reporting for your team", text: "Attendance and compliance reports in a format agreed with you." },
];

/** Most visitors here are clients looking for the login: it is the first, largest action. */
export default function SetuPage() {
  return (
    <>
      <JsonLd data={webPageSchema({ name: TITLE, description: DESCRIPTION, url: "/vayasya-setu" })} />
      <PageHero
        crumbs={<Breadcrumbs path="/vayasya-setu" locale="en-IN" name="Vayasya Setu" />}
        tone="dark"
        title="Vayasya Setu"
        lede="The system behind our crews: attendance, wage and challan records for your site, each month."
        footnote={
          <Button asChild size="lg" className="mt-4">
            <a href={SETU_LOGIN}>
              Log in to Setu <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
        }
      />
      <Section>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_1.6fr]">
          <h2 className="text-4xl font-medium">What Setu keeps.</h2>
          <ul className="jobs-work">
            {rows.map((r) => (
              <li key={r.title}>
                <h3>{r.title}</h3>
                <p>{r.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>
      <CtaBlock variant="setu" />
    </>
  );
}
