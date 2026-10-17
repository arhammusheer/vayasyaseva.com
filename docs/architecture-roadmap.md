# Architecture roadmap

Started 17 October 2026 (status updated 18 October 2026) from four read-only planning passes over this repo, vayasya-infra and nevaehfirstsource.com. Each system gets one module with one job, dependencies point one way, and every refactor is pinned by tests first, so it changes nothing users or data see.

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
| 1A | Stored-id lock, market behaviour snapshot, consent matrix and golden payloads | #55 |
| 1B | One market module | #57 |
| — | Approved market changes: one vocabulary, UT→UK, no Saharanpur intent, multi-word ad tags; `MODEL_VERSION` 3 | #60 |
| 1C | One consent and measurement module | #58 |
| 1D | `@vspl/contracts` (versioned Zod contracts → JSON Schema and OpenAPI; Windmill validates with them); one edge pipeline; Idempotency-Key; rate-limiter interface; separate ticket key; a lead is forwarded even when the staff email fails | #61, #64 |
| 1E | Windmill owns its secrets and the hooks certificate; `integrations/n8n` removed | infra #113, #56 |
| 1F | Lead inbox (`leads` database) and idempotent CRM sync; `deliveries` with backoff and dead letters; one dispatcher `f/talent/dispatch`; signed route `webhook/vspl-submission`; `f/platform/health` | #63, infra #115 |
| Hub A | Notification hub `f/notify/*` (outbox, dispatch, digest, ingest, Alertmanager adapter); ntfy at `ntfy.vayasyaseva.com` (deny-all; users `owner` read-only and `windmill` write-only); `notify` database; Resend fallback with the shared Vayasya key. Test events reached all three topics, 18 Oct 2026 | #62, infra #114, #116 |
| — | Vercel WAF: one rate-limit rule on the eight form and agent POST paths, 15 per 60 s per IP, **log only** (Hobby allows one rate-limit rule) | Vercel firewall |

## In progress

- **Hub phase B** (`docs/notification-hub.md`, "Producers"; built, in review with its owner steps): applications (name, phone, Call) and leads from the CRM steps, `lead.forward_failed`, `lead.email_failed` from the site, `f/platform/health` every 15 minutes (the 11 Oct SMS `unknown` fires once), the compliance monitor and SEO watch dual-writing Chatwoot and the hub, the GitHub workflows' failures, and Alertmanager into the hub with Windmill and Twenty down alerts and the weekly seo-watch alert fix (infra PR). `windmill.job_failed` is not possible on Windmill CE v1.822 (its workspace error handler runs from enterprise code only); the Windmill pod alerts and health cover it.
- **Applicants' files into Twenty** (built, in review): the `files` delivery target copies each application's R2 files to attachments on its Twenty application (neutral labels `VS-J-XXXXXX-<n>.<ext>`, voice notes skipped), and setup backfills earlier applications oldest first. Erasure deletes the attachments, trashed ones too, before the application. Owner step: the API key's Upload files permission. The backfill must drain before the first R2 files expire, about 25 Dec 2026.

## Next

1. **Site onto the signed route:** add `SUBMISSION_SIGNING_SECRET` to Vercel and redeploy, with one owner-watched test application and enquiry.
2. **Retire Chatwoot** (owner approved): after hub phase B and the file move. Run both for 1–2 weeks; stop Chatwoot delivery; take Chatwoot out of erasure and deploy; remove it in infra; update the privacy notice. First check the Chatwoot UI for a WhatsApp inbox and FurblowCraft's account.
3. **Delete the n8n app (N6):** from 20 October 2026, after checking Windmill's health and that `/webhook/*` has no hits. The NFSS deploy reads `windmill-nfss` first.
4. **Rotate the secrets exposed on 17 October 2026.** The Vayasya Resend key (`N8N_SMTP_PASS`) is now used by Alertmanager, Chatwoot, Twenty, n8n and the hub; update all five.
5. **WAF:** review the log-only rule's hits (`vercel.com/<team>/vayasyaseva-com/firewall/traffic`), then switch it to `rate_limit`. Indian mobile carrier NAT shares addresses, so check before enforcing.
6. **Health:** one SMS from about 11 Oct is `unknown`; check Fast2SMS history before any resend.

## Work in progress, owner to decide

- **Consent and data collection (frozen at current behaviour).** Owner direction, 17 Oct 2026: the default is the most data-collective, unrestricted setup, and decisions come later. Recordings stay unmasked, with typed input recorded, under Allow All. Nothing is restricted until the owner decides. Open for that discussion: v7 and v8 sign-off with counsel; per-purpose choices; the legal-basis wording; consent receipts; the old-refusal, blocked-storage and cross-tab rules; what GA4 receives; Data Manager `adUserData`; the notice's backup wording. The one standing rule: the notice and banner describe what is collected.
- **Retention pipeline.** The owner wants a better pipeline designed before more retention automation. Known gaps: no retention on Umami events; enquiry deletion after 24 months is not automated; infra purges can't be verified from this repo. `src/lib/measurement/retention.ts` lists the stores, and content check C14 compares it with the notice.

## Outside the code (owner)

- Point Google Business Profile and listings at `/locations/haridwar`. Google Ads needs no change: the campaigns land on `/jobs` pages.
