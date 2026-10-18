import Link from "@/components/i18n/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Doors, Faqs, HERO_TIGHT } from "@/components/pages/minimum-wages";
import { COMPLIANCE_HELP } from "@/content/compliance";
import { lwfCopy as l, lwfStamp, stateFunds, type StateFund } from "@/content/pages/labour-welfare-fund";
import { wageDoors, wageUi } from "@/content/pages/minimum-wages";
import { linkable } from "@/content/registry";
import { LWF_PATH, LWF_STATE_SLUGS, WAGE_HUB_PATH, lwfStatePath, wageStatePath, type LwfStateSlug } from "@/content/registry/identifiers";
import { formatDate } from "@/content/wages";
import { JsonLd, faqSchema, webPageSchema } from "@/lib/structured-data";
import { localePath } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

/**
 * /labour-welfare-fund: the Labour Welfare Fund of every state the wage
 * pages cover, from the employer dues in src/content/statutory.ts. One
 * table to compare, then a short section per state (its own heading, for
 * "labour welfare fund <state>" searches) with the cited documents.
 */

export function lwfMetadata() {
  return pageMetadata({
    title: l.title,
    description: l.description(stateFunds().map((f) => f.name)),
    alternates: { canonical: localePath(LWF_PATH, "en-IN") },
    locale: "en-IN",
  });
}

/** "₹50 a year", or the U.P. Act's "Nothing" spelled out as no regular contribution. */
const share = (f: StateFund, value: string) => (f.noContribution && value === "Nothing" ? "No contribution" : value);

/** The state's own page, where it has one and it is published. */
function statePage(slug: string) {
  if (!(LWF_STATE_SLUGS as readonly string[]).includes(slug)) return undefined;
  const path = lwfStatePath(slug as LwfStateSlug);
  return linkable(path, "en-IN") ? path : undefined;
}

function StateSection({ fund }: { fund: StateFund }) {
  const { row, due } = fund;
  const wagePage = wageStatePath(fund.slug);
  const full = statePage(fund.slug);
  return (
    <section id={fund.slug} className="wage-split lwf-state">
      <h2 className="wage-h2">{l.state.heading(fund.name)}</h2>
      <div className="wage-prose">
        <dl className="lwf-facts">
          <div>
            <dt>{l.state.covers}</dt>
            <dd>{row.applies}</dd>
          </div>
          <div>
            <dt>{l.state.worker}</dt>
            <dd>{share(fund, row.worker)}</dd>
          </div>
          <div>
            <dt>{l.state.employer}</dt>
            <dd>{row.employer}</dd>
          </div>
          {due && !row.explain?.some(([label]) => label === "When") && (
            <div>
              <dt>{l.state.due}</dt>
              <dd>
                {due.when}, {due.detail}
              </dd>
            </div>
          )}
          {row.explain?.map(([label, text]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{text}</dd>
            </div>
          ))}
        </dl>
        <p className="wage-source">
          {l.state.sources}:{" "}
          {fund.sources.map((s, i) => (
            <span key={s.id}>
              {i > 0 && "; "}
              <a href={s.url} className="wage-inline-link" rel="noopener">
                {s.title}
              </a>{" "}
              ({s.number}, {formatDate(s.date)})
            </span>
          ))}
          .
        </p>
        {full && (
          <p>
            <Link href={full} className="text-link">
              {l.state.full(fund.name)} <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </p>
        )}
        {linkable(wagePage, "en-IN") && (
          <p>
            <Link href={wagePage} className="text-link">
              {l.state.wages(fund.name)} <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}

export function LabourWelfareFundPage() {
  const funds = stateFunds();
  const names = funds.map((f) => f.name);
  const faqs = l.faqs(funds);
  return (
    <>
      <JsonLd data={webPageSchema({ name: l.title, description: l.description(names), url: localePath(LWF_PATH, "en-IN") })} />
      <JsonLd data={faqSchema(faqs)} />
      <PageHero
        crumbs={<Breadcrumbs path={LWF_PATH} locale="en-IN" name={l.breadcrumb} />}
        title={l.heading}
        lede={l.lede(names, funds.filter((f) => f.noContribution).map((f) => f.name))}
        className={HERO_TIGHT}
      />
      <Section id="states" className="pt-6 sm:pt-10 lg:pt-12">
        <div className="wage-table-scroll">
          <table className="wage-table is-index lwf-table">
            <caption className="sr-only">{l.table.caption}</caption>
            <thead>
              <tr>
                <th scope="col">{l.table.state}</th>
                <th scope="col">{l.table.worker}</th>
                <th scope="col">{l.table.employer}</th>
                <th scope="col" className="col-split">{l.table.covers}</th>
                <th scope="col" className="col-split">{l.table.due}</th>
              </tr>
            </thead>
            <tbody>
              {funds.map((f) => (
                <tr key={f.slug} className="wage-row">
                  <th scope="row">
                    {statePage(f.slug) ? (
                      <Link href={statePage(f.slug)!} className="wage-row-link">
                        {f.name} <ArrowRight size={18} aria-hidden="true" />
                      </Link>
                    ) : (
                      <a href={`#${f.slug}`} className="wage-row-link">
                        {f.name} <ArrowRight size={18} aria-hidden="true" />
                      </a>
                    )}
                  </th>
                  <td>
                    <strong>{share(f, f.row.worker)}</strong>
                  </td>
                  <td>{f.row.employer}</td>
                  <td className="col-split">{f.row.applies}</td>
                  <td className="col-split">{f.due ? `${f.due.when}, ${f.due.detail}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="wage-note">
          {lwfStamp()} from each state&apos;s Act and its Labour Welfare Board&apos;s notices.{" "}
          <Link href={COMPLIANCE_HELP.href} className="wage-inline-link">
            {l.links.compliance} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </p>
      </Section>
      <Section id="by-state" className="border-t border-border pt-12 sm:pt-14 lg:pt-16">
        <div className="lwf-states">
          {funds.map((f) => (
            <StateSection key={f.slug} fund={f} />
          ))}
        </div>
      </Section>
      <Faqs faqs={faqs} self={LWF_PATH}>
        <p className="method-back">
          <Link href={WAGE_HUB_PATH} className="text-link">
            {l.links.wages} <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link href="/minimum-wages/how-we-check" className="text-link">
            {wageUi.howWeCheck} <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </p>
      </Faqs>
      <Doors doors={[wageDoors.business, wageDoors.jobsAll]} />
    </>
  );
}
