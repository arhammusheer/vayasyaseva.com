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
  type Skill,
  type WageHistory,
  type WageSource,
  type WageState,
  type WageTable,
} from "@/content/wages";
import { EDITORIAL_HREF } from "@/content/editorial";
import { getWageStateCopy, howWeCheck, listDates, wageDoors, wageHubCopy, wageUiEn } from "@/content/pages/minimum-wages";
import {
  SKILLS_HI,
  formatDateHi,
  formatShortDateHi,
  getWageStateCopyHi,
  historyNoteHi,
  howWeCheckHi,
  listDatesHi,
  stateNameHi,
  tableTextHi,
  wageDoorsHi,
  wageHubCopyHi,
  wageUiHi,
} from "@/content/pages/minimum-wages.hi";
import { localePath, type Locale } from "@/lib/i18n";

/**
 * The minimum wage pages in English and, in review (PR8), Hindi. Everything
 * language-specific comes from one bundle per language; the figures come
 * from the datasets in both.
 */
type WageLocale = Extract<Locale, "en-IN" | "hi-IN">;
const asWageLocale = (locale: Locale): WageLocale => (locale === "hi-IN" ? "hi-IN" : "en-IN");

function textFor(locale: WageLocale) {
  if (locale === "hi-IN") {
    return {
      ui: wageUiHi,
      stateCopy: getWageStateCopyHi,
      hub: wageHubCopyHi,
      check: howWeCheckHi,
      doors: wageDoorsHi,
      date: formatDateHi,
      shortDate: formatShortDateHi,
      listDates: listDatesHi,
      name: stateNameHi,
      skill: (k: Skill) => SKILLS_HI[k],
      table: tableTextHi,
      historyNote: historyNoteHi,
      checkedBy: (state: WageState) => {
        const by = state.checked.by;
        return by ? (by.name ? `${by.name}, ${by.role}` : `Vayasya Seva के ${by.role}`) : null;
      },
    };
  }
  return {
    ui: wageUiEn,
    stateCopy: getWageStateCopy,
    hub: wageHubCopy,
    check: howWeCheck,
    doors: wageDoors,
    date: formatDate,
    shortDate: formatShortDate,
    listDates,
    name: (state: WageState) => state.name,
    skill: (k: Skill) => SKILLS[k],
    table: (_state: WageState, table: WageTable) => ({
      ...table,
      zone: (id: string) => table.zones.find((z) => z.id === id)!,
    }),
    historyNote: (_state: WageState, entry: WageHistory) => entry.note,
    checkedBy: checkedByLine,
  };
}
type WageText = ReturnType<typeof textFor>;

/** Published state pages, in hub order. A state in review is not listed or linked. */
const listedStates = () => wageStates.filter((s) => linkable(wageStatePath(s.state), "en-IN"));

/** The year shows in titles and headings only while the figures are current (PLAN §5.5). */
const yearOf = (state: WageState, today: string) => (wageStatus(state, today).stale ? null : ratesYear(state));

// ── Metadata ────────────────────────────────────────────────────────────────

export function wageStateMetadata(slug: WageStateSlug, pageLocale: Locale = "en-IN") {
  const locale = asWageLocale(pageLocale);
  const state = stateOrThrow(slug);
  const t = textFor(locale).stateCopy(slug)!;
  return pageMetadata({
    title: t.title(yearOf(state, todayIso())),
    description: t.description,
    alternates: { canonical: localePath(wageStatePath(slug), locale) },
    locale,
  });
}

export function wageHubMetadata(pageLocale: Locale = "en-IN") {
  const locale = asWageLocale(pageLocale);
  const hub = textFor(locale).hub;
  const today = todayIso();
  const anyStale = listedStates().some((s) => wageStatus(s, today).stale);
  return pageMetadata({
    title: hub.title(anyStale ? null : hubYear()),
    description: hub.description(),
    alternates: { canonical: localePath(WAGE_HUB_PATH, locale) },
    locale,
  });
}

function stateOrThrow(slug: WageStateSlug) {
  const state = wageStates.find((s) => s.state === slug);
  if (!state || !getWageStateCopy(slug) || !getWageStateCopyHi(slug)) throw new Error(`No wage data or copy for ${slug}`);
  return state;
}

const hubYear = () => listedStates().map(ratesYear).sort().at(-1) ?? null;

// ── Shared pieces ───────────────────────────────────────────────────────────

const pdfLabel = (x: WageText, s: WageSource) => x.ui.pdf(s.kind, s.language === "hi", s.sizeKb ? formatSize(s.sizeKb) : null);

/** "Notification No. 289, dated 1 April 2026. Labour Department." in the page's language. */
function sourceLine(x: WageText, state: WageState, id: string) {
  const s = sourceById(state, id);
  // Delhi's numbers carry their own "F.No." prefix.
  const no = /^F\.?\s?No\./i.test(s.number) ? "" : x.ui === wageUiEn ? "No. " : "सं. ";
  const end = x.ui === wageUiEn ? "." : "।";
  return `${x.ui.sourceKind(s.kind)} ${no}${s.number}, ${x.ui.dated} ${x.date(s.date)}${end} ${s.authority}.`;
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

/** Both audiences get their next step in the first screen (no phone); workers also get the pay check. */
function QuickDoors({ x, contactHref = "/contact", jobsLine, workers }: { x: WageText; contactHref?: string; jobsLine?: string; workers?: boolean }) {
  return (
    <div className="wage-quick-doors">
      <p>
        {x.ui.doors.looking}
        {jobsLine && <span className="wage-quick-note">{jobsLine}</span>}
        <Link href={x.doors.jobs.link.href} className="text-link">
          {x.doors.jobs.link.label} <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </p>
      <p>
        {x.ui.doors.hiring}
        <Link href={contactHref} className="text-link">
          {x.doors.business.link.label} <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </p>
      {workers && (
        <p>
          {x.ui.doors.paidLess}
          <a href="#workers" className="text-link">
            {x.ui.doors.whatYouCanDo} <ArrowRight size={18} aria-hidden="true" />
          </a>
        </p>
      )}
    </div>
  );
}

/** "May have been revised" once stale; a quieter "revision due" note before that. */
function RevisionNotice({ x, state, today }: { x: WageText; state: WageState; today: string }) {
  const status = wageStatus(state, today);
  const due = unpublishedRevisions(state, today);
  if (!due.length && !status.stale) return null;
  const listing = state.sources[0].listing;
  const [strong, rest] = due.length > 1 ? x.ui.notice.many(x.listDates(due), x.date(state.checked.on)) : due.length ? x.ui.notice.one(x.date(due[0]), x.date(state.checked.on), x.name(state)) : ["", ""];
  return (
    <div className={status.stale ? "wage-notice is-stale" : "wage-notice"} role={status.stale ? "status" : undefined}>
      <div className="site-shell">
        {status.stale ? (
          <p>
            <strong>{x.ui.notice.staleStrong}</strong> {x.ui.notice.staleText} <a href={listing}>{x.ui.notice.staleLink}</a>
          </p>
        ) : (
          <p>
            <strong>{strong}</strong> {rest}
          </p>
        )}
      </div>
    </div>
  );
}

function RateTable({ x, state, table }: { x: WageText; state: WageState; table: WageTable }) {
  const tt = x.table(state, table);
  const split = table.rates.some((r) => r.vda > 0);
  const zones = table.zones.length > 1;
  const source = sourceById(state, table.sources[0]);
  const skills = [...new Set(table.rates.map((r) => r.skill))];
  return (
    <div className="wage-table-block" id={table.id}>
      <h3>{tt.title}</h3>
      <p className="wage-applies">{tt.appliesTo}</p>
      <div className="wage-table-scroll">
        <table className="wage-table">
          <caption className="sr-only">{x.ui.table.caption(tt.title, x.name(state), x.date(table.effectiveFrom))}</caption>
          <thead>
            <tr>
              <th scope="col">{x.ui.table.skill}</th>
              {split && (
                <>
                  <th scope="col" className="col-split">{tt.basicLabel}</th>
                  <th scope="col" className="col-split">{tt.vdaLabel}</th>
                </>
              )}
              <th scope="col">{x.ui.table.month}</th>
              <th scope="col">{table.daily === "derived" ? x.ui.table.dayDerived : x.ui.table.day}</th>
            </tr>
          </thead>
          {table.zones.map((zone) => (
            <tbody key={zone.id}>
              {zones && (
                <tr className="zone-row">
                  <th scope="rowgroup" colSpan={split ? 5 : 3}>
                    {tt.zone(zone.id).name}
                    <span>{tt.zone(zone.id).areas}</span>
                  </th>
                </tr>
              )}
              {skills.map((skill) => {
                const r = table.rates.find((y) => y.zone === zone.id && y.skill === skill)!;
                return (
                  <tr key={skill}>
                    <th scope="row">{x.skill(skill)}</th>
                    {split && (
                      <>
                        <td className="col-split">{formatRupees(r.basic)}</td>
                        <td className="col-split">{formatRupees(r.vda)}</td>
                      </>
                    )}
                    <td>
                      <strong>{formatRupees(r.monthly)}</strong>
                      {split && (
                        <span className="split-inline" aria-label={x.ui.table.split(tt.basicLabel, formatRupees(r.basic), tt.vdaLabel, formatRupees(r.vda))}>
                          {formatRupees(r.basic)} + {formatRupees(r.vda)}
                        </span>
                      )}
                    </td>
                    <td>{r.daily === null ? <span className="wage-none">{x.ui.table.notSet}</span> : formatRupees(r.daily)}</td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>
      <p className="wage-source">
        {x.ui.table.from(x.date(table.effectiveFrom))} {sourceLine(x, state, source.id)} <a href={source.url}>{pdfLabel(x, source)}</a>
      </p>
      {table.sources.slice(1).map((id) => {
        const extra = sourceById(state, id);
        // The Hindi original of an English translation needs no second line.
        if (extra.number === source.number && extra.date === source.date && extra.kind === source.kind) return null;
        return (
          <p key={id} className="wage-source is-extra">
            {x.ui.table.also} {sourceLine(x, state, id)} <a href={extra.url}>{pdfLabel(x, extra)}</a>
          </p>
        );
      })}
      {tt.dailyRule && <p className="wage-note">{tt.dailyRule}</p>}
      {tt.vdaNote && <p className="wage-note">{tt.vdaNote}</p>}
    </div>
  );
}

function HistoryBlock({ x, state, entry }: { x: WageText; state: WageState; entry: WageHistory }) {
  const source = sourceById(state, entry.source);
  const table = state.tables.find((t) => t.id === entry.table)!;
  const title = x.table(state, table).title;
  const hasDaily = entry.rates.some((r) => r.daily !== undefined);
  const note = x.historyNote(state, entry);
  return (
    <div className="wage-history-entry">
      <h3>
        {x.ui.table.range(x.shortDate(entry.effectiveFrom), x.shortDate(entry.effectiveTo))}
        <span>{title}</span>
      </h3>
      {note && <p className="wage-applies">{note}</p>}
      <table className="wage-table is-compact">
        <caption className="sr-only">
          {title}, {x.ui.table.range(x.date(entry.effectiveFrom), x.date(entry.effectiveTo))}
        </caption>
        <thead>
          <tr>
            <th scope="col">{x.ui.table.skill}</th>
            <th scope="col">{x.ui.table.month}</th>
            {hasDaily && <th scope="col">{x.ui.table.day}</th>}
          </tr>
        </thead>
        <tbody>
          {entry.rates.map((r) => (
            <tr key={`${r.zone ?? ""}${r.skill}`}>
              <th scope="row">{x.skill(r.skill)}</th>
              <td>{formatRupees(r.monthly)}</td>
              {hasDaily && <td>{r.daily === undefined ? <span className="wage-none">{x.ui.table.notSet}</span> : formatRupees(r.daily)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="wage-source">
        {sourceLine(x, state, source.id)} <a href={source.url}>{pdfLabel(x, source)}</a>
      </p>
    </div>
  );
}

/** The dark band with the two doors, at the foot of every wage page. */
function WageDoors({ x }: { x: WageText }) {
  return (
    <section className="wage-doors" data-header-theme="dark">
      <div className="site-shell wage-doors-inner">
        {[x.doors.jobs, x.doors.business].map((d) => (
          <div key={d.eyebrow}>
            <p className="eyebrow">{d.eyebrow}</p>
            <h2>{d.heading}</h2>
            <p>{d.text}</p>
            <Link href={d.link.href} className="light-link">
              {d.link.label} <ArrowRight size={19} aria-hidden="true" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowWeCheck({ x, states }: { x: WageText; states: readonly WageState[] }) {
  const single = states.length === 1 ? states[0] : undefined;
  return (
    <Section id="how-we-check" className="border-t border-border">
      <div className="wage-split">
        <div>
          <p className="eyebrow text-gold-700">{x.ui.sections.sources}</p>
          <h2 className="wage-h2">{x.check.heading}</h2>
        </div>
        <div className="wage-prose">
          {single && <p className="wage-reviewed">{x.ui.checkedPhrase(x.checkedBy(single), x.date(single.checked.on))}</p>}
          {x.check.text.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p>
            {x.check.corrections}{" "}
            <a href={`mailto:${siteConfig.email}`} className="font-data">
              {siteConfig.email}
            </a>
          </p>
          <Link href={EDITORIAL_HREF} className="text-link">
            {x.ui.sections.editorial} <ArrowRight size={18} aria-hidden="true" />
          </Link>
          {single && (
            <>
              <h3>{x.ui.sections.documents}</h3>
              <ol className="wage-sources">
                {single.sources.map((s) => (
                  <li key={s.id}>
                    <a href={s.url} lang={s.language === "hi" ? "hi-IN" : "en-IN"}>
                      {s.title}
                    </a>
                    <span>
                      <span className="font-data">
                        <OrderNumber value={s.number} />
                      </span>
                      , {x.date(s.date)}. {s.authority}.{s.sizeKb && ` PDF, ${formatSize(s.sizeKb)}.`}
                      {/* The legal basis is quoted from the English record; the Hindi draft leaves it out. */}
                      {x.ui === wageUiEn && s.legalBasis && ` ${s.legalBasis.replace(/([^.])$/, "$1.")}`}
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

function FaqProse({ x, faqs }: { x: WageText; faqs: { question: string; answer: string }[] }) {
  return (
    <Section id="questions" variant="subtle">
      <div className="wage-split">
        <div>
          <p className="eyebrow text-gold-700">{x.ui.sections.questions}</p>
          <h2 className="wage-h2">{x.ui.sections.questionsHeading}</h2>
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

export function WageStatePage({ slug, locale: pageLocale = "en-IN" }: { slug: WageStateSlug; locale?: Locale }) {
  const locale = asWageLocale(pageLocale);
  const x = textFor(locale);
  const state = stateOrThrow(slug);
  const t = x.stateCopy(slug)!;
  const today = todayIso();
  const year = yearOf(state, today);
  const path = localePath(wageStatePath(slug), locale);
  const due = unpublishedRevisions(state, today);
  const others = listedStates().filter((s) => s.state !== slug);
  const by = x.checkedBy(state);
  return (
    <>
      <JsonLd data={wageStateSchema(state, { name: t.title(year), description: t.description, url: path, inLanguage: locale })} />
      <JsonLd data={faqSchema(t.faqs)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: x.ui.home, href: "/" },
          { name: x.ui.minimumWages, href: localePath(WAGE_HUB_PATH, locale) },
          { name: x.name(state), href: path },
        ])}
      />
      <PageHero
        title={x.ui.stateHeading(x.name(state), year)}
        lede={t.lede}
        aside={
          <dl className="wage-facts">
            <div>
              <dt>{x.ui.facts.inForce}</dt>
              <dd>{x.date(state.tables.map((y) => y.effectiveFrom).sort().at(-1)!)}</dd>
            </div>
            <div>
              <dt>{t.headlineSource.label}</dt>
              <dd className="font-data">
                <OrderNumber value={t.headlineSource.number} />
              </dd>
            </div>
            <div>
              <dt>{x.ui.facts.checked}</dt>
              <dd>
                <a href="#how-we-check">
                  {x.date(state.checked.on)}
                  {by ? x.ui.facts.checkedBy(by) : x.ui.facts.fromDocs}
                </a>
              </dd>
            </div>
            <div>
              <dt>{due.length > 1 ? x.ui.facts.overdue : due.length ? x.ui.facts.wasDue : x.ui.facts.next}</dt>
              <dd>{x.date(due[0] ?? state.nextRevision.expected)}</dd>
            </div>
          </dl>
        }
        footnote={<QuickDoors x={x} contactHref={t.contactHref} jobsLine={t.jobsLine} workers />}
      />
      <RevisionNotice x={x} state={state} today={today} />
      <Section id="rates">
        <p className="eyebrow text-gold-700">{x.ui.sections.rates}</p>
        <h2 className="wage-h2 mt-5">{x.ui.sections.ratesHeading(x.name(state))}</h2>
        <div className="wage-tables">
          {state.tables.map((table) => (
            <RateTable key={table.id} x={x} state={state} table={table} />
          ))}
        </div>
      </Section>
      <Section id="zones" variant="subtle">
        <div className="wage-split">
          <div>
            <p className="eyebrow text-gold-700">{x.ui.sections.where}</p>
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
                    {t.zones.link.label} <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                )
              ))}
          </div>
        </div>
      </Section>
      <Section id="how-the-rate-is-made-up">
        <div className="wage-split">
          <div>
            <p className="eyebrow text-gold-700">{x.ui.sections.theRate}</p>
            <h2 className="wage-h2">{x.ui.sections.madeUpHeading}</h2>
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
              <p className="eyebrow text-gold-700">{x.ui.sections.history}</p>
              <h2 className="wage-h2">{x.ui.sections.historyHeading}</h2>
            </div>
            <div className="wage-history">
              {state.history.map((h) => (
                <HistoryBlock key={`${h.table}-${h.effectiveFrom}`} x={x} state={state} entry={h} />
              ))}
            </div>
          </div>
        </Section>
      )}
      <Section id="contract-labour">
        <div className="wage-split">
          <div>
            <p className="eyebrow text-gold-700">{x.ui.sections.employers}</p>
            <h2 className="wage-h2">{x.ui.sections.employersHeading(x.name(state))}</h2>
          </div>
          <div className="wage-prose">
            {t.contractLabour.text.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {t.contractLabour.vspl && <p className="wage-vspl">{t.contractLabour.vspl}</p>}
            <Link href={t.contractLabour.link.href} className="text-link">
              {t.contractLabour.link.label} <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <p className="wage-worker-line" id="workers">
              {x.ui.sections.workerLine[0]} <a href={t.labourDepartment.href}>{t.labourDepartment.label}</a>
              {x.ui.sections.workerLine[1]}
            </p>
          </div>
        </div>
      </Section>
      <FaqProse x={x} faqs={t.faqs} />
      {others.length > 0 && (
        <Section className="wage-others">
          <p className="eyebrow text-gold-700">{x.ui.sections.others}</p>
          <ul className="wage-state-links">
            {others.map((s) => (
              <li key={s.state}>
                <Link href={wageStatePath(s.state)}>
                  {x.ui.statesListItem(x.name(s))} <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </li>
            ))}
            <li>
              <Link href={WAGE_HUB_PATH}>
                {x.ui.sections.allStates} <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </li>
          </ul>
        </Section>
      )}
      <WageDoors x={x} />
      <HowWeCheck x={x} states={[state]} />
    </>
  );
}

// ── Hub ─────────────────────────────────────────────────────────────────────

export function WageHubPage({ locale: pageLocale = "en-IN" }: { locale?: Locale }) {
  const locale = asWageLocale(pageLocale);
  const x = textFor(locale);
  const today = todayIso();
  const states = listedStates();
  const anyStale = states.some((s) => wageStatus(s, today).stale);
  const year = anyStale ? null : hubYear();
  const headlines = states.map((s) => ({ state: s, ...headlineRate(s) }));
  const lowest = [...headlines].sort((a, b) => a.low.monthly - b.low.monthly)[0];
  const highest = [...headlines].sort((a, b) => b.high.monthly - a.high.monthly)[0];
  const faqs = x.hub.faqs(
    `${formatRupees(lowest.low.monthly)} (${x.name(lowest.state)})`,
    `${formatRupees(highest.high.monthly)} (${x.name(highest.state)})`,
  );
  const lastChecked = states.map((s) => s.checked.on).sort()[0];
  const hubPath = localePath(WAGE_HUB_PATH, locale);
  return (
    <>
      <JsonLd
        data={wageHubSchema({
          name: x.hub.title(year),
          description: x.hub.description(),
          url: hubPath,
          dateModified: lastChecked,
          reviewed: states.every((s) => s.checked.by),
          states: states.map((s) => ({ name: x.ui.statesListItem(x.name(s)), url: wageStatePath(s.state) })),
          inLanguage: locale,
        })}
      />
      <JsonLd data={faqSchema(faqs)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: x.ui.home, href: "/" },
          { name: x.ui.minimumWages, href: hubPath },
        ])}
      />
      <PageHero title={x.hub.heading(year)} lede={x.hub.lede(states)} footnote={<QuickDoors x={x} />} className="pb-10 pt-10 sm:pb-12 sm:pt-16 lg:pb-14 lg:pt-16" />
      <Section id="states">
        <p className="eyebrow text-gold-700">{x.ui.hub.byState}</p>
        <h2 className="wage-h2 mt-5">{x.ui.hub.tableHeading}</h2>
        <div className="wage-table-scroll mt-10">
          <table className="wage-table is-index">
            <caption className="sr-only">{x.ui.hub.caption}</caption>
            <thead>
              <tr>
                <th scope="col">{x.ui.hub.state}</th>
                <th scope="col">{x.ui.hub.unskilledMonth}</th>
                <th scope="col" className="col-split">{x.ui.hub.inForce}</th>
                <th scope="col" className="col-split">{x.ui.hub.checked}</th>
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
                        {x.name(state)} <ArrowRight size={18} aria-hidden="true" />
                      </Link>
                      <span className="wage-row-note">
                        {x.table(state, table).title}
                        {zoned && x.ui.hub.byCategory}
                        {stale && x.ui.hub.mayBeRevised}
                      </span>
                    </th>
                    <td>
                      <strong>{locale === "hi-IN" ? headlineRange(state).replace(" to ", " से ") : headlineRange(state)}</strong>
                      <span className="split-inline">{x.ui.hub.from(x.shortDate(table.effectiveFrom))}</span>
                    </td>
                    <td className="col-split">{x.date(table.effectiveFrom)}</td>
                    <td className="col-split">{x.date(state.checked.on)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="wage-note mt-6">{x.ui.hub.note}</p>
      </Section>
      <Section id="what-is-a-minimum-wage" variant="subtle">
        <div className="wage-split">
          <div>
            <p className="eyebrow text-gold-700">{x.ui.hub.basics}</p>
            <h2 className="wage-h2">{x.hub.whatIs.heading}</h2>
          </div>
          <div className="wage-prose">
            {x.hub.whatIs.text.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </Section>
      <Section id="changes-2026">
        <div className="wage-split">
          <div>
            <p className="eyebrow text-gold-700">{x.ui.hub.thisYear}</p>
            <h2 className="wage-h2">{x.hub.changes.heading}</h2>
          </div>
          <ul className="jobs-work">
            {x.hub.changes.items
              .map((item) => ({ item, state: states.find((s) => s.state === item.state) }))
              .filter((y) => y.state)
              .map(({ item, state }) => (
                <li key={item.state}>
                  <h3>{x.name(state!)}</h3>
                  <p>{item.text(state!)}</p>
                </li>
              ))}
          </ul>
        </div>
      </Section>
      <Section id="contract-labour" variant="subtle">
        <div className="wage-split">
          <div>
            <p className="eyebrow text-gold-700">{x.ui.hub.employers}</p>
            <h2 className="wage-h2">{x.hub.employers.heading}</h2>
          </div>
          <div className="wage-prose">
            {x.hub.employers.text.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <Link href="/contact" className="text-link">
              {x.ui.hub.requestCrew} <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Section>
      <Section id="for-workers">
        <div className="wage-split">
          <div>
            <p className="eyebrow text-gold-700">{x.ui.hub.workers}</p>
            <h2 className="wage-h2">{x.hub.workers.heading}</h2>
          </div>
          <div className="wage-prose">
            {x.hub.workers.text.map((p) => (
              <p key={p}>{p}</p>
            ))}
            <ul className="wage-state-links is-plain">
              {states.map((s) => {
                const dept = x.stateCopy(s.state)!.labourDepartment;
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
      <FaqProse x={x} faqs={faqs} />
      <WageDoors x={x} />
      <HowWeCheck x={x} states={states} />
    </>
  );
}
