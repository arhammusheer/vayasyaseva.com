/** Trust strip */
export interface TrustClient {
  name: string;
  logoLight: string;
  logoDark: string;
  visible: boolean;
  context?: string; // engagement context e.g. "Warehousing operations"
}

/** FAQ item — grouped by persona */
export interface FaqItem {
  question: string;
  answer: string;
  /** An optional link shown after the answer (not part of the FAQPage text). */
  link?: { href: string; label: string };
  category: "operations" | "compliance" | "integration" | "commercial";
}

/** Contact form field */
export interface ContactField {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "select" | "textarea" | "date" | "number";
  required: boolean;
  placeholder?: string;
  options?: string[];
}

/** Site-wide configuration */
export interface SiteConfig {
  companyName: string;
  legalName: string;
  tagline: string;
  email: string;
  /** No phone here: it lives in business-contact.ts, for business pages only. */
  gstin: string;
  /** Corporate Identity Number (MCA). */
  cin: string;
  msme: string;
  address: string;
  region: string;
  /** Public profiles for Organization.sameAs. Add as they are created. */
  sameAs: string[];
  /** City-level coordinates for LocalBusiness.geo. */
  geo: { latitude: number; longitude: number };
}
