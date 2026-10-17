import Link from "@/components/i18n/link";
import { breadcrumbTrail, showsBreadcrumb, visibleTrail } from "@/lib/breadcrumbs";
import type { Locale } from "@/lib/i18n";
import { JsonLd, breadcrumbSchema } from "@/lib/structured-data";
import { cn } from "@/lib/utils";

const LABEL: Record<Locale, string> = { "en-IN": "Breadcrumb", "hi-IN": "आप यहाँ हैं", "hi-Latn-IN": "Aap yahan hain", "pa-IN": "ਤੁਸੀਂ ਇੱਥੇ ਹੋ", "kn-IN": "ನೀವು ಇಲ್ಲಿದ್ದೀರಿ" };

/**
 * The page's place on the site, from the registry's parent chain
 * (src/lib/breadcrumbs.ts): the BreadcrumbList JSON-LD on every page that
 * renders it, and a visible trail, Home included (Jobs first on jobs
 * pages), only two levels down. `visible={false}` keeps only the JSON-LD,
 * for a page whose layout places no trail yet: the jobs pages, until the
 * jobs rebuild puts the trail in their hero in place of the "Jobs" eyebrow.
 */
export function Breadcrumbs({
  path,
  locale,
  name,
  visible = true,
  className,
}: {
  /** Neutral path of the current page ("/services/housekeeping"). */
  path: string;
  locale: Locale;
  /** The current page's short name. */
  name: string;
  visible?: boolean;
  className?: string;
}) {
  const trail = breadcrumbTrail(path, locale, name);
  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />
      {visible && showsBreadcrumb(trail) && (
        <nav aria-label={LABEL[locale]} className={cn("crumbs", className)}>
          <ol>
            {visibleTrail(path, trail).map((crumb, i, shown) =>
              i === shown.length - 1 ? (
                <li key={crumb.href} aria-current="page">
                  {crumb.name}
                </li>
              ) : (
                <li key={crumb.href}>
                  <Link href={crumb.href} prefetch={false}>
                    {crumb.name}
                  </Link>
                </li>
              ),
            )}
          </ol>
        </nav>
      )}
    </>
  );
}
