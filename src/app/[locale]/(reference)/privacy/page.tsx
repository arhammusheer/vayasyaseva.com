import Link from "@/components/i18n/link";
import { pageMetadata } from "@/lib/metadata";
import { JsonLd, webPageSchema, breadcrumbSchema } from "@/lib/structured-data";
import { LegalPage } from "@/components/layout/legal-page";
import { analyticsSummary, privacyContent } from "@/content/privacy";
import { linkable } from "@/content/registry";
import { localeParams } from "@/lib/i18n";

export const dynamicParams = false;
export const generateStaticParams = localeParams("/privacy");

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "Privacy Policy of Vayasya Seva Private Limited: the information collected through vayasyaseva.com and its subdomains, how it is used and shared, retention, your rights and the Grievance Officer.",
  alternates: { canonical: "/privacy" },
});

/** §3 at a glance: what runs, when, and what it receives. The detail stays in §2. */
function AnalyticsTable() {
  return (
    <div className="legal-table-wrap">
      <table className="legal-table">
        <caption className="sr-only">What each kind of measurement does, and when it runs</caption>
        <thead>
          <tr>
            <th scope="col">What</th>
            <th scope="col">When</th>
            <th scope="col">What it receives</th>
          </tr>
        </thead>
        <tbody>
          {analyticsSummary.map((row) => (
            <tr key={row.what}>
              <th scope="row">{row.what}</th>
              <td>{row.when}</td>
              <td>{row.gets}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={webPageSchema({
          name: "Privacy Policy",
          description:
            "Privacy Policy of Vayasya Seva Private Limited: the information collected through vayasyaseva.com and its subdomains, how it is used and shared, retention, your rights and the Grievance Officer.",
          url: "/privacy",
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Privacy Policy", href: "/privacy" },
        ])}
      />
      <LegalPage
        content={privacyContent}
        inserts={{
          "analytics-table": <AnalyticsTable />,
          // The applicant notice in their own language, once it is published.
          "jobs-privacy": linkable("/jobs/privacy") ? (
            <p>
              <strong>Applying for work?</strong> Read the short version in English, Hindi or Hinglish:{" "}
              <Link href="/jobs/privacy">what happens to your details</Link>. The full applicant terms follow, for the record.
            </p>
          ) : null,
        }}
      />
    </>
  );
}
