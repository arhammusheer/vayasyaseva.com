import { ContractLabourPage, contractLabourMetadata } from "@/components/pages/contract-labour";

export const metadata = contractLabourMetadata("hi");

export default function ContractLabourHindiRoute() {
  return <ContractLabourPage locale="hi" />;
}
