import { notFound } from "next/navigation";
import { WageStatePage, wageStateMetadata } from "@/components/pages/minimum-wages";
import { builtLocales } from "@/content/registry";
import { WAGE_STATE_SLUGS, wageStatePath, type WageStateSlug } from "@/content/registry/identifiers";
import { locales } from "@/lib/i18n";

export const dynamicParams = false;
// See ../page.tsx: the staleness rule needs a daily rebuild.
export const revalidate = 86400;

/** One page per state and language the registry builds (status review or published). */
export function generateStaticParams() {
  return WAGE_STATE_SLUGS.flatMap((state) => builtLocales(wageStatePath(state)).map((l) => ({ locale: locales[l].segment, state })));
}

const isBuilt = (state: string): state is WageStateSlug =>
  (WAGE_STATE_SLUGS as readonly string[]).includes(state) && builtLocales(wageStatePath(state as WageStateSlug)).length > 0;

type Props = { params: Promise<{ locale: string; state: string }> };

export async function generateMetadata({ params }: Props) {
  const { state } = await params;
  if (!isBuilt(state)) notFound();
  return wageStateMetadata(state);
}

export default async function MinimumWagesStatePage({ params }: Props) {
  const { state } = await params;
  if (!isBuilt(state)) notFound();
  return <WageStatePage slug={state} />;
}
