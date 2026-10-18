/** Where the visitor context keeps its state (docs/visitor-context.md, "Storage"). */

/** sessionStorage: this session's signals (collect.ts Session). */
export const SESSION_KEY = "vs-ctx-session-v1";
/** sessionStorage: the IP region from /api/context when the vs_geo cookie is missing. */
export const GEO_FALLBACK_KEY = "vs-ctx-geo-v1";
/** sessionStorage: which context events this tab has sent. */
export const REPORTED_KEY = "vs-ctx-reported-v1";
/** Cookie: the visitor's picks (collect.ts), 90 days. */
export const PICKS_COOKIE = "vs_ctx";
export const PICKS_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;
/** Cookie set by the proxy: the IP region, this browser session only. */
export const GEO_COOKIE = "vs_geo";

/** Model 3's remembered pick (src/lib/intent, until 18 Oct 2026), migrated once by the runtime. */
export const LEGACY_CHOICE_KEY = "vs-area-choice-v1";
/** Model 3's other keys, removed on migration. */
export const LEGACY_KEYS = { session: ["vs-area-session-v2", "vs-area-region-v3", "vs-area-reported-v1", "vs-area-board-v1"], local: [LEGACY_CHOICE_KEY] } as const;
