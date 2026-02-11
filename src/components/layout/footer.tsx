import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { siteConfig, navigation, footerLinks } from "@/content/site";

export function Footer() {
  return (
    <footer className="border-t border-border bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-bold">{siteConfig.companyName}</h3>
            <p className="mt-2 max-w-md text-sm text-background/70">
              {siteConfig.tagline}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <a
                href={`mailto:${siteConfig.email}`}
                className="flex items-center gap-2 text-sm text-background/70 transition-colors hover:text-background"
              >
                <Mail className="h-4 w-4 shrink-0" />
                {siteConfig.email}
              </a>
              <a
                href={`tel:${siteConfig.phone}`}
                className="flex items-center gap-2 text-sm text-background/70 transition-colors hover:text-background"
              >
                <Phone className="h-4 w-4 shrink-0" />
                {siteConfig.phone}
              </a>
              <div className="flex items-center gap-2 text-sm text-background/70">
                <MapPin className="h-4 w-4 shrink-0" />
                {siteConfig.address}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-background/50">
              Quick Links
            </h4>
            <ul className="mt-3 flex flex-col gap-2">
              {navigation.slice(1).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-background/70 transition-colors hover:text-background"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-background/50">
              Legal
            </h4>
            <ul className="mt-3 flex flex-col gap-2">
              {footerLinks.utility.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-background/70 transition-colors hover:text-background"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-background/10" />

        {/* Bottom Bar */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-xs text-background/50">
            &copy; {new Date().getFullYear()} {siteConfig.legalName}. All rights
            reserved.
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-background/50">
            <span>GSTIN: {footerLinks.legal.gstin}</span>
            <span>MSME: {footerLinks.legal.msme}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
