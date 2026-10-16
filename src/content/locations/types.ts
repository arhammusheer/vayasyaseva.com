import type { FaqItem } from "../types";
import type { LocationCluster } from "@/content/registry/identifiers";

/**
 * One location page: a region hub (/locations/<cluster>) or an industrial
 * area (/locations/<cluster>/<estate>). English only, like the other
 * business pages. Every fact cites a source in `sources`; claims follow
 * docs/claims-register.md (no tenant names, no registration claims, no
 * headcount or pay figures beyond the state minimum wage).
 */
export type LocationCopy = {
  cluster: LocationCluster;
  /** The estate slug; absent on a region hub. */
  estate?: string;
  /** Short name for breadcrumbs and links ("Peenya", "Delhi NCR"). */
  name: string;
  /** The #location= id the Request a crew link prefills (src/lib/crew-request.ts KNOWN_PLACES). */
  placeId: string;
  /** Up to 55 characters before " | Vayasya Seva". */
  metaTitle: string;
  /** 140 to 160 characters. */
  description: string;
  heading: string;
  lede: string;
  /** The facts table under the hero: a label and a value each. */
  facts: { label: string; value: string }[];
  /** One paragraph on the place itself. */
  intro: string;
  /** Hubs: the industrial areas with their own page (and any other page, e.g. /haridwar-sidcul), one line each. */
  areas?: { href: string; name: string; text: string }[];
  /** Two or three short sections: who works here, how they commute, what crews we supply here. */
  sections: { heading: string; body: string[] }[];
  /** The state rules in one line, with the wage page(s) it links when published. */
  rules: { text: string; links: { href: string; label: string }[] };
  faqs: FaqItem[];
  sources: { label: string; url: string }[];
};
