import type { FaqItem } from "@/content/types";
import type { ServiceDetail } from "@/content/services";
import { siteConfig } from "@/content/site";

const BASE_URL = "https://www.vayasyaseva.com";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.legalName,
    url: BASE_URL,
    logo: `${BASE_URL}/brand/logos/vspl.svg`,
    email: siteConfig.email,
    telephone: siteConfig.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Haridwar",
      addressRegion: "Uttarakhand",
      addressCountry: "IN",
    },
    description: siteConfig.tagline,
    taxID: siteConfig.gstin,
    sameAs: [],
  };
}

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteConfig.legalName,
    url: BASE_URL,
    logo: `${BASE_URL}/brand/logos/vspl.svg`,
    email: siteConfig.email,
    telephone: siteConfig.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Haridwar",
      addressRegion: "Uttarakhand",
      addressCountry: "IN",
    },
    description: siteConfig.tagline,
    priceRange: "$$",
    openingHours: "Mo-Sa 09:00-18:00",
  };
}

export function faqSchema(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function serviceSchema(service: ServiceDetail) {
  return {
    "@type": "Service",
    name: service.title,
    description: service.description,
    provider: {
      "@type": "Organization",
      name: siteConfig.legalName,
    },
    areaServed: {
      "@type": "Place",
      name: "Haridwar, Uttarakhand, India",
    },
    url: `${BASE_URL}/services#${service.id}`,
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

export function breadcrumbSchema(
  items: { name: string; href: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.href}`,
    })),
  };
}

export function webPageSchema(page: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.name,
    description: page.description,
    url: `${BASE_URL}${page.url}`,
    publisher: {
      "@type": "Organization",
      name: siteConfig.legalName,
    },
    inLanguage: "en-IN",
  };
}
