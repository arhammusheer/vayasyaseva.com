import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";
import { siteConfig } from "@/content/site";
import { termsContent } from "@/content/terms";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of service for ${siteConfig.legalName}.`,
};

export default function TermsPage() {
  return <LegalPage content={termsContent} />;
}
