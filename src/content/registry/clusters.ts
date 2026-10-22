/**
 * Clusters with public pages. This is a public repo: an entry holds only
 * what may be published. A cluster that has not passed the readiness check is
 * simply absent, with no placeholder. Who delivers the work, routing, tier
 * reasoning and keyword evidence never go here (content:check enforces part
 * of this).
 *
 * Market knowledge that is not page content (names and link labels, places,
 * regions, the words places and ad tags share, the language picker and header switch order) lives in
 * src/markets.
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
    states: ["uttarakhand"],
    buyerHub: "/locations/haridwar",
    // None signed off yet; the page copy carries no claim block.
    claims: [],
    // Waiting for the state registration list (PLAN §12, decision 3).
    registrations: [],
  },
  {
    // The Uttarakhand business page (owner direction 16-17 Oct 2026: publish
    // as normal; VSPL confirmed it can supply crews here). Haridwar and
    // Dehradun are markets of their own, like Jalandhar and Kapurthala in
    // Punjab; this one carries the rest of the state (Udham Singh Nagar,
    // Kotdwar and beyond).
    id: "uttarakhand",
    publishable: true,
    states: ["uttarakhand"],
    buyerHub: "/locations/uttarakhand",
    claims: [],
    registrations: [],
  },
  {
    // Dehradun (owner direction, 18 Oct 2026): a market of its own, like
    // Haridwar and Jalandhar–Kapurthala, with a jobs hub and business pages.
    // Selaqui moved here from the Uttarakhand hub. The jobs hub is a worker
    // list: no open requirement is named until there is one. "dehradun job"
    // is ~12,100 searches a month in Dehradun (Keyword Planner, 18 Oct 2026).
    id: "dehradun",
    publishable: true,
    states: ["uttarakhand"],
    buyerHub: "/locations/dehradun",
    claims: [],
    registrations: [],
  },
  {
    // Delhi NCR business pages (owner direction 16-17 Oct 2026: publish as
    // normal; VSPL confirmed it can lawfully supply crews in Delhi, Haryana
    // and UP). No jobs hub yet.
    id: "delhi-ncr",
    publishable: true,
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
    // Since 20 Oct 2026 the jobs side is Jalandhar district only (Kapurthala
    // has its own); the buyer page still covers the whole region.
    id: "jalandhar",
    publishable: true,
    states: ["punjab"],
    buyerHub: "/locations/jalandhar",
    claims: [],
    registrations: [],
  },
  {
    // Kapurthala district, Phagwara included (owner direction, 20 Oct 2026):
    // a jobs market of its own, split from the Jalandhar region's jobs hub,
    // with the open packing work. No buyer page: the Jalandhar region's
    // covers Kapurthala's buyers (/locations/jalandhar/kapurthala).
    id: "kapurthala",
    publishable: true,
    states: ["punjab"],
    claims: [],
    registrations: [],
  },
  {
    // Punjab outside Jalandhar and Kapurthala (owner direction, 17 Oct 2026):
    // a jobs-only market, a worker list like Bengaluru's. No buyer page; the
    // Jalandhar region's carries Punjab's business side.
    id: "punjab",
    publishable: true,
    states: ["punjab"],
    claims: [],
    registrations: [],
  },
  {
    // Visakhapatnam (owner direction, 22 Oct 2026): jobs and business pages,
    // like Bengaluru, put up to be indexed before any ads run. The jobs hub
    // is a worker list: no open requirement is named until there is one.
    // The buyer hub covers the city and Anakapalli district's belts
    // (Parawada, Atchutapuram–Rambilli), which job seekers call Vizag too.
    id: "visakhapatnam",
    publishable: true,
    states: ["andhra-pradesh"],
    buyerHub: "/locations/visakhapatnam",
    claims: [],
    registrations: [],
  },
  {
    // Andhra Pradesh outside Visakhapatnam (owner direction, 22 Oct 2026): a
    // jobs-only market, a worker list like Punjab's. No buyer page; the
    // Visakhapatnam hub carries the state's business side.
    id: "andhra-pradesh",
    publishable: true,
    states: ["andhra-pradesh"],
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
