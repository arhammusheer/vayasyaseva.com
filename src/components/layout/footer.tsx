import Image from "next/image";
import Link from "@/components/i18n/link";
import { siteConfig } from "@/content/site";
import { jobHubs } from "@/content/pages/job-hubs";
import { jobClusters } from "@/content/pages/job-clusters";
import { AnalyticsPreferencesButton } from "@/components/analytics";
import { FooterJobsLink } from "@/components/layout/footer-jobs-link";
import { FALLBACK_LOCALE, localePath, type Locale } from "@/lib/i18n";
import type { HeaderDoor, HeaderPhone } from "@/components/layout/header";
import { linkable } from "@/content/registry";
import { WAGE_HUB_PATH } from "@/content/registry/identifiers";

type Column = { label: string; links: string[][] };

/**
 * Business footer labels in the page's language (Hindi and Hinglish business
 * pages: /haridwar-sidcul and the services). The pages it links to are mostly
 * English, so the link names stay English. Drafts for native review.
 */
const BUSINESS_FOOTER: Record<Locale, { company: string; more: string; crew: string; about: string; work: string; apply: string }> = {
  "en-IN": {
    company: "Company", more: "More", crew: "Request a crew",
    about: "Labour contractor for factories, warehouses and facilities. Based in Haridwar, Uttarakhand.",
    work: "Looking for work?", apply: "Apply online",
  },
  "hi-IN": {
    company: "कंपनी", more: "और", crew: "कामगार माँगें",
    about: "फ़ैक्टरी, वेयरहाउस और दूसरी साइटों के लिए लेबर ठेकेदार। हरिद्वार, उत्तराखंड में।",
    work: "काम चाहिए?", apply: "ऑनलाइन आवेदन करें",
  },
  "hi-Latn-IN": {
    company: "Company", more: "Aur", crew: "Workers maangein",
    about: "Factory, warehouse aur dusri sites ke liye labour contractor. Haridwar, Uttarakhand mein.",
    work: "Kaam chahiye?", apply: "Online apply karein",
  },
};

/** Reference pages, listed once they are published (src/content/registry). */
const referenceLinks = [[WAGE_HUB_PATH, "Minimum wages"]].filter(([href]) => linkable(href, "en-IN"));

const businessColumns = (locale: Locale): Column[] => [
  {
    label: BUSINESS_FOOTER[locale].company,
    links: [
      ["/about", "About"],
      ["/services", "Services"],
      ["/services/contract-labour", "Contract labour"],
      ["/industries", "Industries"],
      ["/how-we-operate", "Our approach"],
      ["/compliance", "Compliance"],
    ],
  },
  {
    label: BUSINESS_FOOTER[locale].more,
    links: [
      ["/haridwar-sidcul", "SIDCUL Haridwar"],
      ...referenceLinks,
      ["/vayasya-setu", "Vayasya Setu"],
      ["https://setu.vayasyaseva.com", "Setu login ↗"],
      ["/brand", "Brand guidelines"],
      ["/vayasya-seva-company-profile.pdf", "Company profile"],
      ["/contact", BUSINESS_FOOTER[locale].crew],
    ],
  },
];

/** Jobs footer copy, in the page's language. Privacy and Terms are English pages. */
const JOBS_FOOTER: Record<Locale, { about: string; jobs: string; company: string; all: string; apply: string; fraud: string; business: string; privacy: string; terms: string }> = {
  "en-IN": {
    about: "Factory, warehouse and ITI work in SIDCUL Haridwar. There is no fee to apply.",
    jobs: "Jobs", company: "For businesses", all: "All jobs", apply: "Apply now", fraud: "Fees and fraud",
    business: "Business enquiries", privacy: "Privacy", terms: "Terms",
  },
  "hi-IN": {
    about: "सिडकुल हरिद्वार में फ़ैक्टरी, वेयरहाउस और ITI का काम। आवेदन की कोई फ़ीस नहीं है।",
    jobs: "नौकरी", company: "कंपनियों के लिए", all: "सभी नौकरियाँ", apply: "आवेदन करें", fraud: "फ़ीस और धोखा",
    business: "कंपनियों की पूछताछ", privacy: "गोपनीयता", terms: "नियम",
  },
  "hi-Latn-IN": {
    about: "SIDCUL Haridwar mein factory, warehouse aur ITI ka kaam. Apply karne ki koi fee nahi hai.",
    jobs: "Jobs", company: "Companies ke liye", all: "Sabhi jobs", apply: "Apply karein", fraud: "Fee aur fraud",
    business: "Business enquiries", privacy: "Privacy", terms: "Terms",
  },
};

/**
 * Jobs pages: jobs links, then the business door. No phone, no email, no
 * company profile PDF (it carries the phone), and no links to business
 * pages that show the phone (About, SIDCUL Haridwar): one door, labelled.
 */
function jobsColumns(locale: Locale): Column[] {
  const t = JOBS_FOOTER[locale];
  return [
    {
      label: t.jobs,
      links: [
        [localePath("/jobs", locale), t.all],
        [localePath("/jobs/apply", locale), t.apply],
        ...jobClusters[locale].map((c) => [localePath(`/jobs/${c.slug}`, locale), c.linkLabel]),
        ...jobHubs[locale].map((hub) => [localePath(`/jobs/${hub.slug}`, locale), hub.name]),
        [localePath("/jobs/fees-and-fraud", locale), t.fraud],
      ],
    },
    {
      label: t.company,
      links: [["/contact", t.business]],
    },
  ];
}

/** Reference pages (wages, guides): business and jobs links, no phone and no PDF. */
const referenceColumns: Column[] = [
  businessColumns("en-IN")[0],
  {
    label: "More",
    links: [
      ["/haridwar-sidcul", "SIDCUL Haridwar"],
      ...referenceLinks,
      ["/jobs", "Jobs"],
      ["/contact", "Request a crew"],
    ],
  },
];

/**
 * Site footer. The business layout passes the phone; jobs and reference
 * layouts cannot (eslint.config.mjs), so their footers carry none, and
 * their contact link reads "Business enquiries".
 */
export function Footer({
  door = "business",
  phone,
  locale = FALLBACK_LOCALE,
}: {
  door?: HeaderDoor;
  phone?: HeaderPhone;
  /** The page's language: the jobs footer, and the labels of the business footer. */
  locale?: Locale;
}) {
  const isJobs = door === "jobs";
  const t = JOBS_FOOTER[locale];
  const b = BUSINESS_FOOTER[door === "business" ? locale : "en-IN"];
  const shown = isJobs ? jobsColumns(locale) : door === "reference" ? referenceColumns : businessColumns(locale);
  const footerLang = isJobs || door === "business" ? locale : "en-IN";
  return (
    <footer className="site-footer" lang={footerLang}>
      <div className="site-shell">
        <div className="footer-main">
          <div className="footer-about">
            <Link
              href={isJobs ? localePath("/jobs", locale) : "/"}
              className="footer-brand"
              aria-label={isJobs ? "Vayasya Seva jobs" : "Vayasya Seva home"}
            >
              <Image
                src="/brand/logos/master-logo-light.svg"
                alt=""
                width={48}
                height={48}
              />
              <span>Vayasya Seva</span>
            </Link>
            <p>{isJobs ? t.about : b.about}</p>
            {door === "business" && (
              // The jobs door sits before the contact lines, in the page's
              // language. Nothing here says who the phone is for: business
              // pages carry it, jobs pages never do (structural, not a note).
              <p className="footer-jobs-door">
                {b.work}{" "}
                <Link href="/jobs/apply" className="underline underline-offset-4">
                  {b.apply} →
                </Link>
              </p>
            )}
            <address lang="en-IN">
              {door === "business" && <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>}
              {door === "business" && phone && (
                <a className="font-data" href={phone.href}>
                  {phone.display}
                </a>
              )}
              <a
                className="footer-social"
                href={siteConfig.linkedin}
                target="_blank"
                rel="me noopener"
                aria-label="Vayasya Seva on LinkedIn"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"
                  />
                </svg>
              </a>
            </address>
          </div>
          {shown.map((c) => (
            <nav key={c.label} aria-label={c.label}>
              <p className="footer-label">{c.label}</p>
              {c.links.map(([href, label]) =>
                href.endsWith(".pdf") ? (
                  // A file, not a page: a plain link so the locale prefix is not added.
                  <a key={href} href={href} className="footer-file">
                    {label}
                    <span className="font-data">PDF</span>
                  </a>
                ) : href.startsWith("http") ? (
                  <a key={href} href={href}>
                    {label}
                  </a>
                ) : (
                  // Jobs footers: no viewport prefetch, to spare data on patchy 4G.
                  <Link key={href} href={href} prefetch={isJobs ? false : undefined}>
                    {label}
                  </Link>
                ),
              )}
              {door === "business" && c.label === b.more && <FooterJobsLink />}
            </nav>
          ))}
        </div>
        <div className="footer-bottom">
          <div className="footer-legal" lang="en-IN">
            <span>
              © {new Date().getFullYear()} {siteConfig.legalName}
            </span>
            <span>EPF, ESIC, GST and MSME registered</span>
            <span>
              GSTIN <span className="font-data">{siteConfig.gstin}</span>
            </span>
            <span>
              CIN <span className="font-data">{siteConfig.cin}</span>
            </span>
          </div>
          <div>
            <AnalyticsPreferencesButton />
            <Link href="/privacy" lang={isJobs ? locale : "en-IN"}>
              {isJobs ? t.privacy : "Privacy"}
            </Link>
            <Link href="/terms" lang={isJobs ? locale : "en-IN"}>
              {isJobs ? t.terms : "Terms"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
