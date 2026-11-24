import { JobRolePage, jobRoleMetadata, jobRoleParams } from "@/components/pages/job-role";
import { JobHubPage, jobHubMetadata, jobHubParams } from "@/components/pages/job-hub";
import { JobClusterPage, isJobClusterSlug, jobClusterMetadata, jobClusterParams } from "@/components/pages/job-cluster";
import { allLocales, locales, localeOfParams } from "@/lib/i18n";
import { isJobHub } from "@/lib/talent-intake/rules";

/**
 * Role pages (/jobs/packing), candidate category pages (/jobs/freshers) and
 * cluster jobs hubs (/jobs/haridwar). content:check keeps the three slug
 * sets apart.
 */
export const dynamicParams = false;
// Locale and slug pairs, as the location routes do: only versions the
// registry builds in a language get a page, so the rest 404. Not per parent
// locale: a locale with no jobs pages (te-IN) returned [] and the build then
// emitted no /jobs/[role] page in any language.
export function generateStaticParams() {
  return allLocales.flatMap((locale) =>
    [...jobRoleParams(locale), ...jobHubParams(locale), ...jobClusterParams(locale)].map((p) => ({ locale: locales[locale].segment, ...p })),
  );
}

type Props = { params: Promise<{ locale: string; role: string }> };

export async function generateMetadata({ params }: Props) {
  const p = await params;
  const locale = localeOfParams(p);
  if (isJobClusterSlug(p.role)) return jobClusterMetadata(p.role, locale);
  return isJobHub(p.role) ? jobHubMetadata(p.role, locale) : jobRoleMetadata(p.role, locale);
}

export default async function JobRoleRoute({ params }: Props) {
  const p = await params;
  const locale = localeOfParams(p);
  if (isJobClusterSlug(p.role)) return <JobClusterPage slug={p.role} locale={locale} />;
  return isJobHub(p.role) ? <JobHubPage slug={p.role} locale={locale} /> : <JobRolePage slug={p.role} locale={locale} />;
}
