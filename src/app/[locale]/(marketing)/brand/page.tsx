import { statSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import { Download } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { JsonLd, webPageSchema } from "@/lib/structured-data";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { ColorSwatches } from "./color-swatches";
import { localeParams } from "@/lib/i18n";

export const dynamicParams = false;
export const generateStaticParams = localeParams("/brand");

const DESCRIPTION = "Logo files, fonts and the core colours for Vayasya, Seva and Setu, with the company profile.";

export const metadata = pageMetadata({
  title: "Brand Guidelines",
  description: DESCRIPTION,
  alternates: { canonical: "/brand" },
});

/** Files under public/, served from the site root. */
const downloads = [
  {
    href: "/brand/downloads/vayasya-seva-logo-kit.zip",
    label: "Logo kit",
    meta: "ZIP · SVG, PNG 256–2048, plated variants, icon set, usage notes",
  },
  {
    href: "/brand/downloads/vayasya-setu-lockup-light.svg",
    label: "Vayasya Setu lockup, for light surfaces",
    meta: "SVG · mark and name, text outlined",
  },
  {
    href: "/brand/downloads/vayasya-setu-lockup-dark.svg",
    label: "Vayasya Setu lockup, for dark surfaces",
    meta: "SVG · mark and name, text outlined",
  },
  {
    href: "/brand/downloads/vayasya-seva-fonts.zip",
    label: "Font pack",
    meta: "ZIP · Anek and Hind (Latin, Devanagari, Kannada, Gurmukhi), JetBrains Mono · TTF · SIL OFL",
  },
  {
    href: "/vayasya-seva-company-profile.pdf",
    label: "Company profile",
    meta: "PDF",
  },
];

/** The three rules a printer or partner needs; the rest are in docs/brand-rules.md. */
const logoRules = [
  "Keep clear space equal to the height of the inner V on every side.",
  "Do not recolour, distort or rebuild the mark.",
  "Use the supplied files as they are.",
];

const specimens = [
  { meta: "Anek · display · 500–700 · Latin, Devanagari, Kannada, Gurmukhi", className: "font-display text-5xl font-medium leading-none tracking-[-0.03em] sm:text-6xl", text: "Workforce. With care." },
  { meta: "Hind · body and interface · 400–700 · Hind Mysuru (Kannada), Hind Jalandhar (Gurmukhi)", className: "max-w-xl text-lg leading-relaxed", text: "Supervised crews for factories, warehouses and facilities, with the records kept for every shift." },
  { meta: "JetBrains Mono · data · 400–500", className: "font-data text-base", text: "GSTIN 05AAJCV4562E1ZB · Shift 06:00–14:00 · 24 loaders" },
];

function size(href: string) {
  const bytes = statSync(path.join(process.cwd(), "public", href)).size;
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/** Downloads first, then the three logo rules, the type and the core colours. */
export default function BrandPage() {
  return (
    <>
      <JsonLd data={webPageSchema({ name: "Brand", description: DESCRIPTION, url: "/brand" })} />
      <PageHero
        crumbs={<Breadcrumbs path="/brand" locale="en-IN" name="Brand" />}
        title="Brand guidelines"
        lede="Logo files, fonts and the core colours for Vayasya and its products, Seva and Setu."
      />

      <Section id="downloads">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_2fr]">
          <h2 className="text-4xl font-medium">Downloads</h2>
          <ul>
            {downloads.map((d) => (
              <li key={d.href} className="border-t first:border-0">
                <a
                  href={d.href}
                  download
                  className="group flex items-center justify-between gap-6 py-5 transition-colors hover:text-gold-700"
                >
                  <span>
                    <span className="block text-lg font-medium">{d.label}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{d.meta}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3 font-data text-sm text-muted-foreground">
                    {size(d.href)}
                    <Download size={18} className="text-gold-700" aria-hidden="true" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section id="logo" variant="subtle">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 className="text-4xl font-medium">Logo usage</h2>
            <ol className="mt-6 space-y-3 leading-relaxed text-muted-foreground">
              {logoRules.map((r, i) => (
                <li key={r} className="flex gap-3">
                  <span aria-hidden="true" className="font-data text-gold-700">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {r}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border">
              <div className="flex aspect-[4/3] items-center justify-center bg-background">
                <Image src="/brand/downloads/vayasya-seva-mark.svg" alt="Vayasya Seva mark on white" width={140} height={140} />
              </div>
              <div className="flex aspect-[4/3] items-center justify-center bg-neutral-900">
                <Image src="/brand/downloads/vayasya-seva-mark.svg" alt="Vayasya Seva mark on navy" width={140} height={140} />
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              One gold mark, used as-is on light and dark surfaces: Gold #DAA236 on white or Neutral 900.
            </p>
          </div>
        </div>
      </Section>

      <Section id="typography">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_2fr]">
          <h2 className="text-4xl font-medium">Typography</h2>
          <div className="space-y-8">
            {specimens.map((s, i) => (
              <div key={s.meta} className={i < specimens.length - 1 ? "border-b pb-8" : undefined}>
                <p className="font-data text-xs text-muted-foreground">{s.meta}</p>
                <p className={`mt-3 ${s.className}`}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section id="colour" variant="subtle">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <h2 className="text-4xl font-medium">Colour</h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Gold is the brand colour for Vayasya and every product under it. Keep it under 20% of any surface. Click a
              swatch to copy its hex value.
            </p>
          </div>
          <ColorSwatches />
        </div>
      </Section>
    </>
  );
}
