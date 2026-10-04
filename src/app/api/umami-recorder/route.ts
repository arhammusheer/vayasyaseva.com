/**
 * Umami's replay recorder, served at /_t/recorder.js (src/proxy.ts) with one
 * change: Umami 3.4 masks every form input at every mask level. Here mask
 * level "none" (Umami dashboard, website replay settings) records inputs as
 * typed; "moderate" and "strict" behave as upstream. The recorder only loads
 * after "Allow All" (src/components/analytics.tsx), and the privacy notice
 * says recordings include what is typed.
 *
 * If an Umami upgrade changes the code this patches, the original script is
 * served unchanged, so inputs stay masked rather than the recorder breaking.
 */
const UPSTREAM = "https://t.vayasyaseva.com/recorder.js";
const MASKED = '"strict"===e?{maskAllInputs:!0,maskTextSelector:"*"}:{maskAllInputs:!0}';
const BY_LEVEL = '"strict"===e?{maskAllInputs:!0,maskTextSelector:"*"}:{maskAllInputs:"none"!==e}';

export const revalidate = 3600;

export async function GET() {
  const upstream = await fetch(UPSTREAM, { next: { revalidate } });
  if (!upstream.ok) return new Response("", { status: 502 });
  const source = await upstream.text();
  return new Response(source.replace(MASKED, BY_LEVEL), {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "public, max-age=3600, must-revalidate",
      "x-recorder-inputs": source.includes(MASKED) ? "by-level" : "upstream",
    },
  });
}
