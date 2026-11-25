import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NotFoundEvent } from "@/components/not-found-event";
import { jobsNotFoundCopy } from "@/content/pages/jobs-not-found";
import { allLocales, jobsLocale, locales, localeOfParams, nearestLocalePath } from "@/lib/i18n";

/**
 * The jobs section's 404, at /{locale}/jobs/_gone (the folder is %5Fgone
 * because a plain _gone folder is private to Next.js). src/proxy.ts rewrites
 * URLs under /jobs that are no page to it, with status 404, so a job seeker
 * who mistypes a jobs URL stays in their language with the jobs header and
 * footer (no business phone) and the jobs hub as the way on.
 *
 * Rendered as a page, not through notFound() and a not-found file: in this
 * app (a root layout per locale, global-not-found) a nested notFound()
 * prerenders Next's empty error shell, with no lang and nothing until the
 * JavaScript loads.
 */
export const dynamicParams = false;
export function generateStaticParams() {
  return allLocales.map((l) => ({ locale: locales[l].segment }));
}

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = jobsNotFoundCopy[jobsLocale(localeOfParams(await params))];
  return { title: { absolute: t.title }, robots: { index: false, follow: true } };
}

export default async function JobsGone({ params }: Props) {
  const locale = localeOfParams(await params);
  const t = jobsNotFoundCopy[jobsLocale(locale)];
  return (
    <section className="site-shell py-24 sm:py-32">
      <NotFoundEvent />
      <p className="eyebrow text-gold-700">404</p>
      <h1 className="mt-5 text-5xl font-medium leading-[1.04] tracking-[-0.03em] sm:text-6xl">{t.heading}</h1>
      <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">{t.body}</p>
      <div className="mt-10">
        <Button asChild size="lg">
          <Link href={nearestLocalePath("/jobs", locale)}>{t.hub}</Link>
        </Button>
      </div>
    </section>
  );
}
