/** Claim discipline categories per brand policy */
export type ClaimType = "directional" | "measured" | "contractual";

export interface Claim {
  text: string;
  type: ClaimType;
}

/** Navigation item */
export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

/** Hero section content */
export interface HeroContent {
  headline: string;
  subheadline: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}

/** Trust strip */
export interface TrustClient {
  name: string;
  logoLight: string;
  logoDark: string;
  visible: boolean;
}

export interface Registration {
  label: string;
  value: string;
}

/** Service cluster */
export interface ServiceCluster {
  id: string;
  title: string;
  description: string;
  roles: string[];
  icon: string;
  href: string;
}

/** Operations timeline step */
export interface OperationStep {
  step: number;
  title: string;
  description: string;
  icon: string;
}

/** Compliance item */
export interface ComplianceItem {
  title: string;
  description: string;
  registrations?: string[];
}

/** FAQ item */
export interface FaqItem {
  question: string;
  answer: string;
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

/** Setu feature */
export interface SetuFeature {
  title: string;
  description: string;
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
