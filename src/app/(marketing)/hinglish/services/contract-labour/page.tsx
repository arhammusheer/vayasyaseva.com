import { ContractLabourPage, contractLabourMetadata } from "@/components/pages/contract-labour";

export const metadata = contractLabourMetadata("hinglish");

export default function ContractLabourHinglishRoute() {
  return <ContractLabourPage locale="hinglish" />;
}
