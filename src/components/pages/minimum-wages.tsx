import Link from "@/components/i18n/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { JsonLd, breadcrumbSchema, faqSchema, wageHubSchema, wageStateSchema } from "@/lib/structured-data";
import { linkable } from "@/content/registry";
import { WAGE_HUB_PATH, wageStatePath, type WageStateSlug } from "@/content/registry/identifiers";
import { siteConfig } from "@/content/site";
import {
  SKILLS,
  checkedByLine,
  formatDate,
  formatRupees,
  formatShortDate,
  formatSize,
  headlineRange,
  headlineRate,
  ratesYear,
  sourceById,
  todayIso,
  unpublishedRevisions,
  wageStates,
  wageStatus,
  type WageHistory,
  type WageSource,
  type WageState,
  type WageTable,
} from "@/content/wages";
import { getWageStateCopy, howWeCheck, listDates, sourceLine, wageDoors, wageHubCopy } from "@/content/pages/minimum-wages";

/** Published state pages, in hub order. A state in review is not listed or linked. */
const listedStates = () => wageStates.filter((s) => linkable(wageStatePath(s.state), "en-IN"));

/** The year shows in titles and headings only while the figures are current (PLAN §5.5). */
const yearOf = (state: WageState, today: string) => (wageStatus(state, today).stale ? null : ratesYear(state));

// ── Metadata ────────────────────────────────────────────────────────────────

export function wageStateMetadata(slug: WageStateSlug) {
  const state = stateOrThrow(slug);
  const t = getWageStateCopy(slug)!;
  return pageMetadata({
    title: t.title(yearOf(state, todayIso())),
    description: t.description,
    alternates: { canonical: wageStatePath(slug) },
    locale: "en-IN",
  });
}

export function wageHubMetadata() {
  const today = todayIso();
  const anyStale = listedStates().some((s) => wageStatus(s, today).stale);
  return pageMetadata({
    title: wageHubCopy.title(anyStale ? null : hubYear()),
    description: wageHubCopy.description(),
    alternates: { canonical: WAGE_HUB_PATH },
    locale: "en-IN",
  });
}

function stateOrThrow(slug: WageStateSlug) {
  const state = wageStates.find((s) => s.state === slug);
  if (!state || !getWageStateCopy(slug)) throw new Error(`No wage data or copy for ${slug}`);
  return state;
}

const hubYear = () => listedStates().map(ratesYear).sort().at(-1) ?? null;

// ── Shared pieces ───────────────────────────────────────────────────────────

const pdfLabel = (s: WageSource) =>
  `Read the ${s.kind === "notification" ? "notification" : s.kind === "order" ? "order" : "amendment"} (PDF${s.language === "hi" ? ", Hindi" : ""}${s.sizeKb ? `, ${formatSize(s.sizeKb)}` : ""})`;

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

/** "Checked 16 October 2026, by a director of Vayasya Seva", or what is true until someone signs off. */
const checkedPhrase = (state: WageState) => {
  const by = checkedByLine(state);
  return by
    ? `Checked by ${by} on ${formatDate(state.checked.on)}.`
    : `Entered from the state's own documents on ${formatDate(state.checked.on)}.`;
};

/** Both audiences get their next step in the first screen (no phone); workers also get the pay check. */
function QuickDoors({ contactHref = "/contact", jobsLine, workers }: { contactHref?: string; jobsLine?: string; workers?: boolean }) {
  return (
    <div className="wage-quick-doors">
      <p>
        Looking for work?{jobsLine && <span className="wage-quick-note">{jobsLine}</span>}
        <Link href={wageDoors.jobs.link.href} className="text-link">
          {wageDoors.jobs.link.label} <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </p>
      <p>
        Hiring for a unit?
        <Link href={contactHref} className="text-link">
          {wageDoors.business.link.label} <ArrowUpRight size={18} aria-hidden="true" />
        </Link>
      </p>
      {workers && (
        <p>
          Paid less than this?
          <a href="#workers" className="text-link">
            What you can do <ArrowRight size={18} aria-hidden="true" />
          </a>
        </p>
      )}
    </div>
  );
}

/** "May have been revised" once stale; a quieter "revision due" note before that. */
function RevisionNotice({ state, today }: { state: WageState; today: string }) {
  const status = wageStatus(state, today);
  const due = unpublishedRevisions(state, today);
  if (!due.length && !status.stale) return null;
  const listing = state.sources[0].listing;
  return (
    <div className={status.stale ? "wage-notice is-stale" : "wage-notice"} role={status.stale ? "status" : undefined}>
      <div className="site-shell">
        {status.stale ? (
          <p>
            <strong>These rates may have been revised.</strong> Check the latest notification.{" "}
            <a href={listing}>Latest notifications from the state</a>
          </p>
        ) : due.length > 1 ? (
          <p>
            <strong>Revisions were due on {listDates(due)}.</strong> None had been published when we checked on{" "}
            {formatDate(state.checked.on)}. If they are published with back effect, arrears may be due. These are the latest
            published rates.
          </p>
        ) : (
          <p>
            <strong>A revision was due on {formatDate(due[0])}.</strong> When we checked on {formatDate(state.checked.on)},{" "}
            {state.name} had not published one. These are the latest published rates.
          </p>
        )}
      </div>
    </div>
  );
}

function RateTable({ state, table }: { state: WageState; table: WageTable }) {
  const split = table.rates.some((r) => r.vda > 0);
  const zones = table.zones.length > 1;
  const source = sourceById(state, table.sources[0]);
  const skills = [...new Set(table.rates.map((r) => r.skill))];
  return (
    <div className="wage-table-block" id={table.id}>
      <h3>{table.title}</h3>
      <p className="wage-applies">{table.appliesTo}</p>
      <div className="wage-table-scroll">
        <table className="wage-table">
          <caption className="sr-only">
            {table.title}: minimum wages in {state.name} from {formatDate(table.effectiveFrom)}, in rupees
          </caption>
          <thead>
            <tr>
              <th scope="col">Skill level</th>
              {split && (
                <>
                  <th scope="col" className="col-split">{table.basicLabel}</th>
                  <th scope="col" className="col-split">{table.vdaLabel}</th>
                </>
              )}
              <th scope="col">Per month</th>
              <th scope="col">{table.daily === "derived" ? "Per day (÷ 26)" : "Per day"}</th>
            </tr>
          </thead>
          {table.zones.map((zone) => (
            <tbody key={zone.id}>
              {zones && (
                <tr className="zone-row">
                  <th scope="rowgroup" colSpan={split ? 5 : 3}>
                    {zone.name}
                    <span>{zone.areas}</span>
                  </th>
                </tr>
              )}
              {skills.map((skill) => {
                const r = table.rates.find((x) => x.zone === zone.id && x.skill === skill)!;
                return (
                  <tr key={skill}>
                    <th scope="row">{SKILLS[skill]}</th>
                    {split && (
                      <>
                        <td className="col-split">{formatRupees(r.basic)}</td>
                        <td className="col-split">{formatRupees(r.vda)}</td>
                      </>
                    )}
                    <td>
                      <strong>{formatRupees(r.monthly)}</strong>
                      {split && (
                        <span className="split-inline" aria-label={`${table.basicLabel} ${formatRupees(r.basic)} plus ${table.vdaLabel} ${formatRupees(r.vda)}`}>
                          {formatRupees(r.basic)} + {formatRupees(r.vda)}
                        </span>
                      )}
                    </td>
                    <td>{r.daily === null ? <span className="wage-none">Not set</span> : formatRupees(r.daily)}</td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>
      <p className="wage-source">
        From {formatDate(table.effectiveFrom)}. {sourceLine(state, source.id)}{" "}
        <a href={source.url}>{pdfLabel(source)}</a>
      </p>
      {table.sources.slice(1).map((id) => {
        const extra = sourceById(state, id);
        // The Hindi original of an English translation needs no second line.
        if (extra.number === source.number && extra.date === source.date && extra.kind === source.kind) return null;
        return (
          <p key={id} className="wage-source is-extra">
            Also: {sourceLine(state, id)} <a href={extra.url}>{pdfLabel(extra)}</a>
          </p>
        );
      })}
      {table.dailyRule && <p className="wage-note">{table.dailyRule}</p>}
      {table.vdaNote && <p className="wage-note">{table.vdaNote}</p>}
    </div>
  );
}

function HistoryBlock({ state, entry }: { state: WageState; entry: WageHistory }) {
  const source = sourceById(state, entry.source);
  const table = state.tables.find((t) => t.id === entry.table)!;
  const hasDaily = entry.rates.some((r) => r.daily !== undefined);
  return (
    <div className="wage-history-entry">
      <h3>
        {formatShortDate(entry.effectiveFrom)} to {formatShortDate(entry.effectiveTo)}
        <span>{table.title}</span>
      </h3>
      {entry.note && <p className="wage-applies">{entry.note}</p>}
      <table className="wage-table is-compact">
        <caption className="sr-only">
          {table.title}, {formatDate(entry.effectiveFrom)} to {formatDate(entry.effectiveTo)}
        </caption>
        <thead>
          <tr>
            <th scope="col">Skill level</th>
            <th scope="col">Per month</th>
            {hasDaily && <th scope="col">Per day</th>}
          </tr>
        </thead>
        <tbody>
          {entry.rates.map((r) => (
            <tr key={`${r.zone ?? ""}${r.skill}`}>
              <th scope="row">{SKILLS[r.skill]}</th>
              <td>{formatRupees(r.monthly)}</td>
              {hasDaily && <td>{r.daily === undefined ? <span className="wage-none">Not set</span> : formatRupees(r.daily)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="wage-source">
        {sourceLine(state, source.id)} <a href={source.url}>{pdfLabel(source)}</a>
      </p>
    </div>
  );
}

/** The dark band with the two doors, at the foot of every wage page. */
function WageDoors() {
  return (
    <section className="wage-doors" data-header-theme="dark">
      <div className="site-shell wage-doors-inner">
        {[wageDoors.jobs, wageDoors.business].map((d) => (
          <div key={d.eyebrow}>
            <p className="eyebrow">{d.eyebrow}</p>
            <h2>{d.heading}</h2>
            <p>{d.text}</p>
            <Link href={d.link.href} className="light-link">
              {d.link.label} <ArrowUpRight size={19} aria-hidden="true" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowWeCheck({ states }: { states: readonly WageState[] }) {
  const single = states.length === 1 ? states[0] : undefined;
  return (
    <Section id="how-we-check" className="border-t border-border">
      <div className="wage-split">
        <div>
          <p className="eyebrow text-gold-700">SOURCES AND CHECKS</p>
          <h2 className="wage-h2">{howWeCheck.heading}</h2>
        </div>
        <div className="wage-prose">
          {single && <p className="wage-reviewed">{checkedPhrase(single)}</p>}
          {howWeCheck.text.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p>
            {howWeCheck.corrections}{" "}
            <a href={`mailto:${siteConfig.email}`} className="font-data">
              {siteConfig.email}
            </a>
          </p>
          {single && (
            <>
              <h3>Documents used for this page</h3>
              <ol className="wage-sources">
                {single.sources.map((s) => (
                  <li key={s.id}>
                    <a href={s.url} lang={s.language === "hi" ? "hi-IN" : undefined}>
                      {s.title}
                    </a>
                    <span>
                      <span className="font-data">
                        <OrderNumber value={s.number} />
                      </span>
                      , {formatDate(s.date)}. {s.authority}.{s.sizeKb && ` PDF, ${formatSize(s.sizeKb)}.`}
                      {s.legalBasis && ` ${s.legalBasis.replace(/([^.])$/, "$1.")}`}
                    </span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      </div>
    </Section>
  );
}

function FaqProse({ faqs }: { faqs: { question: string; answer: string }[] }) {
  return (
    <Section id="questions" variant="subtle">
      <div className="wage-split">
        <div>
          <p className="eyebrow text-gold-700">QUESTIONS</p>
          <h2 className="wage-h2">Common questions</h2>
        </div>
        <div className="faq-prose">
          {faqs.map((f) => (
            <div key={f.question}>
              <h3>{f.question}</h3>
              <p>{f.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ── State page ──────────────────────────────────────────────────────────────

export function WageStatePage({ slug }: { slug: WageStateSlug }) {
  const state = stateOrThrow(slug);
  const t = getWageStateCopy(slug)!;
  const today = todayIso();
  const year = yearOf(state, today);
  const path = wageStatePath(slug);
  const due = unpublishedRevisions(state, today);
  const others = listedStates().filter((s) => s.state !== slug);
  return (
    <>
      <JsonLd data={wageStateSchema(state, { name: t.title(year), description: t.description, url: path })} />
      <JsonLd data={faqSchema(t.faqs)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Minimum wages", href: WAGE_HUB_PATH },
          { name: state.name, href: path },
        ])}
      />
      <PageHero
        title={`Minimum wages in ${state.name}${year ? `, ${year}` : ""}.`}
        lede={t.lede}
        aside={
          <dl className="wage-facts">
            <div>
              <dt>In force from</dt>
              <dd>{formatDate(state.tables.map((x) => x.effectiveFrom).sort().at(-1)!)}</dd>
            </div>
            <div>
              <dt>{t.headlineSource.label}</dt>
              <dd className="font-data">
                <OrderNumber value={t.headlineSource.number} />
              </dd>
            </div>
            <div>
              <dt>Checked</dt>
              <dd>
                <a href="#how-we-check">
                  {formatDate(state.checked.on)}
                  {checkedByLine(state) ? `, by ${checkedByLine(state)}` : ", from the state's documents"}
                </a>
              </dd>
            </div>
            <div>
              <dt>{due.length > 1 ? "Revisions overdue since" : due.length ? "Revision was due" : "Next revision"}</dt>
              <dd>{formatDate(due[0] ?? state.nextRevision.expected)}</dd>
            </div>
          </dl>
        }
        footnote={<QuickDoors contactHref={t.contactHref} jobsLine={t.jobsLine} workers />}
      />
      <RevisionNotice state={state} today={today} />
      <Section id="rates">
        <p className="eyebrow text-gold-700">RATES</p>
        <h2 className="wage-h2 mt-5">Minimum wage rates in {state.name}</h2>
        <div className="wage-tables">
          {state.tables.map((table) => (
            <RateTable key={table.id} state={state} table={table} />
          ))}
        </div>
      </Section>
      <Section id="zones" variant="subtle">
        <div className="wage-split">
          <div>
            <p className="eyebrow text-gold-700">WHERE IT APPLIES</p>
            <h2 className="wage-h2">{t.zones.heading}</h2>
          </div>
          <div className="wage-prose">
            {t.zones.text.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {t.zones.link &&
              (t.zones.link.href.startsWith("http") ? (
                <a href={t.zones.link.href} className="text-link">
                  {t.zones.link.label} <ArrowUpRight size={18} aria-hidden="true" />
                </a>
              ) : (
                linkable(t.zones.link.href, "en-IN") && (
                  <Link href={t.zones.link.href} className="text-link">
                    {t.zones.link.label} <ArrowUpRight size={18} aria-hidden="true" />
                  </Link>
                )
              ))}
          </div>
        </div>
      </Section>
      <Section id="how-the-rate-is-made-up">
        <div className="wage-split">
          <div>
            <p className="eyebrow text-gold-700">THE RATE</p>
            <h2 className="wage-h2">How the rate is made up</h2>
          </div>
          <div className="wage-prose">
            {t.madeUp.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </Section>
      {state.history.length > 0 && (
        <Section id="history" variant="subtle">
          <div className="wage-split">
            <div>
              <p className="eyebrow text-gold-700">HISTORY</p>
              <h2 className="wage-h2">Earlier rates</h2>
            </div>
            <div className="wage-history">
              {state.history.map((h) => (
                <HistoryBlock key={`${h.table}-${h.effectiveFrom}`} state={state} entry={h} />
              ))}
            </div>
          </div>
        </Section>
      )}
      <Section id="contract-labour">
        <div className="wage-split">
          <div>
            <p className="eyebrow text-gold-700">FOR EMPLOYERS</p>
            <h2 className="wage-h2">If you use contract labour in {state.name}</h2>
          </div>
          <div className="wage-prose">
            {t.contractLabour.text.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {t.contractLabour.vspl && <p className="wage-vspl">{t.contractLabour.vspl}</p>}
            <Link href={t.contractLabour.link.href} className="text-link">
              {t.contractLabour.link.label} <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
            <p className="wage-worker-line" id="workers">
              Paid less than this? You can complain to the{" "}
              <a href={t.labourDepartment.href}>{t.labourDepartment.label}</a>. Keep your wage slips and attendance record.
            </p>
          </div>
        </div>
      </Section>
      <FaqProse faqs={t.faqs} />
      {others.length > 0 && (
        <Section className="wage-others">
          <p className="eyebrow text-gold-700">OTHER STATES</p>
          <ul className="wage-state-links">
            {others.map((s) => (
              <li key={s.state}>
                <Link href={wageStatePath(s.state)}>
                  Minimum wages in {s.name} <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
              </li>
            ))}
            <li>
              <Link href={WAGE_HUB_PATH}>
                All states <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </li>
          </ul>
        </Section>
      )}
      <WageDoors />
      <HowWeCheck states={[state]} />
    </>
  );
}

// ── Hub ─────────────────────────────────────────────────────────────────────

export function WageHubPage() {
  const today = todayIso();
  const states = listedStates();
  const anyStale = states.some((s) => wageStatus(s, today).stale);
  const year = anyStale ? null : hubYear();
  const headlines = states.map((s) => ({ state: s, ...headlineRate(s) }));
  const lowest = [...headlines].sort((a, b) => a.low.monthly - b.low.monthly)[0];
  const highest = [...headlines].sort((a, b) => b.high.monthly - a.high.monthly)[0];
  const faqs = wageHubCopy.faqs(
    `${formatRupees(lowest.low.monthly)} (${lowest.state.name})`,
    `${formatRupees(highest.high.monthly)} (${highest.state.name})`,
  );
  const lastChecked = states.map((s) => s.checked.on).sort()[0];
  return (
    <>
      <JsonLd
        data={wageHubSchema({
          name: wageHubCopy.title(year),
          description: wageHubCopy.description(),
          url: WAGE_HUB_PATH,
          dateModified: lastChecked,
          reviewed: states.every((s) => s.checked.by),
          states: states.map((s) => ({ name: `Minimum wages in ${s.name}`, url: wageStatePath(s.state) })),
        })}
      />
      <JsonLd data={faqSchema(faqs)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Minimum wages", href: WAGE_HUB_PATH },
        ])}
      />
      <PageHero title={wageHubCopy.heading(year)} lede={wageHubCopy.lede(states)} footnote={<QuickDoors />} className="pb-10 pt-10 sm:pb-12 sm:pt-16 lg:pb-14 lg:pt-16" />
      <Section id="states">
        <p className="eyebrow text-gold-700">BY STATE</p>
        <h2 className="wage-h2 mt-5">Unskilled rate by state</h2>
        <div className="wage-table-scroll mt-10">
          <table className="wage-table is-index">
            <caption className="sr-only">Monthly minimum wage for unskilled work in the main factory employments, by state, in rupees</caption>
            <thead>
              <tr>
                <th scope="col">State</th>
                <th scope="col">Unskilled, per month</th>
                <th scope="col" className="col-split">In force from</th>
                <th scope="col" className="col-split">Checked</th>
              </tr>
            </thead>
            <tbody>
              {headlines.map(({ state, table, low, high }) => {
                const stale = wageStatus(state, today).stale;
                const zoned = low.monthly !== high.monthly;
                return (
                  <tr key={state.state}>
                    <th scope="row">
                      <Link href={wageStatePath(state.state)} className="wage-row-link">
                        {state.name} <ArrowUpRight size={18} aria-hidden="true" />
                      </Link>
                      <span className="wage-row-note">
                        {table.title}
                        {zoned && ", by district category"}
                        {stale && " · may have been revised"}
                      </span>
                    </th>
                    <td>
                      <strong>{headlineRange(state)}</strong>
                      <span className="split-inline">from {formatShortDate(table.effectiveFrom)}</span>
                    </td>
                    <td className="col-split">{formatDate(table.effectiveFrom)}</td>
                    <td className="col-split">{formatDate(state.checked.on)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="wage-note mt-6">
          These are the rates for the main factory employments. Each state page has every skill level and zone, the other tables it covers, and the notification each comes from.
        </p>
      </Section>
      <Section id="what-is-a-minimum-wage" variant="subtle">
        <div className="wage-split">
          <div>
            <p className="eyebrow text-gold-700">THE BASICS</p>
            <h2 className="wage-h2">{wageHubCopy.whatIs.heading}</h2>
          </div>
          <div className="wage-prose">
            {wageHubCopy.whatIs.text.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </Section>
      <Section id="changes-2026">
        <div className="wage-split">
          <div>
            <p className="eyebrow text-gold-700">THIS YEAR</p>
            <h2 className="wage-h2">{wageHubCopy.changes.heading}</h2>
          </div>
          <ul className="jobs-work">
            {wageHubCopy.changes.items
              .map((item) => ({ item, state: states.find((s) => s.state === item.state) }))
              .filter((x) => x.state)
              .map(({ item, state }) => (
                <li key={item.state}>
                  <h3>{state!.name}</h3>
                  <p>{item.text(state!)}</p>
                </li>
              ))}
          </ul>
        </div>
      </Section>
      <Section id="contract-labour" variant="subtle">
        <div className="wage-split">
          <div>
            <p className="eyebrow text-gold-700">FOR EMPLOYERS</p>
            <h2 className="wage-h2">{wageHubCopy.employers.heading}</h2>
          </div>
          <div className="wage-prose">
            {wageHubCopy.employers.text.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <Link href="/contact" className="text-link">
              Request a crew <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Section>
      <Section id="for-workers">
        <div className="wage-split">
          <div>
            <p className="eyebrow text-gold-700">FOR WORKERS</p>
            <h2 className="wage-h2">{wageHubCopy.workers.heading}</h2>
          </div>
          <div className="wage-prose">
            {wageHubCopy.workers.text.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <ul className="wage-state-links is-plain">
              {states.map((s) => {
                const dept = getWageStateCopy(s.state)!.labourDepartment;
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
      <FaqProse faqs={faqs} />
      <WageDoors />
      <HowWeCheck states={states} />
    </>
  );
}
