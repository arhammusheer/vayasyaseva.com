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

/**
 * Devanagari-only cuts for Hindi pages. The unicode-range keeps them off
 * English pages: browsers download them only when Devanagari text renders.
 * Font loader options must be literals, so the range is repeated.
 */
export const brandDisplayDevanagari = localFont({
  src: "../assets/fonts/optimized/AnekDevanagari-Devanagari.woff2",
  variable: "--font-anek-deva",
  weight: "500",
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

export const brandSerifDevanagari = localFont({
  src: [
    { path: "../assets/fonts/optimized/Hind-Regular-Devanagari.woff2", weight: "400" },
    { path: "../assets/fonts/optimized/Hind-Medium-Devanagari.woff2", weight: "500" },
    { path: "../assets/fonts/optimized/Hind-SemiBold-Devanagari.woff2", weight: "600" },
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
