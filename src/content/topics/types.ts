/**
 * A reference topic page (EPF, ESIC, Professional Tax): the answer first,
 * then sections of label rows, tables and short prose, two or three FAQs
 * and the documents it rests on. Every page cites statutorySources by id
 * (src/content/statutory.ts), where the wage pages' employer dues cite the
 * same documents, so one re-check covers both.
 */
/** A table cell: text, or text linking to another page (a state's own page). */
export type TableCell = string | { text: string; href: string };

export type TopicSection =
  | { kind: "facts"; id: string; heading?: string; intro?: string; rows: { label: string; text: string }[]; note?: string }
  | { kind: "table"; id: string; heading: string; intro?: string; caption: string; columns: string[]; rows: TableCell[][]; note?: string }
  | { kind: "prose"; id: string; heading: string; paragraphs: string[] };

export type Topic = {
  /** Neutral path, e.g. "/epf". */
  path: string;
  /** Before " | Vayasya Seva": at most 55 characters. */
  title: string;
  /** 140 to 160 characters. */
  description: string;
  breadcrumb: string;
  heading: string;
  /** The answer, under the H1. */
  lede: string;
  sections: TopicSection[];
  faqs: { question: string; answer: string }[];
  /** statutorySources ids, in the order they are listed. */
  sources: string[];
  /** Internal links at the foot: other reference pages. */
  links: { href: string; label: string }[];
  /** ISO date the page was checked against its documents. */
  checked: string;
};
