import Link from "@/components/i18n/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Doors, Faqs, HERO_TIGHT } from "@/components/pages/minimum-wages";
import { COMPLIANCE_HELP } from "@/content/compliance";
import { lwfStateDetail } from "@/content/lwf-states";
import { lwfStamp } from "@/content/pages/labour-welfare-fund";
import { wageDoors } from "@/content/pages/minimum-wages";
import { linkable } from "@/content/registry";
import { LWF_PATH, lwfStatePath, wageStatePath, type LwfStateSlug } from "@/content/registry/identifiers";
import { statutorySources } from "@/content/statutory";
import { formatDate, getWageState, headlineRate } from "@/content/wages";
import { JsonLd, faqSchema, webPageSchema } from "@/lib/structured-data";
import { localePath } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

/**
 * /labour-welfare-fund/<state>: one state's fund in full (src/content/lwf-states.ts),
 * for "labour welfare fund <state>" searches. The hub keeps the comparison
 * table and links here.
 */

/** Haryana's worked example uses the state's unskilled minimum wage from the wage dataset. */
function detail(slug: LwfStateSlug) {
  const haryana = getWageState("haryana");
  return lwfStateDetail(slug, haryana ? headlineRate(haryana).low.monthly : 0);
}

export function lwfStateMetadata(slug: LwfStateSlug) {
  const d = detail(slug);
  return pageMetadata({ title: d.title, description: d.description, alternates: { canonical: localePath(lwfStatePath(slug), "en-IN") }, locale: "en-IN" });
}

const sourceById = (id: string) => statutorySources.find((s) => s.id === id)!;

export function LwfStatePage({ slug }: { slug: LwfStateSlug }) {
  const d = detail(slug);
  const wagePage = wageStatePath(slug);
  const sources = d.sources.map(sourceById);
  return (
    <>
      <JsonLd data={webPageSchema({ name: d.title, description: d.description, url: localePath(lwfStatePath(slug), "en-IN") })} />
      <JsonLd data={faqSchema(d.faqs)} />
      <PageHero
        crumbs={<Breadcrumbs path={lwfStatePath(slug)} locale="en-IN" name={d.name} />}
        title={d.heading}
        lede={d.lede}
        className={HERO_TIGHT}
      />
      <Section id="rules" className="pt-6 sm:pt-10 lg:pt-12">
        <div className="wage-split">
          <dl className="lwf-facts lwf-facts-wide">
            {d.facts.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.text}</dd>
              </div>
            ))}
          </dl>
          <p className="wage-note">
            {lwfStamp()} from the documents below.{" "}
            <Link href={COMPLIANCE_HELP.href} className="wage-inline-link">
              {COMPLIANCE_HELP.label} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </p>
        </div>
      </Section>
      <Section id="example" className="border-t border-border pt-12 sm:pt-14 lg:pt-16">
        <div className="wage-split">
          <h2 className="wage-h2">{d.example.heading}</h2>
          <div className="wage-prose">
            <p>{d.example.intro}</p>
            <dl className="lwf-facts">
              {d.example.rows.map((r) => (
                <div key={r.label}>
                  <dt>{r.label}</dt>
                  <dd>{r.value}</dd>
                </div>
              ))}
            </dl>
            {d.example.note && <p>{d.example.note}</p>}
          </div>
        </div>
      </Section>
      {d.history && (
        <Section id="history" className="border-t border-border pt-12 sm:pt-14 lg:pt-16">
          <div className="wage-split">
            <h2 className="wage-h2">{d.history.heading}</h2>
            <div className="wage-prose">
              <div className="wage-table-scroll">
                <table className="wage-table is-compact">
                  <caption className="sr-only">{`${d.name} Labour Welfare Fund: the monthly cap on each share`}</caption>
                  <thead>
                    <tr>
                      <th scope="col">From</th>
                      <th scope="col">Worker, up to</th>
                      <th scope="col">Employer, up to</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.history.rows.map((r) => (
                      <tr key={r.from}>
                        <th scope="row">{r.from}</th>
                        <td>{r.worker} a month</td>
                        <td>{r.employer} a month</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>{d.history.note}</p>
            </div>
          </div>
        </Section>
      )}
      <Section id="pay" className="border-t border-border pt-12 sm:pt-14 lg:pt-16">
        <div className="wage-split">
          <h2 className="wage-h2">{d.pay.heading}</h2>
          <div className="wage-prose">
            <p>{d.pay.text}</p>
            <p>
              <a href={d.pay.link.href} className="text-link" rel="noopener">
                {d.pay.link.label} <ArrowRight size={18} aria-hidden="true" />
              </a>
            </p>
            <p className="wage-source">
              From:{" "}
              {sources.map((s, i) => (
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
          </div>
        </div>
      </Section>
      <Faqs faqs={d.faqs} self={lwfStatePath(slug)}>
        <p className="method-back">
          <Link href={LWF_PATH} className="text-link">
            Labour Welfare Fund in other states <ArrowRight size={18} aria-hidden="true" />
          </Link>
          {linkable(wagePage, "en-IN") && (
            <Link href={wagePage} className="text-link">
              Minimum wages in {d.name} <ArrowRight size={18} aria-hidden="true" />
            </Link>
          )}
        </p>
      </Faqs>
      <Doors doors={[wageDoors.business, wageDoors.jobsAll]} />
    </>
  );
}
