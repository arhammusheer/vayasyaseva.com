/**
 * Reaching Twenty from a laptop: `kubectl port-forward svc/twenty` and the
 * workspace API key in Secret growth/twenty-api (never printed). Twenty
 * limits a key to 100 requests a minute, so calls are spaced to stay under it.
 */
import { execFileSync, spawn } from "node:child_process";

export function secret(): string {
  const b64 = execFileSync("kubectl", ["-n", "growth", "get", "secret", "twenty-api", "-o", "jsonpath={.data.TWENTY_API_KEY}"], { encoding: "utf8" });
  return Buffer.from(b64, "base64").toString("utf8").trim();
}

export async function portForward(): Promise<{ base: string; stop: () => void }> {
  if (process.env.TWENTY_URL) return { base: process.env.TWENTY_URL.replace(/\/$/, ""), stop: () => {} };
  const port = 13_000 + Math.floor(Math.random() * 1000);
  const child = spawn("kubectl", ["-n", "growth", "port-forward", "svc/twenty", `${port}:80`], { stdio: "ignore" });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${base}/healthz`)).ok) return { base, stop: () => child.kill() };
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  child.kill();
  throw new Error("could not reach Twenty through kubectl port-forward");
}

/** 90 a minute: under Twenty's 100, leaving room for Windmill's sync on the same key. */
const MIN_GAP_MS = 667;
let last = 0;

export function client(base: string, key: string) {
  return async function gql<T>(endpoint: "/metadata" | "/graphql", query: string, variables: Record<string, unknown> = {}): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      const wait = last + MIN_GAP_MS - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      last = Date.now();
      const res = await fetch(`${base}${endpoint}`, {
        method: "POST",
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(60_000),
      });
      if (res.status === 429 && attempt < 3) {
        await new Promise((r) => setTimeout(r, 30_000));
        continue;
      }
      const body = (await res.json()) as { data?: T; errors?: { message: string; extensions?: unknown }[] };
      // The extensions carry Twenty's per-field validation messages (no secrets).
      if (body.errors?.length) throw new Error(`${endpoint}: ${body.errors.map((e) => `${e.message} ${JSON.stringify(e.extensions ?? {}).slice(0, 800)}`).join("; ")}`);
      return body.data as T;
    }
  };
}

export type Gql = ReturnType<typeof client>;

export type Option = { value: string; label: string; color: string };
export type MetaField = { id: string; name: string; type: string; options: Option[] | null; isActive: boolean };
export type MetaObject = { id: string; nameSingular: string; fields: { edges: { node: MetaField }[] } };

export async function loadObjects(gql: Gql): Promise<MetaObject[]> {
  return (
    await gql<{ objects: { edges: { node: MetaObject }[] } }>(
      "/metadata",
      `{ objects(paging:{first:500}) { edges { node { id nameSingular fields(paging:{first:500}) { edges { node { id name type options isActive } } } } } } }`,
    )
  ).objects.edges.map((e) => e.node);
}
