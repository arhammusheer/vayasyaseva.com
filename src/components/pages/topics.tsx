import Link from "@/components/i18n/link";
import { Section } from "@/components/layout/section";
import { Doors } from "@/components/pages/minimum-wages";
import { BonusCalculator, EpfCalculator, EsicCalculator, GratuityCalculator, KarnatakaPtCalculator, type BonusPlace } from "@/components/reference/calculators";
import { BonusCalendar, EpfSplit, EsicPeriods, GratuityStairs, KarnatakaPtYear } from "@/components/reference/figures";
import { RefSection, RefWide, RuleGroups, TopicEnd, TopicHero } from "@/components/reference/primitives";
import { wageDoors } from "@/content/pages/minimum-wages";
import { linkable } from "@/content/registry";
import { epfCeilingChange, epfTopic } from "@/content/topics/epf";
import { esicTopic } from "@/content/topics/esic";
import { bonusTopic } from "@/content/topics/bonus";
import { gratuityTopic } from "@/content/topics/gratuity";
import { headlineTable, wageStates } from "@/content/wages";
import { wageStatePath } from "@/content/registry/identifiers";
import { karnatakaPtTopic, professionalTaxTopic, ptStates } from "@/content/topics/professional-tax";
import type { TopicPage } from "@/content/topics/types";
import { JsonLd, faqSchema, topicSchema } from "@/lib/structured-data";
import { statutorySources } from "@/content/statutory";
import { localePath } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

/**
 * The reference topic pages (redesign, 18 Oct 2026). Each composes its own
 * order around one signature figure that explains how its scheme works and
 * a calculator, on the parts in src/components/reference. Owner: the earlier
 * template looked like "a skeleton structure slapped onto random info".
 */

export function topicMetadata(topic: TopicPage) {
  return pageMetadata({ title: topic.title, description: topic.description, alternates: { canonical: localePath(topic.path, "en-IN") }, locale: "en-IN" });
}

function Schema({ topic }: { topic: TopicPage }) {
  return (
    <>
      <JsonLd
        data={topicSchema({
          headline: topic.title,
          description: topic.description,
          url: localePath(topic.path, "en-IN"),
          checked: topic.checked,
          sources: topic.sources.flatMap((id) => statutorySources.filter((s) => s.id === id)),
        })}
      />
      <JsonLd data={faqSchema(topic.faqs)} />
    </>
  );
}

function Hero({ topic }: { topic: TopicPage }) {
  return <TopicHero path={topic.path} breadcrumb={topic.breadcrumb} heading={topic.heading} lede={topic.lede} glance={topic.glance} checked={topic.checked} updatedFrom={topic.updatedFrom} />;
}

const doors = [wageDoors.business, wageDoors.jobsAll];

/** EPF: where the 25% goes, the ceiling that just changed, a calculator, the rules. */
export function EpfPage() {
  const t = epfTopic;
  return (
    <>
      <Schema topic={t} />
      <Hero topic={t} />
      <RefWide id="split" heading="Where the 25% goes." intro="Two shares of 12% on the same wages, and two small charges the employer pays on top.">
        <EpfSplit />
      </RefWide>
      <RefSection id="calculator" heading="Work it out." intro="For one worker, a full month. Above ₹25,000 the contributions stop at the ceiling." subtle>
        <EpfCalculator />
      </RefSection>
      <RefSection id="ceiling" heading="The ceiling rose on 17 September 2026." intro="What EPFO's FAQs ask employers to do now.">
        <div className="ref-change" aria-label="The wage ceiling went from ₹15,000 to ₹25,000 a month">
          <s>₹15,000</s>
          <strong>₹25,000</strong>
          <span>a month, the first change since September 2014</span>
        </div>
        <dl className="ref-rows mt-8">
          {epfCeilingChange.map((r) => (
            <div key={r.label}>
              <dt>{r.label}</dt>
              <dd>{r.text}</dd>
            </div>
          ))}
        </dl>
      </RefSection>
      <RefSection id="rules" heading="The rules.">
        <RuleGroups groups={t.rules} />
      </RefSection>
      <TopicEnd faqs={t.faqs} self={t.path} links={t.links} sources={t.sources} />
      <Doors doors={doors} />
    </>
  );
}

/** ESIC: the contribution period, which decides coverage; a calculator; the rules. */
export function EsicPage() {
  const t = esicTopic;
  return (
    <>
      <Schema topic={t} />
      <Hero topic={t} />
      <RefWide id="periods" heading="Coverage is decided twice a year." intro="ESIC runs in two contribution periods. A worker within ₹21,000 when one begins stays covered to its end, whatever happens to their wages.">
        <EsicPeriods />
      </RefWide>
      <RefSection id="calculator" heading="Work it out." intro="For one worker, a full month." subtle>
        <EsicCalculator />
      </RefSection>
      <RefSection id="rules" heading="The rules.">
        <RuleGroups groups={t.rules} />
      </RefSection>
      <TopicEnd faqs={t.faqs} self={t.path} links={t.links} sources={t.sources} />
      <Doors doors={doors} />
    </>
  );
}

/** Karnataka PT: the year in twelve months, a calculator, what the employer does. */
export function KarnatakaPtPage() {
  const t = karnatakaPtTopic;
  return (
    <>
      <Schema topic={t} />
      <Hero topic={t} />
      <RefWide id="year" heading="₹2,500 a year, in twelve parts." intro="The financial year from April: the same ₹200 each month, and ₹300 in February to reach the Constitution's limit.">
        <KarnatakaPtYear />
      </RefWide>
      <RefSection id="calculator" heading="Work it out." intro="For one worker's salary in a month." subtle>
        <KarnatakaPtCalculator />
      </RefSection>
      <RefSection id="rules" heading="The rules.">
        <RuleGroups groups={t.rules} />
      </RefSection>
      <TopicEnd faqs={t.faqs} self={t.path} links={t.links} sources={t.sources} />
      <Doors doors={doors} />
    </>
  );
}

/** The six states: who levies professional tax. */
export function ProfessionalTaxHubPage() {
  const t = professionalTaxTopic;
  return (
    <>
      <Schema topic={t} />
      <Hero topic={t} />
      <Section id="states" className="pt-10 sm:pt-14 lg:pt-16">
        <div className="wage-table-scroll">
          <table className="wage-table is-index">
            <caption className="sr-only">Professional tax on salaries in the six states we cover</caption>
            <thead>
              <tr>
                <th scope="col">State</th>
                <th scope="col">Levied</th>
                <th scope="col">On salaries</th>
                <th scope="col" className="col-split">Who pays</th>
              </tr>
            </thead>
            <tbody>
              {ptStates.map((s) => {
                const name = typeof s.state === "string" ? s.state : s.state.text;
                const href = typeof s.state === "string" ? undefined : s.state.href;
                return (
                  <tr key={name} className="wage-row">
                    <th scope="row">
                      {href && linkable(href, "en-IN") ? (
                        <Link href={href} className="wage-row-link">
                          {name}
                        </Link>
                      ) : (
                        name
                      )}
                    </th>
                    <td>
                      <span className={s.levied ? "ref-status" : "ref-status is-none"}>{s.levied ? "Yes" : "No"}</span>
                    </td>
                    <td>{s.levied ? <strong>{s.amount}</strong> : s.amount}</td>
                    <td className="col-split">{s.who}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="wage-note">In Karnataka, Andhra Pradesh, Telangana and Punjab the employer deducts the tax from salary and pays it every month.</p>
      </Section>
      <TopicEnd faqs={t.faqs} self={t.path} links={t.links} sources={t.sources} />
      <Doors doors={doors} />
    </>
  );
}


/** Each published wage state's unskilled minimum wage (each UP category on its own), for the bonus calculator. */
function bonusPlaces(): BonusPlace[] {
  return wageStates
    .filter((st) => linkable(wageStatePath(st.state), "en-IN"))
    .flatMap((st) => {
      const table = headlineTable(st);
      return table.zones.map((z) => ({
        label: table.zones.length > 1 ? `${st.name}, ${z.name}` : st.name,
        minimumWage: table.rates.find((r) => r.zone === z.id && r.skill === "unskilled")!.monthly,
      }));
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Statutory bonus: the year it is earned and the eight months to pay it; a calculator on each state's minimum wage. */
export function BonusPage() {
  const t = bonusTopic;
  return (
    <>
      <Schema topic={t} />
      <Hero topic={t} />
      <RefWide id="calendar" heading="Earned over the year, paid by 30 November." intro="Bonus is worked out on the wages of the accounting year, and paid within the eight months that follow it.">
        <BonusCalendar />
      </RefWide>
      <RefSection id="calculator" heading="Work it out." intro="On the state's unskilled minimum wage, for a full year. The ₹21,000 and ₹7,000 are the Central sphere's figures; no state we cover had notified its own when we checked." subtle>
        <BonusCalculator places={bonusPlaces()} />
      </RefSection>
      <RefSection id="rules" heading="The rules.">
        <RuleGroups groups={t.rules} />
      </RefSection>
      <TopicEnd faqs={t.faqs} self={t.path} links={t.links} sources={t.sources} />
      <Doors doors={doors} />
    </>
  );
}

/** Gratuity: what each year of service adds, and from when it is due; a calculator on each state's minimum wage. */
export function GratuityPage() {
  const t = gratuityTopic;
  const places = bonusPlaces();
  const shown = places.find((p) => p.label === "Haryana") ?? places[0];
  return (
    <>
      <Schema topic={t} />
      <Hero topic={t} />
      <RefWide id="years" heading="Every year adds 15 days' wages." intro="The amount grows by the same step for each year of service. What changes at five years is who can receive it.">
        <GratuityStairs wage={shown.minimumWage} label={`${shown.label}'s unskilled minimum wage`} />
      </RefWide>
      <RefSection id="calculator" heading="Work it out." intro="On the wages last drawn, basic and DA. Pick the state for its unskilled minimum wage, or type the worker's own." subtle>
        <GratuityCalculator places={places} />
      </RefSection>
      <RefSection id="rules" heading="The rules.">
        <RuleGroups groups={t.rules} />
      </RefSection>
      <TopicEnd faqs={t.faqs} self={t.path} links={t.links} sources={t.sources} />
      <Doors doors={doors} />
    </>
  );
}
