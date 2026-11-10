/**
 * rate_alert.v1: minimum wage rate alerts (10 Nov 2026). A reader of a wage
 * page leaves an email address and the states they follow; we email them
 * when a state's rates change. Double opt-in: nothing is sent until the
 * address is confirmed from the link in the first email.
 *
 * Wire: /api/alerts/subscribe (the website form, Turnstile), and
 * /api/alerts/confirm and /api/alerts/unsubscribe (the links in our emails).
 * Canonical (what the site forwards to Windmill f/platform/submission, in an
 * envelope): one of three actions on the subscriber list in the lead inbox.
 */
import { z } from "zod/v4";

export const RATE_ALERT_V1 = "rate_alert.v1";

/** References the site issues for each action: ALR-<date>-<8 hex>. */
export const ALERT_REF_PATTERN = /^ALR-\d{8}-[0-9A-F]{8}$/;
/** A wage page's state slug (src/content/wages), e.g. "uttar-pradesh". The site checks it is a published one. */
export const ALERT_STATE_PATTERN = /^[a-z][a-z-]{1,31}$/;
/** The token in a confirm or unsubscribe link: 32 random bytes, base64url. */
export const ALERT_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,64}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ALERT_LIMITS = { email: 200, states: 40, sourcePath: 200, noticeVersion: 40 } as const;

const email = z.string().max(ALERT_LIMITS.email).regex(EMAIL_PATTERN);
const states = z
  .array(z.string().regex(ALERT_STATE_PATTERN))
  .min(1)
  .max(ALERT_LIMITS.states)
  .refine((list) => new Set(list).size === list.length, "Each state once")
  .meta({ uniqueItems: true });
const token = z.string().regex(ALERT_TOKEN_PATTERN);

// --- Wire ---------------------------------------------------------------------------

export const rateAlertSubscribeRequestSchema = z
  .object({
    email: email.meta({ description: "Where the alerts go. Confirmed from a link before anything else is sent.", example: "hr@example.com" }),
    states: states.meta({ description: "Wage page state slugs to follow.", example: ["uttarakhand"] }),
    sourcePath: z
      .string()
      .max(ALERT_LIMITS.sourcePath)
      .regex(/^\/[A-Za-z0-9/_-]*$/)
      .optional()
      .meta({ description: "Set by the website: the page the form was on." }),
  })
  .strict();
export type RateAlertSubscribeRequest = z.output<typeof rateAlertSubscribeRequestSchema>;

/** The body of /api/alerts/confirm and /api/alerts/unsubscribe. */
export const rateAlertTokenRequestSchema = z.object({ token }).strict();

// --- Canonical ----------------------------------------------------------------------

const common = { ref: z.string().regex(ALERT_REF_PATTERN), receivedAt: z.iso.datetime() };

export const rateAlertCanonicalSchema = z
  .discriminatedUnion("action", [
    z
      .object({
        ...common,
        action: z.literal("subscribe"),
        /** Lower-cased by the site: one subscriber per address. */
        email,
        states,
        sourcePath: z.string().min(1).max(ALERT_LIMITS.sourcePath).nullable(),
        /** The privacy notice the person saw (src/lib/rate-alerts.ts). */
        noticeVersion: z.string().min(1).max(ALERT_LIMITS.noticeVersion),
      })
      .strict(),
    z.object({ ...common, action: z.literal("confirm"), token }).strict(),
    z.object({ ...common, action: z.literal("unsubscribe"), token }).strict(),
  ])
  .meta({ title: "rate_alert.v1 (canonical)", description: "One action on the rate alert subscriber list, as the website forwards it to Windmill." });
export type RateAlertCanonical = z.output<typeof rateAlertCanonicalSchema>;
