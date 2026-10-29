import Link from "@/components/i18n/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Doors, Faqs, HERO_TIGHT, hubStale, hubYear, listedStates } from "@/components/pages/minimum-wages";
import { EDITORIAL_HREF } from "@/content/editorial";
import { WAGE_HUB_PATH, WAGE_VDA_PATH, wageStatePath } from "@/content/registry/identifiers";
import { stamp, wageDoors } from "@/content/pages/minimum-wages";
import { VDA_CYCLE, allowanceNow, cycleStart, statusText, vdaStatus, wageVdaCopy as v } from "@/content/pages/wage-vda";
import { formatRupees, formatShortDate, headlineTable, todayIso, type WageState } from "@/content/wages";
import { JsonLd, faqSchema, webPageSchema } from "@/lib/structured-data";
import { checkedWageStates } from "@/lib/wage-listing-checks";
import { localePath } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

/**
 * /minimum-wages/vda: the VDA and DA revisions of the published wage states,
 * built from the wage dataset alone (src/content/wages), so it changes when a
 * state's file does and the daily rebuild moves "due" and "revised" with the
 * date. A state in review is not listed, as on the hub.
 */

export async function wageVdaMetadata() {
  const today = todayIso();
  const states = listedStates(await checkedWageStates());
  return pageMetadata({
    title: v.title(hubStale(today, states) ? null : hubYear(states, today)),
    description: v.description(
      states.map((s) => s.name),
      stamp(states),
    ),
    alternates: { canonical: localePath(WAGE_VDA_PATH, "en-IN") },
    locale: "en-IN",
  });
}

/** The unskilled monthly rate of the headline table: one figure, or a range across zones. */
function unskilledNow(state: WageState) {
  const rows = headlineTable(state)
    .rates.filter((r) => r.skill === "unskilled")
    .map((r) => r.monthly)
    .sort((a, b) => a - b);
  return rows[0] === rows.at(-1) ? formatRupees(rows[0]) : `${formatRupees(rows[0])} to ${formatRupees(rows.at(-1)!)}`;
}

/**
 * The headline table's earlier rates, newest first, with the change from the
 * one before (only where both are a single statewide figure).
 */
function movedRows(state: WageState) {
  const table = headlineTable(state);
  const single = (rates: { skill: string; monthly: number }[]) => {
    const u = rates.filter((r) => r.skill === "unskilled").map((r) => r.monthly);
    return u.length === 1 ? u[0] : null;
  };
  const past = state.history
    .filter((h) => h.table === table.id)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))
    .map((h) => ({ from: h.effectiveFrom, text: unskilledOf(h.rates), value: single(h.rates), note: h.note }));
  const rows = [{ from: table.effectiveFrom, text: unskilledNow(state), value: single(table.rates), note: undefined as string | undefined, now: true }, ...past.map((p) => ({ ...p, now: false }))];
  return rows.map((r, i) => {
    const prev = rows[i + 1];
    const change = r.value !== null && prev?.value != null ? r.value - prev.value : null;
    return { ...r, change };
  });
}

function unskilledOf(rates: { skill: string; monthly: number }[]) {
  const u = rates.filter((r) => r.skill === "unskilled").map((r) => r.monthly).sort((a, b) => a - b);
  return u[0] === u.at(-1) ? formatRupees(u[0]) : `${formatRupees(u[0])} to ${formatRupees(u.at(-1)!)}`;
}

const signed = (n: number) => (n === 0 ? "No change" : `${n > 0 ? "+" : "−"}${formatRupees(Math.abs(Math.round(n * 100) / 100))}`);

export async function WageVdaPage() {
  const today = todayIso();
  const cycle = cycleStart(today);
  const states = listedStates(await checkedWageStates());
  const rows = states.map((state) => ({ state, allowance: allowanceNow(state), status: vdaStatus(state, today) }));
  const revised = rows.filter((r) => r.status.kind === "revised" && r.allowance).map((r) => r.state.name);
  const due = rows.filter((r) => r.status.kind === "due").map((r) => r.state.name);
  const withVda = rows.filter((r) => r.allowance && !r.allowance.isDa).map((r) => r.state.name);
  const withDa = rows.filter((r) => r.allowance?.isDa).map((r) => r.state.name);
  const allInclusive = rows.filter((r) => !r.allowance).map((r) => r.state.name);
  const faqs = v.faqs(states, today);
  const title = v.title(hubStale(today, states) ? null : hubYear(states, today));
  return (
    <>
      <JsonLd data={webPageSchema({ name: title, description: v.description(states.map((s) => s.name), stamp(states)), url: localePath(WAGE_VDA_PATH, "en-IN") })} />
      <JsonLd data={faqSchema(faqs)} />
      <PageHero
        crumbs={<Breadcrumbs path={WAGE_VDA_PATH} locale="en-IN" name={v.breadcrumb} />}
        title={v.heading(cycle)}
        lede={v.lede(cycle, revised, due)}
        className={HERO_TIGHT}
      />
      <Section id="states" className="pt-6 sm:pt-10 lg:pt-12">
        <div className="wage-table-scroll">
          <table className="wage-table is-index vda-table">
            <caption className="sr-only">{v.table.caption}</caption>
            <thead>
              <tr>
                <th scope="col">{v.table.state}</th>
                <th scope="col">
                  {v.table.allowance} <span className="wage-th-unit">{v.table.perMonth}</span>
                </th>
                <th scope="col">{v.table.since}</th>
                <th scope="col" className="col-split">{v.table.cycle}</th>
                <th scope="col">{v.table.status}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ state, allowance, status }) => (
                <tr key={state.state} className="wage-row">
                  <th scope="row">
                    <Link href={wageStatePath(state.state)} className="wage-row-link">
                      {state.name} <ArrowRight size={18} aria-hidden="true" />
                    </Link>
                  </th>
                  <td>
                    {allowance ? (
                      <strong>
                        {allowance.text}
                        {allowance.isDa && <span className="wage-row-note">{v.table.da}</span>}
                      </strong>
                    ) : (
                      <span className="wage-none">{v.table.none}</span>
                    )}
                  </td>
                  <td>{formatShortDate(headlineTable(state).effectiveFrom)}</td>
                  <td className="col-split">{VDA_CYCLE[state.state]}</td>
                  <td>
                    <span className={`vda-status is-${status.kind}`}>{statusText(status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="wage-note">
          {stamp(states)}.{" "}
          <Link href={EDITORIAL_HREF} className="wage-inline-link">
            {v.links.method} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </p>
      </Section>
      <Section id="what-vda-is" className="border-t border-border pt-12 sm:pt-14 lg:pt-16">
        <div className="wage-split">
          <h2 className="wage-h2">{v.explain.heading}</h2>
          <div className="wage-prose">
            {v.explain.paragraphs(withVda, withDa, allInclusive).map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </Section>
      <Section id="history" className="border-t border-border pt-12 sm:pt-14 lg:pt-16">
        <div className="wage-split">
          <h2 className="wage-h2">{v.moved.heading}</h2>
          <div className="vda-moved">
            <p className="wage-note">{v.moved.intro}</p>
            {states.map((state) => {
              const moved = movedRows(state);
              return (
                <details key={state.state} className="wage-more is-section">
                  <summary>{v.moved.summary(state.name, moved.length)}</summary>
                  <div className="wage-table-scroll">
                    <table className="wage-table is-compact">
                      <caption className="sr-only">{`${state.name}: ${v.moved.intro}`}</caption>
                      <thead>
                        <tr>
                          <th scope="col">{v.moved.from}</th>
                          <th scope="col">{v.moved.rate}</th>
                          <th scope="col">{v.moved.change}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {moved.map((r) => (
                          <tr key={r.from}>
                            <th scope="row">
                              {formatShortDate(r.from)}
                              {r.now && <span className="wage-row-note">{v.moved.now}</span>}
                            </th>
                            <td>
                              {r.text}
                              {r.note && <span className="wage-row-note">{r.note}</span>}
                            </td>
                            <td>{r.change === null ? "" : signed(r.change)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="wage-note">
                    <strong>{v.moved.basis}:</strong> {state.nextRevision.basis}
                  </p>
                </details>
              );
            })}
          </div>
        </div>
      </Section>
      <Faqs faqs={faqs}>
        <p className="method-back">
          <Link href={WAGE_HUB_PATH} className="text-link">
            {v.links.states} <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </p>
      </Faqs>
      <Doors doors={[wageDoors.jobsAll, wageDoors.business]} />
    </>
  );
}
