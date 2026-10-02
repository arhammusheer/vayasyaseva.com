import { QuickApplyPage, quickApplyMetadata } from "@/components/pages/quick-apply";
import { localeOfParams, localeParams } from "@/lib/i18n";

export const dynamicParams = false;
export const generateStaticParams = localeParams("/jobs/apply");

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return quickApplyMetadata(localeOfParams(await params));
}

export default async function QuickApplyRoute({ params }: Props) {
  return <QuickApplyPage locale={localeOfParams(await params)} />;
}
