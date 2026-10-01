import type { Metadata } from "next";
import Image from "next/image";
import { jobsCopy } from "@/content/pages/jobs";
import { getJobRole } from "@/content/pages/job-roles";
import {
  languageAlternates,
  localePath,
  locales,
  localesOf,
  neutralTarget,
  pages,
  type Locale,
} from "@/lib/i18n";
import { LanguageChoices } from "./language-choices";

/**
 * The language picker. The proxy rewrites a neutral URL here when the page's
 * override is "prompt", so the address bar keeps /jobs. One static page per
 * such path.
 */
export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(pages)
    .filter((path) => neutralTarget(path) === "prompt")
    .map((path) => ({ path: path.split("/").filter(Boolean) }));
}

type Props = { params: Promise<{ path?: string[] }> };

const toPath = (segments: string[] = []) => `/${segments.join("/")}`;

/** The page's name in a language, so each choice shows what it opens. */
function pageTitle(path: string, locale: Locale) {
  if (path === "/jobs") return jobsCopy[locale].heading;
  const role = /^\/jobs\/([^/]+)$/.exec(path)?.[1];
  return (role && getJobRole(role, locale)?.name) || locales[locale].hint;
}

const PROMPT = [
  { locale: "en-IN", text: "Choose your language" },
  { locale: "hi-IN", text: "अपनी भाषा चुनें" },
  { locale: "hi-Latn-IN", text: "Apni bhasha chunein" },
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const path = toPath((await params).path);
  const english = path === "/jobs" ? jobsCopy["en-IN"].title : pageTitle(path, "en-IN");
  const languages = languageAlternates(path);
  return {
    title: { absolute: `${english} | Vayasya Seva` },
    description: `Choose your language: ${localesOf(path).map((l) => locales[l].label).join(", ")}.`,
    alternates: { canonical: path, ...(languages && { languages }) },
  };
}

export default async function LanguagePickerPage({ params }: Props) {
  const path = toPath((await params).path);
  const choices = localesOf(path).map((locale) => ({
    href: localePath(path, locale),
    locale,
    label: locales[locale].label,
    title: pageTitle(path, locale),
  }));
  return (
    <main id="main-content" className="language-picker">
      <div className="language-picker-inner">
        <Image src="/brand/logos/master-logo-light.svg" alt="Vayasya Seva" width={56} height={56} priority />
        <h1>
          {PROMPT.map((p) => (
            <span key={p.locale} lang={p.locale}>
              {p.text}
            </span>
          ))}
        </h1>
        <LanguageChoices choices={choices} />
      </div>
    </main>
  );
}
