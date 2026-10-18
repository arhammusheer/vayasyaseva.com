/**
 * The <html> attributes a visitor context sets (docs/visitor-context.md,
 * "Before paint"). The page's surfaces carry every candidate in the server
 * HTML; CSS rules keyed on these attributes (css.ts) order them and show
 * the right ones, so the page never re-renders or shifts to follow the
 * decision. Self-contained like core.ts: the boot script inlines it.
 *
 *   data-ctx            the model version (present = the context applies)
 *   data-ctx-aud        jobs | business | unknown
 *   data-ctx-band       stated | confident | leaning | unknown
 *   data-ctx-b1/-b2     business side, in order (the page's own market first)
 *   data-ctx-j1/-j2     jobs side, in order
 *   data-ctx-m1/-m2     the visitor's markets, in their order
 *   data-ctx-n1..-n3    nearby markets (job seekers outside our markets)
 *   data-ctx-jd         the header's jobs door: none | one (the hub, unlabelled) | labelled
 *   data-ctx-apply      the market whose hub Apply opens
 *   data-ctx-lr-<code>  each other language's rank in the header switch
 */
import type { VisitorContext } from "./core";

export function contextAttributes(ctx: VisitorContext, page: { locale: string; market?: string }, codes: Readonly<Record<string, string>>): Record<string, string> {
  const a: Record<string, string> = { "data-ctx": String(ctx.v), "data-ctx-aud": ctx.audience.value, "data-ctx-band": ctx.region.band };
  if (ctx.holdout) a["data-ctx-holdout"] = "1";
  const slots = (prefix: string, list: readonly string[], n: number) => list.slice(0, n).forEach((m, i) => (a[`data-ctx-${prefix}${i + 1}`] = m));
  slots("b", ctx.sides.business, 2);
  slots("j", ctx.sides.jobs, 2);
  if (!ctx.holdout || ctx.region.band === "stated") {
    slots("m", ctx.region.markets, 2);
    slots("n", ctx.region.nearby, 3);
  }
  const sure = ctx.region.band === "stated" || ctx.region.band === "confident";
  const jobs = ctx.sides.jobs;
  a["data-ctx-jd"] = !jobs.length ? "none" : jobs.length === 1 && (sure || jobs[0] === page.market) ? "one" : "labelled";
  if (jobs[0] && (jobs[0] === page.market || (sure && jobs.length === 1))) a["data-ctx-apply"] = jobs[0];
  // The header switch: the page's other languages in the visitor's order;
  // on a non-English page English stays among the first two (it is always visible).
  const others = ctx.language.order.filter((l) => l !== page.locale);
  const en = others.indexOf("en-IN");
  if (page.locale !== "en-IN" && en > 1) {
    others.splice(en, 1);
    others.splice(1, 0, "en-IN");
  }
  others.forEach((l, i) => {
    if (codes[l]) a[`data-ctx-lr-${codes[l]}`] = String(i);
  });
  return a;
}
