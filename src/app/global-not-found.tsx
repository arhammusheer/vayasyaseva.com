import "./globals.css";
import type { Metadata } from "next";
import NotFound from "./[locale]/not-found";
import { fontClassName } from "@/lib/site-metadata";
import { Analytics } from "@/components/analytics";
import { gaId } from "@/lib/measurement/config";
import { bootCss, bootScript } from "@/context/boot";

export const metadata: Metadata = {
  title: "Page not found | Vayasya Seva",
};

/**
 * 404 for URLs no route matches. The root layout is per locale (app/[locale]),
 * so this one brings its own, including the visitor-context head: without its
 * rules the header shows every candidate link (each market's Locations slot
 * and jobs door) at once.
 */
export default function GlobalNotFound() {
  return (
    <html lang="en-IN" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: bootCss() }} />
        <script dangerouslySetInnerHTML={{ __html: bootScript() }} />
      </head>
      <body className={fontClassName}>
        <NotFound />
        {gaId && <Analytics gaId={gaId} />}
      </body>
    </html>
  );
}
