import { LocationsIndex } from "@/components/pages/location";
import { pageMetadata } from "@/lib/metadata";
import { localeParams } from "@/lib/i18n";
import { LOCATIONS_PATH } from "@/content/registry/identifiers";

export const dynamicParams = false;
export const generateStaticParams = localeParams(LOCATIONS_PATH);

export const metadata = pageMetadata({
  title: "Locations: Labour Contractor in Uttarakhand, NCR",
  description: "Where Vayasya Seva supplies supervised contract labour crews: Uttarakhand, Delhi NCR, Jalandhar and Kapurthala in Punjab, and Bengaluru.",
  alternates: { canonical: LOCATIONS_PATH },
});

export default function LocationsPage() {
  return <LocationsIndex />;
}
