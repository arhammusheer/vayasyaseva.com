/**
 * The core palette published on /brand: Gold and Neutral. Values mirror the
 * tokens in globals.css. The extended ramps, state colours, dark surfaces and
 * type scale are internal (docs/brand-rules.md).
 */
export interface Swatch {
  name: string;
  hex: string;
  note?: string;
}
export interface Scale {
  id: string;
  title: string;
  role: string;
  swatches: Swatch[];
}

const scale = (prefix: string, stops: [string, string][]) =>
  stops.map(([step, hex]) => ({ name: `${prefix} ${step}`, hex }));

export const palette: Scale[] = [
  {
    id: "gold",
    title: "Gold",
    role: "Master brand, and the colour every Vayasya product carries: Seva and Setu alike. Gold 500 is the brand colour; 700 is the accessible cut for text on light surfaces.",
    swatches: scale("Gold", [
      ["50", "#FFF9E8"],
      ["100", "#FDF1CF"],
      ["200", "#FAE19E"],
      ["300", "#F4CD6D"],
      ["400", "#EBB74A"],
      ["500", "#DAA236"],
      ["600", "#B98621"],
      ["700", "#8F6818"],
      ["800", "#6A4C12"],
      ["900", "#48330B"],
      ["950", "#2C1F06"],
    ]),
  },
  {
    id: "neutral",
    title: "Neutral",
    role: "Everything else. White and cool grey carry text, surfaces and borders; Neutral 900 is the brand navy.",
    swatches: scale("Neutral", [
      ["0", "#FFFFFF"],
      ["25", "#FCFCFD"],
      ["50", "#F8FAFC"],
      ["100", "#F1F5F9"],
      ["200", "#E2E8F0"],
      ["300", "#CBD5E1"],
      ["400", "#94A3B8"],
      ["500", "#64748B"],
      ["600", "#475569"],
      ["700", "#334155"],
      ["800", "#1E293B"],
      ["900", "#0F172A"],
      ["950", "#020617"],
    ]),
  },
];
