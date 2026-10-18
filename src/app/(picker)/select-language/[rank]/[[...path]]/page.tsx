import { pageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";
import Image from "next/image";
import { jobsCopy } from "@/content/pages/jobs";
import { getJobRole } from "@/content/pages/job-roles";
import { getJobHub } from "@/content/pages/job-hubs";
import { getJobCluster } from "@/content/pages/job-clusters";
import { jobsLinkLabel } from "@/markets/labels";
import { quickApplyCopy } from "@/content/pages/quick-apply";
import { feesAndFraudCopy } from "@/content/pages/fees-and-fraud";
import { jobsPrivacyCopy } from "@/content/pages/jobs-privacy";
import {
  localePath,
  locales,
  neutralTarget,
  pages,
  type Locale,
} from "@/lib/i18n";
import { parseRankSegment, PICKER_TOP, rankSegments } from "@/lib/language-rank";
import { notFound } from "next/navigation";
import { LanguageChoices } from "./language-choices";

/**
 * The language picker. The proxy rewrites a neutral URL here when the page's
 * override is "prompt", so the address bar keeps /jobs. [rank] is the order
 * of the choices for the visitor (src/lib/language-rank.ts): one static page
 * per path and order (and, on /jobs/apply, per share image), all
 * prerendered. Every variant lists every language; only the order differs.
 */
export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(pages)
    .filter((path) => neutralTarget(path) === "prompt")
    .flatMap((path) => rankSegments(path).map((rank) => ({ rank, path: path.split("/").filter(Boolean) })));
}

type Props = { params: Promise<{ rank: string; path?: string[] }> };

const toPath = (segments: string[] = []) => `/${segments.join("/")}`;

/** The path and its picker variant, from the route params. */
async function readParams(params: Props["params"]) {
  const { rank, path: segments } = await params;
  const path = toPath(segments);
  const ranked = parseRankSegment(rank, path);
  if (!ranked) notFound();
  return { path, ...ranked };
}

/**
 * The page's title and short description, for <head> only (the English
 * ones: one snippet per canonical URL, whatever the order).
 */
function pageSummary(path: string): { title: string; text?: string } {
  if (path === "/jobs") return { title: jobsCopy["en-IN"].title, text: jobsCopy["en-IN"].description };
  if (path === "/jobs/apply") return { title: quickApplyCopy["en-IN"].title, text: quickApplyCopy["en-IN"].description };
  if (path === "/jobs/fees-and-fraud") return { title: feesAndFraudCopy["en-IN"].title, text: feesAndFraudCopy["en-IN"].description };
  if (path === "/jobs/privacy") return { title: jobsPrivacyCopy["en-IN"].title, text: jobsPrivacyCopy["en-IN"].description };
  const slug = /^\/jobs\/([^/]+)$/.exec(path)?.[1];
  const role = slug ? (getJobCluster(slug, "en-IN") ?? getJobRole(slug, "en-IN") ?? getJobHub(slug, "en-IN")) : undefined;
  if (role) return { title: role.metaTitle, text: role.description };
  return { title: locales["en-IN"].hint };
}

/**
 * What each choice opens, in its own language: a short page name, never the
 * meta title and description. /jobs opens the jobs index, which lists every
 * market (no market is the default, owner direction 17 Oct 2026).
 */
function pageName(path: string, locale: Locale): { title: string; href?: string } {
  if (path === "/jobs") return { title: jobsCopy[locale].heading };
  if (path === "/jobs/apply") return { title: quickApplyCopy[locale].breadcrumb };
  if (path === "/jobs/fees-and-fraud") return { title: feesAndFraudCopy[locale].breadcrumb };
  if (path === "/jobs/privacy") return { title: jobsPrivacyCopy[locale].breadcrumb };
  const slug = /^\/jobs\/([^/]+)$/.exec(path)?.[1];
  if (slug) {
    const name = (getJobCluster(slug, locale) ? jobsLinkLabel(slug, locale) : undefined) ?? getJobRole(slug, locale)?.name ?? getJobHub(slug, locale)?.name;
    if (name) return { title: name };
  }
  return { title: locales[locale].hint };
}

/** The heading, one line per language, in the order of the choices. */
const PROMPT: Record<Locale, string> = {
  "en-IN": "Choose your language",
  "hi-IN": "अपनी भाषा चुनें",
  "hi-Latn-IN": "Apni bhasha chunein",
  "pa-IN": "ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ",
  "kn-IN": "ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { path, variant } = await readParams(params);
  const english = pageSummary(path);
  const sharing = pageMetadata({ title: english.title, description: english.text ?? "Choose your language.", alternates: { canonical: localePath(path, "en-IN") }, shareVariant: variant });
  return {
    openGraph: { ...sharing.openGraph, url: path },
    twitter: sharing.twitter,
    title: { absolute: `${english.title} | Vayasya Seva` },
    // The English page's own description: one snippet per canonical URL,
    // whatever order this visitor's variant lists the languages in.
    description: english.text ?? "Choose your language.",
    // Never indexed and in no hreflang set: the picker has no content of its
    // own, and Google indexed it in place of the language pages it links to
    // (18 Oct 2026). Search results show the locale pages; shared links and
    // ads still open the picker at the neutral URL.
    alternates: { canonical: path },
    robots: { index: false, follow: true },
  };
}

export default async function LanguagePickerPage({ params }: Props) {
  const { path, key, order } = await readParams(params);
  const choices = order.map((locale) => {
    const name = pageName(path, locale);
    return {
      href: name.href ?? localePath(path, locale),
      locale,
      label: locales[locale].label,
      hint: locales[locale].hint,
      title: name.title,
    };
  });
  const top = choices.slice(0, PICKER_TOP);
  return (
    <main id="main-content" className="language-picker">
      <div className="language-picker-inner">
        <Image src="/brand/logos/master-logo-light.svg" alt="Vayasya Seva" width={40} height={40} priority />
        <h1>
          {top.map((c) => (
            <span key={c.locale} lang={c.locale}>
              {PROMPT[c.locale]}
            </span>
          ))}
        </h1>
        <LanguageChoices choices={top} more={choices.slice(PICKER_TOP)} orderKey={key} />
      </div>
    </main>
  );
}
