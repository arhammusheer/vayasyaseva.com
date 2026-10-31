/**
 * A real Postgres for the tests (PGlite: Postgres compiled to WebAssembly,
 * in memory), so the schemas, triggers, claims and backoff run as SQL
 * rather than against a fake. One database per call; nothing leaves the process.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { checkSubmission, saveSubmissionParams } from "./talent/lib/intake-payload.ts";
import { SAVE_SUBMISSION, schemaStatements } from "./talent/lib/sql.ts";
import type { Query } from "./talent/lib/db.ts";

export const TALENT_SCHEMA = readFileSync(new URL("talent/schema.sql", import.meta.url), "utf8");
export const LEADS_SCHEMA = readFileSync(new URL("leads/schema.sql", import.meta.url), "utf8");

export interface TestDb {
  db: PGlite;
  query: Query;
  exec: (sql: string) => Promise<void>;
}

export async function testDb(...schemas: string[]): Promise<TestDb> {
  const db = new PGlite();
  const exec = async (sql: string) => {
    await db.exec(schemaStatements(sql));
  };
  for (const schema of schemas) await exec(schema);
  const query: Query = async (text, params = []) => (await db.query(text, params as unknown[])).rows as never[];
  return { db, query, exec };
}

/** Saves a web application through intake's own query; returns its submission id. */
export async function saveApplication(query: Query, ref: string, over: Record<string, unknown> = {}): Promise<string> {
  const checked = checkSubmission({
    ref, source: "web", locale: "en-IN", cluster: "haridwar", pageCluster: "haridwar", pagePath: "/jobs/haridwar",
    role: "packing", hub: null, channel: "web", agentName: null, phone: "+919876543210", adult: true,
    consent: { version: "2026-10-16-v7", at: "2026-10-17T09:30:00.000Z" }, text: "Two years packing.",
    attachments: [], form: "long", applicantName: null, answers: null, ...over,
  });
  assert.ok(checked.ok);
  const [row] = await query<{ submission_id: string }>(SAVE_SUBMISSION, saveSubmissionParams(checked.value));
  return row.submission_id;
}
