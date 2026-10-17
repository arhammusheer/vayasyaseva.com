"use client";
import NextLink from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { track } from "@/lib/measurement/gateway";
import { noteChoice } from "@/lib/intent/store";
import { useAreaDecision } from "@/lib/intent/use-area";
import { MODEL_VERSION } from "@/lib/intent/model";
import { reportChoice } from "@/lib/intent/report";

/** One market in a list: its cluster id and its page, with the href already resolved for the page's language. */
export type MarketItem = { cluster: string; href: string; title: string; text?: string };

/**
 * Every market on equal terms (owner direction, 17 Oct 2026). The server
 * renders `items` in MARKET_ORDER, so search engines and visitors with no
 * signal see the same list; after load the area decision (src/lib/intent)
 * moves the visitor's market(s) to the front. A tap is an explicit pick,
 * remembered and reported like the header's area links (area_nav_click),
 * so the lists measure which market people want as well as showing it.
 */
export function MarketList({
  items,
  path,
  side,
  surface,
  className,
}: {
  items: MarketItem[];
  /** The page's neutral path, for the decision. */
  path: string;
  /** Which side of the decision orders the list. */
  side: "business" | "jobs";
  /** The analytics surface name (jobs-index, locations-index). */
  surface: string;
  className?: string;
}) {
  const area = useAreaDecision(path);
  const decided = area[side];
  const ordered = [
    ...decided.flatMap((id) => items.filter((i) => i.cluster === id)),
    ...items.filter((i) => !decided.includes(i.cluster)),
  ];
  return (
    <ul className={className} data-decided={decided.join(" ") || undefined}>
      {ordered.map((item, i) => (
        <li key={item.cluster} data-market={item.cluster}>
          <NextLink
            href={item.href}
            prefetch={false}
            onClick={() => {
              noteChoice(item.cluster);
              reportChoice(item.cluster, decided, surface);
              track("area_nav_click", {
                cluster: item.cluster,
                surface,
                mode: area.mode,
                decided: decided.join("+") || "none",
                is_decided: decided.includes(item.cluster) ? "yes" : "no",
                position: i + 1,
                explicit: "yes",
                v: MODEL_VERSION,
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
 * form asks which market. The server renders /jobs/apply.
 */
export function DecidedApplyLink({
  path,
  hubs,
  fallback,
  label,
  className,
}: {
  path: string;
  /** Each market's jobs hub, resolved for the page's language. */
  hubs: Record<string, string>;
  fallback: string;
  label: string;
  className?: string;
}) {
  const area = useAreaDecision(path);
  const decided = area.jobs.find((id) => hubs[id]);
  return (
    <NextLink href={decided ? hubs[decided] : fallback} prefetch={false} className={className} data-market={decided}>
      {label} <ArrowRight size={20} aria-hidden="true" />
    </NextLink>
  );
}
