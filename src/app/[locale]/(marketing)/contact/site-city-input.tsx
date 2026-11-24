"use client";

import { useId, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { track } from "@/lib/measurement/gateway";
import { STATE_OPTIONS } from "@/lib/contact-contract";
import { useVisitorContext } from "@/context/use-context";
import { suggestSites, suggestionDetail, type SitePlace, type SuggestSignals } from "@/markets/site-suggest";

/** The list, fetched once on first use (about 2,000 places; not in the page's first load). */
let placesPromise: Promise<SitePlace[]> | null = null;
const loadPlaces = () => (placesPromise ??= import("@/markets/site-places.json").then((m) => m.default as SitePlace[]));

type Props = {
  value: string;
  state: string;
  roles: readonly string[];
  headcountBand: string;
  /** The market the request came from (a location page or a link). */
  originMarket?: string | null;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
  onChange: (value: string) => void;
  /** A suggestion from another state was picked with no state chosen. */
  onPickState: (state: string) => void;
};

/**
 * "City or industrial area" with three to five suggestions (owner
 * direction, 24 Nov 2026), ranked by src/markets/site-suggest.ts. Free
 * text stays allowed; the browser's own address autofill is off, since a
 * saved address is the visitor's, not the site's. ARIA combobox: arrow
 * keys move, Enter picks, Escape closes.
 */
export function SiteCityInput({ value, state, roles, headcountBand, originMarket, invalid, describedBy, className, onChange, onPickState }: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const ctx = useVisitorContext();
  const [places, setPlaces] = useState<SitePlace[] | null>(null);
  const [open, setOpen] = useState(false);
  // The highlighted row, tied to the signals it was chosen under: any change resets it.
  const [highlight, setHighlight] = useState<{ key: string; index: number }>({ key: "", index: -1 });
  // The suggestion last picked: no list or note while the field still holds it.
  const [pickedValue, setPickedValue] = useState<string | null>(null);

  const signals: SuggestSignals = {
    query: value,
    state,
    roles,
    headcountBand,
    originMarket,
    visitorMarkets: ctx && !ctx.holdout ? ctx.region.markets : [],
    visitorState: ctx?.region.state,
  };
  const key = JSON.stringify(signals);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const items = useMemo(() => (places ? suggestSites(places, signals) : []), [places, key]);
  const shown = open && items.length > 0;
  // Typed something we have no place for: say any place is fine (owner direction, 24 Nov 2026).
  const unmatched = open && places !== null && value.trim().length >= 2 && items.length === 0 && value !== pickedValue;
  const active = highlight.key === key ? highlight.index : -1;
  const setActive = (next: (i: number) => number) => setHighlight({ key, index: next(active) });

  function pick(p: SitePlace, index: number) {
    setPickedValue(p.name);
    onChange(p.name);
    if (!state) onPickState(p.state);
    setOpen(false);
    track("site_suggestion_pick", { rank: index + 1, kind: p.kind, typed: value.trim().length > 0 ? "yes" : "no", state_chosen: state ? "yes" : "no" });
  }

  return (
    <div className="site-suggest">
      <Input
        id="siteCity"
        name="siteCity"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={shown}
        aria-controls={listId}
        aria-activedescendant={shown && active >= 0 ? `${id}-opt-${active}` : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        enterKeyHint="next"
        autoComplete="off"
        spellCheck={false}
        placeholder="Town or industrial area"
        maxLength={120}
        value={value}
        className={className}
        onFocus={() => {
          void loadPlaces().then(setPlaces);
          if (value !== pickedValue) setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && shown) {
            event.preventDefault();
            setOpen(false);
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActive((i) => (items.length ? (i + 1) % items.length : -1));
          } else if (event.key === "ArrowUp" && shown) {
            event.preventDefault();
            setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
          } else if (event.key === "Enter" && shown && active >= 0) {
            event.preventDefault();
            pick(items[active], active);
          }
        }}
      />
      <ul id={listId} role="listbox" aria-label="Suggestions" className={cn("site-suggest-list", !shown && "hidden")}>
        {shown &&
          items.map((p, i) => (
            <li
              key={p.id}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              className={cn("site-suggest-option", i === active && "is-active")}
              // mousedown, so the input's blur does not close the list first
              onMouseDown={(event) => {
                event.preventDefault();
                pick(p, i);
              }}
              onMouseEnter={() => setActive(() => i)}
            >
              <span className="site-suggest-name">{p.name}</span>
              <span className="site-suggest-detail">{suggestionDetail(p, (code) => STATE_OPTIONS[code] ?? code, !state)}</span>
            </li>
          ))}
      </ul>
      <p role="status" aria-live="polite" className={cn("site-suggest-note", !unmatched && "sr-only")}>
        {unmatched ? "Not in our list? That’s fine, type any town or area." : ""}
      </p>
    </div>
  );
}
