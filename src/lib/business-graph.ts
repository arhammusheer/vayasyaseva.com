import { businessPhone } from "@/content/business-contact";
import { siteConfig } from "@/content/site";
import {
  communicateAction,
  jobApplicationsContactPoint,
  organizationNode,
  websiteNode,
} from "@/lib/structured-data";

/**
 * Site graph for business pages only ((marketing) layout): the shared
 * Organization node plus the business phone, email, the sales contact point
 * and the enquiry action. Jobs and reference code cannot import this file
 * (eslint.config.mjs); they use phoneFreeGraphSchema() instead.
 */
export function businessGraphSchema() {
  const org = organizationNode();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...org,
        email: siteConfig.email,
        telephone: businessPhone.display,
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "sales",
            description: "For businesses hiring workers or services. Not for job applications.",
            telephone: businessPhone.display,
            email: siteConfig.email,
            areaServed: "IN",
            availableLanguage: ["en", "hi"],
          },
          jobApplicationsContactPoint,
        ],
        potentialAction: [...org.potentialAction, communicateAction],
      },
      websiteNode,
    ],
  };
}
