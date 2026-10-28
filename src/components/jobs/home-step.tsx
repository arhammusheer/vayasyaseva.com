"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { HomeGuess } from "@/context/home-guess";
import type { Locale } from "@/lib/i18n";
import { areaForPlace, isOutside, placeChoice, placeOfChoice, rankHomeChoices, type HomeSignals } from "@/markets/home";
import { homeStateOf, isStateId, nearestPlaces, searchPlaces, type HomeId } from "@/markets/india";
import { placeName, placeNames } from "@/markets/place-names";
import type { QuickApplyCopy } from "@/content/pages/quick-apply";
import { Pills } from "@/components/jobs/quick-pills";

/** What a pick on the step gives the form: the answer it files under, the place, and how it was found (analytics). */
export type HomePick = {
  area: string;
  home?: HomeId;
  /** page, market, ip, state, language (a listed choice), search, device, skip, or saved. */
  pick: string;
  /** Its place in the list it was picked from; -1 for "My place isn't listed". */
  position: number;
  /** How many listed choices were guesses. */
  guesses: number;
};

/**
 * The location guess, asked once per page load and kept in memory only: the
 * nearest towns are never written to storage (no city is kept: owner
 * decision, 18 Oct 2026).
 */
let asked: Promise<HomeGuess | null> | null = null;
const askGuess = () =>
  (asked ??= fetch("/api/context/near", { cache: "no-store" })
    .then((res) => (res.ok ? (res.json() as Promise<HomeGuess>) : null))
    .catch(() => {
      asked = null;
      return null;
    }));

/**
 * "Where do you live?": the form's own answers ranked with guesses from
 * where the visitor seems to be (src/markets/home.ts), then "Somewhere else",
 * which searches every state, city and industrial cluster, or uses the
 * phone's location when tapped (matched here, never sent). `guessing` is off
 * for the holdout and until the visitor context has loaded.
 */
export function HomeStep({
  locale,
  intent,
  source,
  market,
  first,
  guessing,
  area,
  home,
  labels,
  copy,
  labelledBy,
  disabled,
  onPick,
}: {
  locale: Locale;
  intent: readonly string[];
  source: HomeSignals["source"];
  market: string | null;
  first: readonly string[];
  guessing: boolean;
  area: string | undefined;
  home: HomeId | undefined;
  labels: Record<string, string>;
  copy: QuickApplyCopy["home"];
  labelledBy: string;
  disabled: boolean;
  onPick: (pick: HomePick) => void;
}) {
  const [guess, setGuess] = useState<HomeGuess | null>(null);
  const [languages, setLanguages] = useState<readonly string[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [device, setDevice] = useState<HomeId[] | null>(null);
  const [status, setStatus] = useState<"locating" | "denied" | null>(null);
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!guessing) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLanguages([...navigator.languages]);
    let live = true;
    void askGuess().then((g) => live && g && setGuess(g));
    return () => {
      live = false;
    };
  }, [guessing]);

  useEffect(() => {
    if (open) search.current?.focus();
  }, [open]);

  const names = useMemo(() => placeNames(locale), [locale]);
  const choices = useMemo(
    () => rankHomeChoices({ intent, source, market, first, ...(guessing && guess ? { near: guess.near, confident: guess.confident, state: guess.state } : {}), languages: guessing ? languages : [] }),
    [intent, source, market, first, guessing, guess, languages],
  );
  const guesses = choices.filter((c) => c.why === "ip" || c.why === "state" || c.why === "language").length;
  // The answer already given stays on the list (a search pick, a restored draft).
  const values = useMemo(() => {
    const list = choices.map((c) => c.value);
    const given = home ? placeChoice(home) : area;
    return given && !list.includes(given) ? [...list, given] : list;
  }, [choices, home, area]);

  const listedStates = new Set(values.flatMap((v) => {
    const id = placeOfChoice(v);
    return id && !isStateId(id) ? [homeStateOf(id)] : [];
  }));
  const label = (id: HomeId) => (isStateId(id) && listedStates.has(id) ? copy.elsewhereIn(placeName(id, names)) : placeName(id, names));
  const allLabels = { ...labels, ...Object.fromEntries(values.flatMap((v) => (placeOfChoice(v) ? [[v, label(placeOfChoice(v)!)]] : []))) };

  const results = query.trim() ? searchPlaces(query, names) : (device ?? []);
  // Search results name the state too: there is more than one Bilaspur.
  const resultLabels = Object.fromEntries(
    results.map((id) => [placeChoice(id), isStateId(id) ? placeName(id, names) : `${placeName(id, names)}, ${placeName(homeStateOf(id)!, names)}`]),
  );

  const selected = (v: string) => {
    const id = placeOfChoice(v);
    return id ? home === id : !home && area === v;
  };

  function pick(value: string, how: string, position: number) {
    const id = placeOfChoice(value);
    onPick({ area: id ? areaForPlace(id, intent) : value, home: id, pick: how, position, guesses });
    setOpen(false);
    setQuery("");
  }

  function locate() {
    if (!("geolocation" in navigator)) return setStatus("denied");
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const near = nearestPlaces(coords.latitude, coords.longitude, { limit: 4, withinKm: 150 }).map((p) => p.id);
        const state = near[0] && homeStateOf(near[0]);
        setDevice(near.length ? [...near, ...(state && !near.includes(state) ? [state] : [])] : []);
        setQuery("");
        setStatus(near.length ? null : "denied");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
    );
  }

  return (
    <>
      <Pills
        labelledBy={labelledBy}
        options={values}
        labels={allLabels}
        disabled={disabled}
        selected={selected}
        onPick={(v) => pick(v, choices.find((c) => c.value === v)?.why ?? "saved", values.indexOf(v))}
      />
      <div className="quick-pills is-more">
        <button type="button" className="quick-pill quick-more" disabled={disabled} aria-expanded={open} aria-controls="quick-home-search" onClick={() => setOpen((o) => !o)}>
          {copy.more}
        </button>
      </div>
      {open && (
        <div id="quick-home-search" className="quick-search">
          <label htmlFor="quick-home-input" id="quick-home-label" className="quick-label">{copy.search}</label>
          <Input
            ref={search}
            id="quick-home-input"
            type="search"
            autoComplete="off"
            enterKeyHint="search"
            placeholder={copy.placeholder}
            value={query}
            disabled={disabled}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
              e.preventDefault();
              if (results[0]) pick(placeChoice(results[0]), "search", 0);
            }}
            className="mt-2 h-12 max-w-sm rounded-lg border-neutral-300 bg-background px-4 text-base shadow-none placeholder:text-neutral-400 focus-visible:border-gold-500 focus-visible:ring-gold-500/25 md:text-base"
          />
          <button type="button" className="quick-locate" disabled={disabled || status === "locating"} onClick={locate}>
            <LocateFixed size={16} aria-hidden="true" />
            {copy.near}
          </button>
          <p className="quick-hint" aria-live="polite">
            {status === "locating" ? copy.locating : status === "denied" ? copy.denied : query.trim() && !results.length ? copy.none : ""}
          </p>
          {results.length > 0 && (
            <Pills
              small
              labelledBy="quick-home-label"
              options={results.map(placeChoice)}
              labels={resultLabels}
              disabled={disabled}
              selected={selected}
              onPick={(v) => pick(v, query.trim() ? "search" : "device", results.indexOf(placeOfChoice(v)!))}
            />
          )}
          <button type="button" className="quick-skip" disabled={disabled} onClick={() => pick(intent.find(isOutside) ?? "market:other", "skip", -1)}>
            {copy.skip}
          </button>
        </div>
      )}
    </>
  );
}
