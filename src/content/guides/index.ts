/**
 * Guides (PLAN §5.6, §4 rows 11–13): plain-language reference on the labour
 * law that contract labour runs under. Each guide is a document: literal
 * headings, every legal statement cited to a primary source (sources.ts),
 * and a named legal reviewer before it is published.
 *
 * Text markup, kept small on purpose:
 *   [[source-id]]  a citation. The page lists each section's sources, by
 *                  number, at the foot of the section (not after each
 *                  sentence); the marker stays so a reviewer can trace
 *                  every statement.
 * Anything else is plain text.
 *
 * A guide stays in review (src/content/registry/pages.ts, GUIDE_STATUS) until
 * `review` is filled in; content:check fails a published guide without one.
 */
import type { Audience, GuideSlug } from "@/content/registry/identifiers";
import { newLabourCodes } from "./new-labour-codes";

export type { GuideSlug };

/**
 * The legal reviewer's sign-off, shown on the page as "Reviewed by <name>,
 * <role> (<credentials>), on <date>" and in the page schema (reviewedBy,
 * lastReviewed). Left null until the owner names a reviewer (PLAN decision
 * 9). Re-review whenever the rules change and at least every six months.
 */
export type GuideReview = {
  name: string;
  /** e.g. "Advocate, labour and employment law". */
  role: string;
  /** e.g. "Enrolled with the Bar Council of Uttarakhand, 2012". */
  credentials: string;
  /** ISO date of the review. */
  on: string;
} | null;

export type GuideBlock =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  /** A ruled table. Cells take [[citations]]. On a phone each row stacks, labelled by its column. */
  | { type: "table"; caption: string; columns: [string, ...string[]]; rows: { head: string; cells: string[] }[] }
  /** Ruled rows with a short heading each: a checklist or a set of points, not bullets. */
  | { type: "rows"; items: { title: string; text: string }[] }
  | { type: "link"; href: string; label: string };

export type GuideSection = {
  id: string;
  heading: string;
  blocks: GuideBlock[];
};

export type Guide = {
  slug: GuideSlug;
  audience: Audience;
  /** Title before " | Vayasya Seva": 55 characters at most, no agency word. */
  title: string;
  /** Short name for the breadcrumb ("New labour codes"). */
  crumb: string;
  /** Meta description, 140 to 160 characters. */
  description: string;
  h1: string;
  lede: string;
  /**
   * First published (ISO): null while the guide is in review, set on the day
   * it goes live. content:check fails a published guide with no date, or one
   * earlier than its legal review.
   */
  published: string | null;
  /** Last content change (ISO). */
  updated: string;
  /** When every source and statement was last checked against the sources (ISO). */
  checkedOn: string;
  review: GuideReview;
  /** Short facts beside the heading. */
  facts: { label: string; value: string; cite?: string }[];
  sections: GuideSection[];
  faqs: { question: string; answer: string }[];
  /** Source ids in the order they are listed (and numbered) on the page. */
  sources: string[];
};

export const guides: Record<GuideSlug, Guide | undefined> = {
  "new-labour-codes": newLabourCodes,
  // Retired (never public): a 404, no content.
  "what-is-contract-labour": undefined,
  // Phase 3 (PLAN §7.5 PR13).
  "contract-labour-act": undefined,
};

export function getGuide(slug: GuideSlug): Guide {
  const guide = guides[slug];
  if (!guide) throw new Error(`No guide content for ${slug}`);
  return guide;
}

const CITE = /\[\[([a-z0-9-]+)\]\]/g;

/** Source ids cited in a piece of text, in order. */
export const citesIn = (text: string) => [...text.matchAll(CITE)].map((m) => m[1]);

/** Text without its citation markers, for meta tags and schema. */
export const plainText = (text: string) => text.replace(CITE, "").replace(/\s+([.,;:])/g, "$1").trim();

/** Every piece of citable text in some blocks, citation markers included. */
export const blockTexts = (blocks: GuideBlock[]) =>
  blocks.flatMap((b) => (b.type === "p" ? [b.text] : b.type === "table" ? b.rows.flatMap((r) => [r.head, ...r.cells]) : b.type === "rows" ? b.items.map((i) => i.text) : []));

/** Every source id a guide cites anywhere. */
export function citedSources(guide: Guide): string[] {
  const texts = [
    ...guide.facts.map((f) => (f.cite ? `[[${f.cite}]]` : "")),
    ...guide.sections.flatMap((s) => blockTexts(s.blocks)),
    ...guide.faqs.map((f) => f.answer),
  ];
  return [...new Set(texts.flatMap(citesIn))];
}
