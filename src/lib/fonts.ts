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
