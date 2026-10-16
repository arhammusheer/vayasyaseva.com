import type { FaqItem } from "../types";
import type { LocationCluster } from "@/content/registry/identifiers";

/**
 * One location page, built on the /haridwar-sidcul structure (owner
 * direction, 17 Oct 2026): a hero with Request a crew, the client strip, one
 * paragraph on the place with its areas linked inline and the crews we
 * supply, four questions, the crew band. English only. Every fact in the
 * paragraph and answers is backed by `sources` (kept for checking, not shown).
 * No tenant names, registrations, headcount or shift claims
 * (docs/claims-register.md).
 */
export type LocationCopy = {
  cluster: LocationCluster;
  /** The estate slug; absent on a region hub. */
  estate?: string;
  /** Short name for breadcrumbs, the section label and links ("Peenya", "Delhi NCR"). */
  name: string;
  /** The #location= id the Request a crew link prefills (src/lib/crew-request.ts KNOWN_PLACES). */
  placeId: string;
  /** Up to 55 characters before " | Vayasya Seva". */
  metaTitle: string;
  /** 140 to 160 characters. */
  description: string;
  /** The H1, one line, ending with a period. */
  heading: string;
  /** One sentence under the H1. */
  lede: string;
  /**
   * One paragraph on the place: what it is, who runs it, what is made there.
   * On a hub, `{areas}` marks where the linked area names go.
   */
  paragraph: string;
  /** Hubs: the areas named inline at `{areas}`, each a link. */
  areas?: { href: string; name: string }[];
  /** Exactly four, as on /haridwar-sidcul; one covers wages and the state's rules. */
  faqs: [FaqItem, FaqItem, FaqItem, FaqItem];
  /** Where each fact comes from. Not rendered. */
  sources: { label: string; url: string }[];
};
