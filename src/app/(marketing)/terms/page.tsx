import type { Metadata } from "next";
import { Section } from "@/components/layout/section";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of service for ${siteConfig.legalName}.`,
};

export default function TermsPage() {
  return (
    <Section>
      <div className="prose prose-neutral mx-auto max-w-3xl">
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground">
          Last updated: February 2026
        </p>

        <h2>1. About This Website</h2>
        <p>
          This website is operated by {siteConfig.legalName} (&quot;VSPL&quot;,
          &quot;we&quot;, &quot;our&quot;). It provides information about our
          workforce operations services and enables prospective clients to
          submit requirement inquiries.
        </p>

        <h2>2. Use of This Website</h2>
        <p>
          By accessing this website, you agree to use it in accordance with
          these terms. The content on this website is provided for
          informational purposes. Service scope, terms, and deliverables are
          defined in individual engagement contracts.
        </p>

        <h2>3. No Contractual Commitment</h2>
        <p>
          Information presented on this website — including service
          descriptions, process outlines, and compliance references — is
          directional and does not constitute a contractual offer or binding
          commitment. Specific terms, scope, and deliverables are defined in
          signed engagement agreements.
        </p>

        <h2>4. Accuracy of Information</h2>
        <p>
          We make reasonable efforts to ensure the accuracy of information on
          this website. However, we do not warrant that all content is
          complete, current, or error-free. Statutory registration details and
          compliance references are subject to regulatory changes.
        </p>

        <h2>5. Intellectual Property</h2>
        <p>
          All content on this website — including text, design, logos, and
          layout — is the property of {siteConfig.legalName} unless otherwise
          stated. Reproduction or distribution without written permission is
          not permitted.
        </p>

        <h2>6. Third-Party Links</h2>
        <p>
          This website may contain links to third-party websites. We are not
          responsible for the content, privacy practices, or terms of any
          external sites.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          VSPL shall not be liable for any direct, indirect, or
          consequential damages arising from the use of this website or
          reliance on any information provided herein.
        </p>

        <h2>8. Governing Law</h2>
        <p>
          These terms are governed by the laws of India. Any disputes arising
          from the use of this website shall be subject to the jurisdiction
          of courts in Haridwar, Uttarakhand.
        </p>

        <h2>9. Contact</h2>
        <p>
          For questions about these terms, contact us at{" "}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a> or
          call {siteConfig.phone}.
        </p>

        <h2>10. Company Details</h2>
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
