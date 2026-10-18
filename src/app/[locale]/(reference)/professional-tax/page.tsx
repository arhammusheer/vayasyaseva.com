import { notFound } from "next/navigation";
import { ReferenceTopicPage, topicMetadata } from "@/components/pages/reference-topic";
import { professionalTaxTopic } from "@/content/topics/professional-tax";
import { localeFromSegment, localeParams, localesOf } from "@/lib/i18n";

/** Professional Tax by state: English only, like the other reference pages. */
export const dynamicParams = false;
export const generateStaticParams = localeParams(professionalTaxTopic.path);
export const metadata = topicMetadata(professionalTaxTopic);

type Props = { params: Promise<{ locale: string }> };

export default async function Page({ params }: Props) {
  const locale = localeFromSegment((await params).locale);
  if (!locale || !localesOf(professionalTaxTopic.path).includes(locale)) notFound();
  return <ReferenceTopicPage topic={professionalTaxTopic} />;
}
