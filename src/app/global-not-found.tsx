import "./globals.css";
import type { Metadata } from "next";
import NotFound from "./[locale]/not-found";
import { fontClassName } from "@/lib/site-metadata";
import { Analytics } from "@/components/analytics";
import { gaId } from "@/lib/analytics-config";

export const metadata: Metadata = {
  title: "Page not found | Vayasya Seva",
};

/** 404 for URLs no route matches. The root layout is per locale (app/[locale]), so this one brings its own. */
export default function GlobalNotFound() {
  return (
    <html lang="en-IN">
      <body className={fontClassName}>
        <NotFound />
        {gaId && <Analytics gaId={gaId} />}
      </body>
    </html>
  );
}
