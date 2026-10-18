import { notFound } from "next/navigation";
import { EpfPage, topicMetadata } from "@/components/pages/topics";
import { epfTopic } from "@/content/topics/epf";
import { localeFromSegment, localeParams, localesOf } from "@/lib/i18n";

/** English only, like the other reference pages. */
export const dynamicParams = false;
export const generateStaticParams = localeParams(epfTopic.path);
export const metadata = topicMetadata(epfTopic);

type Props = { params: Promise<{ locale: string }> };

export default async function Page({ params }: Props) {
  const locale = localeFromSegment((await params).locale);
  if (!locale || !localesOf(epfTopic.path).includes(locale)) notFound();
  return <EpfPage />;
}
