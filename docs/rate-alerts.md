# Minimum wage rate alerts

Since 10 November 2026 each state's wage page (`/minimum-wages/<state>`) asks
its readers for one thing: an email address, to be told when that state's
rates change. About 87% of the site's search traffic lands on these pages,
mostly HR, compliance and contractor staff who come back at every revision.

## The flow

```
wage page        "Email me when rates change" (a button; the email field opens in a dialog)
                 POST /api/alerts/subscribe { email, states: [state], sourcePath }   Turnstile
site             src/server/submissions/types/rate-alert.ts -> envelope.v1, type rate_alert.v1
Windmill         f/platform/submission -> leads/lib/run-alerts.ts
                 saves the address as pending (lead inbox, alert_subscribers) and sends
                 one email through Resend: "Confirm your minimum wage alerts"
reader           opens /en-in/alerts#confirm=<token>  -> POST /api/alerts/confirm -> confirmed
owner            after a wage update is live:  pnpm alerts:send <state>
                 f/leads/alerts_send emails each confirmed follower once per revision
reader           any email's link /en-in/alerts#stop=<token> -> POST /api/alerts/unsubscribe
                 (or the mail client's one-click unsubscribe) -> the row is deleted
```

## Rules

- **Double opt-in.** Nothing but the confirmation email is sent to an address
  until its link is opened. A pending address is deleted after 7 days.
- **One email per address in ten minutes** while it is pending or asks again,
  so the form cannot flood an inbox. The answer to a subscribe never says
  whether the address was already on the list.
- **The address is used for alerts only.** The list is not in Twenty and is
  not joined to leads. The hub's digest hears "new subscriber: <states>",
  never the address.
- **Unsubscribing deletes** the row and its send history.
- **Sending is by hand** (owner decision, 10 Nov 2026): nothing goes out when
  a wage PR merges. Whoever ships a wage update runs the send afterwards.
- **Tokens stay out of logs.** The email links carry the token in the
  fragment; the page posts it. Only the one-click unsubscribe header has it
  in a query string, as RFC 8058 requires.

## Sending an alert

After the wage update PR is merged and the page shows the new rates:

```bash
pnpm alerts:send uttarakhand            # dry run: the email, and how many would get it
pnpm alerts:send uttarakhand --send     # sends
```

The command reads the state's name and the date its headline rates are in
force from (`src/content/wages/<state>.json`): that date is the **revision**,
and each subscriber gets one email per state and revision, so running it
again after a failure mails nobody twice. The email's line is the live page's
own opening sentence; `--line "..."` (repeatable) replaces it, and
`--subject "..."` replaces the subject. It needs kubectl access (WARP on),
like `pnpm windmill:deploy`.

## Where things are

| What | Where |
|---|---|
| Contract (wire and canonical), fixtures | `packages/contracts/src/rate-alert.v1.ts`, `fixtures/*/rate_alert.v1` |
| Site routes | `src/server/submissions/types/rate-alert.ts`, `src/app/api/alerts/*` |
| Signup, links page | `src/components/reference/rate-alert-signup.tsx`, `src/app/[locale]/(reference)/alerts` |
| List, emails, send | `integrations/windmill/leads/lib/{run-alerts,alert-mail,alerts-sql}.ts`, `leads/schema.sql` |
| The hand-run send | `integrations/windmill/alerts-send.mts`, `f/leads/alerts_send` |
| Privacy | `/privacy` §2 "Minimum wage alerts"; `src/lib/measurement/retention.ts` |

## Sender

Alerts go out through Resend with the notification hub's key
(`f/notify/resend_api_key`), from `Vayasya Seva <alerts@notify.vayasyaseva.com>`
with replies to `help@vayasyaseva.com` (`deploy.mts`). A dedicated sending
domain needs only a new key and sender there.

## Looking at the list

```sql
-- in the leads database
SELECT status, count(*) FROM alert_subscribers GROUP BY status;
SELECT e AS state, count(*) FROM alert_subscribers s, unnest(s.states) e WHERE status = 'confirmed' GROUP BY e;
SELECT state, revision, count(*), max(sent_at) FROM alert_sends GROUP BY 1, 2 ORDER BY max(sent_at) DESC;
```
