import { pageMetadata } from "@/lib/metadata";
import { JsonLd, webPageSchema, breadcrumbSchema } from "@/lib/structured-data";
import { LegalPage } from "@/components/layout/legal-page";
import { termsContent } from "@/content/terms";

export const metadata = pageMetadata({
  title: "Terms of Use",
  description:
    "Terms of Use for vayasyaseva.com and its subdomains: licence and permitted automated access, prohibited conduct, intellectual property, disclaimers, limitation of liability and governing law.",
  alternates: { canonical: "/terms" },
});

export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={webPageSchema({
          name: "Terms of Use",
          description:
            "Terms of Use for vayasyaseva.com and its subdomains: licence and permitted automated access, prohibited conduct, intellectual property, disclaimers, limitation of liability and governing law.",
          url: "/terms",
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Terms of Use", href: "/terms" },
        ])}
      />
      <LegalPage content={termsContent} />
    </>
  );
}
