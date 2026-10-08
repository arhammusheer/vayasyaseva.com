import type { FaqItem } from "@/content/types";
import type { ServiceDetail } from "@/content/services";
import { siteConfig } from "@/content/site";
import { localizeHref } from "@/lib/i18n";

const BASE_URL = "https://www.vayasyaseva.com";
const ORG_ID = `${BASE_URL}/#organization`;
const SITE_ID = `${BASE_URL}/#website`;
const LOGO_URL = `${BASE_URL}/brand/downloads/vayasya-seva-mark.png`;

/** Absolute URL of a page; neutral paths resolve to the page's default language. */
const pageUrl = (href: string) => `${BASE_URL}${localizeHref(href)}`;

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

const postalAddress = {
  "@type": "PostalAddress",
  addressLocality: "Haridwar",
  addressRegion: "Uttarakhand",
  addressCountry: "IN",
};

const HARIDWAR = {
  "@type": "City",
  name: "Haridwar",
  containedInPlace: { "@type": "State", name: "Uttarakhand" },
};

/**
 * Primary region and the industrial areas around it; not an exclusive
 * boundary. SIDCUL Haridwar is the State's Integrated Industrial Estate
 * inside Haridwar (Ranipur / BHEL area), so it is modelled as part of the
 * city, not beside it.
 */
export function areaServed() {
  return [
    HARIDWAR,
    {
      "@type": "Place",
      name: "SIDCUL Haridwar",
      alternateName: [
        "SIDCUL Industrial Area, Haridwar",
        "Integrated Industrial Estate (IIE) Haridwar",
        "SIIDCUL Haridwar",
      ],
      containedInPlace: HARIDWAR,
    },
    { "@type": "City", name: "Roorkee" },
    { "@type": "Place", name: "Bahadrabad" },
    { "@type": "Place", name: "Bhagwanpur" },
    { "@type": "State", name: "Uttarakhand" },
  ];
}

export const knowsAbout = [
  "Contract labour for factories",
  "Industrial manpower supply",
  "Warehouse labour and logistics crews",
  "Housekeeping and facility services",
  "Data entry operators (DEO) for ERP and SAP",
  "Civil works for industrial sites",
  "Fabrication and installation",
  "Machinery maintenance",
  "EPF and ESIC compliance for contract workers",
  "SIDCUL Haridwar (Integrated Industrial Estate)",
];

/** Site-wide graph: one Organization/LocalBusiness node and the WebSite, both addressable by @id. */
export function siteGraphSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "LocalBusiness"],
        "@id": ORG_ID,
        name: siteConfig.companyName,
        legalName: siteConfig.legalName,
        alternateName: "VSPL",
        url: BASE_URL,
        logo: { "@type": "ImageObject", url: LOGO_URL, width: 1024, height: 1024 },
        image: LOGO_URL,
        description: siteConfig.tagline,
        email: siteConfig.email,
        telephone: siteConfig.phone,
        address: postalAddress,
        geo: {
          "@type": "GeoCoordinates",
          latitude: siteConfig.geo.latitude,
          longitude: siteConfig.geo.longitude,
        },
        areaServed: areaServed(),
        knowsAbout,
        taxID: siteConfig.gstin,
        identifier: [
          { "@type": "PropertyValue", propertyID: "GSTIN", value: siteConfig.gstin },
          { "@type": "PropertyValue", propertyID: "CIN", value: siteConfig.cin },
          { "@type": "PropertyValue", propertyID: "Udyam", value: siteConfig.msme },
        ],
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "sales",
            description: "For businesses hiring workers or services. Not for job applications.",
            telephone: siteConfig.phone,
            email: siteConfig.email,
            areaServed: "IN",
            availableLanguage: ["en", "hi"],
          },
          // No telephone here on purpose: assistants were handing job seekers
          // the business line. Applications go through the form or agent route.
          {
            "@type": "ContactPoint",
            contactType: "job applications",
            description: "Apply online. Job applications are not taken by phone.",
            url: `${BASE_URL}/en-in/jobs/apply`,
            areaServed: "IN",
            availableLanguage: ["en", "hi"],
          },
        ],
        sameAs: siteConfig.sameAs,
        // Two ways in for an assistant: the open agent routes (/api/agent/*,
        // contract in /openapi/v1.json), or a prefilled form link
        // (src/lib/prefill.ts) the person checks and sends. See /llms.txt.
        potentialAction: [
          {
            "@type": "ApplyAction",
            name: "Apply for work",
            target: [
              {
                "@type": "EntryPoint",
                name: "Open route for AI agents",
                url: `${BASE_URL}/api/agent/jobs`,
                httpMethod: "POST",
                contentType: "application/json",
                encodingType: "application/json",
                actionPlatform: "https://www.vayasyaseva.com/openapi/v1.json",
              },
              {
                "@type": "EntryPoint",
                urlTemplate: `${BASE_URL}/jobs#name={name}&phone={phone}&work={work}&experience={experience}&location={location}&start={start}&about={about}`,
                inLanguage: ["en-IN", "hi-IN", "hi-Latn-IN"],
              },
            ],
          },
          {
            "@type": "CommunicateAction",
            name: "Send an enquiry",
            target: [
              {
                "@type": "EntryPoint",
                name: "Open route for AI agents",
                url: `${BASE_URL}/api/agent/contact`,
                httpMethod: "POST",
                contentType: "application/json",
                encodingType: "application/json",
                actionPlatform: "https://www.vayasyaseva.com/openapi/v1.json",
              },
              {
                "@type": "EntryPoint",
                urlTemplate: `${BASE_URL}/en-in/contact#name={name}&phone={phone}&email={email}&company={company}&location={location}&headcount={headcount}&details={details}`,
                inLanguage: "en-IN",
              },
            ],
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": SITE_ID,
        url: BASE_URL,
        name: siteConfig.companyName,
        publisher: { "@id": ORG_ID },
        inLanguage: "en-IN",
      },
    ],
  };
}

/** Kept for pages that want a standalone LocalBusiness node; references the site graph by @id. */
export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": ORG_ID,
    name: siteConfig.companyName,
    url: BASE_URL,
    telephone: siteConfig.phone,
    address: postalAddress,
    areaServed: areaServed(),
  };
}

export function faqSchema(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export function serviceSchema(service: ServiceDetail) {
  return {
    "@type": "Service",
    "@id": pageUrl(`/services#${service.id}`),
    name: service.title,
    serviceType: service.title,
    description: service.description,
    provider: { "@id": ORG_ID },
    areaServed: areaServed(),
    url: pageUrl(`/services#${service.id}`),
  };
}

export function servicePageSchema(services: ServiceDetail[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: services.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: serviceSchema(service),
    })),
  };
}

export function breadcrumbSchema(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: pageUrl(item.href),
    })),
  };
}

export function webPageSchema(page: {
  name: string;
  description: string;
  url: string;
  type?: "WebPage" | "AboutPage" | "ContactPage" | "FAQPage" | "CollectionPage";
  /** BCP 47 tag; defaults to en-IN. */
  inLanguage?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": page.type ?? "WebPage",
    "@id": `${pageUrl(page.url)}#webpage`,
    name: page.name,
    description: page.description,
    url: pageUrl(page.url),
    isPartOf: { "@id": SITE_ID },
    about: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    inLanguage: page.inLanguage ?? "en-IN",
  };
}

/** A standalone service page; the /services list keeps its own #anchor nodes. */
export function serviceLandingSchema(page: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${pageUrl(page.url)}#service`,
    name: page.name,
    serviceType: page.name,
    description: page.description,
    provider: { "@id": ORG_ID },
    areaServed: areaServed(),
    url: pageUrl(page.url),
  };
}
