import type { NavItem, SiteConfig } from "./types";

export const siteConfig: SiteConfig = {
  companyName: "Vayasya Seva",
  legalName: "Vayasya Seva Private Limited",
  tagline: "Compliance-First Workforce Operations for Industrial Sites",
  email: "help@vayasyaseva.com",
  phone: "+91 72920 14101",
  gstin: "05AAJCV4562E1ZB",
  msme: "UDYAM-UK-06-0029670",
  address: "Haridwar, Uttarakhand",
  region: "Haridwar–SIDCUL",
};

export const navigation: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Industries", href: "/industries" },
  { label: "How We Operate", href: "/how-we-operate" },
  { label: "Compliance", href: "/compliance" },
  { label: "Vayasya Setu", href: "/vayasya-setu" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const footerLinks = {
  utility: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
  company: [
    { label: "Setu Login", href: "https://hr.vayasyaseva.com" },
    { label: "Brand Handbook", href: "https://brand.vayasyaseva.com" },
    { label: "Mail", href: "https://mail.vayasyaseva.com" },
  ],
  legal: {
    gstin: siteConfig.gstin,
    msme: siteConfig.msme,
  },
};
