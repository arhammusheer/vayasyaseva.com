/**
 * Clusters with public pages. This is a public repo: an entry holds only
 * what may be published. A cluster that has not passed the readiness check is
 * simply absent, with no placeholder. Who delivers the work, routing, tier
 * reasoning and keyword evidence never go here (content:check enforces part
 * of this).
 */
import type { ClusterId, LocaleTag, WageStateSlug } from "./identifiers";

/**
 * docs/claim-policy.md. Sign-off lasts six months; at expiry the claim block
 * hides and the page stays. Sign-off is tracked per claim (each sentence is
 * signed off on its own), which supersedes the cluster-level signedOffOn in
 * PLAN §11; content:check warns five months after each claim's sign-off.
 */
export type PublicClaim = {
  /** The sentence exactly as published. */
  text: string;
  tier: "aspirational" | "directional" | "measured" | "contractual";
  /** ISO date of sign-off. */
  signedOffOn: string;
  /** ISO date the claim stops showing. */
  expires: string;
};

/**
 * One registration or licence VSPL holds for a cluster's sites, from the
 * compliance adviser's list, signed off by the owner (PLAN §5.2 "What we
 * hold"). Public facts only: the name and, where it is safe to publish, the
 * number. Like claims, an entry stops showing at `expires`.
 */
export type PublicRegistration = {
  /** What it is, per language; English is required. */
  name: Partial<Record<LocaleTag, string>> & { "en-IN": string };
  /** The registration or licence number, if it may be published. */
  number?: string;
  /** Who issued it, per language; English is required, e.g. "EPFO" or "Labour Department, Uttarakhand". */
  issuedBy: Partial<Record<LocaleTag, string>> & { "en-IN": string };
  /** ISO date of the owner's sign-off. */
  signedOffOn: string;
  /** ISO date the entry stops showing (six months after sign-off at most). */
  expires: string;
};

export type Cluster = {
  id: ClusterId;
  /** Passed the readiness check. A cluster that hasn't is left out instead. */
  publishable: true;
  name: Partial<Record<LocaleTag, string>>;
  /** States the cluster's sites are in (links to wage pages once they exist). */
  states: readonly WageStateSlug[];
  /**
   * The header language switch on this cluster's pages, in order (PLAN §6.4:
   * Hindi belt English · हिंदी · Hinglish; Karnataka English · ಕನ್ನಡ · Hinglish;
   * Punjab English · Hinglish · हिंदी). A page's other languages go under "More".
   */
  quickSwitch: readonly LocaleTag[];
  /**
   * The buyer page for this cluster. Absent for a jobs-only cluster: one
   * whose jobs side passed readiness (a recruiter calls back, VSPL is the
   * employer of record) but whose buyer side has not (PLAN §3.2), so it gets
   * /jobs/<cluster> and nothing that sells crews there.
   */
  buyerHub?: string;
  /** Signed-off public claims. Rendered only from here. */
  claims: readonly PublicClaim[];
  /**
   * "What we hold" on the buyer hub. Empty until the owner signs off the
   * compliance adviser's list; the block renders nothing while it is empty.
   */
  registrations: readonly PublicRegistration[];
};

export const clusters: readonly Cluster[] = [
  {
    id: "haridwar",
    publishable: true,
    name: { "en-IN": "Haridwar", "hi-IN": "हरिद्वार", "hi-Latn-IN": "Haridwar" },
    states: ["uttarakhand"],
    // Hindi belt (PLAN §6.4): English · हिंदी · Hinglish.
    quickSwitch: ["en-IN", "hi-IN", "hi-Latn-IN"],
    buyerHub: "/haridwar-sidcul",
    // None signed off yet; the page copy carries no claim block.
    claims: [],
    // Waiting for the state registration list (PLAN §12, decision 3).
    registrations: [],
  },
  {
    // Jobs only (16 Oct 2026): VSPL is the employer of record in writing and
    // a recruiter calls applicants back, so /jobs/bengaluru is open as a
    // worker list (PLAN §3.2, §5.3). No buyer hub, payroll claim or estate
    // until the Karnataka registrations are on file. No Kannada until there
    // is a native reviewer and someone who can reply in it.
    id: "bengaluru",
    publishable: true,
    name: { "en-IN": "Bengaluru", "hi-IN": "बेंगलुरु", "hi-Latn-IN": "Bengaluru" },
    states: ["karnataka"],
    // Karnataka (PLAN §6.4) is English · ಕನ್ನಡ · Hinglish; until kn-IN is
    // published it falls through to English · Hinglish · हिंदी.
    quickSwitch: ["en-IN", "hi-Latn-IN", "hi-IN"],
    claims: [],
    registrations: [],
  },
];

export function clusterById(id: string) {
  return clusters.find((c) => c.id === id);
}

/** Registrations to show today: signed off and not yet expired. */
export function liveRegistrations(cluster: Cluster, today = new Date().toISOString().slice(0, 10)) {
  return cluster.registrations.filter((r) => r.signedOffOn <= today && today < r.expires);
}
