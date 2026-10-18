/**
 * The contact page's modes and their H1s. A plain module, not "use client":
 * page.tsx renders HEADINGS.crew as the server fallback, and a value imported
 * from a client module reaches the server as a reference, so the prerendered
 * H1 came out empty (18 Oct 2026).
 */
export type Mode = "crew" | "assessment" | "compliance";

export const HEADINGS: Record<Mode, string> = {
  crew: "Request a crew.",
  assessment: "Request a site assessment.",
  compliance: "Get compliance help.",
};
