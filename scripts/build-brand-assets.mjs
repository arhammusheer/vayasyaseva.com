// Pre-generates the downloadable assets served from /brand.
// Run: pnpm brand:assets  (requires network for the font pack)
import { mkdir, readFile, writeFile, rm, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import sharp from "sharp";

const root = new URL("..", import.meta.url).pathname;
const out = path.join(root, "public/brand/downloads");
const tmp = path.join(root, ".brand-build");
const mark = path.join(root, "public/brand/logos/master-logo-light.svg");

const NAVY = "#0f172a";
const SIZES = [256, 512, 1024, 2048];

await rm(tmp, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await mkdir(path.join(tmp, "logo"), { recursive: true });
await mkdir(path.join(tmp, "fonts"), { recursive: true });

// Clean SVG: drop Inkscape editor metadata, keep geometry and colour.
const raw = await readFile(mark, "utf8");
const svg = raw
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/<sodipodi:namedview[\s\S]*?\/>/g, "")
  .replace(/\s+(inkscape|sodipodi):[\w-]+="[^"]*"/g, "")
  .replace(/\s+xmlns:(inkscape|sodipodi)="[^"]*"/g, "")
  .replace(/\s+xml:space="preserve"/g, "")
  .replace(/\n\s*\n/g, "\n")
  .trim();
await writeFile(path.join(out, "vayasya-seva-mark.svg"), svg);
await writeFile(path.join(tmp, "logo/vayasya-seva-mark.svg"), svg);

// PNG renders: transparent at each size, plus plated variants at 1024.
const render = (size) => sharp(Buffer.from(svg), { density: 300 }).resize(size, size);
for (const size of SIZES) {
  const file = `vayasya-seva-mark-${size}.png`;
  await render(size).png().toFile(path.join(tmp, "logo", file));
}
await render(1024).png().toFile(path.join(out, "vayasya-seva-mark.png"));
await render(1024)
  .flatten({ background: "#ffffff" })
  .png()
  .toFile(path.join(tmp, "logo/vayasya-seva-mark-1024-on-white.png"));
await render(1024)
  .flatten({ background: NAVY })
  .png()
  .toFile(path.join(tmp, "logo/vayasya-seva-mark-1024-on-navy.png"));

// Small-size cuts: the master's 7.8 stroke drops under a pixel below about 32 px, so the
// tiny icons use heavier cuts of the same drawing (every edge pushed away from the ink).
// vspl-small (+3 per edge) for 16-24 px, vspl-medium (+2) for 32-48 px, the master above.
const cut = async (name) => (await readFile(path.join(root, `public/brand/logos/${name}.svg`), "utf8")).trim();
const small = await cut("vspl-small");
const medium = await cut("vspl-medium");
await writeFile(path.join(tmp, "logo/vayasya-seva-mark-small.svg"), small);
await writeFile(path.join(tmp, "logo/vayasya-seva-mark-medium.svg"), medium);
const renderFrom = (src, size) => sharp(Buffer.from(src), { density: 300 }).resize(size, size);

// Favicon-scale set for app tiles and manifests.
for (const size of [16, 32, 48, 180, 192, 512]) {
  const src = size <= 24 ? small : size <= 48 ? medium : svg;
  await renderFrom(src, size)
    .png()
    .toFile(path.join(tmp, "logo", `icon-${size}.png`));
}

await writeFile(
  path.join(tmp, "logo/README.txt"),
  `Vayasya Seva – logo kit

Files
  vayasya-seva-mark.svg                 Master mark, scalable (design, print, web)
  vayasya-seva-mark-{256,512,1024,2048} Transparent PNG (documents, slides, office tools)
  vayasya-seva-mark-1024-on-white.png   Plated on white
  vayasya-seva-mark-1024-on-navy.png    Plated on brand navy #0F172A
  vayasya-seva-mark-small.svg           Heavier cut for 16-24 px (favicons, tiny UI)
  vayasya-seva-mark-medium.svg          Heavier cut for 32-48 px
  icon-{16…512}.png                     Favicon, touch and manifest icons (16 small, 32-48 medium, rest master)

Rules
  Keep clear space equal to the height of the mark's inner V on all sides.
  Do not recolour, retint, distort or gradient-map the mark.
  Over imagery, place the mark on a calm solid plate first.
  If it is too small to read, use a larger placement rather than forcing it smaller.
  Use the supplied files as-is; do not rebuild the mark.

Brand gold #DAA236 · Navy #0F172A · https://www.vayasyaseva.com/brand
`,
);

// Font pack: TTFs from the google/fonts repository (SIL Open Font License).
const gf = "https://raw.githubusercontent.com/google/fonts/main/ofl";
const fonts = {
  "Anek Latin": [
    ["aneklatin/AnekLatin[wdth,wght].ttf", "AnekLatin-Variable.ttf"],
    ["aneklatin/OFL.txt", "OFL.txt"],
  ],
  "Anek Devanagari": [
    ["anekdevanagari/AnekDevanagari[wdth,wght].ttf", "AnekDevanagari-Variable.ttf"],
    ["anekdevanagari/OFL.txt", "OFL.txt"],
  ],
  "Anek Kannada": [
    ["anekkannada/AnekKannada[wdth,wght].ttf", "AnekKannada-Variable.ttf"],
    ["anekkannada/OFL.txt", "OFL.txt"],
  ],
  "Anek Gurmukhi": [
    ["anekgurmukhi/AnekGurmukhi[wdth,wght].ttf", "AnekGurmukhi-Variable.ttf"],
    ["anekgurmukhi/OFL.txt", "OFL.txt"],
  ],
  "Anek Telugu": [
    ["anektelugu/AnekTelugu[wdth,wght].ttf", "AnekTelugu-Variable.ttf"],
    ["anektelugu/OFL.txt", "OFL.txt"],
  ],
  Hind: [
    ["hind/Hind-Light.ttf", "Hind-Light.ttf"],
    ["hind/Hind-Regular.ttf", "Hind-Regular.ttf"],
    ["hind/Hind-Medium.ttf", "Hind-Medium.ttf"],
    ["hind/Hind-SemiBold.ttf", "Hind-SemiBold.ttf"],
    ["hind/Hind-Bold.ttf", "Hind-Bold.ttf"],
    ["hind/OFL.txt", "OFL.txt"],
  ],
  "Hind Mysuru": [
    ["hindmysuru/HindMysuru-Light.ttf", "HindMysuru-Light.ttf"],
    ["hindmysuru/HindMysuru-Regular.ttf", "HindMysuru-Regular.ttf"],
    ["hindmysuru/HindMysuru-Medium.ttf", "HindMysuru-Medium.ttf"],
    ["hindmysuru/HindMysuru-SemiBold.ttf", "HindMysuru-SemiBold.ttf"],
    ["hindmysuru/HindMysuru-Bold.ttf", "HindMysuru-Bold.ttf"],
    ["hindmysuru/OFL.txt", "OFL.txt"],
  ],
  "Hind Jalandhar": [
    ["hindjalandhar/HindJalandhar-Light.ttf", "HindJalandhar-Light.ttf"],
    ["hindjalandhar/HindJalandhar-Regular.ttf", "HindJalandhar-Regular.ttf"],
    ["hindjalandhar/HindJalandhar-Medium.ttf", "HindJalandhar-Medium.ttf"],
    ["hindjalandhar/HindJalandhar-SemiBold.ttf", "HindJalandhar-SemiBold.ttf"],
    ["hindjalandhar/HindJalandhar-Bold.ttf", "HindJalandhar-Bold.ttf"],
    ["hindjalandhar/OFL.txt", "OFL.txt"],
  ],
  "Hind Guntur": [
    ["hindguntur/HindGuntur-Light.ttf", "HindGuntur-Light.ttf"],
    ["hindguntur/HindGuntur-Regular.ttf", "HindGuntur-Regular.ttf"],
    ["hindguntur/HindGuntur-Medium.ttf", "HindGuntur-Medium.ttf"],
    ["hindguntur/HindGuntur-SemiBold.ttf", "HindGuntur-SemiBold.ttf"],
    ["hindguntur/HindGuntur-Bold.ttf", "HindGuntur-Bold.ttf"],
    ["hindguntur/OFL.txt", "OFL.txt"],
  ],
  "JetBrains Mono": [
    ["jetbrainsmono/JetBrainsMono[wght].ttf", "JetBrainsMono-Variable.ttf"],
    ["jetbrainsmono/JetBrainsMono-Italic[wght].ttf", "JetBrainsMono-Italic-Variable.ttf"],
    ["jetbrainsmono/OFL.txt", "OFL.txt"],
  ],
};
for (const [family, files] of Object.entries(fonts)) {
  const dir = path.join(tmp, "fonts", family);
  await mkdir(dir, { recursive: true });
  for (const [src, name] of files) {
    const res = await fetch(`${gf}/${src}`);
    if (!res.ok) throw new Error(`${src}: ${res.status}`);
    await writeFile(path.join(dir, name), Buffer.from(await res.arrayBuffer()));
  }
}
await writeFile(
  path.join(tmp, "fonts/README.txt"),
  `Vayasya Seva – font pack

Every script the brand writes in has its own cut of the same two families:

                Display (headings, 500–700)   Body and UI (400–700)
  Latin         Anek Latin                    Hind
  Devanagari    Anek Devanagari               Hind (includes Devanagari)
  Kannada       Anek Kannada                  Hind Mysuru
  Gurmukhi      Anek Gurmukhi                 Hind Jalandhar
  Telugu        Anek Telugu                   Hind Guntur

JetBrains Mono    Data: identifiers, tables and aligned values (400–500)

Install
  Windows  Select the .ttf files, right-click, "Install for all users".
  macOS    Open the .ttf files and click "Install Font", or drop them into Font Book.

The Anek fonts and JetBrains Mono are variable: one file holds every weight.
Hind, Hind Mysuru, Hind Jalandhar and Hind Guntur ship as five static weights.

All families are published under the SIL Open Font License; the OFL.txt in
each folder is the licence. Fonts are unchanged from the google/fonts release.

https://www.vayasyaseva.com/brand
`,
);

const zip = (dir, name) => {
  const target = path.join(out, name);
  execFileSync("zip", ["-qr", "-X", target, path.basename(dir)], { cwd: path.dirname(dir) });
  return target;
};
await rm(path.join(out, "vayasya-seva-logo-kit.zip"), { force: true });
await rm(path.join(out, "vayasya-seva-fonts.zip"), { force: true });
zip(path.join(tmp, "logo"), "vayasya-seva-logo-kit.zip");
zip(path.join(tmp, "fonts"), "vayasya-seva-fonts.zip");
await rm(tmp, { recursive: true, force: true });

for (const f of [
  "vayasya-seva-mark.svg",
  "vayasya-seva-mark.png",
  "vayasya-seva-logo-kit.zip",
  "vayasya-seva-fonts.zip",
]) {
  const { size } = await stat(path.join(out, f));
  console.log(`${f.padEnd(30)} ${(size / 1024).toFixed(0).padStart(6)} KB`);
}
