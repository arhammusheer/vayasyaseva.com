"use client";
import { useEffect, useMemo, useState } from "react";
import { track } from "@/lib/measurement/gateway";
import { MODEL_VERSION, decideArea, type AreaDecision } from "./model";
import { currentSignals, notePageView, regionCluster } from "./store";
import { reportDecision } from "./report";
import { areaSurfaces, knownCluster, ownCluster } from "./surfaces";

const REPORTED_KEY = "vs-area-reported-v1";

/**
 * The header's area decision for the page at `path` (docs/area-intent.md).
 * The first render, on the server and before hydration, is the no-signal
 * default, so search engines and visitors without signals see the same
 * header; the decision lands after load. Each distinct decision is sent to
 * analytics once per session as `area_intent`.
 */
export function useAreaDecision(path: string): AreaDecision {
  const surfaces = useMemo(() => areaSurfaces(), []);
  const [decision, setDecision] = useState<AreaDecision>(() => decideArea({}, surfaces));
  useEffect(() => {
    let alive = true;
    const page = ownCluster(path);
    notePageView(page, new URL(window.location.href), knownCluster);
    regionCluster().then(({ country, region, cluster }) => {
      if (!alive) return;
      const d = decideArea(currentSignals(page, cluster, knownCluster), surfaces);
      setDecision(d);
      reportDecision(d);
      const key = `${d.mode}|${d.business.join("+")}|${d.jobs.join("+")}|${d.basis}`;
      try {
        const seen: string[] = JSON.parse(window.sessionStorage.getItem(REPORTED_KEY) ?? "[]");
        if (seen.includes(key)) return;
        window.sessionStorage.setItem(REPORTED_KEY, JSON.stringify([...seen, key]));
      } catch {
        // Blocked storage: report anyway.
      }
      track("area_intent", {
        mode: d.mode,
        intent: d.intent ?? "none",
        geo: d.geo ?? "none",
        // Region only for Indian visitors (country is checked); country for everyone.
        country: country ?? "none",
        region: region ?? "none",
        basis: d.basis,
        chosen: d.chosen ? "yes" : "no",
        v: MODEL_VERSION,
        business: d.business.join("+"),
        jobs: d.jobs.join("+"),
        confidence: d.confidence,
      });
    });
    return () => {
      alive = false;
    };
  }, [path, surfaces]);
  return decision;
}
