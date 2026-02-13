import Image from "next/image";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { siteConfig, navigation, footerLinks } from "@/content/site";

export function Footer() {
  return (
    <footer
      data-header-theme="dark"
      className="relative overflow-hidden bg-black py-10 text-gold-100 sm:py-12"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-gold/[0.02] to-transparent" />
        <div className="absolute -left-24 top-1/3 h-64 w-64 rounded-full bg-setu-500/20 blur-3xl" />
        <div className="absolute left-[48%] top-[58%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-600/20 blur-3xl" />
        <div className="absolute -bottom-16 right-8 h-80 w-80 rounded-full bg-gold-500/20 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-seva-600/20 blur-3xl" />
        <div className="absolute -bottom-16 left-1/4 h-72 w-72 rounded-full bg-gold-700/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
        <div className="relative">
          <h2 className="mt-4 max-w-3xl text-balance text-3xl font-semibold tracking-tight text-white/95 sm:text-4xl lg:text-5xl">
            {siteConfig.tagline}
          </h2>
        </div>

        <div className="relative mt-12 grid gap-10 lg:grid-cols-5">
          {/* Company Info */}
          <div className="lg:col-span-2">
            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gold-400">
                Contact Us
              </h4>
              <ul className="mt-3 flex flex-col gap-2">
                <li>
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="flex items-center gap-2 text-sm text-gold-200/80 transition-colors hover:text-gold-100"
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    {siteConfig.email}
                  </a>
                </li>
                <li className="flex items-center gap-2 text-sm text-gold-200/80">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span className="font-data">{siteConfig.phone}</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gold-200/80">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {siteConfig.address}
                </li>
              </ul>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 lg:col-span-3">
            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gold-400">
                Quick Links
              </h4>
              <ul className="mt-3 flex flex-col gap-2">
                {navigation.slice(1).map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-gold-200/80 transition-colors hover:text-gold-100"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gold-400">
                Legal
              </h4>
              <ul className="mt-3 flex flex-col gap-2">
                {footerLinks.utility.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-gold-200/80 transition-colors hover:text-gold-100"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gold-400">
                Company
              </h4>
              <ul className="mt-3 flex flex-col gap-2">
                {footerLinks.company.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gold-200/80 transition-colors hover:text-gold-100"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="relative mt-10 flex flex-col gap-5 pt-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-3 sm:gap-4">
            <Image
              src="/brand/logos/vspl.svg"
              alt="Vayasya emblem"
              width={120}
              height={120}
              className="h-16 w-auto sm:h-24 lg:h-30"
            />
            <span className="font-display text-[clamp(2.4rem,13vw,7rem)] font-bold leading-none tracking-[-0.03em] text-white/50">
              Vayasya
            </span>
          </div>
        </div>
        <Separator className="relative my-8 bg-gold-700/30" />

        {/* Bottom Bar */}
        <div className="relative flex flex-col items-start justify-between gap-4 text-xs text-gold-300/85 sm:flex-row sm:items-center">
          <p>
            &copy; {new Date().getFullYear()} {siteConfig.legalName}. All rights
            reserved.
          </p>
          <div className="flex flex-wrap gap-4">
            <span className="font-data">GSTIN: {footerLinks.legal.gstin}</span>
            <span className="font-data">MSME: {footerLinks.legal.msme}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
