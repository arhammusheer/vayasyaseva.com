import { after } from "next/server";

/**
 * Server-side counts in Umami: one event per application or enquiry the
 * server accepts, whatever the visitor's consent, ad blocker or channel
 * (form or AI agent). Sent to a separate Umami website so these requests
 * don't count as visitors on www.vayasyaseva.com. Fixed labels only; no
 * personal data. Runs after the response is sent.
 */
const SERVER_WEBSITE_ID = "00ffb9c2-2201-4346-88d1-852f1798339b";
const COLLECT_URL = "https://t.vayasyaseva.com/e";
// Browser-style so Umami's bot filter (isbot) keeps it; isbot drops agents
// that say "server" or "bot".
const USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 VayasyaSeva";

export function trackServerEvent(name: string, url: string, data: Record<string, string | number>) {
  if (process.env.NODE_ENV !== "production") return;
  after(async () => {
    try {
      await fetch(COLLECT_URL, {
        method: "POST",
        headers: { "content-type": "application/json", "user-agent": USER_AGENT },
        body: JSON.stringify({
          type: "event",
          payload: {
            website: SERVER_WEBSITE_ID, hostname: "www.vayasyaseva.com", url, name, data,
            language: "en-IN", screen: "0x0", browser: "server", os: "server", device: "server",
          },
        }),
        signal: AbortSignal.timeout(3000),
      });
    } catch {
      // Analytics must never affect a submission.
    }
  });
}
