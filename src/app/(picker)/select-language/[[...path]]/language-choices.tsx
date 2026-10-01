"use client";

import { useSyncExternalStore } from "react";
import { ArrowRight } from "lucide-react";
import { trackAnalyticsEvent } from "@/lib/analytics";

export type LanguageChoice = {
  href: string;
  locale: string;
  label: string;
  title: string;
};

const subscribe = () => () => {};

/** One link per language. Query string and hash carry over (e.g. ?utm_source=whatsapp). */
export function LanguageChoices({ choices }: { choices: LanguageChoice[] }) {
  const suffix = useSyncExternalStore(
    subscribe,
    () => window.location.search + window.location.hash,
    () => "",
  );
  return (
    <ul className="language-choices">
      {choices.map((c) => (
        <li key={c.locale}>
          <a
            href={`${c.href}${suffix}`}
            lang={c.locale}
            hrefLang={c.locale}
            onClick={() => trackAnalyticsEvent("language_choice", { locale: c.locale, page: c.href })}
          >
            <span className="language-choice-label">{c.label}</span>
            <span className="language-choice-title">{c.title}</span>
            <ArrowRight aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
}
