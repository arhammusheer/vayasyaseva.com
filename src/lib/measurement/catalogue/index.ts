/**
 * Lookups over the event catalogue (./events.ts). Layer 1 (pure).
 *
 * sanitise() runs in OBSERVE mode only: it returns the issues it finds and
 * never drops or changes a property. Enforcing it (dropping undeclared or
 * personal properties) is a later step that needs the owner's approval.
 */
import { EVENTS, type EventId, type EventSpec, type Sink } from "./events";

export { EVENTS, PAGE_VIEW_PROPS, SESSION_PROPS } from "./events";
export type { Consumer, DataClass, EventId, EventSpec, Sink } from "./events";

const SPECS: Readonly<Record<string, EventSpec>> = EVENTS;
/** Sinks that are analytics (everything the site sends events to). */
export const ANALYTICS_SINKS: readonly Sink[] = ["umami", "ga4", "meta", "google-ads", "umami-server"];

const families = Object.entries(SPECS)
  .filter(([, spec]) => spec.wireName)
  .map(([id, spec]) => ({ id, spec, prefix: spec.wireName!.pattern.slice(0, spec.wireName!.pattern.indexOf("<")) }));

/** Every wire name the catalogue lists (families expanded). */
export function wireNames(): string[] {
  return Object.entries(SPECS).flatMap(([id, spec]) => (spec.wireName ? spec.wireName.values.map((v) => `${spec.wireName!.pattern.replace(/<[^>]+>/, v)}`) : [id]));
}

/** The catalogue entry a wire name belongs to, and whether a family value is one it lists. */
export function resolveEvent(name: string): { id: EventId; spec: EventSpec; listed: boolean } | null {
  if (Object.hasOwn(SPECS, name) && !SPECS[name].wireName) return { id: name as EventId, spec: SPECS[name], listed: true };
  for (const f of families) {
    const value = name.startsWith(f.prefix) ? name.slice(f.prefix.length) : null;
    if (value && /^[a-z0-9_]+$/.test(value)) return { id: f.id as EventId, spec: f.spec, listed: f.spec.wireName!.values.includes(value) };
  }
  return null;
}

/**
 * What is wrong with one call, as messages; never changes the call.
 * `sinks` are where the gateway is about to send it.
 */
export function sanitise(name: string, props: Readonly<Record<string, unknown>> | undefined, sinks: readonly Sink[]): string[] {
  const found = resolveEvent(name);
  if (!found) return [`unknown event "${name}" (add it to src/lib/measurement/catalogue/events.ts)`];
  const { spec, listed } = found;
  const issues: string[] = [];
  if (!listed) issues.push(`"${name}" is not a listed value of ${spec.wireName!.pattern}`);
  for (const sink of sinks) if (!spec.sinks.includes(sink)) issues.push(`"${name}" is sent to ${sink}, which the catalogue does not list`);
  for (const [key, value] of Object.entries(props ?? {})) {
    const cls = spec.props[key] ?? spec.props["*"];
    if (!cls) issues.push(`"${name}" carries undeclared property "${key}"`);
    else if (cls === "personal" && !spec.exception && sinks.some((s) => ANALYTICS_SINKS.includes(s))) issues.push(`"${name}" sends personal property "${key}" to analytics`);
    if (typeof value !== "string" && typeof value !== "number") issues.push(`"${name}".${key} is a ${typeof value}, not a string or number`);
  }
  return issues;
}

/**
 * Development and test only (the gateway calls it behind a NODE_ENV check,
 * so production bundles drop it): logs in development, throws in test.
 */
export function observe(name: string, props: Readonly<Record<string, unknown>> | undefined, sinks: readonly Sink[]) {
  const issues = sanitise(name, props, sinks);
  if (!issues.length) return;
  const message = `[measurement] ${issues.join("; ")}`;
  if (process.env.NODE_ENV === "test") throw new Error(message);
  console.warn(message);
}
