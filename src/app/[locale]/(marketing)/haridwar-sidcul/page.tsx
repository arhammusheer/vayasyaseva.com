import { HaridwarPage, haridwarMetadata } from "@/components/pages/haridwar-sidcul";
import { localeOfParams, localeParams } from "@/lib/i18n";

export const dynamicParams = false;
// "What we hold" hides a registration from its `expires` date on: rebuild the
// page daily so that holds between deploys (ISR; works with next start too).
export const revalidate = 86400;
export const generateStaticParams = localeParams("/haridwar-sidcul");

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return haridwarMetadata(localeOfParams(await params));
}

export default async function HaridwarSidculPage({ params }: Props) {
  return <HaridwarPage locale={localeOfParams(await params)} />;
}
