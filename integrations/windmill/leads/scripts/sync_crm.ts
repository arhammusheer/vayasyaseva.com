/**
 * f/leads/sync_crm: every minute, and started by intake for a new lead.
 * First the lead's emails (the shared inbox's and the buyer's copy, through
 * Resend; leads/lib/lead-mail.ts), then Twenty CRM: the inbox's due leads
 * (company, contact, crew request, enquiry), each step found before it is
 * created. Both with backoff and a cap. See leads/lib/run-leads.ts.
 */
import { config } from "../../talent/lib/config.ts";
import { withDatabase } from "../../talent/lib/db.ts";
import { twentyFromConfig } from "../../talent/lib/twenty.ts";
import { notifyConfig } from "../../notify/lib/config.ts";
import { leadMailer, runLeadMail, type LeadMailResult } from "../lib/lead-mail.ts";
import { runLeadsSync } from "../lib/run-leads.ts";
import { tryEmit } from "../../notify/lib/emit.ts";

export async function main(lead_id?: string | null) {
  const leadId = lead_id || null;
  return withDatabase("leads_pg_url", async (query) => {
    // The emails first, so a slow or failing Twenty never holds them up.
    let mail: LeadMailResult | { error: string };
    try {
      mail = await runLeadMail(
        {
          query,
          // The hub's Resend key (verified for notify.vayasyaseva.com).
          send: leadMailer(await notifyConfig("resend_api_key").catch(() => "")),
          staffFrom: await config("lead_staff_email_from"),
          buyerFrom: await config("lead_buyer_email_from"),
          inbox: await config("lead_inbox_email"),
          notify: tryEmit,
        },
        { leadId },
      );
    } catch (err) {
      mail = { error: err instanceof Error ? err.name : "error" };
      console.error("lead emails not run:", mail.error);
    }
    const crm = await twentyFromConfig();
    return { ...(await runLeadsSync({ query, crm, notify: tryEmit }, { leadId })), mail };
  });
}
