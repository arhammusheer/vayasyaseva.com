# Submissions: contracts and the edge pipeline

Roadmap 1D. Every form and agent submission goes through one pipeline in
`src/server/submissions`, checked against one set of contracts in
`packages/contracts`.

## Contracts (`packages/contracts`, pnpm workspace package `@vspl/contracts`)

| Contract | Wire (what callers send) | Canonical (what Windmill gets) |
|---|---|---|
| `job_application.v1` | `/api/jobs/start`, `/submit`, `/api/agent/jobs`, `/start`, `/submit` | `f/talent/intake` |
| `business_enquiry.v1` | `/api/contact`, `/api/agent/contact` (contact contract 1.5.0: the requirement is the work, the workers and the site; `requestType: "callback"` is the short call-back form) | `f/leads/intake` (the lead) |
| `compliance_help.v1` | the same wire contract, `requestType: "compliance-help"` | the lead, `requestType` fixed |
| `rate_alert.v1` | `/api/alerts/subscribe` (Turnstile), `/api/alerts/confirm`, `/api/alerts/unsubscribe` | one action on the subscriber list (`docs/rate-alerts.md`); the signed route only |
| `envelope.v1` | none | one submission of any type, for the signed route (1F) |
| `upload_ticket` | none | the signed ticket's body |

Zod is the source. `pnpm contracts:generate` writes `generated/`: each
contract's canonical and wire JSON Schemas, and the OpenAPI components that
`src/openapi/v1.json` is built from (`pnpm openapi:generate` runs both).
CI runs `pnpm contracts:check` (stale `generated/` fails) and
`pnpm contracts:test`: the fixture corpus in `fixtures/{valid,invalid}`
through Zod and through ajv. Windmill's `contracts.test.mts` runs the same
corpus through its own ajv validators, which use the generated schemas.

`rules.ts` (the intake's ids and limits) lives in the package and stays
import-free: the Windmill build inlines it.

To compare a spec change semantically (key order ignored):
`node packages/contracts/scripts/openapi-diff.mjs --git <rev> src/openapi/v1.json`.

## The pipeline (`src/server/submissions`)

```
read      parse and validate the body                          400
key       Idempotency-Key header (optional)                     400 invalid_idempotency_key
verify    Turnstile (website forms only)                        403 / 503
replay    a key seen before                                     first answer / 409 in_progress / 422 idempotency_key_reused
screen    bot checks, rate limits                               429
handle    the type's work, then transport.ts to Windmill        200 / 202, or the route's own errors
```

The routes under `src/app/api` are adapters; their URLs, status codes and
bodies did not change. `types/` holds each type's routes, `policies/` the
shared checks, `transport.ts` the delivery to Windmill.

**Idempotency-Key.** The forms send a UUID kept in session storage with a
hash of the request (`src/lib/idempotency-key.ts`); agents may send one
(8 to 128 of `A-Z a-z 0-9 _ . : -`). A replay answers the first 2xx again,
with `idempotent-replayed: true`. A failed run is forgotten, but keeps the
case ID or reference it issued for a retry with the same key. With
`SUBMISSION_SIGNING_SECRET` set the store is Windmill's
(`f/platform/idempotency`: jobs keys in the talent database, contact keys in
the lead inbox), so a retry on another Vercel instance still replays; if
Windmill does not answer within 2.5 s, this instance's memory takes over for
that call. Without the secret, memory only.

**The contact emails go through Windmill** (14 Nov 2026). The site writes
the shared inbox's email (HTML laid out to be read at a glance, with a text part) and the buyer's copy (plain text)
(`src/lib/contact-email.ts`) and hands them over inside the lead (`mail`)
before it answers. Windmill saves the lead with one delivery per email and
sends them through Resend (`leads/lib/lead-mail.ts`), with backoff and a
cap, next to the CRM delivery. When Windmill does not take the lead the
person sees 500 and is asked to try again or call, as a failed email used to.

**Transport.** With `SUBMISSION_SIGNING_SECRET` set, every submission goes
as `envelope.v1` to the one signed route `webhook/vspl-submission` (HMAC over
the timestamp and raw body, five minutes of skew; `packages/contracts/src/signing.ts`).
Without it, the older routes (`vspl-talent-intake`, `vspl-lead`), which stay
as adapters. The switch is the secret: add it to Windmill (deploy) first,
then to Vercel.

**Tickets.** `TICKET_SIGNING_KEY` signs the jobs tickets. Without it they
are signed with a key derived from `TALENT_INTAKE_WEBHOOK_SECRET`, as
before. Once it is set, tickets signed the old way are accepted until they
expire (an hour at most).

## Bot checks and Turnstile

The website forms (contact, call back, rate alert sign-up) send
`x-contact-form-started-at` with every submission; a request without it, or
sent less than 1.5 s after the form opened, is refused with 429, as is one
with the honeypot header filled. Turnstile is checked first: the token must
be valid, solved for the form's own action (`contact`, `jobs_start`,
`alerts`, as `useTurnstile` renders it) and on the host the request reached;
siteverify has a 5 s timeout (an error, 500, not a pass). A failed check
answers 403 without pointing at the agent routes.

**Client IP.** `src/lib/rate-limit.ts` `clientIp`, used by the pipeline and
the Umami proxy: `x-real-ip` (set by Vercel) first, then the first
`x-forwarded-for` entry, which only a proxy that overwrites it (Vercel does)
makes trustworthy.

**Logs.** No log line carries an email address or phone number. Where a
line needs to say "the same sender", it carries a pseudonym
(`policies/pseudonym.ts`): HMAC-SHA-256 under a key derived from
`TICKET_SIGNING_KEY`, else `TALENT_INTAKE_WEBHOOK_SECRET`, else
`SUBMISSION_SIGNING_SECRET`. The limiters key senders, phones and alert
addresses by the same pseudonyms.

**Upload URLs** (`/api/jobs/start`, `/api/agent/jobs/start`, `/api/jobs/resume`):
one presigned PUT per declared file, valid 15 minutes, with Content-Type and
Content-Length signed, so R2 takes only the declared type at exactly the
declared size (at most 10 MB for an image, 20 MB for a document). `/submit`
still checks each object's size.

## Rate limits

The routes' own limits (`policies/rate-limit.ts`) count per Vercel
instance, so they slow one source rather than enforce a global cap. A
`RateLimiter` interface lets a shared counter replace them later. The site
has no shared store for one: no KV or Redis, and Postgres only behind
Windmill, where a call per request would put a flood in front of real leads.
A shared counter needs a store the owner provisions (for example Upstash
Redis from the Vercel Marketplace) and an implementation of `RateLimiter`
over it.

The open agent routes have no Turnstile by design, so their limits are the
tight ones, and each also has a budget for the whole route on the instance,
which a spread of addresses cannot get around. IPv6 addresses count per /64.
Agents share egress addresses (an assistant's servers), so a busy agent can
reach the per-IP limit; the answer is 429 with `retryAfterSeconds`.

**Vercel WAF rules for the owner to add** (Project → Firewall → Custom
rules; not applied by this change). One rule per row: "Request path equals",
method POST, action **Rate limit**, fixed window, keyed on IP, answering
429. The limits sit above what one person can reach, so they only stop
floods that the per-instance counters cannot see. The WAF is the only limit
here that holds across instances.

| Path | Window | Limit per IP | App limit (per instance) |
|---|---|---|---|
| `/api/contact` | 60 s | 10 | Turnstile; 1 a minute; same email and phone once in 5 minutes |
| `/api/agent/contact` | 10 min | 20 | 3 per IP (10 a day), 1 per sender (3 a day), 20 for the route |
| `/api/agent/jobs` | 10 min | 30 | with /start and /submit: 6 per IP (20 a day), 3 per phone an hour, 40 for the three routes |
| `/api/agent/jobs/start` | 10 min | 30 | as above, and 16 upload URLs per IP an hour, 120 for the route |
| `/api/agent/jobs/submit` | 10 min | 30 | as `/api/agent/jobs` |
| `/api/jobs/start` | 10 min | 20 | Turnstile |
| `/api/jobs/submit` | 10 min | 30 | the ticket |
| `/api/jobs/resume` | 10 min | 30 | the ticket |
| `/api/alerts/subscribe` | 10 min | 20 | Turnstile; 5 per IP, 3 per address an hour |
| `/api/alerts/confirm`, `/api/alerts/unsubscribe` | 10 min | 60 | 30 per IP |

Leave `/api/context` and `/api/umami-recorder` out: pages call them on load.

## Caching

Every answer of the pipeline is `cache-control: no-store`, and `next.config.ts`
sets the same on `/api/contact`, `/api/agent/*`, `/api/jobs/*` and
`/api/alerts/*`.
