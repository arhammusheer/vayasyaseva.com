import { allLocales, localePath, localesOf, type Locale } from "./i18n";
import { quickApplyCopy } from "@/content/pages/quick-apply";
import { jobsCopy } from "@/content/pages/jobs";
import { getJobRole } from "@/content/pages/job-roles";
import { getJobHub } from "@/content/pages/job-hubs";
import { getJobCluster, jobClusters } from "@/content/pages/job-clusters";
import { feesAndFraudCopy } from "@/content/pages/fees-and-fraud";
import { JOB_ROLE_SLUGS, JOB_HUB_SLUGS, isJobRole, type JobRole } from "./talent-intake/rules";
import { locationCopyIn, locationPages } from "@/content/locations";
import { servicePages } from "@/content/service-pages";

export type ShareContent = { key: string; path: string; locale: Locale; variant: string; heading: string; description: string; eyebrow: string };
export const shareKey = (path: string, locale: Locale, variant = "") => `${locale}:${path}:${variant}`;

const COMMON: Record<string, { heading: string; description: string }> = {
  "/": { heading: "Workforce.\nWith care.", description: "Contract labour and industrial services, with the workers on our payroll." },
  "/services": { heading: "Contract labour for factories,\nwarehouses and facilities.", description: "Factory, loading and unloading, and housekeeping crews, and how an engagement runs." },
  "/about": { heading: "People at the heart\nof work.", description: "Meet Vayasya Seva: a contract labour and industrial services company." },
  "/faq": { heading: "Questions,\nanswered.", description: "Pricing, crews, payroll and compliance: what buyers ask us most." },
  "/compliance": { heading: "Labour compliance:\nthe records we keep.", description: "Registers, payroll, EPF, ESIC, PT and LWF for every worker on your site." },
  "/vayasya-setu": { heading: "Vayasya Setu.", description: "Attendance, wage and challan records for your site, each month." },
  "/contact": { heading: "Let’s discuss\nyour requirement.", description: "Talk to our team about workforce, site services or a project." },
  "/brand": { heading: "The Vayasya Seva\nbrand.", description: "Our identity, typography, colours and official brand resources." },
  "/privacy": { heading: "Your information.\nHandled with care.", description: "How Vayasya Seva uses information shared through this website." },
  "/terms": { heading: "Using the\nVayasya Seva website.", description: "Terms of use, public information and access to our website." },
  "/minimum-wages": { heading: "Minimum wages\nby state.", description: "Current rates by skill level, each from the state's own notification." },
  "/minimum-wages/uttarakhand": { heading: "Minimum wages\nin Uttarakhand.", description: "Monthly rates by skill level, basic wage and VDA, from the notification." },
  "/minimum-wages/uttar-pradesh": { heading: "Minimum wages\nin Uttar Pradesh.", description: "Rates by district category and skill level, basic wage and VDA." },
  "/minimum-wages/how-we-check": { heading: "How we check\nminimum wages.", description: "Where the rates come from, when we check them, and how to report an error." },
  "/minimum-wages/delhi": { heading: "Minimum wages\nin Delhi.", description: "Monthly and daily rates by skill level, from the Labour Department's order." },
  "/minimum-wages/haryana": { heading: "Minimum wages\nin Haryana.", description: "Monthly and daily rates by skill level, from the state's notification." },
  "/minimum-wages/punjab": { heading: "Minimum wages\nin Punjab.", description: "Monthly and daily rates by skill level, from the state's notification." },
  "/locations": { heading: "Where we\nsupply crews.", description: "Bengaluru, Delhi NCR, Punjab and Uttarakhand, each with its own page." },
};

export { quickShareVariant } from "./share-variant";

export function getShareContent(path: string, locale: Locale = "en-IN", variant = ""): ShareContent {
  let heading = COMMON[path]?.heading ?? "Vayasya Seva";
  // No place in the defaults: a page with no card of its own names no market.
  let description = COMMON[path]?.description ?? "Contract labour and industrial services.";
  let eyebrow = path.startsWith("/minimum-wages") ? "MINIMUM WAGES · REFERENCE" : "VAYASYA SEVA";
  if (path === "/jobs") {
    const t = jobsCopy[locale]; heading = t.heading; description = t.lede; eyebrow = t.eyebrow;
  } else if (path === "/jobs/fees-and-fraud") {
    const t = feesAndFraudCopy[locale]; heading = t.heading; description = t.lede; eyebrow = t.eyebrow;
  } else if (path.startsWith("/jobs/") && path !== "/jobs/apply") {
    const slug = path.slice("/jobs/".length);
    const cluster = getJobCluster(slug, locale);
    const content = getJobRole(slug, locale) ?? getJobHub(slug, locale);
    if (cluster) { heading = cluster.heading; description = cluster.lede; eyebrow = cluster.eyebrow; }
    else if (content) { heading = content.heading; description = content.lede; eyebrow = jobsCopy[locale].eyebrow; }
  } else if (path === "/jobs/apply") {
    const t = quickApplyCopy[locale];
    heading = t.heading; description = t.lede; eyebrow = t.eyebrow;
    const slug = variant.replace(/^role-/, "");
    const role = isJobRole(slug) ? getJobRole(slug, locale) : undefined;
    const hub = variant.startsWith("hub-") ? getJobHub(variant.slice(4), locale) : undefined;
    if (role) { heading = role.heading; description = t.lede; }
    if (hub) { heading = hub.heading; description = t.lede; }
  } else if (locationPages.has(path)) {
    const p = locationCopyIn(locationPages.get(path)!, locale); heading = p.heading; description = p.lede; eyebrow = locale === "en-IN" ? `LOCATIONS · ${p.name.toUpperCase()}` : p.name;
  } else if (path.startsWith("/services/")) {
    const t = servicePages.find((s) => path === `/services/${s.slug}`);
    if (t) { heading = t.heading; description = t.description; eyebrow = t.name; }
  } else if (path === "/contact" && variant === "assessment") {
    heading = "Let’s understand\nyour site."; description = "Share your roles, headcount, shifts and timing to discuss a site assessment."; eyebrow = "SITE ASSESSMENT";
  } else if (path === "/contact" && variant === "compliance") {
    heading = "Get compliance\nhelp."; description = "EPF, ESIC, PT, LWF, licences and registers: we guide you and connect you with CAs and labour lawyers."; eyebrow = "COMPLIANCE HELP · VAYASYA SEVA";
  }
  return { key: shareKey(path, locale, variant), path, locale, variant, heading, description, eyebrow };
}

export function allShareContent(): ShareContent[] {
  const paths = [...Object.keys(COMMON), "/jobs", "/jobs/apply", "/jobs/fees-and-fraud", ...[...JOB_ROLE_SLUGS, ...JOB_HUB_SLUGS, ...jobClusters["en-IN"].map((c) => c.slug)].map((slug) => `/jobs/${slug}`), ...servicePages.map((s) => `/services/${s.slug}`), ...locationPages.keys()];
  const entries = [...new Set(paths)].flatMap((path) => localesOf(path).map((locale) => getShareContent(path, locale)));
  for (const locale of allLocales) {
    for (const role of JOB_ROLE_SLUGS) entries.push(getShareContent("/jobs/apply", locale, `role-${role}`));
    for (const hub of JOB_HUB_SLUGS) entries.push(getShareContent("/jobs/apply", locale, `hub-${hub}`));
  }
  entries.push(getShareContent("/contact", "en-IN", "assessment"), getShareContent("/contact", "en-IN", "compliance"));
  return entries;
}

export function shareLanding(content: ShareContent) {
  const params = new URLSearchParams();
  if (content.variant.startsWith("role-")) params.set("role", content.variant.slice(5) as JobRole);
  if (content.variant.startsWith("hub-")) params.set("hub", content.variant.slice(4));
  if (content.variant === "assessment" || content.variant === "compliance") params.set("type", content.variant);
  return `${localePath(content.path, content.locale)}${params.size ? `?${params}` : ""}`;
}
