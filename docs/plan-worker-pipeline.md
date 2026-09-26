# Plan: Job seeker section and candidate pipeline

Status: proposal, 26 September 2026. Nothing built.

## Why

Most searches around SIDCUL and Haridwar come from job seekers (*SIDCUL jobs*, *Haridwar company job*, *helper job Haridwar*). For a labour contractor, these people are the supply side of the business. A real section for them gives us three things: a candidate pipeline, strong brand search, and entry into **Google's job search panel** through `JobPosting` structured data. That panel sits above normal results for job queries.

## Who it is for

Factory helpers, packers, loaders, housekeeping staff, fitters, welders and supervisors in and around Haridwar. They mostly use phones and prefer Hindi, and WhatsApp is their main channel. Many have no resume. **Resume upload must be optional**; a short form must work on its own.

## Section and URLs

| URL | What | SEO role |
|-----|------|----------|
| `/jobs` (and `/hi/jobs`) | Hub: how we hire, the kinds of work, "we never charge job seekers", apply | *jobs in Haridwar / SIDCUL*, *नौकरी हरिद्वार* |
| `/jobs/apply` | Short application form | Conversion |
| `/jobs/[slug]` | One page per **real, open** position | `JobPosting` rich results |
| `/jobs/[role]-haridwar` | Role pages (helper, packer, housekeeping) **only while that role has openings** | *helper job Haridwar* |

The section is kept separate from buyer pages. It gets one "Jobs" link in the header and footer, and buyer pages don't push job content. It stays in a subfolder, not a subdomain, so it shares the domain's authority.

### Google job search rules (non-negotiable)

- `JobPosting` only for real openings, with `datePosted`, `validThrough`, `jobLocation` and `employmentType`. Include `baseSalary` where operations can state it; listings with salaries perform better.
- Remove or expire a posting as soon as it is filled. Stale postings get the whole site's job markup ignored.
- The hiring organisation is Vayasya Seva, not the client, unless the client has agreed to be named.

## Application form

Required: name, mobile number, area or village, type of work (choose one or more), years of experience, when they can start.
Optional: resume (PDF, JPG or PNG, 5 MB max), preferred shift, languages.
Not collected at intake: Aadhaar, bank details, date of birth, photos of ID. These come later, only at onboarding and through the onboarding process.

The form is Hindi-first with an English toggle, large touch targets, and works on slow networks. Alongside it: "WhatsApp us" and "Call us" options for people who won't fill in a form.

## Pipeline

```
Form / WhatsApp → /api/apply (zod, honeypot, rate limit)
  → Candidate record (dedupe by mobile) + resume in a private bucket
  → SMS/WhatsApp acknowledgement via MSG91 (already integrated)
  → Ops queue: New → Screened → Contacted → Interviewed → Deployed / Not suitable / Withdrawn
  → Match to open requirements
```

- **Storage:** a Postgres database for candidate records, and private object storage for resumes, opened only through short-lived signed links. **Vayasya Setu should probably own this**: it is already the workforce platform, and candidates become deployed workers there. The website then only posts to Setu's intake API.
- **Resume parsing (phase 3):** extract fields from uploaded resumes into the record for a person to review. Never auto-reject on the parsed result.
- **Retention:** delete inactive candidates after 12 months unless they reconfirm. Deletion on request.

## Legal and trust

- **DPDP Act 2023 and Rules:** a clear notice at the point of collection, stating purpose, what is collected, retention, and how to withdraw or request deletion. Record consent with a timestamp. Name a grievance contact. Update `/privacy` before launch, and have counsel review it.
- **Scam warning** on every jobs page: "Vayasya Seva never charges any fee for jobs." Fake job fees are common in this market, and a plain statement builds trust.
- Files: type and size checks, malware scan, no public URLs.
- Analytics: fixed-label events only (`job_apply_start`, `job_apply_submit`). No personal details sent.

## Phases

1. **Hub + apply form + intake + acknowledgement.** Hindi and English. No individual job pages yet.
2. **Job postings:** an ops-owned workflow to publish and expire openings, with `JobPosting` markup and role pages.
3. **Setu integration, resume parsing, matching to client requirements.**
4. WhatsApp intake and status updates.

## Decisions needed

1. Where candidate data lives: Setu, or a separate database the website owns?
2. Who in operations owns the queue and the openings, and what reply time we commit to.
3. Whether salaries can be shown on postings.
4. Are there open positions today to launch phase 2 with?
5. The section's name: "Jobs", "Work with us", or "नौकरी".
