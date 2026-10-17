/**
 * A real Postgres for the tests (PGlite: Postgres compiled to WebAssembly,
 * in memory), so the schemas, triggers, claims and backoff run as SQL
 * rather than against a fake. One database per call; nothing leaves the process.
 */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { schemaStatements } from "./talent/lib/sql.ts";
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
