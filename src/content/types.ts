/**
 * Claims discipline (per brand.vayasyaseva.com)
 *
 * Aspirational:  Forward-looking intent ("We aim to...")
 * Directional:   Active work in progress ("We are working toward...")
 * Measured:       Quantified results with data source
 * Contractual:   Legally binding, clause-referenced
 */
export type ClaimType = "aspirational" | "directional" | "measured" | "contractual";

export interface Claim {
  text: string;
  type: ClaimType;
  evidence?: string;
  expiresAt?: string; // ISO date
}

/** Navigation item */
export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

/** Trust strip */
export interface TrustClient {
  name: string;
  logoLight: string;
  logoDark: string;
  visible: boolean;
  context?: string; // engagement context e.g. "Warehousing operations"
}

export interface Registration {
  label: string;
  value: string;
}

/** Compliance item */
export interface ComplianceItem {
  title: string;
  description: string;
  claim: ClaimType;
  registrations?: string[];
}

/** FAQ item — grouped by persona */
export interface FaqItem {
  question: string;
  answer: string;
  category: "operations" | "compliance" | "integration" | "commercial";
}

/** Industry sector */
export interface IndustrySector {
  id: string;
  title: string;
  description: string;
  staffingPattern: string;
  riskControlNeeds: string;
  reportingCadence: string;
  icon: string;
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
  phone: string;
  gstin: string;
  msme: string;
  address: string;
  region: string;
}
