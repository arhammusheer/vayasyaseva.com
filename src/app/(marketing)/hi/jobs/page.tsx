import { JobsPage, jobsMetadata } from "@/components/pages/jobs";

export const metadata = jobsMetadata("hi");

export default function JobsHindiRoute() {
  return <JobsPage locale="hi" />;
}
