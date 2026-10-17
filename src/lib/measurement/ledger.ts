/**
 * The consent ledger: each consent version, what changed and who signed it
 * off. Layer 1 (pure). The stored key is `vayasya-site-measurement-v<N>`
 * (store.ts), so raising CONSENT_VERSION asks every visitor again.
 *
 * The latest entry carries the consent fingerprint (fingerprint.ts): a hash
 * of the purpose registry's behaviour fields and the banner copy. When
 * either changes, tests/measurement-policy.spec.mjs fails until a new entry
 * is added here; whether that entry also bumps the version (and so re-asks
 * everyone) is the owner's call, with counsel where the wording changes.
 */
export const CONSENT_VERSION = 8;

export type LedgerEntry = {
  v: number;
  /** When the version shipped (from the commit history). */
  date: string;
  change: string;
  /** "pending" until the owner (and counsel, where needed) has signed the wording off. */
  signoff: "pending" | "not recorded" | string;
  /** The consent fingerprint at this version; recorded from v8 on. */
  fingerprint: string | null;
};

export const CONSENT_LEDGER: readonly LedgerEntry[] = [
  {
    v: 1,
    date: "2026-09-26",
    change: "Consent-based site analytics: cookie-free counts for everyone, Google Analytics with Allow All, privacy choices in the footer.",
    signoff: "not recorded",
    fingerprint: null,
  },
  {
    v: 2,
    date: "2026-09-26",
    change: "Microsoft Clarity session replay added, so v1 choices no longer cover it.",
    signoff: "not recorded",
    fingerprint: null,
  },
  {
    v: 3,
    date: "2026-10-02",
    change: "Google Ads conversion measurement added; everyone is asked again.",
    signoff: "not recorded",
    fingerprint: null,
  },
  {
    v: 4,
    date: "2026-10-02",
    change: "Unfinished form contents logged in Umami; everyone is asked again.",
    signoff: "not recorded",
    fingerprint: null,
  },
  {
    v: 5,
    date: "2026-10-04",
    change: "Umami recordings include forms and typed values; everyone is asked again.",
    signoff: "not recorded",
    fingerprint: null,
  },
  {
    v: 6,
    date: "2026-10-04",
    change: "Job applications from ad clicks reported to Google Ads by the server unless Required Only.",
    signoff: "not recorded",
    fingerprint: null,
  },
  {
    v: 7,
    date: "2026-10-16",
    change: "Two-sentence banner, the /privacy §2/§3/§10 rewrite and the applicant notice at /jobs/privacy; no processing changed, but the text consent rests on did.",
    signoff: "pending",
    fingerprint: null,
  },
  {
    v: 8,
    date: "2026-10-17",
    change: "Recordings and heatmaps kept one year, not 30 days (owner, 17 Oct 2026); everyone is asked again.",
    signoff: "pending",
    fingerprint: "f022a6ddd1b07a4aa09570234cfd83e256c9a4bd7f5158a439f8e6a6d0402566",
  },
];

export const latestLedgerEntry = () => CONSENT_LEDGER[CONSENT_LEDGER.length - 1];
