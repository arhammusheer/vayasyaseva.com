import images from "@/content/share-images.json";
import { splitLocalePath, FALLBACK_LOCALE } from "./i18n";

/** Only catalogue entries can become share images; no personal prefills. */
/** Alt text for the home share card, which pages without their own card fall back to. */
export const HOME_SHARE_ALT = "Vayasya Seva: contract labour for factories, warehouses and facilities";

/** True when the page has its own share card rather than the home fallback. */
export function hasOwnShareImage(canonical: string, variant = "") {
  const { locale = FALLBACK_LOCALE, path } = splitLocalePath(canonical.split("?")[0]);
  const catalogue = images as Record<string, string>;
  return Boolean(catalogue[`${locale}:${path}:${variant}`] ?? catalogue[`${locale}:${path}:`]) || path === "/";
}

export function shareImageUrl(canonical: string, variant = "") {
  const { locale = FALLBACK_LOCALE, path } = splitLocalePath(canonical.split("?")[0]);
  const catalogue = images as Record<string, string>;
  return catalogue[`${locale}:${path}:${variant}`] ?? catalogue[`${locale}:${path}:`] ?? catalogue["en-IN:/:"];
}
