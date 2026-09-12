import { pageMetadata } from "@/lib/metadata";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { CtaBlock } from "@/components/sections/cta-block";
import { JsonLd, webPageSchema } from "@/lib/structured-data";
import { trustClients } from "@/content/home";
export const metadata = pageMetadata({
  title: { absolute: "Vayasya Seva | Contract Labour & Workforce Services" },
  description:
    "Contract labour, workforce management and industrial services from Vayasya Seva. Based in Haridwar, with a strong focus on labour compliance, EPF and ESIC records.",
  alternates: { canonical: "/" },
});
const capabilities = [
  {
    title: "Contract labour & workforce",
    text: "People for production, warehousing and the everyday work of your business.",
    href: "/services#workforce-operations",
  },
  {
    title: "Facility & site services",
    text: "Housekeeping, grounds and the upkeep of your working environment.",
    href: "/services#housekeeping-facility",
  },
  {
    title: "Industrial & contract works",
    text: "Civil work, fabrication and maintenance for your next project.",
    href: "/services#civil-works",
  },
];
export default function HomePage() {
  return (
    <>
      <JsonLd
        data={webPageSchema({
          name: "Vayasya Seva",
          description:
            "Contract labour, workforce management and industrial services, with a focus on labour compliance.",
          url: "/",
        })}
      />
      <section className="home-hero">
        <Image
          src="/assets/images/warehouse.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="hero-photo"
        />
        <div className="hero-shade" />
        <div className="site-shell hero-content">
          <p className="eyebrow hero-eyebrow rise">
            PEOPLE AT THE HEART OF WORK
          </p>
          <h1 className="rise rise-1">
            Workforce.
            <br />
            With care.
          </h1>
          <p className="hero-description rise rise-2">
            Contract labour and industrial services. A considered approach to
            people, work and compliance.
          </p>
          <Link href="/services" className="light-link rise rise-3">
            Get to know our work <ArrowUpRight size={20} aria-hidden="true" />
          </Link>
        </div>
        <div className="hero-foot site-shell">
          <span>BASED IN HARIDWAR, UTTARAKHAND</span>
          <a href="#introduction">
            A closer look <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>
      <section id="introduction" className="site-shell home-intro">
        <p className="eyebrow">A PARTNER IN YOUR DAY-TO-DAY</p>
        <div>
          <h2>
            Good work begins
            <br />
            with the right people.
          </h2>
          <p>
            We bring together the workforce, site support and compliance care
            that businesses need to keep moving. From ongoing operations to a
            new project, we build the engagement around your requirements.
          </p>
          <Link href="/about" className="text-link">
            Meet Vayasya Seva <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section
        className="client-section site-shell"
        aria-label="Client experience"
      >
        <p>Our experience includes work with</p>
        <div>
          {trustClients
            .filter((c) => c.visible)
            .map((c) => (
              <Image
                key={c.name}
                src={c.logoLight}
                alt={c.name}
                width={130}
                height={70}
                sizes="130px"
                className="client-logo"
              />
            ))}
        </div>
      </section>
      <section className="capability-section">
        <div className="site-shell">
          <div className="section-intro">
            <p className="eyebrow">WHAT WE DO</p>
            <div>
              <h2>
                Support that fits
                <br />
                the work ahead.
              </h2>
              <p>
                A workforce partner for your operations.
                <br />A wider set of capabilities as your needs grow.
              </p>
            </div>
          </div>
          <div className="capability-list">
            {capabilities.map((c) => (
              <Link className="capability-row" key={c.title} href={c.href}>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
                <ArrowUpRight size={24} aria-hidden="true" />
              </Link>
            ))}
          </div>
          <Link href="/services" className="text-link">
            Explore our capabilities <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section className="compliance-feature">
        <div className="site-shell compliance-inner">
          <div>
            <p className="eyebrow">RESPONSIBILITY, IN PRACTICE</p>
            <h2>
              The work matters.
              <br />
              So does how
              <br />
              it’s managed.
            </h2>
            <Link href="/compliance" className="light-link">
              Our approach to compliance{" "}
              <ArrowUpRight size={19} aria-hidden="true" />
            </Link>
          </div>
          <div className="compliance-detail">
            <p>
              Labour compliance is central to our work. We bring the same
              attention to worker records, wage documentation and statutory
              contributions as we do to the site.
            </p>
            <div className="registration-line">
              <span>EPF &amp; ESIC</span>
              <span>Registered</span>
            </div>
            <div className="registration-line">
              <span>GST &amp; MSME</span>
              <span>Registered</span>
            </div>
            <p className="small-note">
              Registration documents available for your review.
            </p>
          </div>
        </div>
      </section>
      <section className="site-shell closer-section">
        <div>
          <p className="eyebrow">GET TO KNOW US</p>
          <h2>
            A little more,
            <br />
            when you need it.
          </h2>
        </div>
        <div className="closer-links">
          <Link href="/how-we-operate">
            <span>
              How we work with you
              <small>
                From the first conversation to day-to-day coordination.
              </small>
            </span>
            <Plus size={22} aria-hidden="true" />
          </Link>
          <Link href="/industries">
            <span>
              The businesses we support
              <small>Manufacturing, logistics, facilities and beyond.</small>
            </span>
            <Plus size={22} aria-hidden="true" />
          </Link>
          <Link href="/haridwar-sidcul">
            <span>
              Our roots in Haridwar
              <small>
                Contract labour and site services in the SIDCUL region.
              </small>
            </span>
            <Plus size={22} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <CtaBlock />
    </>
  );
}
