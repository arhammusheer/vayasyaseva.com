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
  intro: "Where the figures on our minimum wage pages and labour law guides come from, how we work them out and check them, and how to tell us when one is wrong.",
  items: [
    {
      title: "Sources",
      text: [
        "We work only from primary sources: the Gazette of India, state gazettes, and the orders and notifications of the Ministry of Labour and Employment and state labour departments. We don't take figures or legal statements from summary sites or news reports.",
        "A rate counts as current once the state has notified it and it is in force. Each page lists the documents it uses under “Documents used”, linked where the government publishes a copy. Where it doesn't, we read a copy of the gazette notice and cite it by number and date.",
      ],
    },
    {
      title: "How the figures are worked out",
      text: [
        "Every figure is entered by hand from the document. Where a notification fixes only a monthly rate, the daily rate is the monthly rate divided by 26, rounded up to the paisa, and the hourly rate is at least one sixth of the daily rate. Delhi's orders print their own daily rates.",
        "Most rates are a basic wage plus a variable dearness allowance (VDA) that follows the All-India Consumer Price Index. The notifications reset it every April and October from an earlier six-month average: Uttarakhand's April 2026 VDA comes from the July to December 2025 average. The breakdown under each table shows the two parts.",
        "Delhi publishes the rate in force and the DA added at each revision, so its breakdown shows the 22 October 2019 base and the DA added since. Uttarakhand's April 2026 order for engineering units with 50 or more workers merges the DA into one monthly figure, with no separate DA and no daily rate.",
      ],
    },
    {
      title: "Checks",
      text: [
        "We re-check each state's labour department around every revision date (1 April and 1 October), and when we hear of a new order. The date under each page heading is when the figures were last entered from, or compared with, their documents. Once a named person signs a page off, that line names them.",
        "If a revision is due and the state has not notified it, the page says so once, near the top, and keeps the latest published rates. If our last check is more than 14 days past a revision date, the page drops the year from its title and says the rates may have been revised.",
      ],
    },
    {
      title: "Corrections",
      text: ["Send us the page and the document that shows the error. We aim to correct a confirmed error quickly, and the page shows the date of the change."],
    },
  ] satisfies EditorialItem[],
  /** Shown only while a guide is published (no guide is yet). */
  guides: {
    title: "Guides",
    text: ["Labour law guides are published only after a labour-law practitioner has reviewed them. Each guide names its reviewer and the review date, and is reviewed again when the rules change and at least every six months."],
  } satisfies EditorialItem,
  /** The page's one action, in its foot. */
  correction: "Report a correction",
  /** One line; the link is Terms 2.2. */
  notAdvice: { before: "These pages explain the law in general terms. They are not legal advice; see", link: "Terms 2.2", after: "." },
};
