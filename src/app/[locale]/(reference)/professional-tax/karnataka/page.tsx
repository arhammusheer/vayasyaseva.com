import { notFound } from "next/navigation";
import { KarnatakaPtPage, topicMetadata } from "@/components/pages/topics";
import { karnatakaPtTopic } from "@/content/topics/professional-tax";
import { localeFromSegment, localeParams, localesOf } from "@/lib/i18n";

/** English only, like the other reference pages. */
export const dynamicParams = false;
export const generateStaticParams = localeParams(karnatakaPtTopic.path);
export const metadata = topicMetadata(karnatakaPtTopic);

type Props = { params: Promise<{ locale: string }> };

export default async function Page({ params }: Props) {
  const locale = localeFromSegment((await params).locale);
  if (!locale || !localesOf(karnatakaPtTopic.path).includes(locale)) notFound();
  return <KarnatakaPtPage />;
}
