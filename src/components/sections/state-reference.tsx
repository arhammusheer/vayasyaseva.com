import Link from "@/components/i18n/link";
import { ArrowUpRight } from "lucide-react";
import { linkable } from "@/content/registry";
import { referenceHref } from "@/content/reference-links";
import { WAGE_STATE_CODES, guidePath, wageStatePath, type WageStateSlug } from "@/content/registry/identifiers";
import type { ReferenceTopic } from "@/content/statutory";
import type { Locale } from "@/lib/i18n";
import { MARKETS, type MarketId } from "@/markets/data";

/**
 * "Rules and rates here" on a location page (owner direction, 24 Nov 2026):
 * the reference pages that apply where the page is, as links, never their
 * figures. Wages and LWF per state of the market; EPF, ESIC, bonus,
 * gratuity, PT and the labour codes guide once each. A page that is not
 * published is left out (referenceHref, linkable). The reference pages
 * are English, so the row says so in other languages.
 */
type Copy = { label: string; wages: string; lwf: string; pt: string; bonus: string; gratuity: string; codes: string };
const COPY: Partial<Record<Locale, Copy>> = {
  "en-IN": { label: "Rules and rates here", wages: "Minimum wages", lwf: "Labour welfare fund", pt: "Professional tax", bonus: "Bonus", gratuity: "Gratuity", codes: "New labour codes" },
  "hi-IN": { label: "यहाँ के नियम और दरें (अंग्रेज़ी में)", wages: "न्यूनतम मज़दूरी", lwf: "लेबर वेलफ़ेयर फ़ंड", pt: "प्रोफ़ेशनल टैक्स", bonus: "बोनस", gratuity: "ग्रेच्युटी", codes: "नए लेबर कोड" },
  "hi-Latn-IN": { label: "Yahan ke rules aur rates (English mein)", wages: "Minimum wages", lwf: "Labour welfare fund", pt: "Professional tax", bonus: "Bonus", gratuity: "Gratuity", codes: "Naye labour codes" },
  "pa-IN": { label: "ਇੱਥੋਂ ਦੇ ਨਿਯਮ ਅਤੇ ਦਰਾਂ (ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ)", wages: "ਘੱਟੋ-ਘੱਟ ਤਨਖ਼ਾਹ", lwf: "ਲੇਬਰ ਵੈਲਫ਼ੇਅਰ ਫ਼ੰਡ", pt: "ਪ੍ਰੋਫ਼ੈਸ਼ਨਲ ਟੈਕਸ", bonus: "ਬੋਨਸ", gratuity: "ਗ੍ਰੈਚੁਟੀ", codes: "ਨਵੇਂ ਲੇਬਰ ਕੋਡ" },
  "te-IN": { label: "ఇక్కడి రూల్స్, రేట్లు (English)", wages: "కనీస వేతనాలు", lwf: "లేబర్ వెల్ఫేర్ ఫండ్", pt: "ప్రొఫెషనల్ ట్యాక్స్", bonus: "బోనస్", gratuity: "గ్రాట్యుటీ", codes: "కొత్త లేబర్ కోడ్‌లు" },
};

/** State names in each page language, for the per-state links. */
const STATE_NAMES: Record<WageStateSlug, Partial<Record<Locale, string>> & { "en-IN": string }> = {
  uttarakhand: { "en-IN": "Uttarakhand", "hi-IN": "उत्तराखंड" },
  "uttar-pradesh": { "en-IN": "Uttar Pradesh", "hi-IN": "उत्तर प्रदेश" },
  delhi: { "en-IN": "Delhi", "hi-IN": "दिल्ली" },
  haryana: { "en-IN": "Haryana", "hi-IN": "हरियाणा" },
  punjab: { "en-IN": "Punjab", "hi-IN": "पंजाब", "pa-IN": "ਪੰਜਾਬ" },
  karnataka: { "en-IN": "Karnataka", "hi-IN": "कर्नाटक" },
  "andhra-pradesh": { "en-IN": "Andhra Pradesh", "hi-IN": "आंध्र प्रदेश", "te-IN": "ఆంధ్రప్రదేశ్" },
  telangana: { "en-IN": "Telangana", "hi-IN": "तेलंगाना", "te-IN": "తెలంగాణ" },
};

/** The wage states of a market, from its region codes (src/markets/data.ts). */
export function marketWageStates(market: string): WageStateSlug[] {
  const codes: readonly string[] = (MARKETS as Record<string, { states: readonly string[] }>)[market as MarketId]?.states ?? [];
  return codes.flatMap((c) => {
    const slug = (WAGE_STATE_CODES as Record<string, WageStateSlug>)[c.toLowerCase()];
    return slug ? [slug] : [];
  });
}

type Item = { href: string; text: string };

export function stateReferenceItems(market: string, locale: Locale): { label: string; perState: Item[]; national: Item[] } {
  const t = COPY[locale] ?? COPY["en-IN"]!;
  const states = marketWageStates(market);
  const name = (s: WageStateSlug) => STATE_NAMES[s][locale] ?? STATE_NAMES[s]["en-IN"];
  const many = states.length > 1;
  const perState: Item[] = [];
  for (const s of states) {
    const wages = wageStatePath(s);
    if (linkable(wages, "en-IN")) perState.push({ href: wages, text: many ? `${t.wages}: ${name(s)}` : `${t.wages}, ${name(s)}` });
  }
  const lwfSeen = new Set<string>();
  for (const s of states) {
    const href = referenceHref("lwf", s);
    if (href && !lwfSeen.has(href)) {
      lwfSeen.add(href);
      perState.push({ href, text: many ? `${t.lwf}: ${name(s)}` : t.lwf });
    }
  }
  const topicLink = (topic: ReferenceTopic, text: string): Item[] => {
    const href = referenceHref(topic, states[0]);
    return href ? [{ href, text }] : [];
  };
  const codes = guidePath("new-labour-codes");
  const national: Item[] = [
    ...topicLink("epf", "EPF"),
    ...topicLink("esic", "ESIC"),
    ...topicLink("bonus", t.bonus),
    ...topicLink("gratuity", t.gratuity),
    ...(states.includes("karnataka") ? topicLink("pt", t.pt) : []),
    ...(linkable(codes, "en-IN") ? [{ href: codes, text: t.codes }] : []),
  ];
  return { label: t.label, perState, national };
}

/** The row itself: state pages first, then the national ones; links open the English reference page. */
export function StateReference({ market, locale = "en-IN" }: { market: string; locale?: Locale }) {
  const { label, perState, national } = stateReferenceItems(market, locale);
  const items = [...perState, ...national];
  if (items.length === 0) return null;
  const hrefLang = locale === "en-IN" ? undefined : "en-IN";
  return (
    <nav aria-label={label} className="mt-8" data-state-reference>
      <p className="text-sm text-muted-foreground">{label}</p>
      <ul className="link-row mt-2">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="text-link" hrefLang={hrefLang}>
              {i.text} <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
