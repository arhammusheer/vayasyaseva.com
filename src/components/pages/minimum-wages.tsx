import { Fragment } from "react";
import Link from "@/components/i18n/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { JsonLd, faqSchema, wageHubSchema, wageStateSchema, webPageSchema } from "@/lib/structured-data";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { linkable } from "@/content/registry";
import { WAGE_HUB_PATH, wageStatePath, type WageStateSlug } from "@/content/registry/identifiers";
import {
  SKILLS,
  checkedByLine,
  formatDate,
  formatRupees,
  formatShortDate,
  headlineRate,
  ratesYear,
  sourceById,
  todayIso,
  unpublishedRevisions,
  wageStates,
  wageStatus,
  type Skill,
  type WageState,
  type WageTable,
} from "@/content/wages";
import { EDITORIAL_HREF } from "@/content/editorial";
import { getWageStateCopy, listDates, wageDoors, wageHubCopy, wageUi as x, type WageDoor, type WageStateCopy } from "@/content/pages/minimum-wages";
import { SKILLS_HI, WAGE_HUB_HI, formatDateHi, wageHubHi } from "@/content/pages/minimum-wages.hi";
import { localePath, type Locale } from "@/lib/i18n";
import { duesNote, duesSources, employerDues } from "@/content/statutory";
import { COMPLIANCE_HELP } from "@/content/compliance";

/**
 * The minimum wage pages: lean English answer pages (the hub and one page
 * per state) and, in review, the worker-first Hindi hub. The figures come
 * from the datasets in src/content/wages; the method behind them is on
 * /minimum-wages/how-we-check. Everything a long-tail search may need (the
 * basic + VDA split and the documents) stays in the server-rendered HTML,
 * behind <details>. Each state page also carries the employer dues for that
 * state (EPF, ESIC, PT, LWF, the licence) from src/content/statutory.ts, and
 * one line on compliance help.
 */

/** Published state pages, in hub order. A state in review is not listed or linked. */
const listedStates = () => wageStates.filter((s) => linkable(wageStatePath(s.state), "en-IN"));

/** The year shows in titles and headings only while the figures are current (PLAN §5.5). */
const yearOf = (state: WageState, today: string) => (wageStatus(state, today).stale ? null : ratesYear(state));
const hubYear = () => listedStates().map(ratesYear).sort().at(-1) ?? null;
const hubStale = (today: string) => listedStates().some((s) => wageStatus(s, today).stale);

/** A shorter hero than a business page's, so the first rates show on the first screen. */
const HERO_TIGHT = "pb-8 pt-6 sm:pb-10 sm:pt-14 lg:pb-12 lg:pt-14";

function stateOrThrow(slug: WageStateSlug) {
  const state = wageStates.find((s) => s.state === slug);
  const copy = getWageStateCopy(slug);
  if (!state || !copy) throw new Error(`No wage data or copy for ${slug}`);
  return { state, t: copy };
}

// ── Metadata ────────────────────────────────────────────────────────────────

export function wageStateMetadata(slug: WageStateSlug) {
  const { state, t } = stateOrThrow(slug);
  return pageMetadata({
    title: t.title(yearOf(state, todayIso())),
    description: t.description,
    alternates: { canonical: localePath(wageStatePath(slug), "en-IN") },
    locale: "en-IN",
  });
}

export function wageHubMetadata(locale: Locale = "en-IN") {
  const year = hubStale(todayIso()) ? null : hubYear();
  const hindi = locale === "hi-IN";
  return pageMetadata({
    title: hindi ? wageHubHi.title(year) : wageHubCopy.title(year),
    description: hindi ? wageHubHi.description() : wageHubCopy.description(),
    alternates: { canonical: localePath(WAGE_HUB_PATH, hindi ? "hi-IN" : "en-IN") },
    locale: hindi ? "hi-IN" : "en-IN",
  });
}

// ── Shared pieces ───────────────────────────────────────────────────────────

/**
 * Directly under each H1: when the figures were checked, the revision
 * status (stale, or a revision due and not yet notified) when there is one,
 * and the method page. One line, so the rates start right below the hero.
 */
function CheckedLine({ state, today }: { state: WageState; today: string }) {
  const status = wageStatus(state, today);
  const due = unpublishedRevisions(state, today);
  return (
    <p className={status.stale ? "wage-checked is-stale" : "wage-checked"} role={status.stale ? "status" : undefined}>
      {x.checked(checkedByLine(state), formatDate(state.checked.on))}.{" "}
      {status.stale ? (
        <>
          <strong>{x.notice.staleStrong}</strong> {x.notice.staleText}{" "}
          <a href={state.sources[0].listing} className="wage-inline-link">
            {x.notice.staleLink}
          </a>
          .{" "}
        </>
      ) : (
        due.length > 0 && <>{due.length > 1 ? x.notice.many(listDates(due)) : x.notice.one(formatDate(due[0]))} </>
      )}
      <Link href={EDITORIAL_HREF}>
        {x.howWeCheck} <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </p>
  );
}

/** "In force from 1 April 2026. Notification No. 289." The document itself is linked once, at the foot. */
function sourceLine(state: WageState, table: WageTable) {
  const s = sourceById(state, table.sources[0]);
  // Delhi's numbers carry their own "F.No." prefix.
  const number = /^F\.?\s?No\./i.test(s.number) ? s.number : `No. ${s.number}`;
  return x.table.source(formatDate(table.effectiveFrom), x.sourceKind(s.kind), number);
}

/**
 * One table of rates. Zoned tables (UP's categories, Karnataka's zones) are
 * a matrix: a row per skill, a column per zone, so the zones compare side by
 * side instead of stacking three tables down the page; the zones' areas are
 * listed under it. A single-zone table shows the basic + VDA split as quiet
 * columns on a wide screen (behind "Show breakdown" on a phone).
 */
function RateTable({ state, table }: { state: WageState; table: WageTable }) {
  const split = table.rates.some((r) => r.vda > 0);
  const zoned = table.zones.length > 1;
  const skills = [...new Set(table.rates.map((r) => r.skill))];
  const rateOf = (zone: string, skill: Skill) => table.rates.find((r) => r.zone === zone && r.skill === skill)!;
  const derived = table.daily === "derived";
  const caption = <caption className="sr-only">{x.table.caption(table.title, state.name, formatDate(table.effectiveFrom))}</caption>;
  const day = (v: number | null) => (v === null ? <span className="wage-none">{x.table.notSet}</span> : formatRupees(v));
  return (
    <div className="wage-table-block" id={table.id}>
      <h3>{table.title}</h3>
      <div className="wage-table-scroll">
        {zoned ? (
          <table className="wage-table is-matrix">
            {caption}
            <thead>
              <tr>
                <th scope="col">
                  {x.table.skill}
                  <span className="wage-th-unit">{derived ? x.table.unitsDerived : x.table.units}</span>
                </th>
                {table.zones.map((z) => (
                  <th scope="col" key={z.id}>
                    {z.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => (
                <tr key={skill} className={skill === "unskilled" ? "is-headline" : undefined}>
                  <th scope="row">{SKILLS[skill]}</th>
                  {table.zones.map((z) => {
                    const r = rateOf(z.id, skill);
                    return (
                      <td key={z.id}>
                        <strong>{formatRupees(r.monthly)}</strong>
                        <span className="wage-day">{day(r.daily)}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="wage-table is-flat">
            {caption}
            <thead>
              <tr>
                <th scope="col">{x.table.skill}</th>
                <th scope="col">{x.table.month}</th>
                <th scope="col">{derived ? x.table.dayDerived : x.table.day}</th>
                {split && (
                  <>
                    <th scope="col" className="col-split is-quiet">{table.basicLabel}</th>
                    <th scope="col" className="col-split is-quiet">{table.vdaLabel}</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {skills.map((skill) => {
                const r = rateOf(table.zones[0].id, skill);
                return (
                  <tr key={skill} className={skill === "unskilled" ? "is-headline" : undefined}>
                    <th scope="row">{SKILLS[skill]}</th>
                    <td>
                      <strong>{formatRupees(r.monthly)}</strong>
                    </td>
                    <td>{day(r.daily)}</td>
                    {split && (
                      <>
                        <td className="col-split is-quiet">{formatRupees(r.basic)}</td>
                        <td className="col-split is-quiet">{formatRupees(r.vda)}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {zoned && (
        <dl className="wage-zones">
          {table.zones.map((z) => (
            <div key={z.id}>
              <dt>{z.name}</dt>
              <dd>{z.areas}</dd>
            </div>
          ))}
        </dl>
      )}
      {split && (
        <details className={zoned ? "wage-more" : "wage-more is-phone-only"}>
          <summary>{x.table.breakdown}</summary>
          <table className="wage-table is-compact">
            <caption className="sr-only">{`${table.title}: ${table.basicLabel} and ${table.vdaLabel}, per month, in rupees`}</caption>
            <thead>
              <tr>
                <th scope="col">{x.table.skill}</th>
                <th scope="col">{table.basicLabel}</th>
                <th scope="col">{table.vdaLabel}</th>
              </tr>
            </thead>
            {table.zones.map((zone) => (
              <tbody key={zone.id}>
                {zoned && (
                  <tr className="zone-row">
                    <th scope="rowgroup" colSpan={3}>
                      {zone.name}
                    </th>
                  </tr>
                )}
                {skills.map((skill) => {
                  const r = rateOf(zone.id, skill);
                  return (
                    <tr key={skill}>
                      <th scope="row">{SKILLS[skill]}</th>
                      <td>{formatRupees(r.basic)}</td>
                      <td>{formatRupees(r.vda)}</td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
        </details>
      )}
      <p className="wage-source">{sourceLine(state, table)}</p>
    </div>
  );
}

/**
 * "Sources (n)", in two groups: the wage notifications and the employer dues
 * sources. Title, number and date each. It closes the questions rather than
 * standing as a section of its own (one collapsed line did not earn a band).
 */
function Documents({ state, slug }: { state: WageState; slug: WageStateSlug }) {
  const groups = [
    { label: x.sections.wageDocs, items: state.sources.map((s) => ({ id: s.id, title: s.title, url: s.url, number: s.number, date: s.date, language: s.language })) },
    { label: x.sections.duesDocs, items: duesSources(slug).map((s) => ({ ...s, language: "en" as const })) },
  ].filter((g) => g.items.length);
  return (
    <div id="documents" className="wage-documents">
      <details className="wage-more is-section">
        <summary>
          {x.sections.documents} ({groups.reduce((n, g) => n + g.items.length, 0)})
        </summary>
        {groups.map((g) => (
          <div key={g.label} className="wage-doc-group">
            <h3>{g.label}</h3>
            <ol className="wage-sources">
              {g.items.map((d) => (
                <li key={d.id}>
                  <a href={d.url} lang={d.language === "hi" ? "hi-IN" : d.language === "kn" ? "kn-IN" : "en-IN"}>
                    {d.title}
                  </a>
                  <span>
                    <span className="font-data">
                      <OrderNumber value={d.number} />
                    </span>
                    , {formatDate(d.date)}
                    {d.language !== "en" ? `. ${x.inLanguage[d.language]}` : ""}.
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </details>
    </div>
  );
}

/** An order number that breaks only after a slash, never at a hyphen, so it is copied whole. */
function OrderNumber({ value }: { value: string }) {
  const parts = value.split("/");
  return (
    <>
      {parts.map((part, i) => (
        <span key={i} className="whitespace-nowrap">
          {part}
          {i < parts.length - 1 && "/"}
          {i < parts.length - 1 && <wbr />}
        </span>
      ))}
    </>
  );
}

/** The dark band with two doors: the one ending of every wage page. */
function Doors({ doors }: { doors: WageDoor[] }) {
  return (
    <section className="wage-doors" data-header-theme="dark">
      <div className="site-shell wage-doors-inner">
        {doors.map((d) => (
          <div key={d.eyebrow + d.heading}>
            <p className="eyebrow">{d.eyebrow}</p>
            <h2>{d.heading}</h2>
            <p>{d.text}</p>
            {d.external ? (
              <a href={d.link.href} className="light-link">
                {d.link.label} <ArrowUpRight size={19} aria-hidden="true" />
              </a>
            ) : (
              <Link href={d.link.href} className="light-link">
                {d.link.label} <ArrowRight size={19} aria-hidden="true" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Faqs({ faqs, children }: { faqs: { question: string; answer: string }[]; children?: React.ReactNode }) {
  return (
    <Section id="questions" variant="subtle">
      <div className="wage-split">
        <h2 className="wage-h2">{x.sections.questions}</h2>
        <div className="faq-prose">
          {faqs.map((f) => (
            <div key={f.question}>
              <h3>{f.question}</h3>
              <p>{f.answer}</p>
            </div>
          ))}
          {children}
        </div>
      </div>
    </Section>
  );
}

/**
 * What an employer owes in the state beyond the wage: the due dates as one
 * strip, then who pays what for the contributions, one note and one line on
 * compliance help.
 */
function Dues({ slug, name }: { slug: WageStateSlug; name: string }) {
  const dues = employerDues[slug];
  if (!dues) return null;
  return (
    <Section id="employer-dues" className="border-t border-border pt-12 sm:pt-14 lg:pt-16">
      <h2 className="wage-h2">{x.dues.heading(name)}</h2>
      <ol className="dues-strip">
        {dues.deadlines.map((d) => (
          <li key={d.what}>
            <strong>{d.when}</strong>
            <small>{d.detail}</small>
            <span>{d.what}</span>
          </li>
        ))}
      </ol>
      <div className="wage-table-scroll">
        <table className="wage-table dues-table">
          <caption className="sr-only">{x.dues.caption(name)}</caption>
          <thead>
            <tr>
              <th scope="col">{x.dues.what}</th>
              <th scope="col">{x.dues.worker}</th>
              <th scope="col">{x.dues.employer}</th>
            </tr>
          </thead>
          <tbody>
            {dues.rows.map((r) => (
              <Fragment key={r.name}>
                <tr className={r.explain ? "has-explain" : undefined}>
                  <th scope="row">
                    {r.name}
                    <small>{r.applies}</small>
                  </th>
                  <td data-label={x.dues.worker}>{r.worker}</td>
                  <td data-label={x.dues.employer}>{r.employer}</td>
                </tr>
                {r.explain && (
                  <tr className="dues-explain">
                    <td colSpan={3}>
                      <dl>
                        {r.explain.map(([label, text]) => (
                          <div key={label}>
                            <dt>{label}</dt>
                            <dd>{text}</dd>
                          </div>
                        ))}
                      </dl>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="wage-note">
        {dues.notLevied} {duesNote}
      </p>
      <p className="wage-note">
        {x.dues.help}{" "}
        <Link href={COMPLIANCE_HELP.href} className="wage-inline-link">
          {COMPLIANCE_HELP.label} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </p>
    </Section>
  );
}

/**
 * "Where do you work?" for a state with more than one table: radio buttons
 * that show one table at a time (CSS :has, globals.css "Wage table
 * chooser"). Both tables stay in the HTML; without :has both show.
 */
function TableChooser({ state, which }: { state: WageState; which: NonNullable<WageStateCopy["whichTable"]> }) {
  return (
    <fieldset className="wage-pick">
      <legend>{x.table.which}</legend>
      <div>
        {state.tables.map((table, i) => (
          <label key={table.id}>
            <input type="radio" name={`${state.state}-table`} value={table.id} defaultChecked={i === 0} />
            <span>{which.labels[table.id] ?? table.title}</span>
          </label>
        ))}
      </div>
      <p>{which.rule}</p>
    </fieldset>
  );
}

/** The employer door for a state: its region's location page where one is live, else the neutral door. */
const CREW_REGIONS: Partial<Record<WageStateSlug, [string, string, string]>> = {
  "uttar-pradesh": ["Noida or Ghaziabad", "We supply crews in Noida, Greater Noida and Ghaziabad.", "/locations/delhi-ncr/noida-greater-noida"],
  delhi: ["Delhi NCR", "We supply crews in Delhi's industrial areas and across NCR.", "/locations/delhi-ncr"],
  karnataka: ["Bengaluru", "We supply crews across Bengaluru's industrial belts.", "/locations/bengaluru"],
};
function crewDoor(slug: WageStateSlug) {
  const r = CREW_REGIONS[slug];
  return r && linkable(r[2], "en-IN") ? wageDoors.crewIn(...r) : wageDoors.neutral;
}

// ── State page ──────────────────────────────────────────────────────────────

export function WageStatePage({ slug }: { slug: WageStateSlug }) {
  const { state, t } = stateOrThrow(slug);
  const today = todayIso();
  const year = yearOf(state, today);
  const crew = crewDoor(slug);
  const doors =
    t.band === "haridwar" ? [wageDoors.jobs, wageDoors.business] : t.band === "bengaluru" ? [wageDoors.jobsBengaluru, crew] : [wageDoors.officialSource(state.name, t.labourDepartment), crew];
  return (
    <>
      <JsonLd data={wageStateSchema(state, { name: t.title(year), description: t.description, url: localePath(wageStatePath(slug), "en-IN") })} />
      <JsonLd data={faqSchema(t.faqs)} />
      <PageHero
        crumbs={<Breadcrumbs path={wageStatePath(slug)} locale="en-IN" name={state.name} />}
        title={x.stateHeading(state.name, year)}
        lede={t.answer}
        footnote={<CheckedLine state={state} today={today} />}
        className={HERO_TIGHT}
      />
      {/* The rates straight under the answer; the hero already says whose they are. */}
      <Section id="rates" className="pt-8 pb-12 sm:pt-10 sm:pb-14 lg:pt-12 lg:pb-16">
        <h2 className="sr-only">{x.sections.rates(state.name)}</h2>
        <div className="wage-picker">
          {t.whichTable && <TableChooser state={state} which={t.whichTable} />}
          <div className="wage-tables">
            {state.tables.map((table) => (
              <RateTable key={table.id} state={state} table={table} />
            ))}
          </div>
        </div>
        {t.note && (
          <p className="wage-note">
            {t.note.text}{" "}
            <Link href={t.note.link.href} className="wage-inline-link">
              {t.note.link.label} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </p>
        )}
      </Section>
      <Dues slug={slug} name={state.name} />
      <Faqs faqs={t.faqs}>
        <Documents state={state} slug={slug} />
      </Faqs>
      <Doors doors={doors} />
    </>
  );
}

// ── Hub ─────────────────────────────────────────────────────────────────────

/** "₹12,356" or "₹12,356–₹13,690" for one skill across the headline table's zones; a phone breaks it after the dash. */
function skillRange(table: WageTable, skill: Skill) {
  const monthly = table.rates.filter((r) => r.skill === skill).map((r) => r.monthly);
  if (!monthly.length) return "–";
  const [low, high] = [Math.min(...monthly), Math.max(...monthly)];
  if (low === high) return formatRupees(low);
  return (
    <>
      {formatRupees(low)}–<wbr />
      {formatRupees(high)}
    </>
  );
}

export function WageHubPage({ locale = "en-IN" }: { locale?: Locale }) {
  if (locale === "hi-IN") return <WageHubPageHi />;
  const today = todayIso();
  const states = listedStates();
  const year = hubStale(today) ? null : hubYear();
  const headlines = states.map((s) => ({ state: s, ...headlineRate(s) }));
  const lowest = [...headlines].sort((a, b) => a.low.monthly - b.low.monthly)[0];
  const highest = [...headlines].sort((a, b) => b.high.monthly - a.high.monthly)[0];
  const lede = wageHubCopy.lede(`${formatRupees(lowest.low.monthly)} a month in ${lowest.state.name}`, `${formatRupees(highest.high.monthly)} in ${highest.state.name}`);
  const lastChecked = states.map((s) => s.checked.on).sort()[0];
  return (
    <>
      <JsonLd
        data={wageHubSchema({
          name: wageHubCopy.title(year),
          description: wageHubCopy.description(),
          url: localePath(WAGE_HUB_PATH, "en-IN"),
          dateModified: lastChecked,
          reviewed: states.every((s) => s.checked.by),
          states: states.map((s) => ({ name: `Minimum wages in ${s.name}`, url: wageStatePath(s.state) })),
        })}
      />
      <Breadcrumbs path={WAGE_HUB_PATH} locale="en-IN" name={x.minimumWages} />
      <PageHero title={wageHubCopy.heading(year)} lede={lede} className={HERO_TIGHT} />
      {/* The table right under the answer: no second heading, no gap to scroll past. */}
      <Section id="states" className="pt-6 sm:pt-10 lg:pt-12">
        <div className="wage-table-scroll">
          <table className="wage-table is-index">
            <caption className="sr-only">Monthly minimum wages by state and skill level, in rupees</caption>
            <thead>
              <tr>
                <th scope="col">{x.hub.state}</th>
                <th scope="col">
                  {x.hub.unskilled} <span className="wage-th-unit">{x.hub.perMonth}</span>
                </th>
                <th scope="col">{x.hub.semiSkilled}</th>
                <th scope="col">{x.hub.skilled}</th>
                <th scope="col" className="col-split">{x.hub.inForce}</th>
              </tr>
            </thead>
            <tbody>
              {headlines.map(({ state, table }) => {
                const stale = wageStatus(state, today).stale;
                const change = wageHubCopy.lastChange[state.state]?.(state);
                // Only what changes the reading of the row: UP's categories, or a stale rate.
                const note = [table.zones.length > 1 && x.hub.byCategory, stale && x.hub.mayBeRevised].filter(Boolean).join(" · ");
                return (
                  <tr key={state.state} className="wage-row">
                    <th scope="row">
                      <Link href={wageStatePath(state.state)} className="wage-row-link">
                        {state.name} <ArrowRight size={18} aria-hidden="true" />
                      </Link>
                      {note && <span className="wage-row-note">{note}</span>}
                    </th>
                    <td>
                      <strong>{skillRange(table, "unskilled")}</strong>
                    </td>
                    <td>{skillRange(table, "semi-skilled")}</td>
                    <td>{skillRange(table, "skilled")}</td>
                    <td className="col-split">
                      {formatShortDate(table.effectiveFrom)}
                      {change && <span className="wage-change">{change}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="wage-note">
          {x.hub.checked}{" "}
          <Link href={EDITORIAL_HREF} className="wage-inline-link">
            {x.howWeCheck} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </p>
      </Section>
      <Doors doors={[wageDoors.jobsAll, wageDoors.business]} />
    </>
  );
}

// ── Hindi hub (in review) ───────────────────────────────────────────────────

function WageHubPageHi() {
  const today = todayIso();
  const states = listedStates().filter((s) => WAGE_HUB_HI[s.state]);
  const year = hubStale(today) ? null : hubYear();
  const h = wageHubHi;
  const lastChecked = states.map((s) => s.checked.on).sort()[0];
  const overdue = states.some((s) => !wageStatus(s, today).stale && unpublishedRevisions(s, today).length);
  return (
    <>
      <JsonLd data={webPageSchema({ name: h.title(year), description: h.description(), url: localePath(WAGE_HUB_PATH, "hi-IN"), inLanguage: "hi-IN" })} />
      <Breadcrumbs path={WAGE_HUB_PATH} locale="hi-IN" name="न्यूनतम मजदूरी" />
      <PageHero
        title={h.heading(year)}
        lede={h.lede}
        footnote={
          <p className="wage-checked">
            {h.jobsLine.before}{" "}
            <Link href={h.jobsLine.href}>
              {h.jobsLine.label} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </p>
        }
        className={HERO_TIGHT}
      />
      {overdue && (
        <div className="wage-notice">
          <div className="site-shell">
            <p>{h.overdue}</p>
          </div>
        </div>
      )}
      <Section id="states">
        <div className="wage-tables is-hindi">
          {states.map((state) => {
            const hi = WAGE_HUB_HI[state.state]!;
            const table = state.tables.find((t) => t.id === hi.table)!;
            const single = hi.zones.length === 1;
            const stale = wageStatus(state, today).stale;
            const rateOf = (zone: string, skill: Skill) => table.rates.find((r) => r.zone === zone && r.skill === skill)!;
            return (
              <div key={state.state} className="wage-table-block" id={state.state}>
                <h2>{hi.name}</h2>
                <p className="wage-applies">
                  {h.inForce(formatDateHi(table.effectiveFrom))} {stale && h.stale}
                </p>
                <div className="wage-table-scroll">
                  <table className="wage-table">
                    <caption className="sr-only">{`${hi.name}: न्यूनतम मजदूरी, रुपये में`}</caption>
                    <thead>
                      <tr>
                        <th scope="col">{h.table.skill}</th>
                        {single ? (
                          <>
                            <th scope="col">{h.table.month}</th>
                            <th scope="col">{h.table.day}</th>
                          </>
                        ) : (
                          hi.zones.map((z) => (
                            <th key={z.id} scope="col">
                              {z.name}
                            </th>
                          ))
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {hi.skills.map((skill) => (
                        <tr key={skill}>
                          <th scope="row">{SKILLS_HI[skill]}</th>
                          {single ? (
                            <>
                              <td>
                                <strong>{formatRupees(rateOf(hi.zones[0].id, skill).monthly)}</strong>
                              </td>
                              <td>{rateOf(hi.zones[0].id, skill).daily === null ? h.table.notSet : formatRupees(rateOf(hi.zones[0].id, skill).daily!)}</td>
                            </>
                          ) : (
                            hi.zones.map((z) => (
                              <td key={z.id}>
                                <strong>{formatRupees(rateOf(z.id, skill).monthly)}</strong>
                              </td>
                            ))
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="wage-note">{hi.key(state)}</p>
              </div>
            );
          })}
        </div>
      </Section>
      <Section id="paid-less" variant="subtle">
        <div className="wage-split">
          <h2 className="wage-h2">{h.paidLess.heading}</h2>
          <div className="wage-prose">
            <ul className="jobs-work guide-rows">
              {h.paidLess.rows.map((row) => (
                <li key={row.title}>
                  <h3>{row.title}</h3>
                  <p>{row.text}</p>
                </li>
              ))}
            </ul>
            <ul className="wage-state-links is-plain">
              {states.map((s) => {
                const dept = WAGE_HUB_HI[s.state]!.department;
                return (
                  <li key={s.state}>
                    <a href={dept.href}>
                      {dept.label} <ArrowUpRight size={18} aria-hidden="true" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Section>
      <Section className="wage-hi-foot">
        <p className="wage-note">
          {h.checked(formatDateHi(lastChecked))}{" "}
          <Link href={EDITORIAL_HREF} className="wage-inline-link">
            {h.howWeCheck} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </p>
      </Section>
    </>
  );
}
