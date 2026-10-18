import { notFound } from "next/navigation";
import { LabourWelfareFundPage, lwfMetadata } from "@/components/pages/labour-welfare-fund";
import { LWF_PATH } from "@/content/registry/identifiers";
import { localeFromSegment, localeParams, localesOf } from "@/lib/i18n";

/** Labour Welfare Fund by state, English only like the other reference pages beside the wage hub. */
export const dynamicParams = false;
export const generateStaticParams = localeParams(LWF_PATH);

export function generateMetadata() {
  return lwfMetadata();
}

type Props = { params: Promise<{ locale: string }> };

export default async function LwfPage({ params }: Props) {
  const locale = localeFromSegment((await params).locale);
  if (!locale || !localesOf(LWF_PATH).includes(locale)) notFound();
  return <LabourWelfareFundPage />;
}
