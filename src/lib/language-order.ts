"use client";
/**
 * The header language switch's order for this visitor (owner direction,
 * 17 Oct 2026): the same ranking as the language picker (src/lib/language-rank.ts),
 * fed in the browser with what the server picker can't see: the area
 * decision's market (src/lib/intent) besides the region, the picker cookie
 * and the browser's languages. The server renders the page's fixed order
 * (same HTML for crawlers and first paint); this reorders after load.
 * English stays visible on every non-English page.
 */
import { useEffect, useState } from "react";
import type { AreaDecision } from "@/lib/intent/model";
import { regionCluster } from "@/lib/intent/store";
import { LANGUAGE_COOKIE, pageCluster, rankLocales } from "@/lib/language-rank";
import { localesOf, type Locale } from "@/lib/i18n";
import type { ClusterId } from "@/content/registry/identifiers";

const cookie = (name: string) => {
  try {
    return document.cookie.split("; ").find((c) => c.startsWith(`${name}=`))?.split("=")[1];
  } catch {
    return undefined;
  }
};

export function useLanguageOrder(path: string, area: AreaDecision): Locale[] | null {
  const [order, setOrder] = useState<Locale[] | null>(null);
  // Intent only when the decision rests on something the visitor did or
  // how they arrived: a decision from location alone is the region below,
  // and with no signal location leads (rankLocales).
  const intent = (area.basis === "geo" || area.basis === "none" ? undefined : (area.jobs[0] ?? area.business[0])) as ClusterId | undefined;
  useEffect(() => {
    let alive = true;
    regionCluster().then(({ country, region }) => {
      if (!alive) return;
      setOrder(
        rankLocales(localesOf(path), {
          chosen: cookie(LANGUAGE_COOKIE),
          acceptLanguage: navigator.languages?.join(","),
          country,
          region,
          intent,
          cluster: pageCluster(path),
        }),
      );
    });
    return () => {
      alive = false;
    };
  }, [path, intent]);
  return order;
}

type LanguageLink = { lang: Locale; more: boolean };

/**
 * The bar's links and the "More" list: as many in the bar as the page's
 * fixed set has, in the visitor's order, with English among them whenever
 * the page isn't English. Without an order yet, the fixed split.
 */
export function splitLanguages<T extends LanguageLink>(links: readonly T[], order: readonly Locale[] | null, current: Locale) {
  const fixed = { quick: links.filter((l) => !l.more), more: links.filter((l) => l.more) };
  if (!order || !fixed.quick.length) return fixed;
  const rank = (l: T) => (order.includes(l.lang) ? order.indexOf(l.lang) : order.length);
  const sorted = [...links].sort((a, b) => rank(a) - rank(b));
  let quick = sorted.slice(0, fixed.quick.length);
  const english = links.find((l) => l.lang === "en-IN");
  if (current !== "en-IN" && english && !quick.includes(english)) quick = [...quick.slice(0, -1), english];
  return { quick: quick.map((l) => ({ ...l, more: false })), more: sorted.filter((l) => !quick.includes(l)).map((l) => ({ ...l, more: true })) };
}
