# Submissions: contracts and the edge pipeline

Roadmap 1D. Every form and agent submission goes through one pipeline in
`src/server/submissions`, checked against one set of contracts in
`packages/contracts`.

## Contracts (`packages/contracts`, pnpm workspace package `@vspl/contracts`)

| Contract | Wire (what callers send) | Canonical (what Windmill gets) |
|---|---|---|
| `job_application.v1` | `/api/jobs/start`, `/submit`, `/api/agent/jobs`, `/start`, `/submit` | `f/talent/intake` |
| `business_enquiry.v1` | `/api/contact`, `/api/agent/contact` (contact contract 1.3.0) | `f/leads/intake` (the lead) |
| `compliance_help.v1` | the same wire contract, `requestType: "compliance-help"` | the lead, `requestType` fixed |
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

**A failed staff email** (MSG91) no longer loses the lead: the lead goes to
Windmill after the response either way, and Windmill saves it in the lead
inbox before it answers 202 (roadmap 1F). The person still sees the error
(500) and is asked to try again or call, as before.

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

## Rate limits

The routes' own limits (`policies/rate-limit.ts`, unchanged) count per
Vercel instance, so they slow one source rather than enforce a global cap.
A `RateLimiter` interface lets a shared counter replace them later.

**Vercel WAF rules for the owner to add** (Project → Firewall → Custom
rules; not applied by this change). One rule per row: "Request path equals",
method POST, action **Rate limit**, fixed window, keyed on IP, answering
429. The limits sit above what one person can reach, so they only stop
floods that the per-instance counters cannot see.

| Path | Window | Limit per IP | App limit (per instance) |
|---|---|---|---|
| `/api/contact` | 60 s | 10 | 1 a minute; same email and phone once in 5 minutes |
| `/api/agent/contact` | 10 min | 20 | 5 per IP, 1 per sender |
| `/api/agent/jobs` | 10 min | 30 | 10 per IP, 3 per phone an hour |
| `/api/agent/jobs/start` | 10 min | 30 | 10 per IP |
| `/api/agent/jobs/submit` | 10 min | 30 | 10 per IP, 3 per phone an hour |
| `/api/jobs/start` | 10 min | 20 | Turnstile |
| `/api/jobs/submit` | 10 min | 30 | the ticket |
| `/api/jobs/resume` | 10 min | 30 | the ticket |

Leave `/api/context` and `/api/umami-recorder` out: pages call them on load.
