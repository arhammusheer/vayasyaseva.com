# Plan: Job seeker intake and candidate pipeline

Status: design exploration, 26 September 2026. Nothing built. Replaces the earlier form-based draft.

## The idea

Nobody fills in a long form. A job seeker **drops whatever they have**: a voice note, a photo of a certificate, a resume PDF, a few typed lines. We ask for only two things: a phone number to reach them on, and consent. An AI pipeline turns the drop into a structured profile. A person on the operations team checks it before anyone relies on it.

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

The group already runs what this needs (see the `vayasya-infra` repo): **n8n** for automation with a public webhook route, **Chatwoot** at `chat.vayasyaseva.com` behind Cloudflare Access, the shared **`pg-main`** Postgres cluster, **R2** buckets in Terraform, and **Resend** for email. The website runs on Vercel and cannot reach `pg-main` (only Traefik is public), so the website stays thin: it takes the drop and hands it to n8n.

```
 Browser (vayasyaseva.com)        Vercel API route              Cluster (growth / data)
 ─────────────────────────        ────────────────              ───────────────────────
 files, audio ── PUT to presigned URL ─────────────────► R2 bucket `vayasya-talent-intake` (private)
 phone, consent, text ──► POST /api/jobs/intake
                           validate (zod), honeypot,
                           issue presigned upload URLs
                           ──► POST hooks.vayasyaseva.com/webhook/jobs-intake
                               (shared-secret header) ─────► n8n workflow
 ◄── reference shown on screen                                1. check secret, save Submission
                                                                 → `talent` database on pg-main
                                                              2. voice → Hindi transcript (STT API)
                                                              3. Claude: files + transcript + text
                                                                 → CandidateProfile (JSON schema)
                                                              4. mask ID numbers, save Profile
                                                              5. Chatwoot API inbox "Jobs, website":
                                                                 contact by phone + conversation,
                                                                 summary as private note, file links
                                                              6. Resend: alert to ops (optional)
 Ops works in Chatwoot ◄───────────────────────────────────── (Stage 2: reply on WhatsApp, same thread)
```

### Why these steps

- **Files never pass through Vercel.** Vercel functions accept request bodies of only about 4.5 MB. The API route issues short-lived presigned R2 upload URLs (the S3-compatible API), and the browser uploads straight to the bucket. The bucket needs CORS for `https://www.vayasyaseva.com` and a token scoped to it alone.
- **n8n owns the pipeline.** It already has a public webhook route, which the runbook lists for "website forms", and its admin screens sit behind Access. Every webhook workflow must check a shared secret. Retries, waits and the Chatwoot and Resend steps are ordinary n8n nodes; there's no new worker service to run.
- **A `talent` database on `pg-main`**, with its own role, like every other app (`databases.yaml`, `pg_hba`, `scripts/rotate-db-password.sh`). n8n gets that role's credentials. This is the candidate system of record until Setu has a talent module, which can then read or import from it. It is covered by the existing daily backups and 30-day point-in-time recovery.
- **Chatwoot is the review screen.** An API-channel inbox receives each submission as a conversation on the person's phone number. The AI summary and follow-up questions go in as a private note, and profile fields as contact attributes. Operations needs no new tool. When WhatsApp is connected, the same contact's WhatsApp messages join the same thread.
- **Speech-to-text is a separate service.** Claude reads PDFs and images directly but doesn't accept audio, so n8n sends each voice note to a speech-to-text API, then passes the transcript on. **Sarvam AI** is the first provider (built for Indian languages). Its key is stored as the n8n credential `sarvam-vspl` (Header Auth), with a backup in the password manager; it isn't in this repo or Vercel. We keep the **Hindi transcript word for word**, and Claude writes the English summary, so operations can check what the person actually said. The browser records WebM/Opus or MP4/AAC, and no conversion step is needed.
  - **Why not self-hosted Whisper (for now):** the cluster has no GPU, so Whisper runs on CPU next to Setu production on two workers. New nodes can't be added (the network is out of IP addresses), and the worker image disks are tight. If a larger or GPU node arrives, a self-hosted Whisper server with an OpenAI-compatible API can be tested against Sarvam without changing anything but the one HTTP node.
  - **Trial:** 20–30 real voice notes with Haridwar accents. Score the transcripts with an ops reviewer before relying on them.
- **Claude for extraction.** n8n calls the Messages API with the PDFs (document blocks), photos (image blocks), transcript and text, and asks for JSON that follows the profile schema (`output_config.format`). The model is `claude-opus-5` by default. Whether a cheaper model is good enough is a decision to make once there is a test set of real submissions. At low volume, requests run one at a time. The Message Batches API (50% cheaper) is worth adding once volume makes the saving matter.
- **Human review, always.** The AI drafts; people decide. It never rejects anyone automatically.

### Profile schema (draft)

```ts
CandidateProfile {
  name?: string
  phones: string[]                      // from form + anything found in files
  location?: { area?: string; district?: string; state?: string }
  languages: string[]
  workTypes: ("production_helper" | "packer" | "loader" | "warehouse" | "housekeeping"
            | "machine_operator" | "welder" | "fitter" | "electrician" | "civil"
            | "gardener" | "supervisor" | "office" | "other")[]
  experience: { role: string; where?: string; duration?: string }[]
  skills: string[]
  certifications: { type: string; detail?: string }[]   // e.g. ITI trade, forklift licence
  availability?: { startWhen?: string; shifts?: string[]; nightShiftOk?: boolean }
  expectedWage?: string                 // only if the person said it
  documentsProvided: string[]           // types only, never ID numbers
  summaryEn: string                     // for ops, 2–3 lines
  summaryHi: string
  followUpQuestions: string[]           // what ops should ask on the call
  confidence: "high" | "medium" | "low"
  sources: { field: string; from: "voice" | "text" | "file"; fileName?: string }[]
}
```

**The prompt forbids extracting or inferring** caste, religion, marital status, health or any other protected attribute. It never records Aadhaar, PAN or bank numbers; if they appear, the pipeline masks them in the profile and flags the file for deletion after review.

### Cost (rough, to verify with real samples)

A typical drop is a 1–2 page PDF, a photo or two and a 2-minute transcript: around 5–10K input tokens and 1–2K output. At Claude Opus 5 list prices ($5 / $25 per million tokens), that is about **$0.05–0.10 per submission, or roughly half with batch processing**. Speech-to-text adds a small per-minute cost. At 1,000 submissions a month, total AI cost is likely in the tens of dollars. Measure this on real samples before committing.

## Data protection (DPDP Act and Rules)

- Put a notice at the point of collection, in the reader's language: what we collect, why, who processes it, how long we keep it, and how to withdraw or ask for deletion. This is why `/privacy` gets a Hindi version.
- Record consent with a timestamp and notice version. Ask for an **18+ confirmation**, since contract labour work for minors is prohibited.
- The speech-to-text provider and Anthropic are processors. Name them in the privacy notice, and check each one's data retention terms.
- Retention: delete source files 90 days after review. Keep the profile for 12 months unless the person reconfirms. Honour erasure requests.
- Security: a private R2 bucket, signed links that expire, file type and size limits, malware scanning, a shared-secret check on the n8n webhook, and rate limits in a persistent store. The contact form's in-memory limits don't survive on serverless, so use Vercel's firewall or a check in n8n.
- Processors to name in the privacy notice: Anthropic, Sarvam AI (speech-to-text), Cloudflare (R2) and Vercel. Check Sarvam's data retention terms.

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
  - n8n credentials for that role, Anthropic, the speech-to-text provider and a Chatwoot API token.
  - A Chatwoot API-channel inbox, "Jobs, website", in the Vayasya Seva account.
- **Website (this repo):**
  - The `/jobs`, `/hi/jobs` and `/hinglish/jobs` intake pages (voice, photos, files, text, phone, consent, 18+).
  - `POST /api/jobs/intake`: validation and presigned uploads, then a forward to the n8n webhook.
  - The Hindi `/privacy` notice.
- **n8n:** the intake workflow (steps 1–6 above).
- **Acknowledgement is on screen only.** SMS needs DLT-registered templates, so there are no SMS messages and no one-time codes yet. Phone numbers stay unverified; duplicates are matched by number in the `talent` database.

### Stage 2: Converse (after WhatsApp and DLT are live in Chatwoot)

- **WhatsApp → pipeline:** a Chatwoot webhook passes incoming WhatsApp voice notes, photos and messages to the same n8n extraction steps, so a WhatsApp conversation builds the same profile a web submission does.
- **Two-way conversations** in the same Chatwoot thread. **SMS acknowledgements** once the DLT templates are approved, for example "आपकी जानकारी मिल गई। नंबर {#var#}". **WhatsApp templates** for reaching out first (Meta approval needed).
- **Optional AI follow-up:** send the profile's `followUpQuestions` over WhatsApp, with a person approving before anything is sent.
- **Listmonk (`listmonk-vspl`)** could later tell opted-in candidates about new openings. It needs separate consent.

### Stage 3: Match

Setu reads or imports the `talent` database when it gains a talent module, then matches candidates against client requirements.

### Designed for any channel from day one

Every input becomes a `Submission` with a `source` (`web_en`, `web_hi`, `web_hinglish`, `whatsapp`, `phone`, `sms`), a contact (phone number) and attachments. The extraction steps never care where a submission came from.

```
Submission { id, ref, source, phone, locale, consent{version, at}, adult, text?, attachments[r2Key, type], status, createdAt }
Profile    { id, submissionIds[], phone, data: CandidateProfile, model, promptVersion, chatwootContactId?, status }
```

## Decisions needed

1. **Infra changes in `vayasya-infra`:** the R2 bucket, the `talent` database and role, and the Chatwoot API inbox. Should I draft them as a pull request there, or do you make them?
2. **Operations alerts:** is a Chatwoot notification for the "Jobs, website" inbox enough, or should there also be a Resend email? If so, to whom?
3. **Speech-to-text trial:** Sarvam is chosen and its key stored. Collect 20–30 real voice notes, with consent, to test it on.
4. **Where the n8n workflow lives:** built in the n8n editor, or exported as JSON and kept in version control, in this repo or `vayasya-infra`?
