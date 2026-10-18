import { notFound } from "next/navigation";
import { EsicPage, topicMetadata } from "@/components/pages/topics";
import { esicTopic } from "@/content/topics/esic";
import { localeFromSegment, localeParams, localesOf } from "@/lib/i18n";

/** English only, like the other reference pages. */
export const dynamicParams = false;
export const generateStaticParams = localeParams(esicTopic.path);
export const metadata = topicMetadata(esicTopic);

type Props = { params: Promise<{ locale: string }> };

export default async function Page({ params }: Props) {
  const locale = localeFromSegment((await params).locale);
  if (!locale || !localesOf(esicTopic.path).includes(locale)) notFound();
  return <EsicPage />;
}
