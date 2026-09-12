import { pageMetadata } from "@/lib/metadata";
import { LegalPage } from "@/components/layout/legal-page";
import { termsContent } from "@/content/terms";

export const metadata = pageMetadata({
  title: "Terms of Use",
  description:
    "Terms of Use for vayasyaseva.com and its subdomains: licence and permitted automated access, prohibited conduct, intellectual property, disclaimers, limitation of liability and governing law.",
  alternates: { canonical: "/terms" },
});

export default function TermsPage() {
  return <LegalPage content={termsContent} />;
}
