"use client";
import NextLink from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { track } from "@/lib/measurement/gateway";
import { currentContext, noteAudience, notePick } from "@/context/runtime";
import { contextMode, reportChoice } from "@/context/report";
import { CONTEXT_VERSION } from "@/context/weights";

/** One market in a list: its cluster id and its page, with the href already resolved for the page's language. */
export type MarketItem = { cluster: string; href: string; title: string; text?: string };

/**
 * Every market on equal terms (owner direction, 17 Oct 2026). The server
 * renders `items` in MARKET_ORDER, so search engines and visitors with no
 * signal see the same list; the visitor context's CSS (src/context/css.ts)
 * puts the decided market(s) first before paint, then nearby markets for
 * job seekers. A tap is an explicit pick, remembered and reported like the
 * header's area links (area_nav_click), so the lists measure which market
 * people want as well as showing it.
 */
export function MarketList({
  items,
  side,
  surface,
  className,
}: {
  items: MarketItem[];
  /** Which side of the context orders the list. */
  side: "business" | "jobs";
  /** The analytics surface name (jobs-index, locations-index). */
  surface: string;
  className?: string;
}) {
  return (
    <ul className={`${className ?? ""} ${side === "jobs" ? "ctx-j" : "ctx-b"}`}>
      {items.map((item) => (
        <li key={item.cluster} data-m={item.cluster}>
          <NextLink
            href={item.href}
            onClick={() => {
              const ctx = currentContext();
              const decided = ctx?.sides[side] ?? [];
              const band = ctx?.region.band ?? "unknown";
              // Where the visitor saw it: decided markets first, then nearby (jobs), then the rest.
              const shown = [...decided, ...(side === "jobs" ? (ctx?.region.nearby ?? []) : [])];
              const rest = items.map((i) => i.cluster).filter((id) => !shown.includes(id));
              const position = [...shown.filter((id) => items.some((i) => i.cluster === id)), ...rest].indexOf(item.cluster) + 1;
              notePick("link", item.cluster);
              noteAudience(side);
              reportChoice(item.cluster, decided, surface, band);
              track("area_nav_click", {
                cluster: item.cluster,
                surface,
                mode: ctx ? contextMode(ctx) : "default",
                band,
                decided: decided.join("+") || "none",
                is_decided: decided.includes(item.cluster) ? "yes" : "no",
                position,
                explicit: "yes",
                v: CONTEXT_VERSION,
              });
            }}
          >
            <strong>
              {item.title} <ArrowUpRight size={20} aria-hidden="true" />
            </strong>
            {item.text && <span>{item.text}</span>}
          </NextLink>
        </li>
      ))}
    </ul>
  );
}

/**
 * The Apply button where no market is the page's own (/jobs): the decided
 * market's hub, whose form has that market's areas, else /jobs/apply, whose
 * form asks which market. Every candidate is in the HTML; the visitor
 * context's CSS shows one (src/context/css.ts, .ctx-apply).
 */
export function DecidedApplyLink({
  hubs,
  fallback,
  label,
  className,
}: {
  /** Each market's jobs hub, resolved for the page's language. */
  hubs: Record<string, string>;
  fallback: string;
  label: string;
  className?: string;
}) {
  return (
    <span className="ctx-apply">
      {[["", fallback], ...Object.entries(hubs)].map(([id, href]) => (
        <NextLink key={href} href={href} className={className} data-m={id} onClick={() => noteAudience("jobs")}>
          {label} <ArrowRight size={20} aria-hidden="true" />
        </NextLink>
      ))}
    </span>
  );
}
