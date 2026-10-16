import { pageMetadata } from "@/lib/metadata";
import Image from "next/image";
import Link from "@/components/i18n/link";
import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { CtaBlock } from "@/components/sections/cta-block";
import { JsonLd, faqSchema, webPageSchema } from "@/lib/structured-data";
import { homeFaqs, trustClients, whereWeWork } from "@/content/home";
import { clusters, linkable } from "@/content/registry";
import { WAGE_HUB_PATH, guidePath, wageStatePath } from "@/content/registry/identifiers";
import { wageStates } from "@/content/wages";
import { localeParams } from "@/lib/i18n";
export const dynamicParams = false;
export const generateStaticParams = localeParams("/");

// National contractor terms (PLAN §5.2, owner decision 7). The Haridwar
// terms live on /haridwar-sidcul and /jobs/haridwar. The search snapshot
// taken before this retitle is kept outside the repo, with the rollback rule
// in PLAN §9.5.
const TITLE = "Labour Contractor and Manpower Supply Company";
const DESCRIPTION =
  "Contract labour for factories, warehouses and facilities. Workers on our payroll; we handle wages, EPF and ESIC, supervise and replace absentees.";

export const metadata = pageMetadata({
  title: { absolute: `${TITLE} | Vayasya Seva` },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
});

const capabilities = [
  {
    title: "Contract labour and manpower",
    text: "Production helpers, packers, loaders and warehouse crews.",
    href: "/services/contract-labour",
  },
  {
    title: "Facility and site services",
    text: "Housekeeping and upkeep crews for plants, warehouses and offices.",
    href: "/services/housekeeping",
  },
  {
    title: "Industrial and contract works",
    text: "Civil work, fabrication and maintenance for your next project.",
    href: "/services#civil-works",
  },
];

/** What we track for every worker. Described only: no figures until measured and signed off (docs/claim-policy.md). */
const tracked = [
  { title: "Retention", text: "How long people stay with a crew." },
  { title: "Training", text: "Which training each worker has finished, and what comes next." },
  { title: "Time to full productivity", text: "How long a new worker takes to work at full pace on the line." },
];

/** Clusters whose buyer page is published, in registry order (PLAN §5.2 "Where we work"). */
const places = clusters.flatMap((c) => {
  const line = whereWeWork[c.id];
  const name = c.id === "haridwar" ? "SIDCUL Haridwar" : c.name["en-IN"];
  return line && name && linkable(c.buyerHub, "en-IN") ? [{ id: c.id, name, href: c.buyerHub, ...line }] : [];
});

/** Reference pages linked from the compliance band once they are published. */
const references = [
  { href: WAGE_HUB_PATH, label: "Minimum wages by state" },
  { href: guidePath("new-labour-codes"), label: "The new labour codes, explained" },
].filter((r) => linkable(r.href, "en-IN"));

/** Published state wage pages, linked by name under the wage hub link. */
const wageLinks = wageStates
  .map((s) => ({ href: wageStatePath(s.state), label: s.name }))
  .filter((l) => linkable(l.href, "en-IN"));

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
            We supply the workers and stay their employer. We pay wages and
            deposit EPF and ESIC where they apply, supervise the crew and
            replace absentees.
          </p>
          {/* The two doors (PLAN §5.2): buyers to the form, job seekers to jobs. */}
          <div className="hero-doors rise rise-3">
            <Link href="/contact" className="light-link">
              Request a crew <ArrowUpRight size={20} aria-hidden="true" />
            </Link>
            <p className="hero-seeker">
              Looking for work?
              <Link href="/jobs">
                See jobs <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </p>
          </div>
        </div>
        <div className="hero-foot site-shell">
          <span>BASED IN HARIDWAR, UTTARAKHAND</span>
        </div>
      </section>
      <section id="introduction" className="site-shell home-intro">
        <p className="eyebrow">HOW IT WORKS</p>
        <div>
          <h2>
            On our payroll,
            <br />
            on your site.
          </h2>
          <p>
            The workers we send are our employees, not candidates for you to
            hire. We pay their wages, deposit EPF and ESIC where they apply,
            and keep the
            attendance and wage registers. Our supervisor runs the crew on
            your shifts and sends a replacement when someone is absent.
          </p>
          <p>
            Every shift is a full 8 hours. You tell us the work, the headcount
            and the shift pattern, and you get one invoice for the crew.
            Before a crew starts, we can visit the site to see the work, the
            shifts and the safety rules.
          </p>
          <div className="tracked-list">
            <h3>What we track for every worker</h3>
            <ol>
              {tracked.map((item, i) => (
                <li key={item.title}>
                  <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="tracked-note">
              We treat the people we deploy as people to develop: a worker who
              stays and learns is better for your line. These records show us
              where a crew needs support. We&rsquo;ll publish figures only once
              they&rsquo;re measured.
            </p>
          </div>
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
            <p className="eyebrow">WHAT WE SUPPLY</p>
            <div>
              <h2>
                Crews for the
                <br />
                work you run.
              </h2>
              <p>
                Tell us the roles, the headcount and the shift pattern. We put
                together the crew, a supervisor and the records the site needs,
                for ongoing operations or a fixed project.
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
            All services <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section className="where-section" id="where-we-work">
        <div className="site-shell">
          <div className="section-intro">
            <p className="eyebrow">WHERE WE WORK</p>
            <div>
              <h2>
                Rooted in Haridwar.
                <br />
                Open to your site.
              </h2>
              <p>
                We run crews only where we can supervise them properly. Before we
                take on a site anywhere else, we check that we can recruit, pay
                and supervise people there.
              </p>
            </div>
          </div>
          <ul className="where-list">
            {places.map((p) => (
              <li key={p.id}>
                <p className="where-place">
                  {p.name}
                  <small>{p.label}</small>
                </p>
                <div>
                  <p>{p.text}</p>
                  <Link href={p.href} className="text-link">
                    {p.link} <ArrowUpRight size={18} aria-hidden="true" />
                  </Link>
                </div>
              </li>
            ))}
            <li className="is-open">
              <p className="where-place">Elsewhere in India?</p>
              <div>
                <p>
                  Tell us the site and we&rsquo;ll tell you plainly whether we
                  can staff it.
                </p>
                <Link href="/contact" className="text-link">
                  Tell us the site <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
              </div>
            </li>
          </ul>
        </div>
      </section>
      <section className="compliance-feature">
        <div className="site-shell compliance-inner">
          <div>
            <p className="eyebrow">COMPLIANCE, IN PRACTICE</p>
            <h2>
              Wage records, attendance, EPF and ESIC.
              <br />
              Kept by us, open to you.
            </h2>
            <Link href="/compliance" className="light-link">
              Our approach to compliance{" "}
              <ArrowUpRight size={19} aria-hidden="true" />
            </Link>
          </div>
          <div className="compliance-detail">
            <p>
              As the employer, we carry the statutory work for the workers we
              deploy: attendance and wage registers, wage slips, and the EPF
              and ESIC contributions that apply, ready for your review.
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
            {references.map((r) => (
              <Link key={r.href} href={r.href} className="light-link">
                {r.label} <ArrowUpRight size={19} aria-hidden="true" />
              </Link>
            ))}
            {wageLinks.length > 0 && linkable(WAGE_HUB_PATH, "en-IN") && (
              <p className="band-states">
                <span>Minimum wages in</span>
                {wageLinks.map((l) => (
                  <Link key={l.href} href={l.href}>
                    {l.label}
                  </Link>
                ))}
              </p>
            )}
          </div>
        </div>
      </section>
      <section className="home-faq" id="questions">
        <div className="site-shell home-faq-inner">
          <div>
            <p className="eyebrow">QUESTIONS</p>
            <h2>
              What buyers
              <br />
              ask us first.
            </h2>
          </div>
          <div className="faq-prose">
            {homeFaqs.map((f) => (
              <div key={f.question}>
                <h3>{f.question}</h3>
                <p>{f.answer}</p>
                {f.link && (
                  <Link href={f.link.href} className="text-link">
                    {f.link.label} <ArrowUpRight size={18} aria-hidden="true" />
                  </Link>
                )}
              </div>
            ))}
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
              <small>Manufacturing, warehousing, FMCG and facilities.</small>
            </span>
            <Plus size={22} aria-hidden="true" />
          </Link>
          <Link href="/about">
            <span>
              About Vayasya Seva
              <small>A contract labour company based in Haridwar.</small>
            </span>
            <Plus size={22} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <CtaBlock />
    </>
  );
}
