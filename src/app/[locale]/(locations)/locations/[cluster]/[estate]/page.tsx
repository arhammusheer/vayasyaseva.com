import { notFound } from "next/navigation";
import { LocationPage, locationMetadata } from "@/components/pages/location";
import { locationPages } from "@/content/locations";
import { builtLocales } from "@/content/registry";
import { LOCATION_CLUSTERS, LOCATION_ESTATES, estatePath, type LocationCluster } from "@/content/registry/identifiers";
import { locales } from "@/lib/i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCATION_CLUSTERS.flatMap((cluster) =>
    LOCATION_ESTATES[cluster]
      .filter((estate) => locationPages.has(estatePath(cluster, estate)))
      .flatMap((estate) => builtLocales(estatePath(cluster, estate)).map((l) => ({ locale: locales[l].segment, cluster, estate }))),
  );
}

type Props = { params: Promise<{ locale: string; cluster: string; estate: string }> };
const pageFor = (cluster: string, estate: string) =>
  (LOCATION_CLUSTERS as string[]).includes(cluster) ? locationPages.get(estatePath(cluster as LocationCluster, estate)) : undefined;

export async function generateMetadata({ params }: Props) {
  const { cluster, estate } = await params;
  const page = pageFor(cluster, estate);
  if (!page) notFound();
  return locationMetadata(page);
}

export default async function EstatePage({ params }: Props) {
  const { cluster, estate } = await params;
  const page = pageFor(cluster, estate);
  if (!page) notFound();
  return <LocationPage page={page} />;
}
