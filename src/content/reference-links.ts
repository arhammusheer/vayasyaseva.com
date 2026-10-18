import { linkable } from "@/content/registry";
import { LWF_PATH, LWF_STATE_SLUGS, lwfStatePath, type LwfStateSlug, type WageStateSlug } from "@/content/registry/identifiers";
import type { ReferenceTopic } from "@/content/statutory";

/**
 * Where each reference topic is explained in full, for a given state where
 * the topic has state pages (owner direction, 18 Oct 2026: the reference
 * pages name EPF, ESIC, PT and LWF in each other's tables, and each name
 * should take the reader to its page). The most specific published page
 * wins: a state's own page, else the hub with the state's section. Returns
 * undefined while the page is not published, so a name stays plain text.
 */
export function referenceHref(topic: ReferenceTopic, state?: WageStateSlug): string | undefined {
  const first = (...paths: string[]) => paths.find((p) => linkable(p.split("#")[0], "en-IN"));
  switch (topic) {
    case "epf":
      return first("/epf");
    case "esic":
      return first("/esic");
    case "bonus":
      return first("/bonus");
    case "gratuity":
      return first("/gratuity");
    case "pt":
      return state === "karnataka" ? first("/professional-tax/karnataka", "/professional-tax") : first("/professional-tax");
    case "lwf": {
      const own = state && (LWF_STATE_SLUGS as readonly string[]).includes(state) ? lwfStatePath(state as LwfStateSlug) : undefined;
      return first(...(own ? [own] : []), state ? `${LWF_PATH}#${state}` : LWF_PATH);
    }
  }
}

/** The words a title uses for each topic, longest first so "ESIC" is not read inside another name. */
const TOPIC_WORDS: [string, ReferenceTopic][] = [
  ["Labour Welfare Fund", "lwf"],
  ["Professional Tax", "pt"],
  ["ESIC", "esic"],
  ["EPF", "epf"],
];

/**
 * A title split into plain text and topic names with their pages, so
 * "EPF and ESIC" can link each name: [{ text: "EPF", href: "/epf" },
 * { text: " and " }, { text: "ESIC", href: "/esic" }]. Names without a
 * published page stay plain.
 */
export function topicParts(title: string, state?: WageStateSlug): { text: string; href?: string }[] {
  const pattern = new RegExp(`(${TOPIC_WORDS.map(([w]) => w).join("|")})`, "g");
  return title
    .split(pattern)
    .filter(Boolean)
    .map((text) => {
      const topic = TOPIC_WORDS.find(([w]) => w === text)?.[1];
      const href = topic ? referenceHref(topic, state) : undefined;
      return href ? { text, href } : { text };
    });
}
