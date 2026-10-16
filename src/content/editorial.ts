import { WAGE_METHOD_PATH } from "@/content/registry/identifiers";

/**
 * Editorial policy (PLAN §10.4), on /minimum-wages/how-we-check (it moved
 * there from /about) and linked from every wage page and guide. It
 * describes what we do today: keep it true. The corrections line is
 * directional ("aim to", docs/claim-policy.md) and names no time until the
 * owner signs one off.
 */
export const EDITORIAL_HREF = WAGE_METHOD_PATH;

export const editorialPolicy = {
  intro: "Our minimum wage pages and labour law guides are written by the Vayasya Seva team. They explain the rules in plain words for plant teams and for workers.",
  items: [
    {
      title: "Sources",
      text: "We work from primary sources: the Gazette of India, state gazettes, and the orders and notifications of the Ministry of Labour and Employment and state labour departments. We don't take figures or legal statements from summary sites. Each page lists the documents it uses, and links to them where the government publishes a copy. Where a state doesn't publish its gazette online, we read a copy of the gazette notice itself, and cite it by number and date without a link.",
    },
    {
      title: "Who checks",
      text: "Each page shows when it was last checked against its sources, and who checked it once a named person has signed it off. Labour law guides are published only after a labour-law practitioner has reviewed them. The page names the reviewer, their role and the review date.",
    },
    {
      title: "Keeping pages current",
      text: "We re-check each state's wage notifications around its revision dates and when a new notification appears. If a revision is overdue, the page says so. Guides are reviewed again when the rules change, and at least every six months.",
    },
    {
      title: "Corrections",
      text: "If you spot an error, email us with the page and the document that shows it. We aim to correct a confirmed error quickly, and the page shows the date of the change.",
      /** Renders "email us" as a mailto link to siteConfig.email. */
      mailto: "email us",
    },
  ],
};
