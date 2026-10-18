import { notFound } from "next/navigation";
import { BonusPage, topicMetadata } from "@/components/pages/topics";
import { bonusTopic } from "@/content/topics/bonus";
import { localeFromSegment, localeParams, localesOf } from "@/lib/i18n";

/** Statutory bonus for employers: English only, like the other reference pages. */
export const dynamicParams = false;
export const generateStaticParams = localeParams(bonusTopic.path);
export const metadata = topicMetadata(bonusTopic);

type Props = { params: Promise<{ locale: string }> };

export default async function Page({ params }: Props) {
  const locale = localeFromSegment((await params).locale);
  if (!locale || !localesOf(bonusTopic.path).includes(locale)) notFound();
  return <BonusPage />;
}
