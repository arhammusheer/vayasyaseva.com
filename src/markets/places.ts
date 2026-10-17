/**
 * Place ids a link may name in "Request a crew"'s `#location=` (src/lib/crew-request.ts):
 * one per location page (hub and estate, src/content/locations) plus a few
 * industrial areas named on them. Stored values: they are in shared links,
 * so add ids, never rename or remove one (tests/fixtures/stored-ids.lock.json).
 *
 * Layer 1: data only, dependency-free except types.
 */
import type { MarketId } from "./data";

export type Place = {
  /** The crew form's state code; empty when the place spans states. */
  state: string;
  /** The city line the form is prefilled with; empty for a whole state. */
  city: string;
  market: MarketId;
};

export const PLACES_BY_ID = {
  // The location pages (src/content/locations): one id per hub and estate.
  haridwar: { state: "UK", city: "Haridwar", market: "haridwar" },
  sidcul: { state: "UK", city: "SIDCUL Haridwar", market: "haridwar" },
  "sidcul-haridwar": { state: "UK", city: "SIDCUL Haridwar", market: "haridwar" },
  bhagwanpur: { state: "UK", city: "Bhagwanpur, Haridwar", market: "haridwar" },
  bahadrabad: { state: "UK", city: "Bahadrabad, Haridwar", market: "haridwar" },
  roorkee: { state: "UK", city: "Roorkee, Haridwar", market: "haridwar" },
  uttarakhand: { state: "UK", city: "", market: "uttarakhand" },
  selaqui: { state: "UK", city: "Selaqui, Dehradun", market: "uttarakhand" },
  bengaluru: { state: "KA", city: "Bengaluru", market: "bengaluru" },
  peenya: { state: "KA", city: "Peenya, Bengaluru", market: "bengaluru" },
  "bommasandra-jigani-attibele": { state: "KA", city: "Bommasandra / Jigani / Attibele", market: "bengaluru" },
  "electronic-city-whitefield": { state: "KA", city: "Electronic City / Whitefield, Bengaluru", market: "bengaluru" },
  "hoskote-narasapura": { state: "KA", city: "Hoskote / Narasapura", market: "bengaluru" },
  "delhi-ncr": { state: "", city: "Delhi NCR", market: "delhi-ncr" },
  "gurugram-manesar": { state: "HR", city: "Gurugram / Manesar", market: "delhi-ncr" },
  "noida-greater-noida": { state: "UP", city: "Noida / Greater Noida", market: "delhi-ncr" },
  "faridabad-ghaziabad": { state: "", city: "Faridabad / Ghaziabad", market: "delhi-ncr" },
  "delhi-industrial-areas": { state: "DL", city: "Delhi", market: "delhi-ncr" },
  jalandhar: { state: "PB", city: "Jalandhar / Kapurthala", market: "jalandhar" },
  kapurthala: { state: "PB", city: "Kapurthala", market: "jalandhar" },
  "phagwara-goraya": { state: "PB", city: "Phagwara / Goraya", market: "jalandhar" },
  "jalandhar-focal-point": { state: "PB", city: "Focal Point, Jalandhar", market: "jalandhar" },
} as const satisfies Record<string, Place>;

export type PlaceId = keyof typeof PLACES_BY_ID;
