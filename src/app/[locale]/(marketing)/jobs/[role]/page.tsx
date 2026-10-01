import { JobRolePage, jobRoleMetadata, jobRoleParams } from "@/components/pages/job-role";
import { localeOfParams } from "@/lib/i18n";

export const dynamicParams = false;
export const generateStaticParams = jobRoleParams;

type Props = { params: Promise<{ locale: string; role: string }> };

export async function generateMetadata({ params }: Props) {
  const p = await params;
  return jobRoleMetadata(p.role, localeOfParams(p));
}

export default async function JobRoleRoute({ params }: Props) {
  const p = await params;
  return <JobRolePage slug={p.role} locale={localeOfParams(p)} />;
}
