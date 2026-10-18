import { notFound } from "next/navigation";
import { WageVdaPage, wageVdaMetadata } from "@/components/pages/wage-vda";
import { WAGE_VDA_PATH } from "@/content/registry/identifiers";
import { localeFromSegment, localeParams, localesOf } from "@/lib/i18n";

/**
 * The VDA and DA tracker. A static segment beside the dynamic [state] route
 * (Next.js matches it first; content:check reserves the slug), English only
 * like How we check. Rebuilt daily, as the hub is, so "due" and "revised"
 * follow the date between deploys.
 */
export const dynamicParams = false;
export const revalidate = 86400;
export const generateStaticParams = localeParams(WAGE_VDA_PATH);

export function generateMetadata() {
  return wageVdaMetadata();
}

type Props = { params: Promise<{ locale: string }> };

export default async function VdaPage({ params }: Props) {
  const locale = localeFromSegment((await params).locale);
  if (!locale || !localesOf(WAGE_VDA_PATH).includes(locale)) notFound();
  return <WageVdaPage />;
}
