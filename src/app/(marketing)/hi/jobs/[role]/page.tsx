import { JobRolePage, jobRoleMetadata, jobRoleParams } from "@/components/pages/job-role";

export const dynamicParams = false;
export const generateStaticParams = jobRoleParams;

type Props = { params: Promise<{ role: string }> };

export async function generateMetadata({ params }: Props) {
  return jobRoleMetadata((await params).role, "hi");
}

export default async function JobRoleHindiRoute({ params }: Props) {
  return <JobRolePage slug={(await params).role} locale="hi" />;
}
