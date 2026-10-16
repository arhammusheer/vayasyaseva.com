import { JOB_HUB_SLUGS, JOB_ROLE_SLUGS, isJobHub, isJobRole } from "./talent-intake/rules";

/**
 * Which share image a /jobs/apply link carries (?role=, ?hub=, ?work=), as
 * a key in src/content/share-images.json. Light on purpose: the proxy reads
 * it to pick the language picker variant for a shared /jobs/apply link.
 */
export function quickShareVariant(params: { role?: string | null; hub?: string | null; work?: string | null }) {
  if (isJobRole(params.role)) return `role-${params.role}`;
  if (isJobHub(params.hub)) return `hub-${params.hub}`;
  if (isJobRole(params.work)) return `role-${params.work}`;
  return "";
}

/** Every share variant quickShareVariant can return, "" included. */
export const QUICK_SHARE_VARIANTS = ["", ...JOB_ROLE_SLUGS.map((r) => `role-${r}`), ...JOB_HUB_SLUGS.map((h) => `hub-${h}`)];
