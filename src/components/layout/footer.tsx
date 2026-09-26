import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/content/site";
import { AnalyticsPreferencesButton } from "@/components/analytics";
import { FooterJobsLink } from "@/components/layout/footer-jobs-link";

const columns = [
  {
    label: "Company",
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
    label: "More",
    links: [
      ["/haridwar-sidcul", "SIDCUL Haridwar"],
      ["/vayasya-setu", "Vayasya Setu"],
      ["https://setu.vayasyaseva.com", "Setu login ↗"],
      ["/brand", "Brand guidelines"],
      ["/contact", "Contact"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-shell">
        <div className="footer-main">
          <div className="footer-about">
            <Link href="/" className="footer-brand" aria-label="Vayasya Seva home">
              <Image
                src="/brand/logos/master-logo-light.svg"
                alt=""
                width={48}
                height={48}
              />
              <span>Vayasya Seva</span>
            </Link>
            <p>Contract labour and industrial services. Haridwar, Uttarakhand.</p>
            <address>
              <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
              <a
                className="font-data"
                href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
              >
                {siteConfig.phone}
              </a>
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
          {columns.map((c) => (
            <nav key={c.label} aria-label={c.label}>
              <p className="footer-label">{c.label}</p>
              {c.links.map(([href, label]) =>
                href.startsWith("http") ? (
                  <a key={href} href={href}>
                    {label}
                  </a>
                ) : (
                  <Link key={href} href={href}>
                    {label}
                  </Link>
                ),
              )}
              {c.label === "More" && <FooterJobsLink />}
            </nav>
          ))}
        </div>
        <div className="footer-bottom">
          <div className="footer-legal">
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
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
