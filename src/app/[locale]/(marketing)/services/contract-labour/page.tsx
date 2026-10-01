import { ContractLabourPage, contractLabourMetadata } from "@/components/pages/contract-labour";
import { localeOfParams, localeParams } from "@/lib/i18n";

export const dynamicParams = false;
export const generateStaticParams = localeParams("/services/contract-labour");

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return contractLabourMetadata(localeOfParams(await params));
}

export default async function ContractLabourRoute({ params }: Props) {
  return <ContractLabourPage locale={localeOfParams(await params)} />;
}
