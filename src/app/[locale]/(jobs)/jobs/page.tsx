import { JobsPage, jobsMetadata } from "@/components/pages/jobs";
import { localeOfParams, localeParams } from "@/lib/i18n";

export const dynamicParams = false;
export const generateStaticParams = localeParams("/jobs");

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return jobsMetadata(localeOfParams(await params));
}

export default async function JobsRoute({ params }: Props) {
  return <JobsPage locale={localeOfParams(await params)} />;
}
