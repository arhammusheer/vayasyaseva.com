import { JobRolePage, jobRoleMetadata, jobRoleParams } from "@/components/pages/job-role";
import { JobHubPage, jobHubMetadata, jobHubParams } from "@/components/pages/job-hub";
import { JobClusterPage, isJobClusterSlug, jobClusterMetadata, jobClusterParams } from "@/components/pages/job-cluster";
import { localeOfParams } from "@/lib/i18n";
import { isJobHub } from "@/lib/talent-intake/rules";

/**
 * Role pages (/jobs/packing), candidate category pages (/jobs/freshers) and
 * cluster jobs hubs (/jobs/haridwar). content:check keeps the three slug
 * sets apart.
 */
export const dynamicParams = false;
// Runs once per locale from app/[locale]/layout.tsx; only versions the
// registry builds in that language get a page, so the rest 404.
export function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale = localeOfParams(params);
  return [...jobRoleParams(locale), ...jobHubParams(locale), ...jobClusterParams(locale)];
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
