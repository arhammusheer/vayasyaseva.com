import { JobsPage, jobsMetadata } from "@/components/pages/jobs";

export const metadata = jobsMetadata("en");

export default function JobsRoute() {
  return <JobsPage locale="en" />;
}
