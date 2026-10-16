import Image from "next/image";
import Link from "@/components/i18n/link";
import { siteConfig } from "@/content/site";
import { AnalyticsPreferencesButton } from "@/components/analytics";
import NextLink from "next/link";
import { FALLBACK_LOCALE, localePath, type Locale } from "@/lib/i18n";
import type { HeaderDoor } from "@/components/layout/header";
import { JOBS_NAV, SETU_LOGIN, WORK_DOOR, jobsDoorHref, jobsFooterLinks, referenceLinks, type NavLink } from "@/components/layout/nav-links";

type Column = { label: string; links: NavLink[] };

/**
 * Business and reference pages: the services, the company, and the
 * reference pages once published. Reference pages list Resources first and
 * leave out the Company column (the spec's footer cut): their readers are
 * often workers. English on every page, as are the pages they open.
 */
function businessColumns(reference: boolean): Column[] {
  const columns: Column[] = [
    {
      label: "Work with us",
      links: [
        { href: "/services", label: "Services" },
        { href: "/services/factory-labour", label: "Factory labour" },
        { href: "/services/loading-unloading-labour", label: "Loading and unloading" },
        { href: "/services/housekeeping", label: "Housekeeping and grounds" },
        { href: "/haridwar-sidcul", label: "Haridwar SIDCUL" },
        { href: "/faq", label: "Questions" },
      ],
    },
    {
      label: "Company",
      links: [
        { href: "/about", label: "About" },
        { href: "/compliance", label: "Compliance" },
        { href: "/vayasya-setu", label: "Vayasya Setu" },
        { href: "/contact", label: "Contact" },
      ],
    },
  ];
  const resources = referenceLinks(true);
  const column = resources.length ? [{ label: "Resources", links: resources }] : [];
  return reference ? [...column, columns[0]] : [...columns, ...column];
}

/**
 * Site footer, with no phone on any page (the business header carries it).
 * Business and reference pages share one footer; reference pages put
 * Resources first and drop the company profile PDF (it carries the phone).
 * Privacy and terms sit in the reference layout, so they get the reference
 * footer too. Jobs pages get their own: jobs links and one business door.
 */
export function Footer({
  door = "business",
  locale = FALLBACK_LOCALE,
}: {
  door?: HeaderDoor;
  /** The page's language: the jobs footer, and the business footer's jobs line. */
  locale?: Locale;
}) {
  const isJobs = door === "jobs";
  const t = JOBS_NAV[locale];
  // Reference pages are English throughout, as in their header.
  const workLocale = door === "business" ? locale : FALLBACK_LOCALE;
  const work = WORK_DOOR[workLocale];
  const shown: Column[] = isJobs
    ? [
        { label: t.menu, links: jobsFooterLinks(locale) },
        // The enquiry page is English: flagged, as Privacy and Terms are.
        { label: t.business, links: [{ href: "/contact", label: `${t.enquiries}${t.english}` }] },
      ]
    : businessColumns(door === "reference");
  return (
    <footer className="site-footer" lang={isJobs ? locale : "en-IN"} data-door={door}>
      <div className="site-shell">
        <div className="footer-main">
          <div className="footer-about">
            <Link
              href={isJobs ? localePath("/jobs", locale) : "/"}
              className="footer-brand"
              aria-label={isJobs ? t.logo : "Vayasya Seva home"}
            >
              <Image
                src="/brand/logos/master-logo-light.svg"
                alt=""
                width={48}
                height={48}
              />
              <span>Vayasya Seva</span>
            </Link>
            {!isJobs && (
              <>
                <address lang="en-IN">
                  <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
                </address>
                {/* The one jobs link in this footer: Jobs in Haridwar
                    (neutral from English pages, so not the i18n Link). */}
                <p className="footer-jobs-door" lang={workLocale}>
                  {work.lead}{" "}
                  <NextLink href={jobsDoorHref(workLocale)} prefetch={false}>
                    {work.label} →
                  </NextLink>
                </p>
              </>
            )}
          </div>
          {shown.map((c) => (
            <nav key={c.label} aria-label={c.label}>
              <p className="footer-label">{c.label}</p>
              {c.links.map(({ href, label }) => (
                // Jobs footers: no viewport prefetch, to spare data on patchy 4G.
                <Link key={href} href={href} prefetch={isJobs ? false : undefined}>
                  {label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
        <div className="footer-bottom">
          <div className="footer-legal" lang="en-IN">
            <span>
              © {new Date().getFullYear()} {siteConfig.legalName}
            </span>
            <span>
              CIN <span className="font-data">{siteConfig.cin}</span>
            </span>
            <span>
              GSTIN <span className="font-data">{siteConfig.gstin}</span>
            </span>
          </div>
          <div className="footer-utility">
            {!isJobs && <a href={SETU_LOGIN}>Setu login ↗</a>}
            {!isJobs && <Link href="/brand">Brand</Link>}
            {door === "business" && (
              // A file, not a page: a plain link so the locale prefix is not added.
              <a href="/vayasya-seva-company-profile.pdf" className="footer-file">
                Company profile
                <span className="font-data">PDF</span>
              </a>
            )}
            <Link href="/privacy" lang={isJobs ? locale : "en-IN"}>
              {isJobs ? `${t.privacy}${t.english}` : "Privacy"}
            </Link>
            <Link href="/terms" lang={isJobs ? locale : "en-IN"}>
              {isJobs ? `${t.terms}${t.english}` : "Terms"}
            </Link>
            <AnalyticsPreferencesButton />
          </div>
        </div>
      </div>
    </footer>
  );
}
