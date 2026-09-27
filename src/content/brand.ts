/** Brand palette published on /brand. Values mirror the tokens in globals.css. */
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
  {
    id: "saffron",
    title: "Saffron",
    role: "Extended palette for charts, templates and theme options.",
    swatches: scale("Saffron", [
      ["50", "#FFF6ED"],
      ["100", "#FFE9D3"],
      ["200", "#FDCFA8"],
      ["300", "#F9B379"],
      ["400", "#F38E46"],
      ["500", "#E06C24"],
      ["600", "#BA511A"],
      ["700", "#8F3F17"],
      ["800", "#6E3215"],
      ["900", "#552811"],
      ["950", "#301306"],
    ]),
  },
  {
    id: "indigo",
    title: "Indigo",
    role: "Extended palette for charts, templates and theme options.",
    swatches: scale("Indigo", [
      ["50", "#F4F7FD"],
      ["100", "#E7EDF8"],
      ["200", "#CEDAF0"],
      ["300", "#A8BDE4"],
      ["400", "#7D98D5"],
      ["500", "#5B77C4"],
      ["600", "#445FA8"],
      ["700", "#374B85"],
      ["800", "#2D3E6C"],
      ["900", "#273558"],
      ["950", "#151D33"],
    ]),
  },
  {
    id: "forest",
    title: "Forest",
    role: "Extended palette for charts, templates and theme options.",
    swatches: scale("Forest", [
      ["50", "#F1FAF6"],
      ["100", "#DBF2E8"],
      ["200", "#B9E4D1"],
      ["300", "#8CCFB1"],
      ["400", "#5FB58F"],
      ["500", "#3D966F"],
      ["600", "#2E7A58"],
      ["700", "#256146"],
      ["800", "#204D38"],
      ["900", "#1B402F"],
      ["950", "#0F261C"],
    ]),
  },
  {
    id: "slate",
    title: "Slate",
    role: "Extended palette for charts, templates and theme options.",
    swatches: scale("Slate", [
      ["50", "#F7F8FA"],
      ["100", "#EDEFF3"],
      ["200", "#D8DCE4"],
      ["300", "#B8BFCC"],
      ["400", "#919BAB"],
      ["500", "#6F7A8D"],
      ["600", "#556073"],
      ["700", "#434C5D"],
      ["800", "#353C4A"],
      ["900", "#2A303C"],
      ["950", "#171B22"],
    ]),
  },
  {
    id: "state",
    title: "State",
    role: "Semantic status only. Never decorative.",
    swatches: [
      { name: "Success", hex: "#1F7A4D" },
      { name: "Info", hex: "#215EA6" },
      { name: "Warning", hex: "#A45E0C" },
      { name: "Danger", hex: "#B42318" },
      { name: "Pending", hex: "#556073" },
      { name: "Locked", hex: "#4A4458", note: "Frozen or final; waiting on nobody" },
    ],
  },
];

/**
 * Dark surfaces. The brand has no separate dark palette: dark mode is the
 * neutral and gold ramps turned over, with each pairing checked against WCAG
 * 2.x contrast. Setu's dark theme is built from exactly these.
 */
export const darkSurfaces: Scale = {
  id: "dark",
  title: "Dark surfaces",
  role: "Dark mode uses the same ramps turned over. Text pairings clear 4.5:1 on their surface; gold text uses 300, never 500.",
  swatches: [
    { name: "Canvas · Neutral 950", hex: "#020617" },
    { name: "Surface · Neutral 900", hex: "#0F172A" },
    { name: "Muted and rules · Neutral 800", hex: "#1E293B" },
    { name: "Text · Neutral 50", hex: "#F8FAFC", note: "19.3:1 on canvas" },
    { name: "Secondary text · Neutral 300", hex: "#CBD5E1", note: "12.0:1 on surface" },
    { name: "Placeholder · Neutral 400", hex: "#94A3B8", note: "7.0:1 on surface" },
    { name: "Brand text · Gold 300", hex: "#F4CD6D", note: "11.7:1 on surface" },
    { name: "Focus · Gold 400", hex: "#EBB74A", note: "11.0:1 on canvas" },
  ],
};

export const typeScale = [
  {
    level: "Display",
    family: "Anek Latin",
    weight: 500,
    size: "40 / 48",
    use: "Page titles, hero statements",
  },
  {
    level: "Heading",
    family: "Anek Latin",
    weight: 500,
    size: "30 / 38",
    use: "Section headings",
  },
  {
    level: "Body",
    family: "Hind",
    weight: 400,
    size: "18 / 30",
    use: "Reading copy, interface text",
  },
  {
    level: "Data",
    family: "JetBrains Mono",
    weight: 500,
    size: "14 / 22",
    use: "Tables, identifiers, aligned values",
  },
];
