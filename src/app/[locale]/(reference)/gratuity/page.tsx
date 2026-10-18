import { notFound } from "next/navigation";
import { GratuityPage, topicMetadata } from "@/components/pages/topics";
import { gratuityTopic } from "@/content/topics/gratuity";
import { localeFromSegment, localeParams, localesOf } from "@/lib/i18n";

/** Gratuity for employers: English only, like the other reference pages. */
export const dynamicParams = false;
export const generateStaticParams = localeParams(gratuityTopic.path);
export const metadata = topicMetadata(gratuityTopic);

type Props = { params: Promise<{ locale: string }> };

export default async function Page({ params }: Props) {
  const locale = localeFromSegment((await params).locale);
  if (!locale || !localesOf(gratuityTopic.path).includes(locale)) notFound();
  return <GratuityPage />;
}
