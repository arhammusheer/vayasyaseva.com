/**
 * The place each market's buyer page serves, as schema.org types, for
 * areaServed (src/lib/structured-data.tsx). Layer 1b: a separate entry point
 * from ./index.ts, imported by structured data only.
 */
import type { BusinessMarketId } from "./data";

export type SchemaPlace = {
  "@type": "City" | "State" | "Place";
  name: string;
  alternateName?: string | readonly string[];
  containedInPlace?: { "@type": "State"; name: string };
};

export const MARKET_PLACES = {
  bengaluru: {
    "@type": "City",
    name: "Bengaluru",
    alternateName: "Bangalore",
    containedInPlace: { "@type": "State", name: "Karnataka" },
  },
  dehradun: {
    "@type": "City",
    name: "Dehradun",
    alternateName: ["Dehra Dun", "Selaqui"],
    containedInPlace: { "@type": "State", name: "Uttarakhand" },
  },
  "delhi-ncr": { "@type": "Place", name: "Delhi NCR", alternateName: "National Capital Region" },
  haridwar: {
    "@type": "City",
    name: "Haridwar",
    alternateName: ["SIDCUL Haridwar", "Integrated Industrial Estate (IIE) Haridwar"],
    containedInPlace: { "@type": "State", name: "Uttarakhand" },
  },
  hyderabad: {
    "@type": "City",
    name: "Hyderabad",
    alternateName: ["Secunderabad", "Cyberabad"],
    containedInPlace: { "@type": "State", name: "Telangana" },
  },
  jalandhar: { "@type": "Place", name: "Jalandhar and Kapurthala", containedInPlace: { "@type": "State", name: "Punjab" } },
  uttarakhand: { "@type": "State", name: "Uttarakhand" },
  visakhapatnam: {
    "@type": "City",
    name: "Visakhapatnam",
    alternateName: ["Vizag", "Vishakhapatnam"],
    containedInPlace: { "@type": "State", name: "Andhra Pradesh" },
  },
} as const satisfies Record<BusinessMarketId, SchemaPlace>;
