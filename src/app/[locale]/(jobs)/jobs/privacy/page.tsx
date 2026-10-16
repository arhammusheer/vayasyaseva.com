import { JobsPrivacyPage, jobsPrivacyMetadata } from "@/components/pages/jobs-privacy";
import { localeOfParams, localeParams } from "@/lib/i18n";

export const dynamicParams = false;
export const generateStaticParams = localeParams("/jobs/privacy");

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return jobsPrivacyMetadata(localeOfParams(await params));
}

export default async function JobsPrivacyRoute({ params }: Props) {
  return <JobsPrivacyPage locale={localeOfParams(await params)} />;
}
