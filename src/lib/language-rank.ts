/**
 * Language picker ranking (PLAN §6.4). The neutral URL of a "prompt" page
 * (/jobs, /jobs/apply…) shows the language picker. The proxy ranks the
 * page's languages for each request and rewrites to one of a few
 * prerendered picker variants, so the picker stays static HTML:
 *
 *   /jobs  --proxy-->  rewrite /select-language/hi-hl-en/jobs
 *
 * Signals, in order:
 * 1. the vspl_lang cookie, set only when someone picks a language on the picker;
 * 2. non-English Accept-Language tags, by q-value (hi pulls Hinglish in after it);
 * 3. the visitor's market when something they did or how they arrived
 *    decided it (the visitor context, src/context, run here on what the
 *    request carries): a market picked on the site (the vs_ctx cookie), or
 *    ?cluster=<market>, or a place in its UTM tags (an ad for Kapurthala
 *    jobs), by the markets' words (src/markets/data.ts). Only markets count:
 *    ?cluster=saharanpur is not intent (owner direction, 17 Oct 2026). This
 *    visit's browsing stays in the browser (docs/visitor-context.md);
 * 4. the visitor's state, from the request's geo headers (visitorRegion);
 * 5. the page's cluster;
 * 6. the default set.
 *
 * With no signal (no cookie, no intent), location weighs more (owner
 * direction, 17 Oct 2026): an Indian region's set comes before the
 * browser's languages, since most Indian phones list Hindi or English
 * whatever the person reads, and a visitor in Karnataka or Punjab should see
 * ಕನ್ನಡ or ਪੰਜਾਬੀ first. Outside India, or with no region, the browser's
 * languages still lead.
 *
 * Punjabi: a visitor in Punjab, or one whose request names the Jalandhar
 * region, gets ਪੰਜਾਬੀ first wherever a page has it. The picker's
 * language_choice events (choice, position, order key) show whether that
 * order is right.
 *
 * The large choices always include English and the phone's first language
 * the page has (owner decision, 18 Oct 2026; rankTop).
 *
 * Nothing here redirects or changes a locale URL: /hi-in/jobs is always Hindi.
 * Imported by the proxy: keep it light.
 */
import { pageEntry } from "@/content/registry";
import type { ClusterId } from "@/content/registry/identifiers";
import { canonicalRegion, geoMarket, isMarketId, marketForPlace, marketsInAdTags, type MarketId } from "@/markets/index";
import { resolveContext, type Pick } from "@/context/core";
import { PICKER_TOP, contextTables } from "@/context/tables";
import { quickShareVariant, QUICK_SHARE_VARIANTS } from "./share-variant";
import { allLocales, preferredLocales, type Locale } from "./i18n";

export { LANGUAGE_COOKIE } from "./language-cookie";

export { PICKER_TOP };
const ALWAYS: Locale = "en-IN";

/** Short codes for the order key in the picker variant's URL ("hi-hl-en"). */
const KEY_CODES = { "en-IN": "en", "hi-IN": "hi", "hi-Latn-IN": "hl", "pa-IN": "pa", "kn-IN": "kn" } as const satisfies Record<Locale, string>;
const CODE_LOCALES = Object.fromEntries(Object.entries(KEY_CODES).map(([l, c]) => [c, l])) as Record<string, Locale>;

/**
 * The cluster that fills gaps in a page's order: the page's own, and nothing
 * else. Pages without a market of their own (/jobs, /jobs/apply, the role
 * and qualification pages) take no market's order by default (owner
 * direction, 17 Oct 2026: no market is the default; the visitor's signals
 * decide).
 */
export function pageCluster(path: string): ClusterId | undefined {
  return pageEntry(path)?.cluster;
}

export type VisitorRegion = { country?: string; region?: string };

/**
 * The visitor's country and state from the request, in one place. On Vercel:
 * x-vercel-ip-country and x-vercel-ip-country-region. Self-hosted behind
 * Cloudflare: CF-IPCountry and cf-region-code (Cloudflare's "Add visitor
 * location headers" managed transform). Read per request, never stored.
 */
export function visitorRegion(headers: Headers): VisitorRegion {
  const vercel = headers.get("x-vercel-ip-country");
  const country = (vercel ?? headers.get("cf-ipcountry"))?.trim().toUpperCase();
  const region = (vercel ? headers.get("x-vercel-ip-country-region") : headers.get("cf-region-code"))
    ?.trim()
    .toUpperCase()
    .replace(/^[A-Z]{2}-/, "");
  return {
    // XX: unknown; T1: Tor (Cloudflare). Both read as "outside India" would be wrong.
    country: country && /^[A-Z]{2}$/.test(country) && country !== "XX" && country !== "T1" ? country : undefined,
    region: region && /^[A-Z0-9]{1,3}$/.test(region) ? region : undefined,
  };
}

/**
 * The visitor's city from the request (x-vercel-ip-city, URL-encoded; or
 * Cloudflare's cf-ipcity), for area intent only. Read per request, never stored.
 */
export function visitorCity(headers: Headers): string | undefined {
  const raw = headers.get("x-vercel-ip-city") ?? headers.get("cf-ipcity");
  if (!raw) return undefined;
  let city = raw;
  try {
    city = decodeURIComponent(raw);
  } catch {
    // Not URL-encoded: use as sent.
  }
  city = city.trim();
  return city && city.length <= 60 && /^[\p{L} .'-]+$/u.test(city) ? city : undefined;
}

/**
 * Locales for the non-English languages in an Accept-Language header, by
 * q-value. English is skipped: most Indian Android phones send en-IN or
 * en-US whatever the person reads. "hi" adds हिंदी then Hinglish;
 * "hi-Latn" adds Hinglish first.
 */
export function acceptLanguageLocales(header: string | null | undefined): Locale[] {
  if (!header) return [];
  const tags = header
    .slice(0, 400)
    .split(",")
    .slice(0, 20)
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = Number(params.map((p) => /^\s*q=([\d.]+)\s*$/.exec(p)?.[1]).find(Boolean) ?? 1);
      return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 0, index };
    })
    .filter((t) => t.tag && t.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  const out: Locale[] = [];
  for (const { tag } of tags) {
    const [language, ...subtags] = tag.split("-");
    if (language === "en" || language === "*") continue;
    const latin = subtags.includes("latn");
    const matches = allLocales
      .filter((l) => l.split("-")[0].toLowerCase() === language)
      .sort((a, b) => Number(b.includes("-Latn-") === latin) - Number(a.includes("-Latn-") === latin));
    for (const l of matches) if (!out.includes(l)) out.push(l);
  }
  return out;
}

export type RankInput = VisitorRegion & {
  /** The vspl_lang cookie. */
  chosen?: string;
  acceptLanguage?: string | null;
  /** The visitor's city from the request, which narrows the state to a market. */
  city?: string;
  /** The market the request names (?cluster= or UTM tags): area intent the proxy can see. */
  intent?: ClusterId;
  /** The page's own market. */
  cluster?: ClusterId;
  /** Picks remembered in the vs_ctx cookie (src/context/store.ts), and when this session began. */
  picks?: readonly Pick[];
  sessionStart?: number;
  /** A decided market from the browser (the header switch: src/context/use-context.ts). */
  decided?: string;
};

/**
 * The market a request's URL names: ?cluster=<market>, else the first
 * market in its UTM tags. A cluster that is not a market (saharanpur,
 * other) names none.
 */
export function urlIntent(search: URLSearchParams): MarketId | undefined {
  const param = search.get("cluster");
  if (isMarketId(param)) return param;
  // The same tags the browser reads (src/context/store.ts).
  return marketsInAdTags(["utm_campaign", "utm_term", "utm_content", "utm_source"].map((k) => search.get(k)))[0];
}

/**
 * The visitor context for one request's language order (src/context/core.ts):
 * the same ranking the browser runs, on what a request carries.
 */
function languageContext(available: readonly Locale[], input: RankInput) {
  const region = input.country === "IN" ? canonicalRegion(input.region) : undefined;
  const market = input.country === "IN" ? geoMarket(region, input.city) : undefined;
  const now = Date.now();
  return resolveContext(
    {
      now,
      sessionStart: input.sessionStart ?? now,
      page: { market: isMarketId(input.cluster) ? input.cluster : undefined, audience: "mixed", locale: ALWAYS, locales: available },
      picks: input.picks ?? (isMarketId(input.decided) ? [{ kind: "link", market: input.decided, at: now }] : []),
      arrival: isMarketId(input.intent) ? { param: input.intent } : undefined,
      geo: input.country
        ? { country: input.country, state: region, market, level: market && marketForPlace(input.city, { region, match: "exact" }) ? "city" : "state" }
        : undefined,
      deviceLocales: acceptLanguageLocales(input.acceptLanguage),
      languagePick: allLocales.find((l) => l === input.chosen),
    },
    contextTables(),
  ).language;
}

/** The page's languages (`available`) in picker order for one request. */
export function rankLocales(available: readonly Locale[], input: RankInput): Locale[] {
  return languageContext(available, input).order as Locale[];
}

/**
 * The large choices for a request: the first PICKER_TOP, with English and
 * the phone's first language the page has always among them.
 */
export function rankTop(available: readonly Locale[], input: RankInput): Locale[] {
  return languageContext(available, input).top as Locale[];
}

/**
 * The large choices for an order alone: its first PICKER_TOP, with English
 * always among them (it takes the last place when the order ranks it lower).
 */
export function topChoices(order: readonly Locale[]): Locale[] {
  const top = order.slice(0, PICKER_TOP);
  if (!order.includes(ALWAYS) || top.includes(ALWAYS)) return top;
  return [...top.slice(0, PICKER_TOP - 1), ALWAYS];
}

/** "hi-hl-en": the top choices of an order, as one URL segment. */
export function orderKey(order: readonly Locale[]) {
  return keyOf(topChoices(order));
}
const keyOf = (top: readonly Locale[]) => top.map((l) => KEY_CODES[l]).join("-");

/** Every top-choice order a page can show (English always among them): one prerendered picker variant each. */
export function orderKeys(path: string): string[] {
  const available = preferredLocales(path);
  const size = Math.min(PICKER_TOP, available.length);
  const build = (prefix: Locale[]): Locale[][] =>
    prefix.length === size ? [prefix] : available.filter((l) => !prefix.includes(l)).flatMap((l) => build([...prefix, l]));
  return build([])
    .filter((top) => !available.includes(ALWAYS) || top.includes(ALWAYS))
    .map(orderKey);
}

/** Paths whose picker carries a share-image variant (?role=, ?hub=, ?work=). */
const VARIANT_PATHS = new Set(["/jobs/apply"]);

/** Picker variant segments for a path: every order key, times every share variant where it applies. */
export function rankSegments(path: string): string[] {
  const variants = VARIANT_PATHS.has(path) ? QUICK_SHARE_VARIANTS : [""];
  return orderKeys(path).flatMap((key) => variants.map((v) => (v ? `${key}_${v}` : key)));
}

/**
 * Read a picker variant segment: the full order of the page's languages
 * (the key's choices, then the rest in default order) and the share
 * variant. Undefined when the segment is not one rankSegments made.
 */
export function parseRankSegment(segment: string, path: string): { key: string; order: Locale[]; variant: string } | undefined {
  if (!rankSegments(path).includes(segment)) return undefined;
  const [key, variant = ""] = segment.split("_");
  const top = key.split("-").map((code) => CODE_LOCALES[code]);
  const rest = rankLocales(preferredLocales(path), {}).filter((l) => !top.includes(l));
  return { key, order: [...top, ...rest], variant };
}

/**
 * Whether a URL segment is shaped like a picker variant (for 308s from
 * direct visits): 2–3 distinct language codes joined by "-", then
 * optionally "_" and a share variant. "/select-language/hi" is a path, not a key.
 */
export function isRankSegment(segment: string | undefined) {
  if (!segment) return false;
  const [key, variant, ...extra] = segment.split("_");
  const codes = key.split("-");
  return (
    extra.length === 0 &&
    codes.length >= 2 &&
    codes.length <= PICKER_TOP &&
    new Set(codes).size === codes.length &&
    codes.every((code) => code in CODE_LOCALES) &&
    (variant === undefined || (variant !== "" && QUICK_SHARE_VARIANTS.includes(variant)))
  );
}

/**
 * The picker variant segment for a request to a prompt page's neutral URL.
 * `search` carries the share variant for /jobs/apply.
 */
export function rankSegmentFor(path: string, input: RankInput, search: URLSearchParams): string {
  const key = keyOf(
    rankTop(preferredLocales(path), { ...input, intent: input.intent ?? urlIntent(search), cluster: input.cluster ?? pageCluster(path) }),
  );
  const variant = VARIANT_PATHS.has(path)
    ? quickShareVariant({ role: search.get("role"), hub: search.get("hub"), work: search.get("work") })
    : "";
  return variant ? `${key}_${variant}` : key;
}
