import type { LocationCopy } from "./types";
import type { LocaleTag } from "@/content/registry/identifiers";
import { haridwarPages } from "./haridwar";
import { uttarakhandPages } from "./uttarakhand";
import { bengaluruPages } from "./bengaluru";
import { delhiNcrPages } from "./delhi-ncr";
import { jalandharPages } from "./jalandhar";
import { dehradunPages } from "./dehradun";
import { hyderabadPages } from "./hyderabad";
import { visakhapatnamPages } from "./visakhapatnam";
import { LOCATIONS_PATH, estatePath, locationPath } from "@/content/registry/identifiers";

/** Every location page's copy, by path. Filled region by region (one file per region). */
const pages: LocationCopy[] = [...uttarakhandPages, ...delhiNcrPages, ...jalandharPages, ...bengaluruPages, ...haridwarPages, ...dehradunPages, ...visakhapatnamPages, ...hyderabadPages];

export const locationPages: ReadonlyMap<string, LocationCopy> = new Map(
  pages.map((p) => [p.estate ? estatePath(p.cluster, p.estate) : locationPath(p.cluster), p]),
);

export const locationsIndexPath = LOCATIONS_PATH;

/** A page's copy in a language: its translation over the English, else the English. */
export function locationCopyIn(page: LocationCopy, locale: LocaleTag): LocationCopy {
  const t = locale === "en-IN" ? undefined : page.translations?.[locale];
  return t ? { ...page, ...t } : page;
}
export type { LocationCopy };
