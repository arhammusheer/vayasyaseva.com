"use client";

import { useId, useState } from "react";
import { EPF_CEILING, ESIC_LIMIT, KA_PT_FROM, delhiLwf, epf, esic, haryanaLwf, karnatakaPt } from "@/content/contributions";

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
