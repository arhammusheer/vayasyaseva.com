# Twenty CRM (crm.vayasyaseva.com)

VSPL's back office: job seekers as people with their applications and every message to them, and client leads as crew requests. Twenty v2.43.0, single workspace "Vayasya Seva", self-hosted in vayasya-infra (`apps/twenty`, RUNBOOK "Twenty"); behind Cloudflare Access.

## The model (`setup.mts`)

| Object | What | Fields we added |
|---|---|---|
| **Person** | Workers and client contacts, one per phone number | Type (Worker / Client contact), Worker status (New, Callable, Placed, Not available, Do not contact), Clusters, Roles (`workRoles`; "roles" is reserved), Home area, Language, Consent version/at, Last applied, Last contact (the retention clock) |
| **Application** (custom) | A job application; name = its reference VS-J-XXXXXX | Status (New → No answer → Screened → Callable → Placed → Archived), Phone, Source, Role (`jobRole`), Work wanted, Area, Experience, Education, Can start, Shifts, Skills (the quick form's answers as real fields), Cluster, Message, Answers (raw), Submitted, Consent version, Page, Talent DB id (unique sync key); → Person |
| **Communication** (custom) | Every SMS, WhatsApp, call or email, with delivery status | Channel, Direction, Delivery (Queued, Sent, Delivered, Read, Failed, Unknown), Template, Message, Provider, Provider ID, Status at, Error, Sync key (unique); → Person, Application, Crew request |
| **Company** | Client companies | (standard) |
| **Opportunity**, labelled **Crew request** | A crew request | Stage replaced with New → Contacted → Site visit → Quoted → Won / Lost; Crew size, Services, Site, Cluster, Start, Lead source, Enquiry, Case ID (unique sync key) |

## How it is laid out (`layout.mts`)

- **Sidebar**: Jobs dashboard, To call, Applications, People, Communications, Crew requests, Companies, Tasks, Notes, Dashboards; Workflows after.
- **Applications**: **To call** (New and No answer, oldest first: the work queue), **Pipeline** (board by status), **All applications**, **Callable pool**, **By role** and **By area** (boards of open applications), **Last 7 days**. Each list shows the person, phone, role, area, experience and start date first; the raw answers, sync key and consent stay on the record only.
- **People**: **Workers** (newest applicant first), **Callable workers**, **Workers by status** (board), **Client contacts**.
- **Communications**: newest first; **Needs attention** (failed or unknown). **Crew requests**: the list and the **By Stage** board, with crew size, cluster, site and start.
- **Record pages**: the fields in working order (phone, status, role, screening answers, message), the bookkeeping last.
- **Jobs dashboard**, three tabs: *Applications* (to call, last 7 days, callable, placed; applications per day; status; open applications by role and area; experience, can start, source; the to-call table), *Workers and SMS* (worker counts and statuses, SMS delivered and needing attention), *Crew requests* (open requests, workers asked for, won, by stage and cluster).

Option values are UPPER_SNAKE (`DELHI_NCR`, `FACTORY_HELPER`); the site's slugs map onto them (`integrations/windmill/talent/lib/crm.ts`).

```bash
node integrations/twenty/setup.mts --dry-run       # what it would add
node integrations/twenty/setup.mts                 # add missing objects, fields, options, views
node integrations/twenty/setup.mts --remove-demo   # also remove Twenty's sample records (done once, 17 Oct 2026)
node integrations/twenty/setup.mts --reset-layout  # put every view, record page, the dashboard and the sidebar back as layout.mts says
node integrations/twenty/backfill-applications.mts # fill new application fields from Answers (done once, 17 Oct 2026)
```

Idempotent: it creates what is missing and updates select options; it never deletes data (apart from `--remove-demo`), and leaves an existing view and the dashboard as staff may have changed them (`--reset-layout` overrides). Calls are spaced under Twenty's 100-a-minute key limit, so a reset takes a few minutes. It reaches Twenty through `kubectl port-forward svc/twenty` with the key in Secret `growth/twenty-api` and prints neither.

## How data gets in

- **Applications**: Windmill `f/talent/sync_crm` every minute: each new submission in the talent database becomes (or updates) its person by phone, an application and an SMS-acknowledgement communication; a changed SMS status is written again. The talent database stays the record of truth and consent evidence; `crm_sync` there says what was written. Backfilled on 17 Oct 2026: 37 people, 41 applications, 27 acknowledgements.
- **Leads**: the website's `/api/contact` and `/api/agent/contact` post each enquiry (after emailing it, in `after()`) to Windmill `f/leads/intake`, which files the company, the client contact, the crew request at stage New and the enquiry as an inbound communication. Replay-safe by case ID.
- **By hand**: staff add notes, tasks, calls and anything else in Twenty itself.

## Erasure and retention

The talent pipeline's erasure (`f/talent/retention`, privacy notice §10) removes the person's Twenty records too (their communications, applications and the person) before the database rows, and stops if Twenty fails. Leads follow the business retention in the privacy notice; delete a company's records in Twenty by hand when asked.

## The API key

"Windmill (automation)", minted with Twenty's `workspace:generate-api-key` command (it refuses in production mode, so it was run once with `NODE_ENV=development` in the server pod), stored in `growth/twenty-api` (SOPS, vayasya-infra `apps/twenty/overlays/growth/secrets.sops.yaml`). Twenty limits a key to 100 requests a minute. Revoke it in Settings → APIs & Webhooks.
