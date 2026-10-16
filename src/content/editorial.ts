import { WAGE_METHOD_PATH } from "@/content/registry/identifiers";

/**
 * Editorial policy and method (PLAN §10.4), on /minimum-wages/how-we-check:
 * the one home for sources, how the figures are worked out, checks,
 * corrections and the "not legal advice" line. The wage pages and guides
 * keep only their own document lists and link here. It describes what we
 * do today: keep it true. The corrections line is directional ("aim to",
 * docs/claim-policy.md) and names no time until the owner signs one off.
 */
export const EDITORIAL_HREF = WAGE_METHOD_PATH;

export type EditorialItem = { title: string; text: string[] };

export const editorialPolicy = {
  intro: "Where our minimum wage rates come from, when we check them, and how to report a mistake.",
  items: [
    {
      title: "Where the rates come from",
      text: [
        "Only from government notices: state gazettes and labour department orders, not news or summary sites. The EPF, ESIC, PT and LWF figures come from the same kind of documents. Each page links the ones it uses.",
      ],
    },
    {
      title: "How we work them out",
      text: [
        "We copy each rate by hand from the notice. Most rates are a basic wage plus a dearness allowance (VDA) that changes every April and October. If a notice gives only a monthly rate, the daily rate is the monthly rate divided by 26.",
      ],
    },
    {
      title: "When we check",
      text: [
        "Around 1 April and 1 October, when rates are revised, and whenever a new order comes out. Each page shows the date we last checked. If a revision is late, the page says so.",
      ],
    },
    {
      title: "Mistakes",
      text: ["Send us the page and the notice that shows the error. We fix confirmed errors and show the date of the change."],
    },
  ] satisfies EditorialItem[],
  /** Shown only while a guide is published (no guide is yet). */
  guides: {
    title: "Guides",
    text: ["A labour-law practitioner reviews each guide before it is published. The guide names them and the review date."],
  } satisfies EditorialItem,
  /** The page's one action, in its foot. */
  correction: "Report a mistake",
  /** One line; the link is Terms 2.2. */
  notAdvice: { before: "These pages explain the law in general terms and are not legal advice; see", link: "Terms 2.2", after: "." },
};
