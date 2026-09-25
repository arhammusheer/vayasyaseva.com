import localFont from "next/font/local";

export const brandDisplay = localFont({
  src: "../assets/fonts/Anek Latin/AnekLatin-Variable.ttf",
  variable: "--font-anek",
  weight: "500 700",
  display: "swap",
});

export const brandSerif = localFont({
  src: [
    { path: "../assets/fonts/Hind/Hind-Regular.ttf", weight: "400" },
    { path: "../assets/fonts/Hind/Hind-Medium.ttf", weight: "500" },
    { path: "../assets/fonts/Hind/Hind-SemiBold.ttf", weight: "600" },
    { path: "../assets/fonts/Hind/Hind-Bold.ttf", weight: "700" },
  ],
  variable: "--font-hind",
  display: "swap",
});

export const brandMono = localFont({
  src: "../assets/fonts/JetBrains Mono/JetBrainsMono-Variable.ttf",
  variable: "--font-jetbrains",
  weight: "400 500",
  display: "swap",
  preload: false,
});
