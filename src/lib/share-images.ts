import images from "@/content/share-images.json";
import { splitLocalePath, FALLBACK_LOCALE } from "./i18n";

/** Only catalogue entries can become share images; no personal prefills. */
export function shareImageUrl(canonical: string, variant = "") {
  const { locale = FALLBACK_LOCALE, path } = splitLocalePath(canonical.split("?")[0]);
  const catalogue = images as Record<string, string>;
  return catalogue[`${locale}:${path}:${variant}`] ?? catalogue[`${locale}:${path}:`] ?? catalogue["en-IN:/:"];
}
