/**
 * A reference topic page (EPF, ESIC, Professional Tax): the answer and its
 * numbers at a glance, the rules in named groups, two or three FAQs and the
 * documents. Each page's own component composes these around its signature
 * figure and calculator (src/components/pages/topics). Every page cites
 * statutorySources by id (src/content/statutory.ts), where the wage pages'
 * employer dues cite the same documents, so one re-check covers both.
 */
export type TopicRow = { label: string; text: string };

export type TopicPage = {
  /** Neutral path, e.g. "/epf". */
  path: string;
  /** Before " | Vayasya Seva": at most 55 characters. */
  title: string;
  /** 140 to 160 characters. */
  description: string;
  breadcrumb: string;
  heading: string;
  /** The answer, under the H1: one or two short sentences. */
  lede: string;
  /** The numbers that answer the page, beside the lede. `key` marks the one to read first. */
  glance: { label: string; note?: string; value: string; key?: boolean }[];
  /** "the Gazette and EPFO's documents": completes "Updated <date> from …". */
  updatedFrom: string;
  /** The rules, in a few named groups. */
  rules: { heading: string; rows: TopicRow[] }[];
  faqs: { question: string; answer: string }[];
  /** statutorySources ids, in the order they are listed. */
  sources: string[];
  /** Internal links at the foot: other reference pages. */
  links: { href: string; label: string }[];
  /** ISO date the page was checked against its documents. */
  checked: string;
};

/** A table cell: text, or text linking to another page (a state's own page). */
export type TableCell = string | { text: string; href: string };
