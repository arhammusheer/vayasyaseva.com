# Architecture roadmap

Started 17 October 2026 from four read-only planning passes over this repo, vayasya-infra and nevaehfirstsource.com. Each system gets one module with one job, dependencies point one way, and every refactor is pinned by tests first, so it changes nothing users or data see.

| Module | Its one job |
|---|---|
| `src/markets/` | What a market is: states, place and ad words, language set, labels, place ids, schema.org place |
| `src/lib/measurement/` | What may be measured and where it goes: purposes and consent rules, the event catalogue, one gateway, vendor adapters |
| `packages/contracts/` and `src/server/submissions/` | What a submission is and how it enters: versioned contracts, one edge pipeline |
| Windmill `f/platform/*` | How a submission is delivered: inbox, deliveries, retries, dead letters, health |

## Done

| Step | What | PR |
|---|---|---|
| — | Haridwar on neutral footing: `/locations/haridwar` on the shared location template | #52 |
| 0 | Erasure keeps client contacts; a replayed lead completes an interrupted write; lead forwarding retries; pa-in and kn-in in every locale pattern; Delhi and Haryana towns | #53 |
| 0 | Recordings and heatmaps kept one year, purged nightly; purge-failure alert | infra #112 |
| 0 | Privacy notice says one year; consent v8 | #54 |
| 1A | Stored-id lock (content check C2b), market behaviour snapshot, consent matrix and golden payloads (`pnpm measurement:check`) | #55 |
| 1B | One market module | #57 |
| 1C | One consent and measurement module | #58 |
| 1E | Windmill owns its secrets (`windmill-talent`, `windmill-nfss`) and the hooks certificate; `integrations/n8n` removed | infra #113, #56 |

## In progress

- **1D, submission contracts and edge:** versioned Zod contracts generating JSON Schema and OpenAPI; Windmill validates with them; one edge pipeline (legacy URLs as adapters); idempotency keys; a rate-limiter interface (Vercel WAF rules for the owner); a separate ticket-signing key.
- **1F, delivery platform:** a durable lead inbox and idempotent CRM sync (infra: a `leads` database); one signed envelope route; inbox and deliveries with backoff and dead letters; `f/platform/health` returns dead and stuck counts for the notification hub.
- **Market changes** (owner approved, 17 Oct 2026): one vocabulary for place and ad words; UT treated as UK; Saharanpur no longer steers the language picker; multi-word ad tags match. `MODEL_VERSION` 3.
- **Notification hub** (owner request, 17 Oct 2026; design in review): one way to be told about new applications, leads, SEO watch, compliance and wage-monitor alerts, platform health and Prometheus alerts, so Chatwoot can go.

## Next

1. **Retire Chatwoot** (owner approved): after the notification hub. Take stock of what uses it (deliver, retention's contact deletion, monitors, any WhatsApp inbox, the shared account); decide how staff see applicants' files in Twenty; run a dual period; stop delivery; erase and drop; update the privacy notice.
2. **Delete the n8n app (N6)** (owner approved): a couple of days after Windmill has run stably, earliest 20 October 2026. Check Windmill runs and errors and that `hooks.vayasyaseva.com/webhook/*` has no hits; take a final `pg_dump`; delete `apps/n8n` in vayasya-infra; drop its role and database; revoke `N8N_SMTP_PASS`. Before that, the NFSS deploy reads `windmill-nfss` (`integrations/windmill/deploy.mts` `appSecrets` in nevaehfirstsource.com, once `feat/twenty-crm` lands).
3. **Rotate the secrets exposed on 17 October 2026** (a shell error printed them into a session transcript): TALENT_R2 read and erase keys, CHATWOOT_TALENT_ADMIN_TOKEN, FAST2SMS_API_KEY, RESEND_NFSS_API_KEY, TALENT_INTAKE_WEBHOOK_SECRET and NFSS_INTAKE_WEBHOOK_SECRET (the talent one signs job tickets: one coordinated change across Vercel and Windmill). N8N_SMTP_PASS, DB_POSTGRESDB_PASSWORD and N8N_ENCRYPTION_KEY go with N6. New values go into `windmill-talent` and `windmill-nfss`, then `pnpm windmill:deploy` and `pnpm talent:sync-secrets`.

## Work in progress, owner to decide

- **Consent and data collection (frozen at current behaviour).** Owner direction, 17 Oct 2026: the default is the most data-collective, unrestricted setup, and decisions come later. Recordings stay unmasked, with typed input recorded, under Allow All. Nothing is restricted until the owner decides. Open for that discussion: v7 and v8 sign-off with counsel; per-purpose choices; the legal-basis wording; consent receipts; the old-refusal, blocked-storage and cross-tab rules; what GA4 receives; Data Manager `adUserData`; the notice's backup wording. The one standing rule: the notice and banner describe what is collected.
- **Retention pipeline.** The owner wants a better pipeline designed before more retention automation. Known gaps: no retention on Umami events; enquiry deletion after 24 months is not automated; infra purges can't be verified from this repo. `src/lib/measurement/retention.ts` lists the stores, and content check C14 compares it with the notice.

## Outside the code (owner)

- Point Google Business Profile and listings at `/locations/haridwar`. Google Ads needs no change: the campaigns land on `/jobs` pages.
