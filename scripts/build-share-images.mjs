// Build committed PNGs with browser text shaping, including Hindi conjuncts.
// --check validates the complete catalogue without installing a browser in CI.
import { registerHooks } from 'node:module';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
registerHooks({ resolve(specifier, context, next) {
  const base = specifier.startsWith('@/') ? resolve(root, 'src', specifier.slice(2))
    : specifier.startsWith('.') && context.parentURL?.endsWith('.ts') ? resolve(dirname(fileURLToPath(context.parentURL)), specifier) : null;
  if (base && existsSync(`${base}.ts`)) return next(pathToFileURL(`${base}.ts`).href, context);
  return next(specifier, context);
} });
const { allShareContent, shareLanding } = await import('../src/lib/share-content.ts');
const fonts = Object.fromEntries(['AnekLatin-SemiBold', 'AnekDevanagari-SemiBold', 'Hind-Regular', 'JetBrainsMono-Regular'].map(name => [name, readFileSync(resolve(root, `src/assets/fonts/og/${name}.ttf`)).toString('base64')]));
const mark = readFileSync(resolve(root, 'public/brand/downloads/vayasya-seva-mark.svg')).toString('base64');
const escape = value => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function html(content) {
  return `<!doctype html><html lang="${content.locale}"><meta charset="utf-8"><style>
  @font-face{font-family:Anek;src:url(data:font/ttf;base64,${fonts['AnekLatin-SemiBold']});font-weight:600}
  @font-face{font-family:AnekDeva;src:url(data:font/ttf;base64,${fonts['AnekDevanagari-SemiBold']});font-weight:600}
  @font-face{font-family:Hind;src:url(data:font/ttf;base64,${fonts['Hind-Regular']});font-weight:400}
  @font-face{font-family:JetBrains;src:url(data:font/ttf;base64,${fonts['JetBrainsMono-Regular']});font-weight:400}
  *{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#0F172A;color:#fff;padding:48px 64px;border-top:7px solid #DAA236;display:flex;flex-direction:column}
  header{display:flex;align-items:center;gap:16px}header img{width:68px;height:68px}header strong{font:600 38px Anek;letter-spacing:-.5px}header small{margin-left:auto;font:16px JetBrains;color:#CBD5E1}
  main{flex:1;display:flex;flex-direction:column;justify-content:center;padding:18px 0}aside{font:400 18px Hind;letter-spacing:2px;color:#EBB74A;margin-bottom:16px}
  h1{font:600 78px/1.07 ${content.locale === 'hi-IN' ? 'AnekDeva,Anek' : 'Anek,AnekDeva'};letter-spacing:-1.5px;margin:0;white-space:pre-line;max-width:1072px}
  p{font:400 29px/1.4 Hind;margin:20px 0 0;color:#CBD5E1;max-width:1000px}
  footer{height:40px;display:flex;align-items:flex-end;justify-content:space-between;border-top:1px solid #475569;font:15px JetBrains;color:#CBD5E1}
  </style><header><img src="data:image/svg+xml;base64,${mark}" alt=""><strong>Vayasya Seva</strong><small>WORKFORCE. WITH CARE.</small></header>
  <main><aside>${escape(content.eyebrow)}</aside><h1>${escape(content.heading)}</h1><p>${escape(content.description)}</p></main>
  <footer><span>vayasyaseva.com</span><span>${escape(shareLanding(content))}</span></footer></html>`;
}
const entries = allShareContent();
const manifest = {};
for (const content of entries) {
  const hash = createHash('sha256').update(html(content)).digest('hex').slice(0,12);
  const slug = `${content.path === '/' ? 'home' : content.path.slice(1).replaceAll('/', '-')}${content.variant ? `-${content.variant}` : ''}`;
  manifest[content.key] = `/share/${content.locale.toLowerCase()}/${slug}-${hash}.png`;
}
const manifestPath = resolve(root, 'src/content/share-images.json');
const serialized = JSON.stringify(manifest, null, 2) + '\n';
if (process.argv.includes('--check')) {
  if (!existsSync(manifestPath) || readFileSync(manifestPath, 'utf8') !== serialized) throw new Error('Share images are stale: run pnpm share:build');
  for (const url of Object.values(manifest)) {
    const data = readFileSync(resolve(root, 'public', url.slice(1)));
    if (data.subarray(1,4).toString() !== 'PNG' || data.readUInt32BE(16) !== 1200 || data.readUInt32BE(20) !== 630) throw new Error(`Invalid image: ${url}`);
  }
  console.log(`Verified ${entries.length} branded share images.`);
  process.exit(0);
}
const { chromium } = await import('playwright');
const browser = await chromium.launch({ ...(process.env.SHARE_IMAGE_CHROME ? { executablePath: process.env.SHARE_IMAGE_CHROME } : {}) });
try {
  const page = await browser.newPage({ viewport: { width:1200, height:630 }, deviceScaleFactor:1 });
  for (const content of entries) {
    const url = manifest[content.key];
    const out = resolve(root, 'public', url.slice(1));
    if (existsSync(out)) continue;
    await page.setContent(html(content));
    await page.evaluate(async () => {
      await document.fonts.ready;
      const heading = document.querySelector('h1');
      while (heading.getBoundingClientRect().height > 210 && parseFloat(getComputedStyle(heading).fontSize) > 48) heading.style.fontSize = `${parseFloat(getComputedStyle(heading).fontSize)-2}px`;
      const body = document.querySelector('p');
      while (body.getBoundingClientRect().height > 120 && parseFloat(getComputedStyle(body).fontSize) > 23) body.style.fontSize = `${parseFloat(getComputedStyle(body).fontSize)-1}px`;
      const footer = document.querySelector('footer');
      if (footer.getBoundingClientRect().bottom > 630) throw new Error('Share image content overflows');
    });
    mkdirSync(dirname(out), {recursive:true});
    await page.screenshot({path:out});
  }
  writeFileSync(manifestPath, serialized);
  console.log(`Built ${entries.length} branded share images.`);
} finally { await browser.close(); }
