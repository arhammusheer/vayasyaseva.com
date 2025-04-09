import { BsQuestion } from "react-icons/bs";
import { FaMailBulk, FaPhone, FaSchool, FaUsers } from "react-icons/fa";
import { IoMail } from "react-icons/io5";
import { RiBuilding2Fill } from "react-icons/ri";
import { WebsiteContent } from "./types";

export const content: WebsiteContent = {
  header: {
    logo: "VAYASYA SEVA",
    navigation: [
      { name: "About Us", href: "about", icon: RiBuilding2Fill },
      { name: "Services", href: "services", icon: FaUsers },
      { name: "Why Us?", href: "why-us", icon: FaSchool },
      { name: "FAQs", href: "faq", icon: BsQuestion },
      { name: "Contact", href: "contact", icon: FaMailBulk },
    ],
    contactButton: "Contact Us",
  },
  heroSection: {
    id: "home",
    headline: "Reliable Seamless Operations",
    subheading: "Your trusted partner for warehouse and logistics staffing.",
    ctaButton: {
      label: "Get in touch",
      href: "contact",
    },
  },
  clientsSection: {
    id: "clients",
    title: "Our Clients",
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
      "Vayasya Seva Private Limited is a manpower solutions company committed to powering your logistics and warehousing needs. From skilled labor for loading and unloading to full-service warehouse management, we provide dependable staffing tailored to your operations. We are fully compliant with Uttarakhand labor laws and registered under ESIC, PF, GST, and as an MSME.",
  },
  servicesSection: {
    id: "services",
    title: "Our Services",
    cards: [
      {
        title: "Warehouse Management",
        description:
          "From inventory tracking to overall supervision, we provide experienced manpower to streamline your warehouse operations.",
        image: "/assets/services/warehouse-management.png",
      },
      {
        title: "Loading & Unloading",
        description:
          "Trained labor for fast, safe, and efficient loading and unloading of goods and materials at your site.",
        image: "/assets/services/loading-unloading.png",
      },
      {
        title: "Shifting & Warehousing",
        description:
          "Reliable shifting and warehousing services for seamless transitions and stock adjustments, whether it's a single pallet or an entire warehouse.",
        image: "/assets/services/shifting-warehousing.png",
      },
      {
        title: "Housekeeping & Facility Support",
        description:
          "Maintain clean, safe, and efficient work environments with our skilled housekeeping staff and general support workers.",
        image: "/assets/services/housekeeping.png",
      },
      {
        title: "Flexible or Seasonal Workforce",
        description:
          "Deploy manpower on-demand for peak seasons, special projects, or urgent requirements—without long-term commitments.",
        image: "/assets/services/flexible-workforce.png",
      },
      {
        title: "Horticulture & Gardening (Factory Premises)",
        description:
          "Beautify and maintain your factory’s outdoor spaces with our trained horticulture staff. We handle garden upkeep, plant care, and landscaping support.",
        image: "/assets/services/horticulture.png",
      },
    ],
  },

  impactSection: {
    id: "why-us",
    title: "Why Choose Us?",
    statistics: [
      {
        stat: "150+ Workers",
        description: "Deployed across Haridwar",
        isRollingNumber: true,
      },
      {
        stat: "10 Years",
        description: "Experience in the industry",
        isRollingNumber: true,
      },
      {
        stat: "24/7 Support",
        description: "Available for all active clients",
        isRollingNumber: false,
      },
    ],
  },
  faqSection: {
    id: "faq",
    title: "Frequently Asked Questions",
    questions: [
      {
        question: "What manpower services do you provide?",
        answer:
          "We offer skilled and unskilled labor for warehouse management, loading, unloading, and shifting needs. All staff are trained and monitored for performance and compliance.",
      },
      {
        question: "Where are your services available?",
        answer:
          "Our services are currently available across Haridwar. For requirements outside the region, please contact us directly.",
      },
      {
        question: "Are your services legally compliant?",
        answer:
          "Yes. We are fully compliant Private Limited Company with all applicable Uttarakhand labor laws, and registered under ESIC, PF, GST, and MSME.",
      },
      {
        question: "Do you provide custom manpower plans?",
        answer:
          "Absolutely. We assess your business needs and provide staffing solutions that align with your operations and timelines.",
      },
      {
        question: "Do you provide transport services as well?",
        answer:
          "While we don’t operate transport services directly, we work closely with trusted logistics partners. We can either coordinate transportation on your behalf or connect you with our verified vendors.",
      },
      {
        question: "Do you offer manpower based on shifts?",
        answer:
          "Yes, we manage manpower rotation across multiple shifts to ensure seamless round-the-clock operations. Our team takes care of shift planning and workforce scheduling based on your requirements.",
      },
      {
        question: "Can I track worker attendance and performance?",
        answer:
          "Attendance is usually tracked by our clients, but we do offer digital tools to share daily attendance reports and workforce summaries for better visibility and transparency.",
      },
      {
        question: "What manpower plans do you offer—per person or per tonnage?",
        answer:
          "We offer flexible plans based on your needs—either by number of workers or workload (such as tonnage). Reach out to us for a tailored quote.",
      },
      {
        question: "Is your workforce insured?",
        answer:
          "Yes, all our employees are covered under the Employees’ State Insurance (ESIC) scheme, ensuring medical and accident protection as per statutory requirements.",
      },
      {
        question: "How do you verify the background of your workers?",
        answer:
          "All deployed personnel undergo police verification to ensure complete reliability and safety at your worksite.",
      },
    ],
  },
  contactSection: {
    id: "contact",
    contactMethodsTitle: "Contact Us Directly",
    enableForm: false,

    title: "Or send us a message",
    fields: [
      {
        id: "email",
        label: "Email",
        type: "email",
        placeholder: "Enter your email",
      },
      {
        id: "message",
        label: "Message",
        type: "textarea",
        placeholder: "Enter your message",
      },
    ],
    contactMethods: [
      {
        name: "Email",
        value: "seva.vayasya888@gmail.com",
        icon: IoMail,
        href: "mailto:seva.vayasya888@gmail.com",
      },
      {
        name: "Phone",
        value: "+91 90688 55443",
        icon: FaPhone,
        href: "tel:+919068855443",
      },
    ],
  },
  footer: {
    copyright: `© ${new Date().getFullYear()} Vayasya Seva Private Limited.`,
    GSTIN: "05AAJCV4562E1ZB",
    MSME: "UDYAM-UK-06-0029670",
  },
};
