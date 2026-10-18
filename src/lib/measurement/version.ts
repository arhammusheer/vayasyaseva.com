/**
 * The consent version (the history is in ledger.ts). The stored key is
 * `vayasya-site-measurement-v<N>` (store.ts), so raising it asks every
 * visitor again. Its own file so the browser bundle doesn't carry the ledger.
 */
export const CONSENT_VERSION = 9;
