/**
 * The hub's settings and secrets: Windmill variables under f/notify/, set by
 * deploy.mts from the cluster (Secret growth/windmill-notify and the
 * pg-main-notify role password). Names differ from talent/lib/config.ts so a
 * talent or leads script can bundle both. Tests answer from a map instead.
 */
import * as wmill from "windmill-client";

export const NOTIFY_VARIABLES = {
  /** postgres://notify:…@pg-main-rw.data.svc.cluster.local:5432/notify */
  notify_pg_url: { secret: true },
  /** The x-vspl-notify-secret header of f/notify/ingest (NOTIFY_INGEST_SECRET). */
  ingest_secret: { secret: true },
  /** Alertmanager's bearer token for f/notify/alertmanager (NOTIFY_ALERTMANAGER_SECRET). */
  alertmanager_secret: { secret: true },
  /** The ntfy `windmill` user's access token (NTFY_TOKEN). */
  ntfy_token: { secret: true },
  /** http://ntfy.growth.svc.cluster.local */
  ntfy_base_url: { secret: false },
  /** Resend key restricted to sending from notify.vayasyaseva.com (RESEND_NOTIFY_API_KEY). */
  resend_api_key: { secret: true },
  /** The sender on notify.vayasyaseva.com. */
  email_from: { secret: false },
  /** Who gets the emails (NOTIFY_EMAIL_TO). Kept out of this public repo, so a secret variable. */
  email_to: { secret: true },
  /** The routing policy, JSON (lib/policy.ts). Created once by deploy; edited by hand after. */
  policy: { secret: false },
} as const;

export type NotifyConfigName = keyof typeof NOTIFY_VARIABLES;
export const notifyVariablePath = (name: NotifyConfigName) => `f/notify/${name}`;

let notifyOverride: Partial<Record<NotifyConfigName, string>> | null = null;

/** Tests only: answer from this map instead of Windmill. */
export function setNotifyConfigForTests(values: Partial<Record<NotifyConfigName, string>> | null) {
  notifyOverride = values;
}

export async function notifyConfig(name: NotifyConfigName): Promise<string> {
  if (notifyOverride) {
    const value = notifyOverride[name];
    if (value === undefined) throw new Error(`test config has no ${name}`);
    return value;
  }
  const value = await wmill.getVariable(notifyVariablePath(name));
  if (!value) throw new Error(`variable ${notifyVariablePath(name)} is empty`);
  return value;
}

/** Placeholder the infra repo ships until the owner sets the real value (sops edit). */
export const OWNER_PLACEHOLDER = "set-by-owner";
