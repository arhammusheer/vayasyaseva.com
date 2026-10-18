import { notFound } from "next/navigation";
import { LwfStatePage, lwfStateMetadata } from "@/components/pages/lwf-state";
import { builtLocales } from "@/content/registry";
import { LWF_STATE_SLUGS, lwfStatePath, type LwfStateSlug } from "@/content/registry/identifiers";
import { locales } from "@/lib/i18n";

export const dynamicParams = false;

/** One page per state and language the registry builds (English only). */
export function generateStaticParams() {
  return LWF_STATE_SLUGS.flatMap((state) => builtLocales(lwfStatePath(state)).map((l) => ({ locale: locales[l].segment, state })));
}

const isBuilt = (state: string): state is LwfStateSlug =>
  (LWF_STATE_SLUGS as readonly string[]).includes(state) && builtLocales(lwfStatePath(state as LwfStateSlug)).length > 0;

type Props = { params: Promise<{ locale: string; state: string }> };

export async function generateMetadata({ params }: Props) {
  const { state } = await params;
  if (!isBuilt(state)) notFound();
  return lwfStateMetadata(state);
}

export default async function LabourWelfareFundStatePage({ params }: Props) {
  const { state } = await params;
  if (!isBuilt(state)) notFound();
  return <LwfStatePage slug={state} />;
}
