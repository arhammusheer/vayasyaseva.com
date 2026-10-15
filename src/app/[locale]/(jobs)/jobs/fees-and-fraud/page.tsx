import { FeesAndFraudPage, feesAndFraudMetadata } from "@/components/pages/fees-and-fraud";
import { localeOfParams, localeParams } from "@/lib/i18n";

export const dynamicParams = false;
export const generateStaticParams = localeParams("/jobs/fees-and-fraud");

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return feesAndFraudMetadata(localeOfParams(await params));
}

export default async function FeesAndFraudRoute({ params }: Props) {
  return <FeesAndFraudPage locale={localeOfParams(await params)} />;
}
