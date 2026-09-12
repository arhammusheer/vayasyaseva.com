import { pageMetadata } from "@/lib/metadata";
import { JsonLd, webPageSchema, breadcrumbSchema } from "@/lib/structured-data";
import { LegalPage } from "@/components/layout/legal-page";
import { privacyContent } from "@/content/privacy";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "Privacy Policy of Vayasya Seva Private Limited: the information collected through vayasyaseva.com and its subdomains, how it is used and shared, retention, your rights and the Grievance Officer.",
  alternates: { canonical: "/privacy" },
});

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
      <LegalPage content={privacyContent} />
    </>
  );
}
