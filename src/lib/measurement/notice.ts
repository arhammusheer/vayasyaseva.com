/**
 * The privacy notice's §3 table (/privacy#analytics), built from the purpose
 * registry so the notice, the banner and the code can't drift apart.
 * Layer 1 (pure). src/content/privacy.ts exports it as analyticsSummary.
 */
import { PURPOSES, type Basis } from "./purposes";

/** The table's "When" column, from each purpose's basis. */
export const WHEN: Record<Basis, string> = {
  always: "Every visit",
  "unless-refused": "Unless you choose Required Only",
  "opt-in": "Only with Allow All",
};

export type NoticeTableRow = { what: string; when: string; gets: string };

/** One row per purpose with a table row, in registry order. */
export function noticeRows(): NoticeTableRow[] {
  return PURPOSES.flatMap((p) => (p.notice?.row ? [{ what: p.notice.row.what, when: WHEN[p.basis], gets: p.notice.row.gets }] : []));
}
