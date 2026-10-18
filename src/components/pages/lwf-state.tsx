import { ArrowUpRight } from "lucide-react";
import { Doors } from "@/components/pages/minimum-wages";
import { DelhiLwfCalculator, HaryanaLwfCalculator } from "@/components/reference/calculators";
import { DelhiHalves, HaryanaCurve } from "@/components/reference/figures";
import { RefSection, RefWide, RuleGroups, TopicEnd, TopicHero } from "@/components/reference/primitives";
import { lwfStates } from "@/content/lwf-states";
import { wageDoors } from "@/content/pages/minimum-wages";
import { LWF_PATH, lwfStatePath, wageStatePath, type LwfStateSlug } from "@/content/registry/identifiers";
import { getWageState, headlineRate } from "@/content/wages";
import { JsonLd, faqSchema, webPageSchema } from "@/lib/structured-data";
import { localePath } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

/**
 * /labour-welfare-fund/<state> (redesign, 18 Oct 2026): Haryana around its
 * cap curve and a wage calculator, Delhi around its two half-years and a
 * headcount calculator; then the rules, how to pay, questions and sources.
 */

export function lwfStateMetadata(slug: LwfStateSlug) {
  const d = lwfStates[slug];
  return pageMetadata({ title: d.title, description: d.description, alternates: { canonical: localePath(lwfStatePath(slug), "en-IN") }, locale: "en-IN" });
}

/** Haryana's unskilled minimum wage from the wage dataset, so the figure moves with the wage page. */
const haryanaMinimumWage = () => {
  const s = getWageState("haryana");
  return s ? headlineRate(s).low.monthly : 15220.71;
};

export function LwfStatePage({ slug }: { slug: LwfStateSlug }) {
  const d = lwfStates[slug];
  const path = lwfStatePath(slug);
  const minimum = haryanaMinimumWage();
  return (
    <>
      <JsonLd data={webPageSchema({ name: d.title, description: d.description, url: localePath(path, "en-IN") })} />
      <JsonLd data={faqSchema(d.faqs)} />
      <TopicHero path={path} breadcrumb={d.name} heading={d.heading} lede={d.lede} glance={d.glance} checked="2026-10-18" updatedFrom={`${d.name}'s Act and its Labour Welfare Board`} />
      <RefWide id="how-it-works" heading={d.figure.heading} intro={d.figure.intro}>
        {slug === "haryana" ? <HaryanaCurve minimumWage={minimum} /> : <DelhiHalves />}
      </RefWide>
      <RefSection id="calculator" heading="Work it out." intro={d.calculator.intro} subtle>
        {slug === "haryana" ? <HaryanaLwfCalculator minimumWage={minimum} /> : <DelhiLwfCalculator />}
      </RefSection>
      <RefSection id="rules" heading="The rules.">
        <RuleGroups
          groups={[
            ...d.rules,
            {
              heading: "How to pay",
              rows: [
                {
                  label: "Online",
                  text: (
                    <>
                      {d.pay.text}{" "}
                      <a href={d.pay.link.href} className="wage-inline-link" rel="noopener">
                        {d.pay.link.label} <ArrowUpRight size={16} aria-hidden="true" />
                      </a>
                    </>
                  ),
                },
              ],
            },
          ]}
        />
      </RefSection>
      <TopicEnd
        faqs={d.faqs}
        self={path}
        links={[
          { href: LWF_PATH, label: "Labour Welfare Fund in other states" },
          { href: wageStatePath(slug), label: `Minimum wages in ${d.name}` },
        ]}
        sources={d.sources}
      />
      <Doors doors={[wageDoors.business, wageDoors.jobsAll]} />
    </>
  );
}
