import { statSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import { Download } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { typeScale } from "@/content/brand";
import { ColorSwatches } from "./color-swatches";

export const metadata = pageMetadata({
  title: "Brand",
  description:
    "The Vayasya Seva mark, typography and colour palette, with downloadable logo files and fonts.",
  alternates: { canonical: "/brand" },
});

const downloads = {
  logo: [
    {
      file: "vayasya-seva-mark.svg",
      label: "Master mark",
      meta: "SVG · design, print, web",
    },
    {
      file: "vayasya-seva-mark.png",
      label: "Master mark",
      meta: "PNG · 1024 px, transparent",
    },
    {
      file: "vayasya-seva-logo-kit.zip",
      label: "Logo kit",
      meta: "ZIP · SVG, PNG 256–2048, plated variants, icon set, usage notes",
    },
  ],
  fonts: [
    {
      file: "vayasya-seva-fonts.zip",
      label: "Font pack",
      meta: "ZIP · Anek Latin, Hind, JetBrains Mono · TTF for Windows and macOS · SIL OFL",
    },
  ],
};

const rules = {
  logo: [
    "Keep clear space equal to the height of the inner V on every side.",
    "Do not recolour, retint, distort or gradient-map the mark.",
    "Over imagery, place the mark on a calm solid plate first.",
    "If it is too small to read clearly, use a larger placement rather than forcing it smaller.",
    "Use the supplied files as they are. Do not rebuild the mark.",
  ],
  type: [
    "Anek carries headings and high-emphasis lines only; it is not a reading face.",
    "Hind carries everything people read: paragraphs, labels, interface copy.",
    "JetBrains Mono is for values that need alignment or character distinction: IDs, tables, figures.",
    "Sentence case by default. No new fonts or local fallbacks to fix a surface quickly.",
  ],
};

function size(file: string) {
  const bytes = statSync(
    path.join(process.cwd(), "public/brand/downloads", file),
  ).size;
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

function DownloadList({
  items,
}: {
  items: { file: string; label: string; meta: string }[];
}) {
  return (
    <ul className="mt-8">
      {items.map((d) => (
        <li key={d.file} className="border-t first:border-0">
          <a
            href={`/brand/downloads/${d.file}`}
            download
            className="group flex items-center justify-between gap-6 py-5 transition-colors hover:text-gold-700"
          >
            <span>
              <span className="block text-lg font-medium">{d.label}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {d.meta}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-3 font-data text-sm text-muted-foreground">
              {size(d.file)}
              <Download
                size={18}
                className="text-gold-700"
                aria-hidden="true"
              />
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function Rules({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 space-y-3 text-muted-foreground leading-relaxed">
      {items.map((r) => (
        <li key={r} className="flex gap-3">
          <span
            aria-hidden="true"
            className="mt-[0.7em] h-1.5 w-1.5 shrink-0 bg-gold-500"
          />
          {r}
        </li>
      ))}
    </ul>
  );
}

export default function BrandPage() {
  return (
    <>
      <PageHero
        title="Brand guidelines"
        lede="Logo usage, typography and colour palette for Vayasya Seva, with downloadable logo files and fonts."
      />

      <Section id="logo">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow text-gold-700">01 · LOGO</p>
            <h2 className="mt-5 text-4xl font-medium">Logo usage</h2>
            <Rules items={rules.logo} />
          </div>
          <div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border">
              <div className="flex aspect-[4/3] items-center justify-center bg-background">
                <Image
                  src="/brand/downloads/vayasya-seva-mark.svg"
                  alt="Vayasya Seva mark on white"
                  width={140}
                  height={140}
                />
              </div>
              <div className="flex aspect-[4/3] items-center justify-center bg-neutral-900">
                <Image
                  src="/brand/downloads/vayasya-seva-mark.svg"
                  alt="Vayasya Seva mark on navy"
                  width={140}
                  height={140}
                />
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              One gold mark, used as-is on light and dark surfaces. Gold #DAA236
              on white or Neutral 900.
            </p>
            <DownloadList items={downloads.logo} />
          </div>
        </div>
      </Section>

      <Section id="typography" variant="subtle">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow text-gold-700">02 · TYPOGRAPHY</p>
            <h2 className="mt-5 text-4xl font-medium">
              Typography
            </h2>
            <Rules items={rules.type} />
          </div>
          <div>
            <div className="space-y-8">
              <div className="border-b pb-8">
                <p className="font-data text-xs text-muted-foreground">
                  Anek Latin · display · 500–700
                </p>
                <p className="mt-3 font-display text-5xl font-medium leading-none tracking-[-0.03em] sm:text-6xl">
                  Workforce. With care.
                </p>
              </div>
              <div className="border-b pb-8">
                <p className="font-data text-xs text-muted-foreground">
                  Hind · body and interface · 400–700
                </p>
                <p className="mt-3 max-w-xl text-lg leading-relaxed">
                  Contract labour and industrial services. A considered approach
                  to people, work and compliance, from the first conversation to
                  day-to-day coordination on site.
                </p>
              </div>
              <div>
                <p className="font-data text-xs text-muted-foreground">
                  JetBrains Mono · data · 400–500
                </p>
                <p className="mt-3 font-data text-base">
                  GSTIN 05AAJCV4562E1ZB · EPF · ESIC · Shift 06:00–14:00 · 24
                  loaders
                </p>
              </div>
            </div>

            <div className="mt-10 overflow-x-auto">
              <table className="w-full min-w-[32rem] text-sm">
                <thead>
                  <tr className="border-b text-left font-data text-xs text-muted-foreground">
                    <th className="py-2 font-normal">Level</th>
                    <th className="py-2 font-normal">Family</th>
                    <th className="py-2 font-normal">Weight</th>
                    <th className="py-2 font-normal">Size / line</th>
                    <th className="py-2 font-normal">Use</th>
                  </tr>
                </thead>
                <tbody>
                  {typeScale.map((t) => (
                    <tr key={t.level} className="border-b">
                      <td className="py-3 font-medium">{t.level}</td>
                      <td className="py-3">{t.family}</td>
                      <td className="py-3 font-data">{t.weight}</td>
                      <td className="py-3 font-data">{t.size}</td>
                      <td className="py-3 text-muted-foreground">{t.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DownloadList items={downloads.fonts} />
            <p className="mt-2 text-sm text-muted-foreground">
              Also on Google Fonts: Anek Latin, Hind and JetBrains Mono.
            </p>
          </div>
        </div>
      </Section>

      <Section id="colour">
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow text-gold-700">03 · COLOUR</p>
            <h2 className="mt-5 text-4xl font-medium">
              Colour palette
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Gold is the brand colour for Vayasya and for every product under
              it; Seva and Setu do not have colours of their own. Saffron,
              Indigo, Forest and Slate are extended scales for chart series,
              document templates and theme options in Setu. They do not
              identify a product line. Accent colour stays under 20% of any
              surface. Click a swatch to copy its hex value.
            </p>
          </div>
          <ColorSwatches />
        </div>
      </Section>
    </>
  );
}
