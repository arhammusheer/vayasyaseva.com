import { pageMetadata } from "@/lib/metadata";
import Image from "next/image";
import NextLink from "next/link";
import Link from "@/components/i18n/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CtaBlock } from "@/components/sections/cta-block";
import { JsonLd, faqSchema, webPageSchema } from "@/lib/structured-data";
import { homeFaqs, FAQ_PATH } from "@/content/faq";
import { ClientStrip } from "@/components/sections/client-strip";
import { servicePages } from "@/content/service-pages";
import { jobsDoorHref } from "@/components/layout/nav-links";
import { localeParams } from "@/lib/i18n";
export const dynamicParams = false;
export const generateStaticParams = localeParams("/");

// National contractor terms (PLAN §5.2, owner decision 7). Place terms live
// on each market's /locations and /jobs pages. The search snapshot
// taken before this retitle is kept outside the repo, with the rollback rule
// in PLAN §9.5. Keep the title, the H1 and the three capability rows.
const TITLE = "Labour Contractor and Manpower Supply Company";
const DESCRIPTION =
  "Supervised crews for factories, warehouses and facilities on 8-hour shifts. Absentees replaced, EPF and ESIC handled, one monthly invoice for the crew.";

export const metadata = pageMetadata({
  title: { absolute: `${TITLE} | Vayasya Seva` },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
});

/**
 * What a buyer gets, one line each. The third is the site's one contractor
 * line (with the agency FAQ below). The training line is described only: no
 * figures until measured and signed off (docs/claim-policy.md).
 */
const benefits = [
  {
    title: "Shifts that stay staffed.",
    text: "Our supervisor runs the crew and sends a replacement when someone is absent.",
  },
  {
    title: "A crew that learns your line.",
    text: "We track each worker’s training and how long they stay.",
  },
  {
    title: "Our payroll, our paperwork.",
    text: "Wages, EPF, ESIC and the registers are ours. You get one invoice.",
  },
];

/**
 * The home compliance band: what we run for the crew, nationally. PT and
 * LWF are state levies; the licence depends on the state and crew size
 * (docs/claims-register.md). The detail lives on /compliance.
 */
const statutory: [string, string][] = [
  ["Payroll and wage slips", "Every worker, every wage period"],
  ["Attendance and wage registers", "Every shift"],
  ["EPF and ESIC", "Deposited every month"],
  ["Professional Tax", "Where the state levies it"],
  ["Labour Welfare Fund", "Where the state levies it"],
  ["Contract labour licence", "For your site, where required"],
];

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={webPageSchema({
          name: TITLE,
          description: DESCRIPTION,
          url: "/",
        })}
      />
      <JsonLd data={faqSchema(homeFaqs)} />
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
            LABOUR CONTRACTOR AND MANPOWER SUPPLY
          </p>
          <h1 className="home-hero-title rise rise-1">
            Contract labour for factories, warehouses and facilities.
          </h1>
          <p className="hero-description rise rise-2">
            Tell us the roles, the headcount and the shifts. We put a
            supervised crew on your floor and keep it running, for a season or
            for years.
          </p>
          {/* The two doors (PLAN §5.2): buyers to the form, job seekers to
              /jobs (neutral, so not the i18n Link). */}
          <div className="hero-doors rise rise-3">
            <Link href="/contact" className="light-link">
              Request a crew <ArrowUpRight size={20} aria-hidden="true" />
            </Link>
            <p className="hero-seeker">
              Looking for work?
              <NextLink href={jobsDoorHref("en-IN")} prefetch={false}>
                See jobs <ArrowRight size={18} aria-hidden="true" />
              </NextLink>
            </p>
          </div>
        </div>
      </section>
      <ClientStrip />
      <section id="introduction" className="site-shell home-intro">
        <p className="eyebrow">WHY TEAMS USE US</p>
        <div>
          <h2>
            You run the line.
            <br />
            We run the crew.
          </h2>
          <ol className="tracked-list">
            {benefits.map((item, i) => (
              <li key={item.title}>
                <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="capability-section">
        <div className="site-shell">
          <div className="section-intro">
            <p className="eyebrow">WHAT WE SUPPLY</p>
            <div>
              <h2>
                Crews for the
                <br />
                work you run.
              </h2>
              <p>A workforce partner for your operations.</p>
            </div>
          </div>
          <div className="capability-list">
            {servicePages.map((s) => (
              <Link className="capability-row" key={s.slug} href={`/services/${s.slug}`}>
                <h3>{s.name}</h3>
                <p>{s.summary}</p>
                <ArrowUpRight size={24} aria-hidden="true" />
              </Link>
            ))}
          </div>
          <Link href="/services" className="text-link">
            All services <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section className="compliance-feature">
        <div className="site-shell compliance-inner">
          <div>
            <p className="eyebrow">COMPLIANCE</p>
            <h2>
              Payroll and
              <br />
              compliance,
              <br />
              handled.
            </h2>
          </div>
          <div className="compliance-detail">
            <p>
              We run the statutory work for the crew by each state’s rules, and
              keep every record open to your audit.
            </p>
            <ul className="statutory-list">
              {statutory.map(([name, note]) => (
                <li key={name}>
                  <span>{name}</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
            <Link href="/compliance" className="light-link">
              How we handle compliance <ArrowUpRight size={19} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
      <section className="home-faq" id="questions">
        <div className="site-shell home-faq-inner">
          <div>
            <h2>Questions.</h2>
          </div>
          <div className="faq-prose">
            {homeFaqs.map((f) => (
              <div key={f.question}>
                <h3>{f.question}</h3>
                <p>{f.answer}</p>
              </div>
            ))}
            <Link href={FAQ_PATH} className="text-link">
              More questions <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
      <CtaBlock />
    </>
  );
}
