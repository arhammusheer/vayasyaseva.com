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
 * 3. the visitor's state, from the request's geo headers (visitorRegion);
 * 4. the page's cluster;
 * 5. the default set.
 *
 * Nothing here redirects or changes a locale URL: /hi-in/jobs is always Hindi.
 * Imported by the proxy: keep it light.
 */
import { pageEntries, pageEntry } from "@/content/registry";
import type { ClusterId } from "@/content/registry/identifiers";
import { quickShareVariant, QUICK_SHARE_VARIANTS } from "./share-variant";
import { allLocales, preferredLocales, type Locale } from "./i18n";

export { LANGUAGE_COOKIE } from "./language-cookie";

/** How many languages the picker shows as large choices; the rest go under "More languages". */
export const PICKER_TOP = 3;

/** Short codes for the order key in the picker variant's URL ("hi-hl-en"). */
const KEY_CODES = { "en-IN": "en", "hi-IN": "hi", "hi-Latn-IN": "hl" } as const satisfies Record<Locale, string>;
const CODE_LOCALES = Object.fromEntries(Object.entries(KEY_CODES).map(([l, c]) => [c, l])) as Record<string, Locale>;

/**
 * Picker orders per region (PLAN §6.4). Maharashtra gets a set only if it is
 * promoted (with mr-IN); until then it falls to the default. Karnataka puts
 * kn-IN first once it is published; until then it reads English · Hinglish · हिंदी.
 */
const RANK_SETS = {
  hindi: ["hi-IN", "hi-Latn-IN", "en-IN"],
  karnataka: ["en-IN", "hi-Latn-IN", "hi-IN"],
  punjab: ["hi-Latn-IN", "en-IN", "hi-IN"],
  default: ["en-IN", "hi-IN", "hi-Latn-IN"],
} as const satisfies Record<string, readonly Locale[]>;
type RankSet = keyof typeof RANK_SETS;

/**
 * ISO 3166-2:IN subdivision codes (without "IN-"). Old and new codes both
 * map: Uttarakhand UK/UT, Chhattisgarh CG/CT, Telangana TG/TS (default set).
 */
const REGION_SETS: Readonly<Record<string, RankSet>> = {
  UT: "hindi", UK: "hindi", UP: "hindi", DL: "hindi", HR: "hindi", RJ: "hindi", MP: "hindi",
  BR: "hindi", JH: "hindi", CG: "hindi", CT: "hindi", HP: "hindi", CH: "hindi",
  KA: "karnataka",
  PB: "punjab",
};

/** A page's cluster fills gaps only: the path says where the job is, not what the reader reads. */
const CLUSTER_SETS: Readonly<Record<ClusterId, RankSet | undefined>> = {
  haridwar: "hindi",
  uttarakhand: "hindi",
  "delhi-ncr": "hindi",
  saharanpur: "hindi",
  jalandhar: "punjab",
  bengaluru: "karnataka",
  other: undefined,
};

/**
 * The cluster of a jobs page without one of its own (/jobs, /jobs/apply,
 * the role pages and hubs): the one cluster with a published jobs hub, while
 * there is only one. Today every opening is in SIDCUL Haridwar, so a
 * visitor whose region is missing or misread (mobile CGNAT often places a
 * phone in a gateway state) still gets the Hindi-belt order there. With a
 * second jobs hub this returns undefined and those pages use the default.
 */
const JOBS_CLUSTER: ClusterId | undefined = (() => {
  const hubs = new Set(
    pageEntries
      .filter((p) => p.kind === "jobs-city" && p.cluster && Object.values(p.locales).includes("published"))
      .map((p) => p.cluster!),
  );
  return hubs.size === 1 ? [...hubs][0] : undefined;
})();

/** The cluster that fills gaps in a page's order: its own, else the jobs cluster for jobs pages. */
export function pageCluster(path: string): ClusterId | undefined {
  const entry = pageEntry(path);
  return entry?.cluster ?? (entry?.audience === "jobs" ? JOBS_CLUSTER : undefined);
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
  cluster?: ClusterId;
};

/** The page's languages (`available`) in picker order for one request. */
export function rankLocales(available: readonly Locale[], input: RankInput): Locale[] {
  const order: Locale[] = [];
  const add = (locale: Locale) => {
    if (available.includes(locale) && !order.includes(locale)) order.push(locale);
  };
  const chosen = allLocales.find((l) => l === input.chosen);
  if (chosen) add(chosen);
  acceptLanguageLocales(input.acceptLanguage).forEach(add);
  if (input.country === "IN") {
    const set = input.region ? REGION_SETS[input.region] : undefined;
    if (set) RANK_SETS[set].forEach(add);
  } else if (input.country) {
    RANK_SETS.default.forEach(add);
  }
  const clusterSet = input.cluster ? CLUSTER_SETS[input.cluster] : undefined;
  if (clusterSet) RANK_SETS[clusterSet].forEach(add);
  RANK_SETS.default.forEach(add);
  available.forEach(add);
  return order;
}

/** "hi-hl-en": the top choices of an order, as one URL segment. */
export function orderKey(order: readonly Locale[]) {
  return order
    .slice(0, PICKER_TOP)
    .map((l) => KEY_CODES[l])
    .join("-");
}

/** Every top-choice order a page can show: one prerendered picker variant each. */
export function orderKeys(path: string): string[] {
  const available = preferredLocales(path);
  const size = Math.min(PICKER_TOP, available.length);
  const build = (prefix: Locale[]): Locale[][] =>
    prefix.length === size ? [prefix] : available.filter((l) => !prefix.includes(l)).flatMap((l) => build([...prefix, l]));
  return build([]).map(orderKey);
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
  const key = orderKey(rankLocales(preferredLocales(path), { ...input, cluster: input.cluster ?? pageCluster(path) }));
  const variant = VARIANT_PATHS.has(path)
    ? quickShareVariant({ role: search.get("role"), hub: search.get("hub"), work: search.get("work") })
    : "";
  return variant ? `${key}_${variant}` : key;
}
