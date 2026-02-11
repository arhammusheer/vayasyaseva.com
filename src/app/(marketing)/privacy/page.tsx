import type { Metadata } from "next";
import { Section } from "@/components/layout/section";
import { Prose } from "@/components/layout/prose";
import { siteConfig } from "@/content/site";
import { privacyContent } from "@/content/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy policy for ${siteConfig.legalName}.`,
};

export default function PrivacyPage() {
  return (
    <Section className="section-glow-seva glow-left">
      <Prose content={privacyContent} />
    </Section>
  );
}
