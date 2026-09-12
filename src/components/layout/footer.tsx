import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/content/site";

const columns = [
  {
    label: "Company",
    links: [
      ["/about", "About"],
      ["/services", "Services"],
      ["/industries", "Industries"],
      ["/how-we-operate", "Our approach"],
      ["/compliance", "Compliance"],
    ],
  },
  {
    label: "More",
    links: [
      ["/haridwar-sidcul", "Haridwar & SIDCUL"],
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
          </div>
          <div>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
