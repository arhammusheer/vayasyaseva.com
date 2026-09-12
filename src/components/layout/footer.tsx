import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/content/site";
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-shell">
        <div className="footer-main">
          <div>
            <Link
              href="/"
              className="footer-brand"
              aria-label="Vayasya Seva home"
            >
              <Image
                src="/brand/logos/master-logo-light.svg"
                alt=""
                width={72}
                height={72}
              />
              <span>
                Vayasya Seva<small>Private Limited</small>
              </span>
            </Link>
            <p>
              Contract labour. Industrial services.
              <br />
              Care in every engagement.
            </p>
            <address>
              {siteConfig.address}
              <br />
              <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
              <br />
              <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>
                {siteConfig.phone}
              </a>
            </address>
          </div>
          <nav aria-label="Company">
            <p className="footer-label">COMPANY</p>
            <Link href="/about">About us</Link>
            <Link href="/services">What we do</Link>
            <Link href="/industries">Industries</Link>
            <Link href="/how-we-operate">Our approach</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <nav aria-label="Further information">
            <p className="footer-label">A CLOSER LOOK</p>
            <Link href="/compliance">Labour compliance</Link>
            <Link href="/haridwar-sidcul">Haridwar &amp; SIDCUL</Link>
            <Link href="/vayasya-setu">Vayasya Setu</Link>
            <a href="https://hr.vayasyaseva.com">Setu login ↗</a>
          </nav>
        </div>
        <div className="footer-registration">
          <span>EPF &amp; ESIC registered</span>
          <span>GST registered</span>
          <span>MSME / UDYAM registered</span>
          <Link href="/compliance">Our compliance approach ↗</Link>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {siteConfig.legalName}
          </span>
          <span>GSTIN {siteConfig.gstin}</span>
          <div>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
