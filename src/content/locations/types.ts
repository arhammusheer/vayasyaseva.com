import type { FaqItem } from "../types";
import type { LocaleTag, LocationCluster } from "@/content/registry/identifiers";
import type { PlaceId } from "@/markets/places";
import type { JobsMarketId } from "@/markets/data";

/**
 * One location page (owner direction, 17 Oct 2026): a hero with Request a
 * crew, the client strip, one paragraph on the place with its areas linked
 * inline and the crews we supply, four questions, the crew band. Every
 * market's page has this structure. English, plus `translations` where a
 * region has them (the registry lists the languages). Every fact in the
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
  /**
   * The jobs market whose hub the page's job seekers are sent to, when it is
   * not the region's: an estate in a jobs market of its own (Kapurthala and
   * Phagwara, in the Jalandhar region's buyer page, since 20 Oct 2026).
   */
  jobsMarket?: JobsMarketId;
  /** The #location= id the Request a crew link prefills (src/markets/places.ts). */
  placeId: PlaceId;
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
  /** Hubs: the areas named inline at `{areas}`, each a link once it has a page (plain text until then). */
  areas?: { href?: string; name: string }[];
  /** Exactly four; one covers wages and the state's rules. */
  faqs: [FaqItem, FaqItem, FaqItem, FaqItem];
  /** Where each fact comes from. Not rendered. */
  sources: { label: string; url: string }[];
  /**
   * The page in other languages, same facts and order. Drafts pending native
   * review, like the other hi-IN pages; keep them in step with the English.
   */
  translations?: Partial<Record<Exclude<LocaleTag, "en-IN">, LocationText>>;
};

/** What a translation replaces. */
export type LocationText = Pick<LocationCopy, "name" | "metaTitle" | "description" | "heading" | "lede" | "paragraph" | "areas" | "faqs">;
