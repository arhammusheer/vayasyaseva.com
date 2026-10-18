import { haryanaLwf } from "@/content/contributions";

/**
 * Each reference page's signature figure: how that scheme works, drawn to
 * scale. Server-rendered and complete at rest; the numbers come from
 * src/content/contributions.ts or the cited documents.
 */

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

/** EPF: 25% of PF wages, split by who pays and where it goes. Widths are the percentages. */
export function EpfSplit() {
  const parts = [
    { key: "worker", pct: 12, label: "12%", who: "Worker", where: "to the worker's EPF account" },
    { key: "epf", pct: 3.67, label: "3.67%", who: "Employer", where: "to the worker's EPF account" },
    { key: "eps", pct: 8.33, label: "8.33%", who: "Employer", where: "to the pension fund (EPS)" },
    { key: "edli", pct: 0.5, label: "0.5%", who: "Employer", where: "EDLI insurance" },
    { key: "admin", pct: 0.5, label: "0.5%", who: "Employer", where: "admin charges" },
  ];
  return (
    <figure className="ref-figure">
      <div className="epf-split" role="img" aria-label="Of 25% of PF wages: the worker pays 12% to EPF; the employer pays 3.67% to EPF, 8.33% to the pension fund, 0.5% for EDLI and 0.5% admin charges.">
        {parts.map((p) => (
          <span key={p.key} className={`is-${p.key}`} style={{ flexGrow: p.pct, flexBasis: 0 }}>
            {p.pct >= 3 ? p.label : ""}
          </span>
        ))}
      </div>
      <div className="epf-brace" aria-hidden="true" style={{ gridTemplateColumns: "12fr 13fr" }}>
        <div>Worker: 12%</div>
        <div style={{ marginLeft: 4 }}>Employer: 13%</div>
      </div>
      <div className="epf-legend">
        {parts.map((p) => (
          <div key={p.key} className={`is-${p.key}`}>
            <i aria-hidden="true" />
            <strong>{p.label}</strong>
            <span>
              {p.who}, {p.where}
            </span>
          </div>
        ))}
      </div>
      <figcaption>Of PF wages up to ₹25,000 a month. A worker outside the pension scheme has the employer&apos;s whole 12% in EPF.</figcaption>
    </figure>
  );
}

const PERIOD_MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

/** ESIC: a worker raised above ₹21,000 in July stays covered to 30 September, then leaves. */
export function EsicPeriods() {
  const state = (i: number) => (i < 3 ? "is-on" : i < 6 ? "is-gold" : "");
  const wage = (i: number) => (i < 3 ? "₹19,500" : "₹22,000");
  return (
    <figure className="ref-figure">
      <div className="ref-months" role="img" aria-label="A worker on ₹19,500 from April to June is covered. Raised to ₹22,000 in July, they stay covered until 30 September, the end of the contribution period, and are not covered from October.">
        {PERIOD_MONTHS.map((m, i) => (
          <div key={m}>
            {/* Labelled where the wage changes (April, July); twelve labels collide on a phone. */}
            <span className="val">{i === 0 || i === 3 ? wage(i) : "\u00a0"}</span>
            <div className={`bar ${state(i)}`} style={{ height: 72 }} />
            <span className="mon">{m}</span>
          </div>
        ))}
      </div>
      <div className="ref-periods">
        <div>
          <strong>1 April to 30 September</strong>
          <span>Covered for the whole period: wages were within ₹21,000 when it began.</span>
        </div>
        <div>
          <strong>1 October to 31 March</strong>
          <span>Not covered: wages were above ₹21,000 when it began.</span>
        </div>
      </div>
      <div className="ref-legend">
        <span><i style={{ background: "var(--neutral-800)" }} />Within the limit, covered</span>
        <span><i style={{ background: "var(--gold-500)" }} />Above it, still covered to the period&apos;s end</span>
        <span><i style={{ background: "var(--neutral-300)" }} />Not covered</span>
      </div>
      <figcaption>One worker&apos;s year. Coverage is decided at the start of each contribution period, so a raise does not end it mid-period.</figcaption>
    </figure>
  );
}

const FY_MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

/** Karnataka PT: ₹200 a month and ₹300 in February, ₹2,500 a year, the Constitution's limit. */
export function KarnatakaPtYear() {
  return (
    <figure className="ref-figure">
      <div className="ref-months" style={{ alignItems: "end" }} role="img" aria-label="₹200 in each month from April to January and in March, ₹300 in February: ₹2,500 in the year.">
        {FY_MONTHS.map((m) => {
          const feb = m === "Feb";
          return (
            <div key={m}>
              <span className="val">{feb ? "₹300" : "₹200"}</span>
              <div className={`bar ${feb ? "is-gold" : "is-on"}`} style={{ height: feb ? 96 : 64 }} />
              <span className="mon">{m}</span>
            </div>
          );
        })}
      </div>
      <div className="ref-split-amount">
        <div>
          <strong>11 × ₹200</strong>
          <span>April to January, and March</span>
        </div>
        <span className="op" aria-hidden="true">+</span>
        <div>
          <strong>₹300</strong>
          <span>February</span>
        </div>
        <span className="op" aria-hidden="true">=</span>
        <div className="is-gold">
          <strong>₹2,500</strong>
          <span>the most Article 276(2) allows a year</span>
        </div>
      </div>
      <figcaption>For a worker earning ₹25,000 or more every month of the financial year. In a month below ₹25,000, nothing is due.</figcaption>
    </figure>
  );
}

/** Haryana LWF: the worker's 0.2% rises to the ₹35 cap at ₹17,500; the employer pays twice. */
export function HaryanaCurve({ minimumWage }: { minimumWage: number }) {
  const W = 720, H = 300, L = 48, R = 24, T = 16, B = 40;
  const maxWage = 30000, maxY = 80;
  const x = (w: number) => L + (w / maxWage) * (W - L - R);
  const y = (v: number) => T + (1 - v / maxY) * (H - T - B);
  const cap = 17500;
  const at = haryanaLwf(minimumWage);
  const worker = `M${x(0)},${y(0)} L${x(cap)},${y(35)} L${x(maxWage)},${y(35)}`;
  const employer = `M${x(0)},${y(0)} L${x(cap)},${y(70)} L${x(maxWage)},${y(70)}`;
  return (
    <figure className="ref-figure ref-curve">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Each month the worker pays 0.2% of wages, rising to the ₹35 cap at ₹17,500; the employer pays twice, up to ₹70. On the minimum wage of ${inr(minimumWage)} the worker pays ${inr(at.worker)}.`}>
        <g className="grid">
          {[0, 20, 40, 60, 80].map((v) => (
            <line key={v} x1={L} x2={W - R} y1={y(v)} y2={y(v)} />
          ))}
        </g>
        {[0, 20, 40, 60, 80].map((v) => (
          <text key={v} x={L - 10} y={y(v) + 4} textAnchor="end">₹{v}</text>
        ))}
        {[0, 10000, 17500, 20000, 30000].map((w) => (
          <text key={w} x={x(w)} y={H - 14} textAnchor="middle" className={w === cap ? "label-strong" : undefined}>
            {w === 0 ? "₹0" : `₹${w.toLocaleString("en-IN")}`}
          </text>
        ))}
        <line className="axis-line" x1={L} x2={W - R} y1={y(0)} y2={y(0)} />
        <line className="cap-line" x1={x(cap)} x2={x(cap)} y1={y(80)} y2={y(0)} />
        <path className="curve-employer" d={employer} />
        <path className="curve" d={worker} />
        <text x={x(maxWage) - 4} y={y(70) - 10} textAnchor="end" className="label-strong">Employer, up to ₹70</text>
        <text x={x(maxWage) - 4} y={y(35) - 10} textAnchor="end" className="label-strong">Worker, up to ₹35</text>
        <circle className="mark" cx={x(minimumWage)} cy={y(at.worker)} r={6} />
        <text x={x(minimumWage) + 12} y={y(at.worker) + 24} textAnchor="start">
          Minimum wage {inr(minimumWage)}: {inr(at.worker)}
        </text>
      </svg>
      <figcaption>Each month, by monthly wage. Above ₹17,500 the shares stop rising. The cap is indexed to the consumer price index every 1 January: ₹34 in 2025, ₹35 from 2026.</figcaption>
    </figure>
  );
}

/** Delhi LWF: the two half-years, when workers are counted and when the money is due. */
export function DelhiHalves() {
  const halves = [
    { name: "January to June", count: "30 June", pay: "before 15 July" },
    { name: "July to December", count: "31 December", pay: "before 15 January" },
  ];
  return (
    <figure className="ref-figure">
      <div className="ref-halves">
        {halves.map((h) => (
          <div key={h.name}>
            <h3>{h.name}</h3>
            <ol>
              <li>
                <b>{h.count}</b>
                <span>Count every worker on the register</span>
              </li>
              <li>
                <b>{h.pay.replace("before ", "By ")}</b>
                <span>Deposit both shares, {h.pay}</span>
              </li>
            </ol>
          </div>
        ))}
      </div>
      <div className="ref-split-amount is-wide">
        <div>
          <strong>₹0.75</strong>
          <span>from each worker</span>
        </div>
        <span className="op" aria-hidden="true">+</span>
        <div className="is-gold">
          <strong>₹2.25</strong>
          <span>from you, the employer</span>
        </div>
        <span className="op" aria-hidden="true">+</span>
        <div>
          <strong>₹1.50</strong>
          <span>from the Government of Delhi</span>
        </div>
      </div>
      <figcaption>Fixed amounts for each worker, each half-year, whatever the wage. You deposit the first two; the government pays its own.</figcaption>
    </figure>
  );
}
