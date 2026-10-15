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

export type Cluster = {
  id: ClusterId;
  /** Passed the readiness check. A cluster that hasn't is left out instead. */
  publishable: true;
  name: Partial<Record<LocaleTag, string>>;
  /** States the cluster's sites are in (links to wage pages once they exist). */
  states: readonly WageStateSlug[];
  /** The header language switch on this cluster's pages, in order. */
  quickSwitch: readonly LocaleTag[];
  /** The buyer page for this cluster. */
  buyerHub: string;
  /** Signed-off public claims. Rendered only from here. */
  claims: readonly PublicClaim[];
};

export const clusters: readonly Cluster[] = [
  {
    id: "haridwar",
    publishable: true,
    name: { "en-IN": "Haridwar", "hi-IN": "हरिद्वार", "hi-Latn-IN": "Haridwar" },
    states: ["uttarakhand"],
    // Hindi belt: Hindi in both scripts, then English.
    quickSwitch: ["hi-IN", "hi-Latn-IN", "en-IN"],
    buyerHub: "/haridwar-sidcul",
    // None signed off yet; the page copy carries no claim block.
    claims: [],
  },
];

export function clusterById(id: string) {
  return clusters.find((c) => c.id === id);
}
