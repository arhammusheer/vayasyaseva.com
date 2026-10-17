// Generated from integrations/windmill/platform/scripts/health.ts by integrations/windmill/build.mts. Edit the source, not this.

import * as wmill from "windmill-client";

import postgres from "postgres";

// integrations/windmill/talent/lib/config.ts
const { VARIABLES, variablePath, setConfigForTests, config } = (() => {
  const VARIABLES = {
      talent_pg_url: { secret: true },
      fast2sms_api_key: { secret: true },
      intake_webhook_secret: { secret: true },
      r2_read_key_id: { secret: true },
      r2_read_secret: { secret: true },
      r2_erase_key_id: { secret: true },
      r2_erase_secret: { secret: true },
      chatwoot_admin_token: { secret: true },
      chatwoot_inbox_identifier: { secret: true },
      chatwoot_base_url: { secret: false },
      chatwoot_account_id: { secret: false },
      r2_endpoint: { secret: false },
      r2_bucket: { secret: false },
      twenty_base_url: { secret: false },
      twenty_api_key: { secret: true },
      lead_webhook_secret: { secret: true },
      fast2sms_dlr_secret: { secret: true },
      leads_pg_url: { secret: true },
      submission_signing_secret: { secret: true },
  };
  const variablePath = (name) => `f/talent/${name}`;
  let override = null;
  function setConfigForTests(values) {
      override = values;
  }
  async function config(name) {
      if (override) {
          const value = override[name];
          if (value === undefined)
              throw new Error(`test config has no ${name}`);
          return value;
      }
      const value = await wmill.getVariable(variablePath(name));
      if (!value)
          throw new Error(`variable ${variablePath(name)} is empty`);
      return value;
  }
  return { VARIABLES, variablePath, setConfigForTests, config };
})();

// integrations/windmill/talent/lib/db.ts
const { withTalentDb, withDatabase, queryWith } = (() => {
  const passThroughJson = (oid) => ({
      to: oid,
      from: [oid],
      serialize: (value) => (typeof value === "string" ? value : JSON.stringify(value)),
      parse: (value) => JSON.parse(value),
  });
  async function withTalentDb(fn) {
      return withDatabase("talent_pg_url", fn);
  }
  async function withDatabase(url, fn) {
      const sql = postgres(await config(url), {
          max: 1,
          connect_timeout: 10,
          idle_timeout: 5,
          prepare: false,
          types: { json: passThroughJson(114), jsonb: passThroughJson(3802) },
          onnotice: () => { },
      });
      try {
          return await fn(queryWith(sql));
      }
      finally {
          await sql.end({ timeout: 5 });
      }
  }
  const queryWith = (sql) => async (text, params = []) => (await sql.unsafe(text, params));
  return { withTalentDb, withDatabase, queryWith };
})();

// integrations/windmill/platform/lib/run-health.ts
const { HEALTH_COUNTS, HEALTH_ERASURE, runHealth } = (() => {
  const HEALTH_COUNTS = `
  SELECT target, reason, count(*)::int AS count, min(updated_at) AS oldest
  FROM deliveries_attention GROUP BY target, reason ORDER BY target, reason;`;
  const HEALTH_ERASURE = `SELECT count(*)::int AS failed FROM erasure_requests WHERE status = 'failed';`;
  const empty = () => ({ dead: {}, unknown: {}, stuck: {}, overdue: {}, oldest: null });
  async function counts(query) {
      const out = empty();
      for (const row of await query(HEALTH_COUNTS)) {
          out[row.reason][row.target] = row.count;
          const oldest = new Date(row.oldest).toISOString();
          if (!out.oldest || oldest < out.oldest)
              out.oldest = oldest;
      }
      return out;
  }
  const total = (c) => (c ? ["dead", "unknown", "stuck", "overdue"].reduce((n, r) => n + Object.values(c[r]).reduce((a, b) => a + b, 0), 0) : 0);
  async function runHealth(db, now = new Date()) {
      const errors = [];
      const talent = await db
          .talent(async (q) => ({ ...(await counts(q)), erasureFailed: (await q(HEALTH_ERASURE))[0]?.failed ?? 0 }))
          .catch((err) => (errors.push(`talent: ${err instanceof Error ? err.message : "unknown error"}`), null));
      const leads = await db.leads(counts).catch((err) => (errors.push(`leads: ${err instanceof Error ? err.message : "unknown error"}`), null));
      return {
          ok: errors.length === 0 && total(talent) === 0 && total(leads) === 0 && (talent?.erasureFailed ?? 0) === 0,
          checkedAt: now.toISOString(),
          talent,
          leads,
          errors,
      };
  }
  return { HEALTH_COUNTS, HEALTH_ERASURE, runHealth };
})();

export async function main() {
    return runHealth({ talent: (fn) => withTalentDb(fn), leads: (fn) => withDatabase("leads_pg_url", fn) });
}

