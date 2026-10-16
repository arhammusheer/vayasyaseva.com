/**
 * One short-lived connection per run, to the talent database as the
 * `talent` role. pg-main caps that role at 5 connections (vayasya-infra
 * apps/pg-main/base/cluster.yaml), so each run holds at most one.
 */
import postgres from "postgres";
import { config } from "./config.ts";

export type Sql = postgres.Sql;

export async function withTalentDb<T>(fn: (query: Query) => Promise<T>): Promise<T> {
  const sql = postgres(await config("talent_pg_url"), {
    max: 1,
    connect_timeout: 10,
    idle_timeout: 5,
    // Short-lived connection: nothing to gain from named prepared statements.
    prepare: false,
    onnotice: () => {},
  });
  try {
    return await fn(queryWith(sql));
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export type Query = <R extends object = Record<string, unknown>>(text: string, params?: unknown[]) => Promise<R[]>;

/** Positional parameters ($1..$n), as the n8n Postgres nodes used them. */
export const queryWith = (sql: Sql): Query => async (text, params = []) =>
  (await sql.unsafe(text, params as postgres.ParameterOrJSON<never>[])) as unknown as never[];
