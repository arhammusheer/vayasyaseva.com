/**
 * The compliance monitor's fetch relay, a Cloudflare Worker
 * (vayasya-fetch-relay). Punjab's state data centre drops every connection
 * from the cluster's hosting network (Tier4Cloud, 19 October 2026), but
 * answers Cloudflare, so the monitor fetches the hosts in sources.json
 * `relayHosts` through here: GET /?url=<source> with the shared secret in
 * `x-relay-secret`. Only the hosts in ALLOWED_HOSTS are fetched, on every
 * redirect too, and never from Cloudflare's cache, so a changed file is seen
 * the day it changes. See docs/wage-monitor.md.
 */
const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 40_000;

const reply = (status, message) => new Response(message, { status, headers: { "content-type": "text/plain; charset=utf-8", "x-relay-error": message } });

/** Constant-time comparison of the presented secret with the stored one. */
async function secretMatches(given, expected) {
  if (!given || !expected) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(given)), crypto.subtle.digest("SHA-256", enc.encode(expected))]);
  // Equal-length digests compared without an early exit (timingSafeEqual is Workers-only; this also runs in the tests).
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export function allowedUrl(raw, allowed) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  return url.protocol === "https:" && allowed.has(url.host) ? url : null;
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET") return reply(405, "GET only");
    if (!(await secretMatches(request.headers.get("x-relay-secret"), env.RELAY_SECRET))) return reply(403, "bad secret");
    const allowed = new Set((env.ALLOWED_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean));
    let url = allowedUrl(new URL(request.url).searchParams.get("url"), allowed);
    if (!url) return reply(400, "url is not an allowed https source");
    const headers = { "user-agent": request.headers.get("user-agent") ?? "Mozilla/5.0", accept: "*/*" };
    const signal = AbortSignal.timeout(TIMEOUT_MS);
    try {
      for (let hop = 0; ; hop++) {
        const res = await fetch(url, { headers, redirect: "manual", signal, cache: "no-store" });
        const location = res.headers.get("location");
        if (res.status >= 300 && res.status < 400 && location) {
          if (hop >= MAX_REDIRECTS) return reply(502, "too many redirects");
          url = allowedUrl(new URL(location, url).href, allowed);
          if (!url) return reply(502, "redirect to a host that is not allowed");
          continue;
        }
        return new Response(res.body, { status: res.status, headers: { "content-type": res.headers.get("content-type") ?? "application/octet-stream", "x-relay-url": url.href } });
      }
    } catch (error) {
      return reply(502, `upstream ${error?.name === "TimeoutError" ? "timed out" : "failed"}: ${error?.message ?? error}`);
    }
  },
};
