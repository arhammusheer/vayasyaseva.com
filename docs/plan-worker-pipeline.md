# Plan: Job seeker intake and candidate pipeline

Status: Stage 1 workflows and infrastructure live since 26 September 2026 (`integrations/n8n`, `vayasya-infra` RUNBOOK "Talent intake"), verified end to end. The website intake pages and API are not built yet.

## The idea

Nobody fills in a long form. A job seeker **drops whatever they have**: a voice note, a photo of a certificate, a PDF or Word resume, a few typed lines. We ask for only two things: a phone number to reach them on, and consent. Everything lands in Chatwoot as a conversation, with voice notes transcribed. **No AI reads or summarises it for now**; staff read the originals. Optional AI parsing is described at the end.

## Two front doors, one backend

| | Hindi-forward | English-forward |
|---|---|---|
| Who | Helpers, loaders, packers, housekeeping, many machine operators | Supervisors, skilled trades (ITI, welders, electricians), office and site admin |
| URL | `/hi/jobs` (primary), `/hinglish/jobs` | `/jobs` |
| Main action | **"बोलकर बताइए"**: a large record button. Speak for up to 3 minutes about yourself and the work you want | **"Drop your resume or tell us about yourself"**: a file drop plus a free-text box |
| Also accepts | Photos of certificates, licences, old payslips; typed text | PDFs, Word files, photos, a LinkedIn URL pasted as text |
| Prompts on screen | Short spoken-style hints: "अपना नाम, गाँव, कौन-सा काम आता है, कब से काम कर सकते हैं" | "Include your role, experience, location and when you can start" |

Both doors post to the same intake API and produce the same profile. Each language page links to the other.

**WhatsApp is the natural third door** for Hindi-forward workers: they send a voice note or photo to the business number. It runs through the Chatwoot WhatsApp inbox, which is being set up, and is part of Stage 2.

## Screens (Hindi-forward, phone)

```
┌──────────────────────────────┐
│  काम चाहिए? हमें बताइए।         │
│  Vayasya Seva कभी कोई फ़ीस नहीं  │
│  लेती।                         │
│                              │
│        ( 🎙 बोलकर बताइए )       │
│                              │
│  📷 फ़ोटो जोड़ें   ✎ लिखकर बताइए  │
│                              │
│  मोबाइल नंबर  [__________]     │
│  ☐ मेरी उम्र 18 साल या ज़्यादा है  │
│  ☐ मैं सहमत हूँ (जानकारी कैसे    │
│    इस्तेमाल होगी, पढ़ें)          │
│                              │
│  [ भेजें ]                     │
└──────────────────────────────┘
→ On screen: "आपकी जानकारी मिल गई। नंबर VS-J-4821"
  (Stage 2: the same message by SMS or WhatsApp)
```

## Pipeline, on the existing infrastructure

The group already runs what this needs (see the `vayasya-infra` repo): **n8n** for automation with a public webhook route, **Chatwoot** at `chat.vayasyaseva.com` behind Cloudflare Access, the shared **`pg-main`** Postgres cluster, and **R2** buckets in Terraform. The website runs on Vercel and cannot reach `pg-main` (only Traefik is public), so the website stays thin: it takes the drop and hands it to n8n.

```
 Browser                 Vercel /api/jobs/intake             n8n (growth)                         Stores
 ───────                 ───────────────────────             ────────────                         ──────
 files, audio ── PUT to presigned URL ──────────────────────────────────────────────────────────► R2 vayasya-talent-intake
 phone, consent, text ─► validate (Zod contract), issue URLs
                         ─► POST /webhook/vspl-talent-intake ─► intake: validate, save, 202 ──────► talent DB (pg-main)
 ◄── reference on screen                                     transcribe (every min): voice →
                                                               Sarvam Batch API → transcript ──────► talent DB
                                                             deliver (every min): Chatwoot contact,
                                                               conversation, private note with
                                                               message + transcripts, files ───────► Chatwoot "Jobs, website"
```

- **Files never pass through Vercel.** Its functions take request bodies of only about 4.5 MB, so the API route issues short-lived presigned R2 upload URLs, and the browser uploads directly.
- **Three workflows that hand off through the database** (`received` → `delivering` → `delivered`), so none of them waits on another inside one run. Stuck steps are reset and retried up to three times.
- **Sarvam `saaras:v4` for voice, REST first.** The synchronous REST endpoint answers in about a second but stops at 30 seconds of audio; longer notes (up to 3 minutes) fall back to the Batch API. Both routes were verified by hand; see `integrations/n8n/README.md`. The key is the n8n credential `sarvam-vspl`. The Hindi transcript is kept word for word; Aadhaar and PAN numbers are masked in transcripts and typed text.
- **Chatwoot is the review screen.** Voice notes, photos and documents are attached to the conversation, so staff can listen and read the originals. There is no AI check for identity documents, so the jobs page must ask people not to upload Aadhaar or bank documents.
- **Type safety:** the website→n8n contract is a Zod schema (`src/lib/talent-intake/contract.ts`), sharing its rules (`rules.ts`) with the n8n Code nodes. The nodes are written in TypeScript and compiled into the workflow JSON by `integrations/n8n/build.mts`.

## Optional later: AI parsing through OpenRouter

The owner prefers **OpenRouter's free models** if parsing is added. Design, not built:

- **A side workflow, never in the delivery path.** It runs after `delivered`, sends the masked text and transcripts (no files, no phone number) and posts a second private note: "AI draft summary". If it fails or is rate-limited, nothing is lost.
- **Documents:** most free models read text only. PDF text can come from n8n's built-in Extract from File node. Word documents and photos would need other handling.
- **Structured output:** request JSON with `response_format`. Free models vary in how reliably they follow it, so the Code node validates the JSON and drops invalid answers. Keep a fallback list of models, because free model IDs change.
- **Limits:** 20 requests per minute. 50 a day without purchased credits, or 1,000 a day with at least $10 of credits.
- **Privacy is the deciding question.** Some free-model providers log prompts or train on them. Sending job seekers' personal details to a provider that trains on them conflicts with the DPDP notice we plan to show. Keep OpenRouter's account setting that excludes providers that train on inputs, and send only masked text. If that leaves no usable free model, the choice is a low-cost paid model with no data retention, or no AI.

## Data protection (DPDP Act and Rules)

- Put a notice at the point of collection, in the reader's language: what we collect, why, who processes it, how long we keep it, and how to withdraw or ask for deletion. This is why `/privacy` gets a Hindi version.
- Record consent with a timestamp and notice version. Ask for an **18+ confirmation**, since contract labour work for minors is prohibited.
- Retention: source files are deleted from R2 after 90 days (bucket lifecycle rule). Chatwoot keeps its copies, so conversations need a matching clean-up. Honour erasure requests in both places.
- Security: a private R2 bucket, signed links that expire, file type and size limits, malware scanning, a shared-secret check on the n8n webhook, and rate limits in a persistent store. The contact form's in-memory limits don't survive on serverless, so use Vercel's firewall or a check in n8n.
- Processors to name in the privacy notice: Sarvam AI (speech-to-text), Cloudflare (R2), Vercel, and Chatwoot's hosting (our own cluster). Check Sarvam's data retention terms. Add OpenRouter and its provider only if AI parsing is switched on.

## SEO

- `/jobs`, `/hi/jobs` and `/hinglish/jobs` are the hubs, written for searches like "jobs in Haridwar", "SIDCUL job" and "हरिद्वार में नौकरी".
- `JobPosting` pages only for real open positions, removed or expired as soon as they are filled.
- The hub pages carry the no-fee statement and a plain explanation of how hiring works. Both build trust and are useful content.

## Rollout (updated 26 September 2026)

Setu has no intake or talent module yet. Chatwoot is deployed; WhatsApp and the business numbers are being connected to it, and DLT registration for SMS is in progress.

### Stage 1: Collect (build now)

- **Infra repo (owner):**
  - The `vayasya-talent-intake` R2 bucket (private, CORS for the site), plus a token scoped to it.
  - The `talent` database and role on `pg-main`.
  - n8n credentials for that role, R2, Sarvam and a Chatwoot API token (see `integrations/n8n/README.md`).
  - A Chatwoot API-channel inbox, "Jobs, website", in the Vayasya Seva account.
- **Website (this repo):**
  - The `/jobs`, `/hi/jobs` and `/hinglish/jobs` intake pages (voice, photos, files, text, phone, consent, 18+).
  - `POST /api/jobs/intake`: validation and presigned uploads, then a forward to the n8n webhook.
  - The Hindi `/privacy` notice.
- **n8n:** the intake workflow (steps 1–6 above).
- **Acknowledgement is on screen only.** SMS needs DLT-registered templates, so there are no SMS messages and no one-time codes yet. Phone numbers stay unverified; duplicates are matched by number in the `talent` database.

### Stage 2: Converse (after WhatsApp and DLT are live in Chatwoot)

- **WhatsApp → pipeline:** a Chatwoot webhook passes incoming WhatsApp voice notes, photos and messages to the same n8n transcription step, so WhatsApp voice notes arrive transcribed in the same thread.
- **Two-way conversations** in the same Chatwoot thread. **SMS acknowledgements** once the DLT templates are approved, for example "आपकी जानकारी मिल गई। नंबर {#var#}". **WhatsApp templates** for reaching out first (Meta approval needed).
- **Listmonk (`listmonk-vspl`)** could later tell opted-in candidates about new openings. It needs separate consent.

### Stage 3: Match

Setu reads or imports the `talent` database when it gains a talent module, then matches candidates against client requirements.

### Designed for any channel from day one

Every input becomes a `Submission` with a `source` (`web_en`, `web_hi`, `web_hinglish`, `whatsapp`, `phone`, `sms`), a contact (phone number) and attachments. The transcribe and deliver workflows never care where a submission came from.

```
Submission { id, ref, source, phone, locale, consent{version, at}, adult, text?, attachments[r2Key, type], status, createdAt }
```

## Decisions (26 September 2026)

- Infra changes are made in `vayasya-infra` (branch `talent-intake`). Chatwoot notifications are the only alert.
- The workflows are generated from TypeScript in this repo (`integrations/n8n`) and imported into n8n.
- No AI in the delivery path. Sarvam transcribes voice notes; there are no test voice notes yet, so the first real submissions are the trial. Check their transcripts before relying on them.

## Jobs pages (decided 26 September 2026)

- **Name and URLs:** "Jobs" / "नौकरी", at `/jobs`, `/hi/jobs` and `/hinglish/jobs` (translations of one another in `pageLocales`).
- **Header and footer link** follows the page's language: English pages link to `/jobs`, Hindi pages to `/hi/jobs`, Hinglish pages to `/hinglish/jobs`.
- **One page with the form**, no separate apply page, in this order:
  1. The no-fee line.
  2. Voice recording: 3-minute timer, play back before sending.
  3. Photos and documents: camera, gallery, PDF, Word, with "don't send Aadhaar or bank documents".
  4. An optional message.
  5. Mobile number, 18+ and consent.
  6. A confirmation with the reference number.
- **Flow:** `POST /api/jobs/start` (reference and presigned R2 upload URLs) → the browser uploads directly → `POST /api/jobs/submit` (Zod contract, Turnstile check) → the n8n webhook.
- **Spam protection:** Cloudflare Turnstile.
- **No openings list yet**, and no `JobPosting` markup until openings are managed properly.
- **Needed:**
  - a website R2 token, write-only and scoped to `vayasya-talent-intake`;
  - a Turnstile widget (in `vayasya-infra`);
  - Vercel environment variables: R2 key, webhook secret, Turnstile secret;
  - the Hindi privacy notice.


1. **OpenRouter parsing:** whether to accept free models that may train on inputs (not recommended), use a low-cost model with no data retention, or stay without AI.
2. **The website intake:** build the jobs pages above. Test WebM/Opus recordings from a real Android phone through Sarvam.
