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
  // Selaqui files under Dehradun since its market opened (18 Oct 2026).
  selaqui: { state: "UK", city: "Selaqui, Dehradun", market: "dehradun" },
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
  // The Kapurthala estate page sits under the Jalandhar region's buyer page,
  // which serves Kapurthala's buyers (its jobs market is its own, 20 Oct 2026).
  kapurthala: { state: "PB", city: "Kapurthala", market: "jalandhar" },
  "phagwara-goraya": { state: "PB", city: "Phagwara / Goraya", market: "jalandhar" },
  "jalandhar-focal-point": { state: "PB", city: "Focal Point, Jalandhar", market: "jalandhar" },
  dehradun: { state: "UK", city: "Dehradun", market: "dehradun" },
  // Visakhapatnam (22 Oct 2026): the hub and its four belts. Parawada and
  // Atchutapuram are in Anakapalli district, carved out of Visakhapatnam's in 2022.
  visakhapatnam: { state: "AP", city: "Visakhapatnam", market: "visakhapatnam" },
  "parawada-pharma-city": { state: "AP", city: "JN Pharma City, Parawada", market: "visakhapatnam" },
  "atchutapuram-rambilli": { state: "AP", city: "APSEZ Atchutapuram / Rambilli", market: "visakhapatnam" },
  "duvvada-vsez": { state: "AP", city: "VSEZ Duvvada, Visakhapatnam", market: "visakhapatnam" },
  gajuwaka: { state: "AP", city: "Gajuwaka, Visakhapatnam", market: "visakhapatnam" },
  // Hyderabad (27 Oct 2026): the hub and its five belts, in Sangareddy,
  // Medchal-Malkajgiri and Rangareddy districts. TS is the crew form's code.
  hyderabad: { state: "TS", city: "Hyderabad", market: "hyderabad" },
  "patancheru-pashamylaram": { state: "TS", city: "Patancheru / Pashamylaram", market: "hyderabad" },
  "jeedimetla-medchal": { state: "TS", city: "Jeedimetla / Medchal", market: "hyderabad" },
  "cherlapally-nacharam": { state: "TS", city: "Cherlapally / Nacharam, Hyderabad", market: "hyderabad" },
  "genome-valley": { state: "TS", city: "Genome Valley, Shamirpet", market: "hyderabad" },
  "shamshabad-kothur": { state: "TS", city: "Shamshabad / Kothur", market: "hyderabad" },
} as const satisfies Record<string, Place>;

export type PlaceId = keyof typeof PLACES_BY_ID;
