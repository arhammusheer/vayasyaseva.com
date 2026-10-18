/**
 * The CSS that applies a visitor context before paint (docs/visitor-context.md):
 * rules keyed on the <html data-ctx-*> attributes (attrs.ts). Every surface
 * renders all of its candidates in the server HTML; these rules hide the
 * ones the context doesn't pick and order lists, so nothing re-renders or
 * moves when the decision lands. Without the attributes (no script, a
 * crawler, the first paint of a blocked boot) each surface shows its
 * neutral version.
 *
 * Rules only ever hide (display: none) or set `order`, never set a display
 * value, so each element keeps its own styles when shown; the one exception
 * marks the "Jobs in" row's current market (weight and underline).
 *
 * Surfaces (class on the container, `data-m` on each candidate):
 *   .ctx-slot     header business area: [data-m=""] "Locations"; [data-slot=1|2][data-m] buyer pages
 *   .ctx-door     header jobs door: [data-door=none] /jobs; [data-door=one][data-m] the hub;
 *                 [data-door=l1|l2][data-m] labelled doors
 *   .ctx-apply    header Apply: [data-m=""] /jobs/apply; [data-m] a hub
 *   .ctx-j        list ordered by the jobs side, then nearby; .ctx-b by the business side
 *   .ctx-jrow     "Jobs in" row: the jobs side and nearby when decided, every market when not
 *   .ctx-lang-bar.lang-k<N> / .ctx-lang-more   header language switch (N = bar size), More inside the bar;
 *                 links carry data-l (code) and data-fixed (q = bar, m = More) for the neutral split
 *   .ctx-aud-jobs / .ctx-aud-default   a mixed page's actions for a job seeker / everyone else
 */

const LANG_CODES = ["en", "hi", "hl", "pa", "kn"] as const;

export function contextCss(markets: readonly string[]): string {
  const r: string[] = [];
  const q = (v: string) => JSON.stringify(v);
  const not = (attr: string, values: readonly string[]) => values.map((v) => `:not([${attr}=${q(v)}])`).join("");

  // Header business area slot.
  r.push(`html[data-ctx-b1] .ctx-slot>[data-m=""]{display:none}`);
  for (const m of markets) {
    r.push(`html:not([data-ctx-b1=${q(m)}]) .ctx-slot>[data-slot="1"][data-m=${q(m)}]{display:none}`);
    r.push(`html:not([data-ctx-b2=${q(m)}]) .ctx-slot>[data-slot="2"][data-m=${q(m)}]{display:none}`);
  }

  // Header jobs door.
  r.push(`html[data-ctx-jd]:not([data-ctx-jd="none"]) .ctx-door>[data-door="none"]{display:none}`);
  r.push(`html:not([data-ctx-jd="one"]) .ctx-door>[data-door="one"]{display:none}`);
  r.push(`html:not([data-ctx-jd="labelled"]) .ctx-door>[data-door="l1"],html:not([data-ctx-jd="labelled"]) .ctx-door>[data-door="l2"]{display:none}`);
  for (const m of markets) {
    r.push(`html:not([data-ctx-j1=${q(m)}]) .ctx-door>[data-door="one"][data-m=${q(m)}],html:not([data-ctx-j1=${q(m)}]) .ctx-door>[data-door="l1"][data-m=${q(m)}]{display:none}`);
    r.push(`html:not([data-ctx-j2=${q(m)}]) .ctx-door>[data-door="l2"][data-m=${q(m)}]{display:none}`);
  }

  // Header Apply.
  r.push(`html[data-ctx-apply] .ctx-apply>[data-m=""]{display:none}`);
  for (const m of markets) r.push(`html:not([data-ctx-apply=${q(m)}]) .ctx-apply>[data-m=${q(m)}]{display:none}`);

  // Ordered lists: decided first, then nearby, then the rest in MARKET_ORDER (DOM order).
  r.push(`.ctx-j>[data-m],.ctx-b>[data-m],.ctx-jrow>[data-m]{order:10}`);
  for (const m of markets) {
    [1, 2, 3].forEach((n) => r.push(`html[data-ctx-n${n}=${q(m)}] .ctx-j>[data-m=${q(m)}],html[data-ctx-n${n}=${q(m)}] .ctx-jrow>[data-m=${q(m)}]{order:${2 + n}}`));
    [1, 2].forEach((n) => r.push(`html[data-ctx-j${n}=${q(m)}] .ctx-j>[data-m=${q(m)}],html[data-ctx-j${n}=${q(m)}] .ctx-jrow>[data-m=${q(m)}]{order:${n}}`));
    [1, 2].forEach((n) => r.push(`html[data-ctx-b${n}=${q(m)}] .ctx-b>[data-m=${q(m)}]{order:${n}}`));
  }

  // "Jobs in" row: once something is decided (or nearby is known), only those markets; "More places" lists every one.
  for (const m of markets) {
    const shown = ["data-ctx-j1", "data-ctx-j2", "data-ctx-n1", "data-ctx-n2", "data-ctx-n3"];
    r.push(`html[data-ctx-j1]${shown.map((a) => `:not([${a}=${q(m)}])`).join("")} .ctx-jrow>[data-m=${q(m)}],html[data-ctx-n1]${shown.map((a) => `:not([${a}=${q(m)}])`).join("")} .ctx-jrow>[data-m=${q(m)}]{display:none}`);
  }

  // The "Jobs in" row marks the market the context is sure of (stated or confident).
  for (const m of markets) {
    r.push(`html[data-ctx-band="stated"][data-ctx-j1=${q(m)}] .ctx-jrow>[data-m=${q(m)}],html[data-ctx-band="confident"][data-ctx-j1=${q(m)}] .ctx-jrow>[data-m=${q(m)}]{font-weight:600;text-decoration-color:var(--gold-700)}`);
  }

  // Header language switch: the neutral split without a context; with one,
  // the first N of the visitor's order in the bar and the rest under More.
  r.push(`html:not([data-ctx]) .ctx-lang-bar>[data-fixed="m"],html:not([data-ctx]) .ctx-lang-more [data-fixed="q"]{display:none}`);
  r.push(`.ctx-lang-bar>.header-lang-more{order:9}`);
  for (const k of [1, 2, 3]) {
    for (const c of LANG_CODES) {
      const ranks = Array.from({ length: k }, (_, i) => String(i));
      r.push(`html[data-ctx]${not(`data-ctx-lr-${c}`, ranks)} .lang-k${k}.ctx-lang-bar>[data-l=${q(c)}]{display:none}`);
      r.push(ranks.map((n) => `html[data-ctx][data-ctx-lr-${c}=${q(n)}] .lang-k${k} .ctx-lang-more [data-l=${q(c)}]`).join(",") + `{display:none}`);
    }
  }
  for (const c of LANG_CODES) for (const n of [0, 1, 2, 3, 4]) r.push(`html[data-ctx-lr-${c}="${n}"] .ctx-lang-bar>[data-l=${q(c)}],html[data-ctx-lr-${c}="${n}"] .ctx-lang-more [data-l=${q(c)}]{order:${n}}`);

  // Mixed pages (location pages): the jobs-first actions for a visitor read as a job seeker.
  r.push(`html:not([data-ctx-aud="jobs"]) .ctx-aud-jobs,html[data-ctx-aud="jobs"] .ctx-aud-default{display:none}`);
  return r.join("\n");
}
