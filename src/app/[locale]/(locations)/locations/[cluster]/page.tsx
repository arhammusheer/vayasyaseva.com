import { notFound } from "next/navigation";
import { LocationPage, locationMetadata } from "@/components/pages/location";
import { locationPages } from "@/content/locations";
import { builtLocales } from "@/content/registry";
import { LOCATION_CLUSTERS, locationPath, type LocationCluster } from "@/content/registry/identifiers";
import { localeOfParams, locales } from "@/lib/i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCATION_CLUSTERS.filter((c) => locationPages.has(locationPath(c))).flatMap((cluster) =>
    builtLocales(locationPath(cluster)).map((l) => ({ locale: locales[l].segment, cluster })),
  );
}

type Props = { params: Promise<{ locale: string; cluster: string }> };
const pageFor = (cluster: string) => ((LOCATION_CLUSTERS as string[]).includes(cluster) ? locationPages.get(locationPath(cluster as LocationCluster)) : undefined);

export async function generateMetadata({ params }: Props) {
  const { cluster, ...rest } = await params;
  const page = pageFor(cluster);
  if (!page) notFound();
  return locationMetadata(page, localeOfParams(rest));
}

export default async function LocationHubPage({ params }: Props) {
  const { cluster, ...rest } = await params;
  const page = pageFor(cluster);
  if (!page) notFound();
  return <LocationPage page={page} locale={localeOfParams(rest)} />;
}
