import type { Metadata } from "next";
import { Section } from "@/components/layout/section";
import { Prose } from "@/components/layout/prose";
import { siteConfig } from "@/content/site";
import { termsContent } from "@/content/terms";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of service for ${siteConfig.legalName}.`,
};

export default function TermsPage() {
  return (
    <Section className="section-glow-contained section-glow-seva glow-left">
      <Prose content={termsContent} />
    </Section>
  );
}
