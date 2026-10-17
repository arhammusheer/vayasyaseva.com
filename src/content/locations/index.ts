import type { LocationCopy } from "./types";
import { uttarakhandPages } from "./uttarakhand";
import { bengaluruPages } from "./bengaluru";
import { delhiNcrPages } from "./delhi-ncr";
import { jalandharPages } from "./jalandhar";
import { LOCATIONS_PATH, estatePath, locationPath } from "@/content/registry/identifiers";

/** Every location page's copy, by path. Filled region by region (uttarakhand.ts, bengaluru.ts, delhi-ncr.ts, jalandhar.ts). */
const pages: LocationCopy[] = [...uttarakhandPages, ...delhiNcrPages, ...jalandharPages, ...bengaluruPages];

export const locationPages: ReadonlyMap<string, LocationCopy> = new Map(
  pages.map((p) => [p.estate ? estatePath(p.cluster, p.estate) : locationPath(p.cluster), p]),
);

export const locationsIndexPath = LOCATIONS_PATH;
export type { LocationCopy };
