"use client";

import { useId, useState } from "react";
import { BONUS_ELIGIBLE_UP_TO, EPF_CEILING, ESIC_LIMIT, GRATUITY_CEILING, KA_PT_FROM, bonus, delhiLwf, epf, esic, gratuity, haryanaLwf, karnatakaPt, type GratuityExit } from "@/content/contributions";

/**
 * The reference pages' calculators: one amount in, the shares out, worked
 * by src/content/contributions.ts (tested against the documents' examples).
 * Each starts on a realistic amount, so the server HTML already shows a
 * complete answer.
 */

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;
const toNumber = (s: string) => Number(s.replace(/[^\d.]/g, "")) || 0;

function AmountField({ label, prefix = "₹", value, onChange, presets, format = inr }: { label: string; prefix?: string; value: number; onChange: (n: number) => void; presets: number[]; format?: (n: number) => string }) {
  const id = useId();
  const [text, setText] = useState(String(value));
  const set = (n: number) => {
    setText(String(n));
    onChange(n);
  };
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <div className="ref-calc-field">
        {prefix && <span aria-hidden="true">{prefix}</span>}
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onChange(toNumber(e.target.value));
          }}
        />
      </div>
      <div className="ref-presets" role="group" aria-label="Try an amount">
        {presets.map((p) => (
          <button key={p} type="button" aria-pressed={value === p} onClick={() => set(p)}>
            {format(p)}
          </button>
        ))}
      </div>
    </div>
  );
}

function Result({ rows, total, note, warn }: { rows: [string, string][]; total: [string, string]; note?: string; warn?: boolean }) {
  return (
    <div aria-live="polite">
      <dl className="ref-result">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
        <div className="is-total">
          <dt>{total[0]}</dt>
          <dd>{total[1]}</dd>
        </div>
      </dl>
      {note && <p className={warn ? "ref-calc-note is-warn mt-3" : "ref-calc-note mt-3"}>{note}</p>}
    </div>
  );
}

export function EpfCalculator() {
  const [wages, setWages] = useState(20000);
  const [pension, setPension] = useState(true);
  const r = epf(wages, pension);
  return (
    <div className="ref-calc">
      <div>
        <AmountField label="PF wages a month (basic + DA)" value={wages} onChange={setWages} presets={[15000, 20000, 35000]} />
        <label className="ref-calc-toggle mt-5">
          <input type="checkbox" checked={pension} onChange={(e) => setPension(e.target.checked)} />
          In the pension scheme (EPS)
        </label>
      </div>
      <Result
        rows={[
          ["Worker, 12%", inr(r.worker)],
          ["Employer to EPS, 8.33%", inr(r.eps)],
          ["Employer to EPF", inr(r.employerEpf)],
          ["EDLI, 0.5%", inr(r.edli)],
          ["Admin charges, 0.5%", inr(r.admin)],
          ["Cost to the employer", inr(r.employerCost)],
        ]}
        total={["Paid in each month", inr(r.total)]}
        note={r.capped ? `Worked out on the ₹${EPF_CEILING.toLocaleString("en-IN")} ceiling: above it, contributions stop unless worker and employer jointly opt for more.` : "Rounded to the nearest rupee, as the Scheme requires. Admin charges are at least ₹500 a month for the establishment."}
      />
    </div>
  );
}

export function EsicCalculator() {
  const [wages, setWages] = useState(18000);
  const r = esic(wages);
  return (
    <div className="ref-calc">
      <AmountField label="Wages a month" value={wages} onChange={setWages} presets={[12000, 18000, 22000]} />
      <Result
        rows={[
          ["Worker, 0.75%", r.withinLimit ? inr(r.worker) : "—"],
          ["Employer, 3.25%", r.withinLimit ? inr(r.employer) : "—"],
        ]}
        total={["Paid in each month", r.withinLimit ? inr(r.total) : "Not covered"]}
        warn={!r.withinLimit}
        note={
          r.withinLimit
            ? "Each share is rounded up to the next rupee. A worker averaging ₹176 a day or less pays nothing; the employer still pays 3.25%."
            : `Above ₹${ESIC_LIMIT.toLocaleString("en-IN")}: a new joiner is not covered. A covered worker raised above it stays covered to the end of the contribution period, paying ${inr(r.worker)} and ${inr(r.employer)}.`
        }
      />
    </div>
  );
}

export function HaryanaLwfCalculator({ minimumWage }: { minimumWage: number }) {
  const [wages, setWages] = useState(Math.round(minimumWage));
  const r = haryanaLwf(wages);
  return (
    <div className="ref-calc">
      <AmountField label="Wages a month" value={wages} onChange={setWages} presets={[Math.round(minimumWage), 17500, 25000]} />
      <Result
        rows={[
          ["Worker, 0.2%", inr(r.worker)],
          ["Employer, twice", inr(r.employer)],
          ["Each month", inr(r.month)],
        ]}
        total={["Paid before 31 December", inr(r.year)]}
        note={r.capped ? "Capped: above ₹17,500 a month the shares stay at ₹35 and ₹70." : "Before any rounding. The employer deducts the worker's share from wages and deposits both."}
      />
    </div>
  );
}

export function DelhiLwfCalculator() {
  const [workers, setWorkers] = useState(40);
  const r = delhiLwf(workers);
  return (
    <div className="ref-calc">
      <AmountField label="Workers on the register" prefix="" value={workers} onChange={setWorkers} presets={[5, 40, 120]} format={(n) => `${n} workers`} />
      <Result
        rows={[
          ["Workers' share, ₹0.75 each", inr(r.workers)],
          ["Employer's share, ₹2.25 each", inr(r.employer)],
        ]}
        total={["Deposit each half-year", inr(r.deposit)]}
        note={workers > 0 && workers < 5 ? "Under five persons the establishment is not covered." : `The Government of Delhi adds ${inr(r.government)}; you do not deposit it.`}
        warn={workers > 0 && workers < 5}
      />
    </div>
  );
}

export function KarnatakaPtCalculator() {
  const [salary, setSalary] = useState(30000);
  const r = karnatakaPt(salary);
  return (
    <div className="ref-calc">
      <AmountField label="Salary for the month" value={salary} onChange={setSalary} presets={[24000, 25000, 40000]} />
      <Result
        rows={[
          ["Each month, April to January and March", inr(r.month)],
          ["February", inr(r.february)],
        ]}
        total={["The year", inr(r.year)]}
        note={r.due ? "Deducted from salary and paid by the 20th of the next month." : `Below ₹${KA_PT_FROM.toLocaleString("en-IN")} a month there is no tax, unless bonus or arrears take that month over it.`}
      />
    </div>
  );
}

/** One state's unskilled minimum wage, from the wage dataset, for the bonus calculator. */
export type BonusPlace = { label: string; minimumWage: number };

export function BonusCalculator({ places }: { places: BonusPlace[] }) {
  const [place, setPlace] = useState(0);
  const minimumWage = places[place]?.minimumWage ?? 0;
  const [wages, setWages] = useState(Math.round(minimumWage));
  const [rate, setRate] = useState(100 / 12);
  const r = bonus(wages, minimumWage, rate);
  const placeId = useId();
  const rates: [string, number][] = [["8.33%", 100 / 12], ["12%", 12], ["20%", 20]];
  return (
    <div className="ref-calc">
      <div className="grid gap-6">
        <div>
          <label htmlFor={placeId}>Where the worker works</label>
          <select
            id={placeId}
            value={place}
            onChange={(e) => {
              const next = Number(e.target.value);
              setPlace(next);
              setWages(Math.round(places[next]?.minimumWage ?? 0));
            }}
          >
            {places.map((p, i) => (
              <option key={p.label} value={i}>
                {p.label}: {inr(p.minimumWage)} minimum wage
              </option>
            ))}
          </select>
        </div>
        {/* Keyed by place, so the field shows the new state's minimum wage. */}
        <AmountField key={place} label="Wages a month (basic + DA)" value={wages} onChange={setWages} presets={[Math.round(minimumWage), 21000, 25000]} />
        <div>
          <span className="block text-[15px] font-semibold">Bonus rate</span>
          <div className="ref-presets" role="group" aria-label="Bonus rate">
            {rates.map(([label, value]) => (
              <button key={label} type="button" aria-pressed={Math.abs(rate - value) < 0.001} onClick={() => setRate(value)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Result
        rows={[
          ["Worked out on", r.eligible ? `${inr(r.base)} a month` : "—"],
          ["The year's wages for bonus", r.eligible ? inr(r.yearWages) : "—"],
          ["At 8.33%, the least", r.eligible ? inr(r.minimum) : "—"],
          ["At 20%, the most", r.eligible ? inr(r.maximum) : "—"],
        ]}
        total={[`Bonus for the year at ${rate === 100 / 12 ? "8.33" : rate}%`, r.eligible ? inr(r.atRate) : "Not eligible"]}
        warn={!r.eligible}
        note={
          r.eligible
            ? wages > 7000
              ? `Above ₹7,000 a month, bonus is worked out on ₹7,000 or the minimum wage, whichever is higher: here ${inr(r.base)}. For a full year; part of a year earns a proportionate share.`
              : "For a full year; part of a year earns a proportionate share."
            : `Above ₹${BONUS_ELIGIBLE_UP_TO.toLocaleString("en-IN")} a month in wages (basic + DA), statutory bonus is not due.`
        }
      />
    </div>
  );
}

export function GratuityCalculator({ places }: { places: BonusPlace[] }) {
  const [place, setPlace] = useState(0);
  const minimumWage = places[place]?.minimumWage ?? 0;
  const [wages, setWages] = useState(Math.round(minimumWage));
  const [years, setYears] = useState(6);
  const [months, setMonths] = useState(0);
  const [exit, setExit] = useState<GratuityExit>("regular");
  const r = gratuity(wages, years, months, exit);
  const placeId = useId();
  const exits: [string, GratuityExit][] = [["Leaving or retiring", "regular"], ["Fixed term ends", "fixed-term"], ["Death or disablement", "death"]];
  const short = exit === "fixed-term" ? "one year under the contract" : "five years of continuous service";
  return (
    <div className="ref-calc">
      <div className="grid gap-6">
        <div>
          <label htmlFor={placeId}>Where the worker works</label>
          <select
            id={placeId}
            value={place}
            onChange={(e) => {
              const next = Number(e.target.value);
              setPlace(next);
              setWages(Math.round(places[next]?.minimumWage ?? 0));
            }}
          >
            {places.map((p, i) => (
              <option key={p.label} value={i}>
                {p.label}: {inr(p.minimumWage)} minimum wage
              </option>
            ))}
          </select>
        </div>
        {/* Keyed by place, so the field shows the new state's minimum wage. */}
        <AmountField key={place} label="Last wages a month (basic + DA)" value={wages} onChange={setWages} presets={[Math.round(minimumWage), 25000, 40000]} />
        <div className="grid gap-6 sm:grid-cols-2">
          <AmountField label="Years of service" prefix="" value={years} onChange={setYears} presets={[1, 5, 10]} format={(n) => `${n} yr`} />
          <AmountField label="And months" prefix="" value={months} onChange={(n) => setMonths(Math.min(n, 11))} presets={[0, 6, 7]} format={(n) => `${n} mo`} />
        </div>
        <div>
          <span className="block text-[15px] font-semibold">How the worker leaves</span>
          <div className="ref-presets" role="group" aria-label="How the worker leaves">
            {exits.map(([label, value]) => (
              <button key={value} type="button" aria-pressed={exit === value} onClick={() => setExit(value)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Result
        rows={[
          ["15 days' wages", inr(r.perYear)],
          ["Years counted", r.counted === 1 ? "1 year" : `${r.counted} years`],
          ...(r.capped ? ([["Before the ceiling", inr(r.uncapped)]] as [string, string][]) : []),
        ]}
        total={["Gratuity", r.due ? inr(r.amount) : "Not yet due"]}
        warn={!r.due}
        note={
          !r.due
            ? exit === "death"
              ? "Nothing to count yet: gratuity on death or disablement is for each completed year, and a part over six months."
              : `Not due before ${short}. ${exit === "regular" ? "On death or disablement, or at the end of a fixed term of a year or more, it is." : ""}`.trim()
            : r.capped
              ? `Limited to the ceiling of ${inr(GRATUITY_CEILING)}. Paid within 30 days of falling due.`
              : months > 6
                ? `The ${months} months count as a full year, being more than six. Paid within 30 days of falling due.`
                : "A part year counts as a full year only when it is more than six months. Paid within 30 days of falling due."
        }
      />
    </div>
  );
}
