# Crew offers on WhatsApp

How a job applicant is invited to interview for a crew request and kept informed, from Twenty CRM, on WhatsApp from the Business number (+91 78958 50598). Built 19 November 2026. Code: `integrations/windmill/talent/lib/crew*.ts`, `run-crew.ts`; Twenty model: `integrations/twenty/setup.mts` (`crewMember`, the crew request's offer fields).

## The procedure

Since 19 November 2026 the first message invites the worker to an interview; the job is decided at the interview, not on WhatsApp. The phone call fixes the interview; WhatsApp carries the details to many people at once and records the answers.

| Step | Who | In Twenty | What the worker gets |
|---|---|---|---|
| 1. Fill in the crew request | Recruiter | Job and Place (for workers), Start, Stay and food (empty when nothing is given); Interview at, Interview time, Ask for, Map link; Pay and Shift for the call | |
| 2. Invite | Recruiter | Select workers, "Offer job" (below), or add a Crew member on the crew request. Status **Invited** | An update on their application (VS-J-...): shortlisted for an interview, the job, place, start (and stay and food when given), Yes / No |
| 3. Answer | Automatic | **Said yes** or **Said no** from the tap or a typed haan / nahi; **No reply** after 24 hours | |
| 4. Call | Recruiter, same day | "To call" view: Said yes, oldest first. Check they are free, can reach the site, are 18 or older; tell them the pay and shift. Set **Interview fixed** | Where and when the interview is, whom to ask for, what to bring |
| 5. Evening before | Automatic, 6 to 9 pm | | A reminder with Yes / Can't come |
| 6. Can't come | Automatic | **Can't come**, and a push to the recruiters | |
| 7. Interview | Site supervisor tells the recruiter | **Came** or **Didn't come** | |
| 8. Interviews full | Recruiter | **Not needed** on those who said yes and were not called | An update on their application: the interviews are full; the application stays open |

Invite about two people per place for helpers and packers, about 1.5 for skilled trades *(a starting point; adjust from what turns up)*.

Said yes and Can't come each push to the jobs topic in ntfy (name, phone, Call button), rule "Crew reply" in `notify/lib/policy.ts`.

## What the automation refuses

Each refusal is written in the crew member's **Message note**, and nothing is sent:

- Do not contact (any message), Not available (the invitation).
- No job application on record (the invitation and the interviews-full message carry its reference).
- No consent on record: the person never applied through the website or an agent. Call them instead.
- No Indian mobile number.
- A worker already holding an open invitation (Invited, Said yes or Interview fixed) on another crew request, or a second crew member for the same worker on the same request: one at a time, the earlier one goes.
- A crew request field the message needs is empty.
- The template for that message and language is not approved yet.
- Quiet hours: invitations and interviews-full messages go 08:00 to 21:00, interview details 07:00 to 22:00, reminders 18:00 to 21:00 the evening before (and at least 2 hours before the interview, and not within 3 hours of the details). They wait, and go when the window opens.

**Test numbers.** Staff numbers listed in the Windmill variable `f/talent/crew_test_phones` (separated by commas or new lines; edited by hand, deploy never overwrites it) skip the quiet hours, and their reminder goes a minute after the confirmation, so the whole path can be tried at any time. Every other check applies to them.

Each message goes at most once per crew member, ever. A refused or failed send says "call them" in Message note; a send cut off midway is never repeated (it may have gone).

## The messages

`talent/lib/crew-templates.ts` holds the words, in English, Hindi and Hinglish. A worker's language comes from their person record: Punjabi readers get Hindi and Kannada readers English until templates in those languages exist.

**Utility, never Marketing** (the owner's rule, 19 November 2026). Each message is a status update on the worker's own application or interview: the invitation and the interviews-full message open with the application's reference; none advertises other work, promises future messages or urges action. Meta filed earlier wordings as Marketing when they opened like an announcement ("Work from Vayasya Seva") or promised to "tell you about the next job". `crew.test.mts` checks every template against those phrases.

| Message | Variables | Buttons |
|---|---|---|
| `vspl_interview_invite` | reference, job, place, start | Yes / No |
| `vspl_interview_invite_stay` | reference, job, place, start, stay and food | Yes / No |
| `vspl_interview_details` | where (with the map link), when, whom to ask | |
| `vspl_interview_reminder` | time, place | Yes, coming / Can't come |
| `vspl_interview_full` | reference, job | |

While a language's template waits for Meta, a Hindi reader gets the Hinglish one instead (`LOCALE_STAND_IN` in `crew.ts`); since 20 November 2026 that covers the two Hindi invitations, still pending at Meta.

Templates are fixed text, so a line cannot be left out at send time: the invitation has two versions, and the one with the stay and food line goes when the crew request's Stay and food is set. Every invitation says Vayasya Seva charges no fee. The Hindi and Hinglish names end in `_hinglish` for Hinglish.

## The "Offer job" button in Twenty

A Twenty workflow, made in the UI (v2.43 lets only a signed-in user edit or activate a workflow's steps; the API key cannot). Live since 19 November 2026 as:

1. Trigger: **Manual**, object **People**, availability **Bulk** (one run for the selection).
2. Action **Form**: one field, type a record of **Crew requests**, label "Crew request".
3. Action **Iterator** over the trigger's records.
4. Inside it, action **Create Record**: object Crew members; Worker = the current item; Crew request = the form's answer; Status = Invited (value OFFERED).
5. Activate. Select workers in the Workers view; the button is in the top bar and in Cmd+K.

Twenty forms cannot make a field required: a run with no crew request picked makes crew members with none, and they say "Pick the crew request" in Message note. Adding a crew member from the crew request's own page works the same way, without the workflow.

## Going live

Done on 19 November 2026: steps 1 (with the record pages laid out by `--reset-view`), 3 and 4 (`--enable-crew` on), and step 2's submission (message ids 46002 to 46013, pending Meta). The "Offer job" workflow is built and active (Workflows, "Offer job": the button shows in the People view's action bar when workers are selected). Left: the approved ids into `CREW_TEMPLATES` and a deploy, and the test on a staff number.

1. Twenty: `node integrations/twenty/setup.mts --dry-run`, then without `--dry-run`. New views appear. Views that already exist are laid out again only on request: `--reset-view="opportunity/Opportunity Record Page Fields"` (repeatable) for one, `--reset-layout` for all (staff's changes to views are lost).
2. Templates: `node integrations/windmill/whatsapp-templates.mts --create --only=crew` submits them to Meta (Utility). When approved, put each Fast2SMS message id in `CREW_TEMPLATES`. Meta may file the offer as Marketing; if it does, it still sends, at a higher price, and workers who opted out of marketing will not get it.
3. Webhook: `node integrations/windmill/fast2sms-whatsapp-webhook.mts` prints the values; the secret goes in the URL as `?key=` because Fast2SMS keeps no custom header. Optional: add `FAST2SMS_WA_SECRET` to `growth/windmill-fast2sms` (until then the delivery report secret is used), then deploy and update the webhook's URL.
4. Windmill: `pnpm windmill:build && pnpm windmill:deploy --reset-notify-policy` (the policy reset adds the Crew reply rule and overwrites hand edits to the policy), then `--enable-crew` when ready to message workers.
5. Try it on a staff member's own number first: a crew request with every field filled, one crew member, a Yes tap, Confirmed, then a reminder (set Report time to tomorrow).

## Not covered

- An SMS fallback: the offer needs a DLT template first. When WhatsApp fails, Message note says to call.
- A minimum wage check on the pay: Pay is free text. The wage data (`src/content/wages`) has categories and zones that need mapping to a crew request first.
- The site supervisor marks Reported or Didn't come through the recruiter until Setu attendance can.
- The privacy notice (Section 10) names Fast2SMS for the acknowledgement only; it should also say WhatsApp messages about work we offer go through Fast2SMS. Wording is the owner's call.
