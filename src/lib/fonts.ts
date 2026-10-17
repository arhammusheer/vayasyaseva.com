import localFont from "next/font/local";

export const brandDisplay = localFont({
  src: "../assets/fonts/optimized/AnekLatin-Latin.woff2",
  variable: "--font-anek",
  weight: "500 700",
  display: "swap",
});

export const brandSerif = localFont({
  src: [
    { path: "../assets/fonts/optimized/Hind-Regular-Latin.woff2", weight: "400" },
    { path: "../assets/fonts/optimized/Hind-Medium-Latin.woff2", weight: "500" },
    { path: "../assets/fonts/optimized/Hind-SemiBold-Latin.woff2", weight: "600" },
    { path: "../assets/fonts/optimized/Hind-Bold-Latin.woff2", weight: "700" },
  ],
  variable: "--font-hind",
  display: "swap",
});

export const brandMono = localFont({
  src: "../assets/fonts/optimized/JetBrainsMono-Latin.woff2",
  variable: "--font-jetbrains",
  weight: "400 500",
  display: "swap",
  preload: false,
});

/*
 * Every script in its own cut of the two brand families (scripts/build-web-fonts.py):
 *   headings  Anek Latin · Anek Devanagari · Anek Kannada · Anek Gurmukhi
 *   body      Hind · Hind (Devanagari) · Hind Mysuru · Hind Jalandhar
 * Each file holds one script and declares its unicode-range, so browsers
 * download it only when that script renders: English pages fetch none of
 * them. Anek's Indic cuts are variable (500–600, every heading weight the CSS
 * uses). For Hind, SemiBold covers 500 and 600, as on the Devanagari cut.
 * Font loader options must be literals, so each range is repeated here and
 * in the build script's RANGES. Stack order is in globals.css (--font-display,
 * --font-sans), with Gurmukhi before Devanagari on Punjabi pages.
 */
export const brandSerifDevanagari = localFont({
  src: [
    { path: "../assets/fonts/optimized/Hind-Regular-Devanagari.woff2", weight: "400" },
    { path: "../assets/fonts/optimized/Hind-SemiBold-Devanagari.woff2", weight: "500 600" },
    { path: "../assets/fonts/optimized/Hind-Bold-Devanagari.woff2", weight: "700" },
  ],
  variable: "--font-hind-deva",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+20A8, U+20B9, U+20F0, U+25CC, U+A830-A839, U+A8E0-A8FF",
    },
  ],
});

export const brandDisplayDevanagari = localFont({
  src: "../assets/fonts/optimized/AnekDevanagari-Devanagari.woff2",
  variable: "--font-anek-deva",
  weight: "500 600",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value:
        "U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+20A8, U+20B9, U+20F0, U+25CC, U+A830-A839, U+A8E0-A8FF",
    },
  ],
});

export const brandDisplayKannada = localFont({
  src: "../assets/fonts/optimized/AnekKannada-Kannada.woff2",
  variable: "--font-anek-knda",
  weight: "500 600",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value: "U+0C80-0CF3, U+1CD0, U+1CD2-1CD3, U+1CDA, U+1CF2, U+1CF4, U+200C-200D, U+20B9, U+25CC, U+A830-A835",
    },
  ],
});

export const brandSerifKannada = localFont({
  src: [
    { path: "../assets/fonts/optimized/HindMysuru-Regular-Kannada.woff2", weight: "400" },
    { path: "../assets/fonts/optimized/HindMysuru-SemiBold-Kannada.woff2", weight: "500 600" },
    { path: "../assets/fonts/optimized/HindMysuru-Bold-Kannada.woff2", weight: "700" },
  ],
  variable: "--font-hind-knda",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value: "U+0C80-0CF3, U+1CD0, U+1CD2-1CD3, U+1CDA, U+1CF2, U+1CF4, U+200C-200D, U+20B9, U+25CC, U+A830-A835",
    },
  ],
});

export const brandDisplayGurmukhi = localFont({
  src: "../assets/fonts/optimized/AnekGurmukhi-Gurmukhi.woff2",
  variable: "--font-anek-guru",
  weight: "500 600",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value: "U+0951-0952, U+0964-0965, U+0A01-0A76, U+200C-200D, U+20B9, U+25CC, U+262C, U+A830-A839",
    },
  ],
});

export const brandSerifGurmukhi = localFont({
  src: [
    { path: "../assets/fonts/optimized/HindJalandhar-Regular-Gurmukhi.woff2", weight: "400" },
    { path: "../assets/fonts/optimized/HindJalandhar-SemiBold-Gurmukhi.woff2", weight: "500 600" },
    { path: "../assets/fonts/optimized/HindJalandhar-Bold-Gurmukhi.woff2", weight: "700" },
  ],
  variable: "--font-hind-guru",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [
    {
      prop: "unicode-range",
      value: "U+0951-0952, U+0964-0965, U+0A01-0A76, U+200C-200D, U+20B9, U+25CC, U+262C, U+A830-A839",
    },
  ],
});

/** Every brand font's CSS variable, for the root element. */
export const brandFontVariables = [
  brandDisplay,
  brandSerif,
  brandMono,
  brandSerifDevanagari,
  brandDisplayDevanagari,
  brandDisplayKannada,
  brandSerifKannada,
  brandDisplayGurmukhi,
  brandSerifGurmukhi,
]
  .map((f) => f.variable)
  .join(" ");
