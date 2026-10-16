import { GuidePage, guideMetadata } from "@/components/pages/guide";
import { guidePath } from "@/content/registry/identifiers";
import { localeParams } from "@/lib/i18n";

export const dynamicParams = false;
// Built in each language the registry builds; in review (noindex, unlisted) until a legal reviewer signs off.
export const generateStaticParams = localeParams(guidePath("what-is-contract-labour"));

export function generateMetadata() {
  return guideMetadata("what-is-contract-labour");
}

export default function Page() {
  return <GuidePage slug="what-is-contract-labour" />;
}
