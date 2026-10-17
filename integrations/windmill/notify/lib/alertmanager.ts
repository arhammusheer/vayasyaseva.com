/**
 * Alertmanager's webhook (payload version 4) as hub events: one per alert,
 * dedupeKey am:<fingerprint>, so a group re-sent every repeat_interval is a
 * duplicate and its resolution pairs with the firing that was sent.
 * https://prometheus.io/docs/alerting/latest/configuration/#webhook_config
 */
import type { EmitInput } from "./emit.ts";
import type { Severity } from "./event.ts";

/** Synthetic alerts with no one to tell. */
export const IGNORED_ALERTS = ["Watchdog", "InfoInhibitor"];

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown) => (typeof v === "string" ? v : "");

export function alertSeverity(label: string): Severity {
  switch (label.toLowerCase()) {
    case "critical":
    case "page":
      return "critical";
    case "warning":
      return "warning";
    case "info":
    case "none":
      return "info";
    default:
      return "notice";
  }
}

const validTime = (v: string) => v && !v.startsWith("0001-") && !Number.isNaN(Date.parse(v));

export function alertmanagerEvents(payload: unknown): { events: EmitInput[]; ignored: number; errors: string[] } {
  if (!isRecord(payload) || !Array.isArray(payload.alerts)) return { events: [], ignored: 0, errors: ["not an Alertmanager webhook payload (no alerts)"] };
  if (payload.version !== undefined && String(payload.version) !== "4") return { events: [], ignored: 0, errors: [`unsupported webhook version ${String(payload.version)}`] };
  const externalUrl = text(payload.externalURL).replace(/\/$/, "");
  const events: EmitInput[] = [];
  const errors: string[] = [];
  let ignored = 0;
  payload.alerts.forEach((alert, i) => {
    if (!isRecord(alert) || !isRecord(alert.labels)) return void errors.push(`alerts[${i}] has no labels`);
    const labels = alert.labels as Record<string, unknown>;
    const annotations = isRecord(alert.annotations) ? alert.annotations : {};
    const name = text(labels.alertname) || "Alert";
    if (IGNORED_ALERTS.includes(name)) return void ignored++;
    const fingerprint = text(alert.fingerprint);
    if (!fingerprint) return void errors.push(`alerts[${i}] has no fingerprint`);
    const status = text(alert.status) === "resolved" ? "resolved" : "firing";
    const namespace = text(labels.namespace);
    const summary = [text(annotations.summary), text(annotations.description)].filter(Boolean).join(" ") || name;
    const occurredAt = status === "resolved" && validTime(text(alert.endsAt)) ? text(alert.endsAt) : validTime(text(alert.startsAt)) ? text(alert.startsAt) : undefined;
    const labelLines = Object.entries(labels)
      .filter(([k]) => k !== "alertname")
      .map(([k, v]) => `  ${k}=${text(v)}`)
      .sort();
    events.push({
      source: "alertmanager",
      type: `alert.${name.replace(/[^A-Za-z0-9_-]/g, "_")}`,
      severity: alertSeverity(text(labels.severity)),
      dedupeKey: `am:${fingerprint}`,
      status,
      ...(occurredAt ? { occurredAt } : {}),
      title: namespace ? `${name} (${namespace})` : name,
      summary,
      body: [text(annotations.description) || text(annotations.summary), "", "Labels:", ...labelLines, text(annotations.runbook_url) ? `\nRunbook: ${text(annotations.runbook_url)}` : ""].join("\n").trim(),
      ...(/^https?:\/\//.test(externalUrl) ? { link: { label: "Alertmanager", url: `${externalUrl}/#/alerts` } } : {}),
    });
  });
  return { events, ignored, errors };
}
