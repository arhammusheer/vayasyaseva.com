import { createSign } from "node:crypto";
import { after } from "next/server";
import type { AdClick } from "@/lib/talent-intake/contract";

/**
 * Server-side Google Ads conversions: when an application the server accepted
 * came from an ad click, tell Google Ads which click (the gclid, gbraid or
 * wbraid Google added to the landing URL). Nothing else about the applicant
 * is sent. The browser leaves the click out after "Required Only"
 * (src/lib/ad-click.ts); the privacy notice describes this.
 *
 * Counts into the "Job application (server)" click-import conversion action,
 * the primary one for bidding. The browser tag's conversion ("Job Application
 * form Filled", "Allow All" only) is secondary, so nothing counts twice.
 *
 * Sent through Google's Data Manager API: the Google Ads API's
 * UploadClickConversions is closed to new integrations.
 *
 * Auth: a service account of the Cloud project vayasya-ads (Data Manager API
 * enabled) that is a Standard user on the ad account; its key is
 * GOOGLE_ADS_SERVICE_ACCOUNT_KEY (JSON).
 */
const CUSTOMER_ID = "9945214823";
const API = "https://datamanager.googleapis.com/v1/events:ingest";
const SCOPE = "https://www.googleapis.com/auth/datamanager";

type ServiceAccountKey = { client_email: string; private_key: string; private_key_id?: string; token_uri?: string };
let cached: { token: string; expires: number } | null = null;

const base64url = (value: string | Buffer) => Buffer.from(value).toString("base64url");

async function accessToken(key: ServiceAccountKey) {
  if (cached && cached.expires > Date.now() + 60_000) return cached.token;
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = key.token_uri ?? "https://oauth2.googleapis.com/token";
  const claims = { iss: key.client_email, scope: SCOPE, aud: tokenUri, iat: now, exp: now + 3600 };
  const unsigned = `${base64url(JSON.stringify({ alg: "RS256", typ: "JWT", kid: key.private_key_id }))}.${base64url(JSON.stringify(claims))}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(key.private_key);
  const response = await fetch(tokenUri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${base64url(signature)}` }),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`token ${response.status}`);
  const body = (await response.json()) as { access_token: string; expires_in: number };
  cached = { token: body.access_token, expires: Date.now() + body.expires_in * 1000 };
  return cached.token;
}

/** After the response: upload one job application conversion for this ad click. */
export function uploadJobApplicationConversion(click: AdClick, ref: string) {
  const raw = process.env.GOOGLE_ADS_SERVICE_ACCOUNT_KEY;
  const action = process.env.GOOGLE_ADS_JOB_CONVERSION_ACTION_ID;
  if (!raw || !action || process.env.VERCEL_ENV !== "production") return;
  const at = new Date();
  after(async () => {
    try {
      const token = await accessToken(JSON.parse(raw) as ServiceAccountKey);
      const response = await fetch(API, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({
          destinations: [
            {
              operatingAccount: { accountType: "GOOGLE_ADS", accountId: CUSTOMER_ID },
              loginAccount: { accountType: "GOOGLE_ADS", accountId: CUSTOMER_ID },
              productDestinationId: action,
            },
          ],
          events: [
            {
              eventTimestamp: at.toISOString(),
              // The application reference: Google drops a second event with the same one.
              transactionId: ref,
              eventSource: "WEB",
              adIdentifiers: { [click.type]: click.id },
            },
          ],
          encoding: "HEX",
          // Measurement only: never used for ad personalisation.
          consent: { adPersonalization: "CONSENT_DENIED" },
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) {
        console.error("google-ads conversion upload failed", response.status, (await response.text()).slice(0, 500));
      }
    } catch (error) {
      // A lost conversion must never affect the application itself.
      console.error("google-ads conversion upload failed", error instanceof Error ? error.message : "unknown");
    }
  });
}
