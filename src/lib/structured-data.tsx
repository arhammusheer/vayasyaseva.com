import type { FaqItem } from "@/content/types";
import type { ServiceDetail } from "@/content/services";
import { siteConfig } from "@/content/site";
import { localizeHref } from "@/lib/i18n";
import { formatDate, type WageSource, type WageState } from "@/content/wages";
import type { Guide } from "@/content/guides";
import type { GuideSource } from "@/content/guides/sources";

const BASE_URL = "https://www.vayasyaseva.com";
const ORG_ID = `${BASE_URL}/#organization`;
const SITE_ID = `${BASE_URL}/#website`;
const LOGO_URL = `${BASE_URL}/brand/downloads/vayasya-seva-mark.png`;

/** Absolute URL of a page; neutral paths resolve to the page's default language. */
export const pageUrl = (href: string) => `${BASE_URL}${localizeHref(href)}`;

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

/** Which door a page belongs to; it decides what the site graph may carry. */
export type GraphDoor = "jobs" | "reference";

const applyAction = {
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
};

/** The enquiry action: the agent route and the prefilled /contact form. */
export const communicateAction = {
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
      urlTemplate: `${BASE_URL}/en-in/contact#roles={roles}&headcount={headcount}&state={state}&city={city}&start={start}&duration={duration}&name={name}&company={company}&phone={phone}&email={email}&details={details}`,
      inLanguage: "en-IN",
    },
  ],
};

// No telephone here on purpose: assistants were handing job seekers the
// business line. Applications go through the form or the agent route.
export const jobApplicationsContactPoint = {
  "@type": "ContactPoint",
  contactType: "job applications",
  description: "Apply online through the application form.",
  url: `${BASE_URL}/en-in/jobs/apply`,
  areaServed: "IN",
  availableLanguage: ["en", "hi"],
};

/**
 * The Organization/LocalBusiness node every page shares by @id, with no
 * phone and no sales contact. Business pages extend it with the phone
 * (src/lib/business-graph.ts); jobs and reference pages use it as is.
 */
export function organizationNode() {
  return {
    "@type": ["Organization", "LocalBusiness"],
    "@id": ORG_ID,
    name: siteConfig.companyName,
    legalName: siteConfig.legalName,
    alternateName: "VSPL",
    url: BASE_URL,
    logo: { "@type": "ImageObject", url: LOGO_URL, width: 1024, height: 1024 },
    image: LOGO_URL,
    description: siteConfig.tagline,
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
    contactPoint: [jobApplicationsContactPoint],
    sameAs: siteConfig.sameAs,
    // Two ways in for an assistant: the open agent routes (/api/agent/*,
    // contract in /openapi/v1.json), or a prefilled form link
    // (src/lib/prefill.ts) the person checks and sends. See /llms.txt.
    potentialAction: [applyAction],
  };
}

export const websiteNode = {
  "@type": "WebSite",
  "@id": SITE_ID,
  url: BASE_URL,
  name: siteConfig.companyName,
  publisher: { "@id": ORG_ID },
  inLanguage: "en-IN",
};

/**
 * Site graph for jobs pages (/jobs/**) and reference pages (wages, guides):
 * the same Organization @id as business pages, with no telephone. Jobs pages
 * carry no sales contact and no enquiry action; reference pages, read by
 * buyers and workers alike, point businesses to /contact (never the phone).
 */
export function phoneFreeGraphSchema(door: GraphDoor) {
  const org = organizationNode();
  return {
    "@context": "https://schema.org",
    "@graph": [
      door === "jobs"
        ? org
        : {
            ...org,
            contactPoint: [
              {
                "@type": "ContactPoint",
                contactType: "sales",
                description: "For businesses hiring workers or services. Not for job applications.",
                url: `${BASE_URL}/en-in/contact`,
                areaServed: "IN",
                availableLanguage: ["en", "hi"],
              },
              jobApplicationsContactPoint,
            ],
            potentialAction: [applyAction, communicateAction],
          },
      websiteNode,
    ],
  };
}

export function faqSchema(faqs: Pick<FaqItem, "question" | "answer">[]) {
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

/** A notification or order, as schema.org Legislation, cited by wage datasets. */
export function legislationSchema(source: WageSource, jurisdiction: string) {
  return {
    "@type": "Legislation",
    "@id": `${source.url}#${source.id}`,
    name: source.title,
    legislationIdentifier: source.number,
    legislationDate: source.date,
    legislationType: source.kind === "notification" ? "Notification" : source.kind === "order" ? "Order" : "Corrigendum",
    legislationJurisdiction: { "@type": "AdministrativeArea", name: jurisdiction, containedInPlace: { "@type": "Country", name: "India" } },
    legislationPassedBy: { "@type": "GovernmentOrganization", name: source.authority },
    inLanguage: source.language === "hi" ? "hi-IN" : "en-IN",
    url: source.url,
  };
}

/**
 * A state wage page (PLAN §5.5): WebPage, and a Dataset of the rates citing
 * the Legislation it is based on. Only what the page shows: lastReviewed and
 * reviewedBy appear only once a person has signed the figures off.
 */
export function wageStateSchema(state: WageState, page: { name: string; description: string; url: string }) {
  const url = pageUrl(page.url);
  const effective = state.tables.map((t) => t.effectiveFrom).sort()[0];
  const cited = [...new Set(state.tables.flatMap((t) => t.sources))].map((id) => state.sources.find((s) => s.id === id)!);
  const reviewed = state.checked.by ? { lastReviewed: state.checked.on, reviewedBy: { "@id": ORG_ID } } : {};
  const by = [state.tables.length > 1 && "employment", state.tables.some((t) => t.zones.length > 1) && "district category", "skill level"].filter(Boolean) as string[];
  const byClause = by.length > 1 ? `${by.slice(0, -1).join(", ")} and ${by.at(-1)}` : by[0];
  const parts = [...new Set(state.tables.filter((t) => t.rates.some((r) => r.vda > 0)).flatMap((t) => [t.basicLabel, t.vdaLabel]))];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        name: page.name,
        description: page.description,
        url,
        isPartOf: { "@id": SITE_ID },
        publisher: { "@id": ORG_ID },
        inLanguage: "en-IN",
        dateModified: state.checked.on,
        ...reviewed,
        mainEntity: { "@id": `${url}#dataset` },
      },
      {
        "@type": "Dataset",
        "@id": `${url}#dataset`,
        name: `Minimum wage rates in ${state.name}`,
        description: `Monthly and daily minimum wage rates in ${state.name} by ${byClause}, in force from ${formatDate(effective)}. Entered by hand from the state's own notifications and orders; the state's sources were last checked on ${formatDate(state.checked.on)}.`,
        url,
        creator: { "@id": ORG_ID },
        publisher: { "@id": ORG_ID },
        inLanguage: "en-IN",
        isAccessibleForFree: true,
        license: pageUrl("/terms"),
        spatialCoverage: { "@type": "AdministrativeArea", name: state.name, containedInPlace: { "@type": "Country", name: "India" } },
        temporalCoverage: `${effective}/..`,
        dateModified: state.checked.on,
        variableMeasured: [...parts.map((p) => `${p}, per month (INR)`), "Minimum wage per month (INR)", "Minimum wage per day (INR)"],
        isBasedOn: cited.map((s) => legislationSchema(s, state.name)),
      },
    ],
  };
}

/** The wage hub: a CollectionPage listing the state pages. */
export function wageHubSchema(page: { name: string; description: string; url: string; dateModified: string; reviewed: boolean; states: { name: string; url: string }[] }) {
  const url = pageUrl(page.url);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#webpage`,
    name: page.name,
    description: page.description,
    url,
    isPartOf: { "@id": SITE_ID },
    publisher: { "@id": ORG_ID },
    inLanguage: "en-IN",
    dateModified: page.dateModified,
    ...(page.reviewed ? { lastReviewed: page.dateModified, reviewedBy: { "@id": ORG_ID } } : {}),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: page.states.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.name, url: pageUrl(s.url) })),
    },
  };
}

/** A guide's source as schema.org: Legislation for Acts, notifications and rules; CreativeWork otherwise. */
function guideCitation(source: GuideSource) {
  const legislation = source.kind === "act" || source.kind === "notification" || source.kind === "rules" || source.kind === "scheme";
  const jurisdiction = {
    "@type": source.jurisdiction === "India" ? "Country" : "AdministrativeArea",
    name: source.jurisdiction,
    ...(source.jurisdiction === "India" ? {} : { containedInPlace: { "@type": "Country", name: "India" } }),
  };
  return legislation
    ? {
        "@type": "Legislation",
        name: source.title,
        ...(source.number && { legislationIdentifier: source.number }),
        legislationDate: source.date,
        legislationType: { act: "Act", notification: "Notification", rules: "Rules", scheme: "Scheme" }[source.kind as "act"],
        legislationJurisdiction: jurisdiction,
        legislationPassedBy: { "@type": source.kind === "act" ? "Organization" : "GovernmentOrganization", name: source.authority },
        inLanguage: source.language === "hi" ? "hi-IN" : "en-IN",
        ...(source.url && { url: source.url }),
      }
    : {
        "@type": "CreativeWork",
        name: source.title,
        datePublished: source.date,
        publisher: { "@type": "GovernmentOrganization", name: source.authority },
        inLanguage: source.language === "hi" ? "hi-IN" : "en-IN",
        ...(source.url && { url: source.url }),
      };
}

/**
 * A guide (PLAN §5.6): WebPage + Article citing its sources. Only what the
 * page shows: the reviewer (reviewedBy, lastReviewed) appears once the
 * guide's `review` is filled in, never before.
 */
export function guideSchema(guide: Guide, page: { url: string; sources: GuideSource[]; headline: string; description: string }) {
  const url = pageUrl(page.url);
  const review = guide.review
    ? {
        lastReviewed: guide.review.on,
        reviewedBy: { "@type": "Person", name: guide.review.name, jobTitle: guide.review.role, description: guide.review.credentials },
      }
    : {};
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        name: page.headline,
        description: page.description,
        url,
        isPartOf: { "@id": SITE_ID },
        publisher: { "@id": ORG_ID },
        inLanguage: "en-IN",
        ...(guide.published && { datePublished: guide.published }),
        dateModified: guide.updated,
        ...review,
        mainEntity: { "@id": `${url}#article` },
      },
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: guide.h1.replace(/\.$/, ""),
        description: page.description,
        url,
        mainEntityOfPage: { "@id": `${url}#webpage` },
        inLanguage: "en-IN",
        ...(guide.published && { datePublished: guide.published }),
        dateModified: guide.updated,
        author: { "@id": ORG_ID },
        publisher: { "@id": ORG_ID },
        isAccessibleForFree: true,
        citation: page.sources.map(guideCitation),
      },
    ],
  };
}
