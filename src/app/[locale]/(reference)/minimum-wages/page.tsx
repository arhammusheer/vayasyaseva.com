import { WageHubPage, wageHubMetadata } from "@/components/pages/minimum-wages";
import { WAGE_HUB_PATH } from "@/content/registry/identifiers";
import { localeParams } from "@/lib/i18n";

export const dynamicParams = false;
// The staleness rule (src/content/wages) reads today's date: rebuild daily so
// the notice and the title follow it between deploys (ISR; works with next
// start too, so it carries over to self-hosting).
export const revalidate = 86400;
export const generateStaticParams = localeParams(WAGE_HUB_PATH);

export function generateMetadata() {
  return wageHubMetadata();
}

export default function MinimumWagesPage() {
  return <WageHubPage />;
}
