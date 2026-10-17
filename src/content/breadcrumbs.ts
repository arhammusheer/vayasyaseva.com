/**
 * Short names of the pages that are breadcrumb parents (the registry's
 * `parent` chain, src/content/registry/pages.ts). The current page passes its
 * own name; only ancestors are named here. A language without its own name
 * uses the English one, as its link opens the English page too.
 *
 * The Hindi and Hinglish names match the pages' own copy (jobs.ts,
 * minimum-wages.hi.ts).
 *
 * Jobs pages: the visible trail starts at Jobs, not Home (src/lib/
 * breadcrumbs.ts visibleTrail). Home opens the English business site, which
 * a seeker on the jobs side should not land on by tapping the first crumb;
 * the jobs logo goes to /jobs for the same reason. The JSON-LD keeps Home.
 */
import type { LocaleTag } from "@/content/registry/identifiers";

export const BREADCRUMB_NAMES: Readonly<Record<string, { "en-IN": string } & Partial<Record<LocaleTag, string>>>> = {
  // English only: the home page is English only.
  "/": { "en-IN": "Home" },
  "/services": { "en-IN": "Services" },
  "/about": { "en-IN": "About" },
  "/locations": { "en-IN": "Locations" },
  "/locations/uttarakhand": { "en-IN": "Uttarakhand" },
  "/locations/bengaluru": { "en-IN": "Bengaluru" },
  "/locations/delhi-ncr": { "en-IN": "Delhi NCR" },
  "/locations/jalandhar": { "en-IN": "Jalandhar and Kapurthala" },
  "/minimum-wages": { "en-IN": "Minimum wages", "hi-IN": "न्यूनतम मजदूरी" },
  "/jobs": { "en-IN": "Jobs", "hi-IN": "नौकरी", "hi-Latn-IN": "Jobs", "pa-IN": "ਨੌਕਰੀਆਂ" },
};
