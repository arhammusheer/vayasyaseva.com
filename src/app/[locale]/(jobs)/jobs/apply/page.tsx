import { QUICK_ANSWERS } from "@/lib/talent-intake/rules";
import { QuickApplyPage, quickApplyMetadata } from "@/components/pages/quick-apply";
import { localeOfParams, localeParams } from "@/lib/i18n";

export const dynamicParams = false;
export const generateStaticParams = localeParams("/jobs/apply");

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params, searchParams }: Props) {
  const query = await searchParams;
  const value = (key: string) => typeof query[key] === "string" ? query[key] as string : undefined;
  return quickApplyMetadata(localeOfParams(await params), { role: value("role"), hub: value("hub"), work: value("work") });
}

export default async function QuickApplyRoute({ params, searchParams }: Props) {
  const query = await searchParams;
  const prefillKey = JSON.stringify(Object.fromEntries(["role", "hub", ...Object.keys(QUICK_ANSWERS)].map((key) => [key, query[key] ?? null])));
  return <QuickApplyPage locale={localeOfParams(await params)} prefillKey={prefillKey} />;
}
