import { allLocales, localePath, localesOf, type Locale } from "./i18n";
import { quickApplyCopy } from "@/content/pages/quick-apply";
import { jobsCopy } from "@/content/pages/jobs";
import { getJobRole } from "@/content/pages/job-roles";
import { getJobHub } from "@/content/pages/job-hubs";
import { JOB_ROLE_SLUGS, JOB_HUB_SLUGS, isJobRole, isJobHub, type JobRole } from "./talent-intake/rules";
import { contractLabourCopy } from "@/content/pages/contract-labour";
import { haridwarCopy } from "@/content/pages/haridwar-sidcul";
import { servicePages } from "@/content/service-pages";
import { servicePagesHiLatn } from "@/content/hi-latn/service-pages";

export type ShareContent = { key: string; path: string; locale: Locale; variant: string; heading: string; description: string; eyebrow: string };
export const shareKey = (path: string, locale: Locale, variant = "") => `${locale}:${path}:${variant}`;

const COMMON: Record<string, { heading: string; description: string }> = {
  "/": { heading: "Workforce.\nWith care.", description: "Contract labour and industrial services for SIDCUL and across Haridwar." },
  "/services": { heading: "People for the work.\nSupport for the site.", description: "Factory and warehouse manpower, housekeeping, maintenance and site services." },
  "/about": { heading: "People at the heart\nof work.", description: "Meet Vayasya Seva: a Haridwar-based contract labour and industrial services company." },
  "/industries": { heading: "Workforce support\nfor your industry.", description: "Teams and site coordination for manufacturing, warehouses, facilities and project work." },
  "/how-we-operate": { heading: "From your requirement\nto the working day.", description: "Workforce planning, worker onboarding, site coordination and ongoing review." },
  "/compliance": { heading: "Careful records.\nClear responsibilities.", description: "Our approach to workforce documentation, statutory records and labour compliance." },
  "/vayasya-setu": { heading: "Vayasya Setu.", description: "The connection between people, the workplace and everyday workforce operations." },
  "/contact": { heading: "Let’s discuss\nyour requirement.", description: "Talk to our Haridwar team about workforce, site services or a project." },
  "/brand": { heading: "The Vayasya Seva\nbrand.", description: "Our identity, typography, colours and official brand resources." },
  "/privacy": { heading: "Your information.\nHandled with care.", description: "How Vayasya Seva uses information shared through this website." },
  "/terms": { heading: "Using the\nVayasya Seva website.", description: "Terms of use, public information and access to our website." },
};

export function quickShareVariant(params: { role?: string; hub?: string; work?: string }) {
  if (isJobRole(params.role)) return `role-${params.role}`;
  if (isJobHub(params.hub)) return `hub-${params.hub}`;
  if (isJobRole(params.work)) return `role-${params.work}`;
  return "";
}

export function getShareContent(path: string, locale: Locale = "en-IN", variant = ""): ShareContent {
  let heading = COMMON[path]?.heading ?? "Vayasya Seva";
  let description = COMMON[path]?.description ?? "Workforce and industrial services in Haridwar.";
  let eyebrow = "VAYASYA SEVA · HARIDWAR";
  if (path === "/jobs") {
    const t = jobsCopy[locale]; heading = t.heading; description = t.lede; eyebrow = t.eyebrow;
  } else if (path.startsWith("/jobs/") && path !== "/jobs/apply") {
    const slug = path.slice("/jobs/".length);
    const content = getJobRole(slug, locale) ?? getJobHub(slug, locale);
    if (content) { heading = content.heading; description = content.lede; eyebrow = jobsCopy[locale].eyebrow; }
  } else if (path === "/jobs/apply") {
    const t = quickApplyCopy[locale];
    heading = t.heading; description = t.lede; eyebrow = t.eyebrow;
    const slug = variant.replace(/^role-/, "");
    const role = isJobRole(slug) ? getJobRole(slug, locale) : undefined;
    const hub = variant.startsWith("hub-") ? getJobHub(variant.slice(4), locale) : undefined;
    if (role) { heading = role.heading; description = t.lede; }
    if (hub) { heading = hub.heading; description = t.lede; }
  } else if (path === "/services/contract-labour") {
    const t = contractLabourCopy[locale]; heading = t.hero.join(" "); description = t.description; eyebrow = t.breadcrumb.page;
  } else if (path === "/haridwar-sidcul") {
    const t = haridwarCopy[locale]; heading = t.hero.join(" "); description = t.description; eyebrow = t.breadcrumb.page;
  } else if (path.startsWith("/services/")) {
    const t = (locale === "hi-Latn-IN" ? servicePagesHiLatn : servicePages).find((s) => path === `/services/${s.slug}`);
    if (t) { heading = t.heading; description = t.description; eyebrow = t.name; }
  } else if (path === "/contact" && variant === "assessment") {
    heading = "Let’s understand\nyour site."; description = "Share your roles, headcount, shifts and timing to discuss a site assessment."; eyebrow = "SITE ASSESSMENT · HARIDWAR";
  }
  return { key: shareKey(path, locale, variant), path, locale, variant, heading, description, eyebrow };
}

export function allShareContent(): ShareContent[] {
  const paths = [...Object.keys(COMMON), "/jobs", "/jobs/apply", ...[...JOB_ROLE_SLUGS, ...JOB_HUB_SLUGS].map((slug) => `/jobs/${slug}`), "/services/contract-labour", "/haridwar-sidcul", ...servicePages.map((s) => `/services/${s.slug}`)];
  const entries = [...new Set(paths)].flatMap((path) => localesOf(path).map((locale) => getShareContent(path, locale)));
  for (const locale of allLocales) {
    for (const role of JOB_ROLE_SLUGS) entries.push(getShareContent("/jobs/apply", locale, `role-${role}`));
    for (const hub of JOB_HUB_SLUGS) entries.push(getShareContent("/jobs/apply", locale, `hub-${hub}`));
  }
  entries.push(getShareContent("/contact", "en-IN", "assessment"));
  return entries;
}

export function shareLanding(content: ShareContent) {
  const params = new URLSearchParams();
  if (content.variant.startsWith("role-")) params.set("role", content.variant.slice(5) as JobRole);
  if (content.variant.startsWith("hub-")) params.set("hub", content.variant.slice(4));
  if (content.variant === "assessment") params.set("type", "assessment");
  return `${localePath(content.path, content.locale)}${params.size ? `?${params}` : ""}`;
}
