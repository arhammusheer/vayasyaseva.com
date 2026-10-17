/**
 * Twenty CRM's REST API (crm.vayasyaseva.com), reached in the cluster at
 * http://twenty.growth.svc.cluster.local with the workspace API key. The
 * record shapes are integrations/twenty/setup.mts. Verified live (Twenty
 * v2.43.0): POST /rest/<plural> answers { data: { create<Singular> } }, GET
 * filters as `filter=field[eq]:"value"`, a unique field answers 400 on a
 * duplicate, and DELETE removes the record for good (404 once gone).
 */
import { config } from "./config.ts";

export type Fetch = typeof fetch;

export interface TwentyRecord {
  id: string;
  [field: string]: unknown;
}

export interface Twenty {
  find(plural: string, filter: string): Promise<TwentyRecord[]>;
  create(plural: string, singular: string, body: Record<string, unknown>): Promise<TwentyRecord>;
  update(plural: string, id: string, body: Record<string, unknown>): Promise<void>;
  /** True when it was removed, false when it was already gone. */
  remove(plural: string, id: string): Promise<boolean>;
}

/** `field[eq]:"value"`, quoting the value as Twenty's filter parser expects. */
export const eq = (field: string, value: string) => `${field}[eq]:${JSON.stringify(value)}`;

export function twentyClient(baseUrl: string, apiKey: string, fetchImpl: Fetch = fetch): Twenty {
  const base = baseUrl.replace(/\/$/, "");
  async function call(method: string, path: string, body?: unknown): Promise<{ status: number; json: unknown }> {
    const res = await fetchImpl(`${base}/rest${path}`, {
      method,
      headers: { authorization: `Bearer ${apiKey}`, ...(body === undefined ? {} : { "content-type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {}
    if (!res.ok && !(method === "DELETE" && res.status === 404)) {
      // Twenty's messages name the field or constraint, not the values.
      const messages = (json as { messages?: string[] } | null)?.messages?.join("; ") ?? text.slice(0, 200);
      throw new Error(`Twenty ${method} ${path.split("?")[0]}: HTTP ${res.status} ${messages}`);
    }
    return { status: res.status, json };
  }
  return {
    async find(plural, filter) {
      const { json } = await call("GET", `/${plural}?limit=60&filter=${encodeURIComponent(filter)}`);
      return ((json as { data: Record<string, TwentyRecord[]> }).data[plural] ?? []) as TwentyRecord[];
    },
    async create(plural, singular, body) {
      const { json } = await call("POST", `/${plural}`, body);
      const created = (json as { data: Record<string, TwentyRecord> }).data[`create${singular}`];
      if (!created?.id) throw new Error(`Twenty POST /${plural}: no record in the answer`);
      return created;
    },
    async update(plural, id, body) {
      await call("PATCH", `/${plural}/${id}`, body);
    },
    async remove(plural, id) {
      const { status } = await call("DELETE", `/${plural}/${id}`);
      return status !== 404;
    },
  };
}

/** The client from the workspace variables (f/talent/twenty_*). */
export async function twentyFromConfig(): Promise<Twenty> {
  return twentyClient(await config("twenty_base_url"), await config("twenty_api_key"));
}
