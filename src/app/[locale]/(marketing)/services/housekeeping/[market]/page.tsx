import { notFound } from "next/navigation";
import { ServiceMarketPage, serviceMarketMetadata } from "@/components/pages/service-market";
import { builtLocales } from "@/content/registry";
import { serviceMarketPage, serviceMarketPages, serviceMarketPath } from "@/content/service-markets";
import { locales } from "@/lib/i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return serviceMarketPages
    .filter((p) => p.service === "housekeeping")
    .flatMap((p) => builtLocales(serviceMarketPath(p.service, p.market)).map((l) => ({ locale: locales[l].segment, market: p.market })));
}

type Props = { params: Promise<{ locale: string; market: string }> };

export async function generateMetadata({ params }: Props) {
  const page = serviceMarketPage("housekeeping", (await params).market);
  if (!page) notFound();
  return serviceMarketMetadata(page);
}

export default async function HousekeepingMarketPage({ params }: Props) {
  const page = serviceMarketPage("housekeeping", (await params).market);
  if (!page) notFound();
  return <ServiceMarketPage page={page} />;
}
