import { BsQuestion } from "react-icons/bs";
import { FaMailBulk, FaPhone, FaSchool, FaUsers } from "react-icons/fa";
import { IoMail } from "react-icons/io5";
import { RiBuilding2Fill } from "react-icons/ri";
import type { WebsiteContent } from "./types";

export const content: WebsiteContent = {
  header: {
    logo: "VAYASYA SEVA",
    navigation: [
      { name: "About", href: "about", icon: RiBuilding2Fill },
      { name: "Services", href: "services", icon: FaUsers },
      { name: "How We Operate", href: "ops", icon: FaSchool },
      { name: "Why Vayasya", href: "why-us", icon: FaSchool },
      { name: "FAQs", href: "faq", icon: BsQuestion },
      { name: "Contact", href: "contact", icon: FaMailBulk },
    ],
    contactButton: "Talk to our team",
  },

  heroSection: {
    id: "home",
    headline: "Reliable Seamless Operations",
    subheading:
      "Vayasya Seva provides disciplined, compliant manpower for warehouses, factories, and facilities.",
    ctaButton: {
      label: "Share your requirement",
      href: "contact",
    },
  },

  clientsSection: {
    id: "clients",
    title: "Trusted by Enterprise Clients",
    clients: [
      {
        name: "ITC Limited",
        image: "/assets/clients/ITC-light.png",
        darkImage: "/assets/clients/ITC-dark.png",
      },
      {
        name: "Wipro",
        image: "/assets/clients/Wipro-light.png",
        darkImage: "/assets/clients/Wipro-dark.png",
      },
      {
        name: "Unilever",
        image: "/assets/clients/Unilever-light.png",
        darkImage: "/assets/clients/Unilever-dark.png",
      },
    ],
  },

  aboutSection: {
    id: "about",
    title: "Who We Are",
    description:
      "Vayasya Seva Private Limited is a manpower and on-ground operations partner for enterprises that depend on disciplined, reliable, and compliance-focused workforce support. We specialise in warehouse operations, logistics support, manufacturing assistance, facility services, and hospitality-linked deployments. To deliver consistency and clarity, our internal operations system Vayasya Setu helps us maintain accurate attendance, structured documentation, and audit-ready compliance. We operate as a fully compliant Private Limited company registered under ESIC, EPF, GST, and MSME.",
  },

  servicesSection: {
    id: "services",
    title: "Manpower & Site Operations",
    cards: [
      {
        title: "Warehouse & Logistics Manpower",
        description:
          "Teams for loading, unloading, stacking, picking, dispatch, staging, and general warehouse operations. Supervisors ensure SLA discipline and safe handling.",
        image: "/assets/services/warehouse-management.png",
      },
      {
        title: "Manufacturing & Shopfloor Support",
        description:
          "Helpers, packers, line feeders, material handling teams, and general support staff aligned to your production requirements and quality processes.",
        image: "/assets/services/manufacturing-support.png",
      },
      {
        title: "Housekeeping, Facility & Hospitality Support",
        description:
          "Housekeeping, pantry, back-of-house, and guest-area staff for plants, offices, institutional facilities, and hospitality-linked sites.",
        image: "/assets/services/housekeeping.png",
      },
      {
        title: "On-Ground Workforce Operations",
        description:
          "Recruitment, onboarding, shift planning, discipline management, and continuous supervision to ensure consistent performance across all active sites.",
        image: "/assets/services/workforce-operations.png",
      },
      {
        title: "Horticulture & Grounds Maintenance",
        description:
          "Garden and outdoor area maintenance teams for factories and institutional campuses, supporting both appearance and environmental goals.",
        image: "/assets/services/horticulture.png",
      },
      {
        title: "Seasonal & Project-Based Workforce",
        description:
          "Rapid ramp-up manpower support for seasonal peaks, new launches, expansions, promotional campaigns, or specialised projects.",
        image: "/assets/services/flexible-workforce.png",
      },
    ],
  },

  impactSection: {
    id: "why-us",
    title: "Why Vayasya Seva",
    statistics: [
      {
        stat: "10+ Years",
        description:
          "On-ground manpower and operations experience in the Haridwar-SIDCUL region.",
        isRollingNumber: true,
      },
      {
        stat: "150+ Personnel",
        description: "Workers and supervisors deployed across active sites.",
        isRollingNumber: true,
      },
      {
        stat: "Structured Ops",
        description:
          "Every deployment backed by our internal system Vayasya Setu for accuracy and clarity.",
        isRollingNumber: false,
      },
      {
        stat: "Compliance-Ready",
        description:
          "Registered under ESIC, EPF, GST, and MSME with strong documentation and audit discipline.",
        isRollingNumber: false,
      },
    ],
  },

  faqSection: {
    id: "faq",
    title: "Frequently Asked Questions",
    questions: [
      {
        question: "What manpower services does Vayasya Seva provide?",
        answer:
          "We provide manpower and on-ground workforce operations for warehouses, logistics hubs, manufacturing units, corporate and industrial facilities, and hospitality sites. This includes workers, supervisors, and shift coordination.",
      },
      {
        question:
          "Can you align attendance or payroll data with our internal formats?",
        answer:
          "Yes. We can share data in Excel, CSV, or PDF formats that align with your existing processes. For larger clients, we can also structure data specifically for your HR or attendance systems without requiring new tools through our internal compliance engine Vayasya Setu.",
      },
      {
        question: "Are your operations legally compliant?",
        answer:
          "Yes. We are registered under ESIC, EPF, GST, and MSME, and operate under all applicable labour rules. Documentation and registers are maintained to support statutory inspections and your internal audits.",
      },
      {
        question: "Where are your services available?",
        answer:
          "Our primary operations are in the Haridwar–SIDCUL region. For other locations, we evaluate requests based on scale and project requirements.",
      },
      {
        question: "Do you provide manpower for multiple shifts?",
        answer:
          "Yes. We manage manpower across multiple shifts and rotation patterns, ensuring consistent coverage and timely replacements when required.",
      },
      {
        question: "Can we get daily or monthly attendance summaries?",
        answer:
          "Absolutely. We can share daily, weekly, or monthly attendance summaries processed through our internal system. These reports are aligned to your internal review cycles.",
      },
      {
        question: "Do you manage worker onboarding and verification?",
        answer:
          "Yes. We handle identity verification and, where necessary, police verification based on client policy or site requirements.",
      },
      {
        question: "Is your workforce insured?",
        answer:
          "Yes, all our employees are covered under the Employees’ State Insurance (ESIC) scheme, ensuring medical and accident protection as per statutory requirements.",
      },
      {
        question: "Do you operate transport fleets?",
        answer:
          "No. We do not operate transport fleets but have strong partnerships with transporters which we can extend to you as per your requirement.",
      },
      {
        question: "How do we start with Vayasya Seva?",
        answer:
          "Share your requirement, location, and tentative manpower numbers. We will study your operations and propose an appropriate manpower model along with reporting and compliance support.",
      },
      {
        question: "What is Vayasya Setu?",
        answer:
          "Vayasya Setu is our internal operations engine that ensures accurate attendance tracking, structured documentation, payroll, and audit-ready compliance. It helps us deliver consistent, error-free data to our clients without requiring them to manage new systems.",
      },
      {
        question: "Can Vayasya Setu integrate with our HR systems?",
        answer:
          "Yes. Vayasya Setu is has built in bridges which link directly to commonly used HR and attendance systems. This allows us to provide you real-time data straight into your existing workflows without additional effort on your part.",
      },
      {
        question: "Do we need to use Vayasya Setu as a software?",
        answer:
          "It's not necessary but we can provide you access to Vayasya Setu as a software platform if required. This allows you to view real-time attendance, worker details, and compliance reports directly through a web portal. It can also be integrated with your internal systems for seamless data flow.",
      },
    ],
  },

  contactSection: {
    id: "contact",
    title: "Share Your Requirement",
    contactMethodsTitle: "Contact us directly",
    enableForm: false,
    fields: [
      {
        id: "email",
        label: "Work Email",
        type: "email",
        placeholder: "name@company.com",
      },
      {
        id: "message",
        label: "Requirement / Message",
        type: "textarea",
        placeholder:
          "Tell us about your site, manpower requirement, and timelines.",
      },
    ],
    contactMethods: [
      {
        name: "Email",
        value: "help@vayasyaseva.com",
        icon: IoMail,
        href: "mailto:help@vayasyaseva.com",
      },
      {
        name: "Phone",
        value: "+91 72920 14101",
        icon: FaPhone,
        href: "tel:+917292014101",
      },
    ],
  },

  footer: {
    copyright: `© ${new Date().getFullYear()} Vayasya Seva Private Limited.`,
    GSTIN: "05AAJCV4562E1ZB",
    MSME: "UDYAM-UK-06-0029670",
  },
};
