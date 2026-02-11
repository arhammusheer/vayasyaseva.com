import type { Metadata } from "next";
import { Section } from "@/components/layout/section";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy policy for ${siteConfig.legalName}.`,
};

export default function PrivacyPage() {
  return (
    <Section>
      <div className="prose prose-neutral mx-auto max-w-3xl">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">
          Last updated: February 2026
        </p>

        <h2>1. Information We Collect</h2>
        <p>
          When you submit a requirement through our contact form, we collect
          the following information: your name, company name, role, phone
          number, email address, site location, industry, headcount
          requirement, shift requirement, target start date, and requirement
          details.
        </p>

        <h2>2. How We Use Your Information</h2>
        <p>
          We use the information you provide solely for the purpose of
          responding to your workforce requirement inquiry. Specifically:
        </p>
        <ul>
          <li>To assess and respond to your operational requirements</li>
          <li>To communicate with you regarding your inquiry</li>
          <li>To prepare deployment assessments and proposals</li>
        </ul>

        <h2>3. Information Sharing</h2>
        <p>
          We do not sell, rent, or share your personal information with third
          parties for marketing purposes. Your information may be shared only
          with VSPL operations staff involved in responding to your inquiry.
        </p>

        <h2>4. Data Retention</h2>
        <p>
          Inquiry data is retained for the duration necessary to respond to
          your requirement and for a reasonable period thereafter for
          follow-up purposes. You may request deletion of your data at any
          time by contacting us.
        </p>

        <h2>5. Cookies</h2>
        <p>
          This website uses essential cookies required for basic
          functionality. We do not use tracking cookies or third-party
          analytics cookies unless explicitly disclosed.
        </p>

        <h2>6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Request access to the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Withdraw consent for data processing</li>
        </ul>

        <h2>7. Contact</h2>
        <p>
          For privacy-related inquiries, contact us at{" "}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> or
          call {siteConfig.phone}.
        </p>

        <h2>8. Company Details</h2>
        <p>
          {siteConfig.legalName}
          <br />
          GSTIN: <span className="font-data">{siteConfig.gstin}</span>
          <br />
          MSME: <span className="font-data">{siteConfig.msme}</span>
          <br />
          {siteConfig.address}
        </p>
      </div>
    </Section>
  );
}
