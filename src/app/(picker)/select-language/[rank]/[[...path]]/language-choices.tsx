"use client";

import { useSyncExternalStore } from "react";
import { ArrowRight } from "lucide-react";
import { track } from "@/lib/measurement/gateway";
import { LANGUAGE_COOKIE, LANGUAGE_COOKIE_MAX_AGE } from "@/lib/language-cookie";

export type LanguageChoice = {
  href: string;
  locale: string;
  label: string;
  /** "Read this page in …", in that language: the link's title. */
  hint: string;
  /** A short page name, in that language. */
  title: string;
};

const subscribe = () => () => {};

/**
 * Remember the choice so this picker lists it first next time (the proxy
 * reads it). Strictly necessary: it holds only the locale, is set only on
 * an explicit choice, and never redirects anyone.
 */
function rememberChoice(locale: string) {
  try {
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${LANGUAGE_COOKIE}=${locale}; path=/; max-age=${LANGUAGE_COOKIE_MAX_AGE}; samesite=lax${secure}`;
  } catch {
    // Cookies blocked: the picker still works, in the default order.
  }
}

/**
 * One link per language: the top choices large, the rest under a quiet
 * "More languages" (a <details>, so every link is in the HTML for
 * crawlers). Query string and hash carry over (e.g. ?utm_source=whatsapp).
 */
export function LanguageChoices({ choices, more, orderKey }: { choices: LanguageChoice[]; more: LanguageChoice[]; orderKey: string }) {
  const suffix = useSyncExternalStore(
    subscribe,
    () => window.location.search + window.location.hash,
    () => "",
  );
  const target = (c: LanguageChoice) => `${c.href}${suffix}`;
  const choose = (c: LanguageChoice, position: number | "more") => {
    rememberChoice(c.locale);
    track("language_choice", { locale: c.locale, page: c.href, position, order_key: orderKey });
  };
  return (
    <>
      <ul className="language-choices">
        {choices.map((c, i) => (
          <li key={c.locale}>
            <a href={target(c)} lang={c.locale} hrefLang={c.locale} title={c.hint} onClick={() => choose(c, i + 1)}>
              <span className="language-choice-label">{c.label}</span>
              <span className="language-choice-title">{c.title}</span>
              <ArrowRight aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
      {more.length > 0 && (
        <details className="language-more">
          <summary>
            More languages · <span lang="hi-IN">और भाषाएँ</span>
          </summary>
          <ul className="language-choices language-choices-more">
            {more.map((c) => (
              <li key={c.locale}>
                <a href={target(c)} lang={c.locale} hrefLang={c.locale} title={c.hint} onClick={() => choose(c, "more")}>
                  <span className="language-choice-label">{c.label}</span>
                  <span className="language-choice-title">{c.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
