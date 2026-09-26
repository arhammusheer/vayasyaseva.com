import { ContractLabourPage, contractLabourMetadata } from "@/components/pages/contract-labour";

export const metadata = contractLabourMetadata("en");

export default function ContractLabourRoute() {
  return <ContractLabourPage locale="en" />;
}
