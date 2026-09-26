import { JobsPage, jobsMetadata } from "@/components/pages/jobs";

export const metadata = jobsMetadata("hinglish");

export default function JobsHinglishRoute() {
  return <JobsPage locale="hinglish" />;
}
