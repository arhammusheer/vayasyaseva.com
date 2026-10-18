"use client";
import NextLink from "next/link";
import { track } from "@/lib/measurement/gateway";
import { nearestLocalePath, type Locale } from "@/lib/i18n";
import { jobsHubPath, type ClusterId } from "@/content/registry/identifiers";
import { marketName } from "@/markets/labels";
import { currentContext, noteAudience, notePick } from "@/context/runtime";
import { contextMode, reportChoice } from "@/context/report";
import { JOBS_AREA_LABEL, jobMarkets } from "@/context/surfaces";
import { CONTEXT_VERSION } from "@/context/weights";

/** Drafts for native review (docs/hindi-glossary.md, docs/punjabi-glossary.md). */
const COPY: Record<Locale, { label: string; more: string; all: string }> = {
  "en-IN": { label: "Jobs in", more: "More places", all: "All jobs" },
  "hi-IN": { label: "नौकरी कहाँ:", more: "और जगहें", all: "सभी नौकरियाँ" },
  "hi-Latn-IN": { label: "Job kahan:", more: "Aur jagah", all: "Saari naukriyan" },
  "pa-IN": { label: "ਨੌਕਰੀ ਕਿੱਥੇ:", more: "ਹੋਰ ਥਾਵਾਂ", all: "ਸਾਰੀਆਂ ਨੌਕਰੀਆਂ" },
  "kn-IN": { label: "ಉದ್ಯೋಗ ಎಲ್ಲಿ:", more: "ಇನ್ನಷ್ಟು ಸ್ಥಳಗಳು", all: "ಎಲ್ಲಾ ಉದ್ಯೋಗಗಳು" },
};

/**
 * "Jobs in Haridwar · More places": where the work is, on jobs pages with no
 * market of their own (the 10th pass, 12th pass and fresher hubs, the role
 * pages, /jobs/apply). Owner direction, 18 Oct 2026: the location choices
 * there follow the visitor context too.
 *
 * Every market is in the server HTML; the context's CSS (.ctx-jrow,
 * src/context/css.ts) shows only the decided and nearby ones once it knows
 * them, and marks the current one. A tap is the visitor's pick: the page
 * stays (the role or qualification with it) and the form below asks that
 * market's areas. "More places" links every market's hub, crawlable.
 */
export function JobsInRow({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const markets = jobMarkets();
  const choose = (id: string) => {
    const ctx = currentContext();
    const decided = ctx?.sides.jobs ?? [];
    const band = ctx?.region.band ?? "unknown";
    notePick("link", id);
    noteAudience("jobs");
    reportChoice(id, decided, "jobs-row", band);
    track("area_nav_click", {
      cluster: id,
      surface: "jobs-row",
      mode: ctx ? contextMode(ctx) : "default",
      band,
      decided: decided.join("+") || "none",
      is_decided: decided.includes(id) ? "yes" : "no",
      position: Math.max(1, [...decided, ...(ctx?.region.nearby ?? [])].indexOf(id) + 1),
      explicit: "yes",
      v: CONTEXT_VERSION,
    });
  };
  return (
    <div className="jobs-in" lang={locale}>
      <p className="jobs-in-row ctx-jrow">
        <span className="jobs-in-label">{t.label}</span>
        {markets.map((id) => (
          <button key={id} type="button" className="jobs-in-chip" data-m={id} onClick={() => choose(id)}>
            {marketName(id, locale) ?? id}
          </button>
        ))}
      </p>
      <details className="jobs-in-more">
        <summary>{t.more}</summary>
        <ul>
          {markets.map((id) => (
            <li key={id}>
              <NextLink href={nearestLocalePath(jobsHubPath(id as Exclude<ClusterId, "other">), locale)} onClick={() => choose(id)}>
                {JOBS_AREA_LABEL[locale][id] ?? marketName(id, locale) ?? id}
              </NextLink>
            </li>
          ))}
          <li>
            <NextLink href={nearestLocalePath("/jobs", locale)}>{t.all}</NextLink>
          </li>
        </ul>
      </details>
    </div>
  );
}
