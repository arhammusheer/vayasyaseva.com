import { Anek_Devanagari, Hind, JetBrains_Mono } from "next/font/google";

export const brandDisplay = Anek_Devanagari({
  variable: "--font-anek",
  subsets: ["latin", "devanagari"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const brandSerif = Hind({
  variable: "--font-hind",
  subsets: ["latin", "devanagari"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const brandMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});
