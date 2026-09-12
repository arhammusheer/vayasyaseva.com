import { pageMetadata } from "@/lib/metadata";
import { LegalPage } from "@/components/layout/legal-page";
import { privacyContent } from "@/content/privacy";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "Privacy Policy of Vayasya Seva Private Limited: the information collected through vayasyaseva.com and its subdomains, how it is used and shared, retention, your rights and the Grievance Officer.",
  alternates: { canonical: "/privacy" },
});

export default function PrivacyPage() {
  return <LegalPage content={privacyContent} />;
}
