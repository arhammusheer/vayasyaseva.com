import { notFound } from "next/navigation";
import { ReferenceTopicPage, topicMetadata } from "@/components/pages/reference-topic";
import { epfTopic } from "@/content/topics/epf";
import { localeFromSegment, localeParams, localesOf } from "@/lib/i18n";

/** EPF for employers: English only, like the other reference pages. */
export const dynamicParams = false;
export const generateStaticParams = localeParams(epfTopic.path);
export const metadata = topicMetadata(epfTopic);

type Props = { params: Promise<{ locale: string }> };

export default async function EpfPage({ params }: Props) {
  const locale = localeFromSegment((await params).locale);
  if (!locale || !localesOf(epfTopic.path).includes(locale)) notFound();
  return <ReferenceTopicPage topic={epfTopic} />;
}
