import { JobRolePage, jobRoleMetadata, jobRoleParams } from "@/components/pages/job-role";
import { JobHubPage, jobHubMetadata, jobHubParams } from "@/components/pages/job-hub";
import { localeOfParams } from "@/lib/i18n";
import { isJobHub } from "@/lib/job-hubs";

/** Role pages (/jobs/packing) and the unlinked hub pages (/jobs/freshers). */
export const dynamicParams = false;
export const generateStaticParams = () => [...jobRoleParams(), ...jobHubParams()];

type Props = { params: Promise<{ locale: string; role: string }> };

export async function generateMetadata({ params }: Props) {
  const p = await params;
  const locale = localeOfParams(p);
  return isJobHub(p.role) ? jobHubMetadata(p.role, locale) : jobRoleMetadata(p.role, locale);
}

export default async function JobRoleRoute({ params }: Props) {
  const p = await params;
  const locale = localeOfParams(p);
  return isJobHub(p.role) ? <JobHubPage slug={p.role} locale={locale} /> : <JobRolePage slug={p.role} locale={locale} />;
}
