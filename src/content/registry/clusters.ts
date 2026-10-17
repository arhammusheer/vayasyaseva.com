/**
 * Clusters with public pages. This is a public repo: an entry holds only
 * what may be published. A cluster that has not passed the readiness check is
 * simply absent, with no placeholder. Who delivers the work, routing, tier
 * reasoning and keyword evidence never go here (content:check enforces part
 * of this).
 *
 * Market knowledge that is not page content (places, regions, ad words, the
 * language picker and header switch order) lives in src/markets.
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
  /** The business header's label for the buyer page, when it differs from the English name. */
  navLabel?: string;
  /** States the cluster's sites are in (links to wage pages once they exist). */
  states: readonly WageStateSlug[];
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
    buyerHub: "/locations/haridwar",
    // None signed off yet; the page copy carries no claim block.
    claims: [],
    // Waiting for the state registration list (PLAN §12, decision 3).
    registrations: [],
  },
  {
    // The Uttarakhand business page (owner direction 16-17 Oct 2026: publish
    // as normal; VSPL confirmed it can supply crews here). Haridwar is its
    // own market, like Jalandhar–Kapurthala in Punjab; this one carries the
    // rest of the state (Selaqui).
    id: "uttarakhand",
    publishable: true,
    name: { "en-IN": "Uttarakhand", "hi-IN": "उत्तराखंड", "hi-Latn-IN": "Uttarakhand" },
    states: ["uttarakhand"],
    buyerHub: "/locations/uttarakhand",
    claims: [],
    registrations: [],
  },
  {
    // Delhi NCR business pages (owner direction 16-17 Oct 2026: publish as
    // normal; VSPL confirmed it can lawfully supply crews in Delhi, Haryana
    // and UP). No jobs hub yet.
    id: "delhi-ncr",
    publishable: true,
    name: { "en-IN": "Delhi NCR", "hi-IN": "दिल्ली NCR", "hi-Latn-IN": "Delhi NCR" },
    states: ["delhi", "uttar-pradesh", "haryana"],
    buyerHub: "/locations/delhi-ncr",
    claims: [],
    registrations: [],
  },
  {
    // Jobs hub since 16 Oct 2026 (VSPL is the employer of record in writing,
    // a recruiter calls back). Business pages since 17 Oct 2026, on the
    // owner's confirmation that VSPL can lawfully supply crews in Karnataka.
    // No Kannada until there is a native reviewer and someone who can reply
    // in it.
    id: "bengaluru",
    publishable: true,
    name: { "en-IN": "Bengaluru", "hi-IN": "बेंगलुरु", "hi-Latn-IN": "Bengaluru" },
    states: ["karnataka"],
    buyerHub: "/locations/bengaluru",
    claims: [],
    registrations: [],
  },
  {
    // Jalandhar–Kapurthala, Punjab (owner direction, 17 Oct 2026): parity
    // with SIDCUL Haridwar, a jobs hub with open work and business pages,
    // on a live requirement in Kapurthala and the owner's confirmation that
    // VSPL is the employer of record nationally. The id stays "jalandhar"
    // (a stored value since PLAN §1a, and where the search is: "jalandhar
    // job" ~5,400 a month against "kapurthala job" ~260). No Punjabi until
    // there is a native reviewer and someone who can reply in it.
    id: "jalandhar",
    publishable: true,
    name: { "en-IN": "Jalandhar and Kapurthala", "hi-IN": "जालंधर और कपूरथला", "hi-Latn-IN": "Jalandhar aur Kapurthala" },
    navLabel: "Jalandhar–Kapurthala",
    states: ["punjab"],
    buyerHub: "/locations/jalandhar",
    claims: [],
    registrations: [],
  },
  {
    // Punjab outside Jalandhar–Kapurthala (owner direction, 17 Oct 2026):
    // a jobs-only market, a worker list like Bengaluru's. No buyer page; the
    // Jalandhar region's carries Punjab's business side.
    id: "punjab",
    publishable: true,
    name: { "en-IN": "Punjab", "hi-IN": "पंजाब", "hi-Latn-IN": "Punjab", "pa-IN": "ਪੰਜਾਬ" },
    states: ["punjab"],
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
