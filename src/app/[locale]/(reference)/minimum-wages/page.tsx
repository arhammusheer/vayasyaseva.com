import { WageHubPage, wageHubMetadata } from "@/components/pages/minimum-wages";
import { WAGE_HUB_PATH } from "@/content/registry/identifiers";
import { localeOfParams, localeParams } from "@/lib/i18n";

export const dynamicParams = false;
// The staleness rule (src/content/wages) reads today's date: rebuild daily so
// the notice and the title follow it between deploys (ISR; works with next
// start too, so it carries over to self-hosting).
export const revalidate = 86400;
export const generateStaticParams = localeParams(WAGE_HUB_PATH);

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return wageHubMetadata(localeOfParams(await params));
}

export default async function MinimumWagesPage({ params }: Props) {
  return <WageHubPage locale={localeOfParams(await params)} />;
}
