"use client";

import { useSearchParams } from "next/navigation";
import { ContactForm } from "./contact-form";

/**
 * ?type=assessment and ?type=compliance: variants of one static page
 * (canonical /contact). The mode is read in the browser, so the route is
 * prerendered and Link can prefetch it in full; the server HTML carries the
 * crew variant (the Suspense fallbacks in page.tsx). Reading searchParams on
 * the server made every "Request a crew" click wait for a fresh render
 * (18 Oct 2026).
 */
export type Mode = "crew" | "assessment" | "compliance";

export function useContactMode(): Mode {
  const type = useSearchParams().get("type");
  return type === "assessment" ? "assessment" : type === "compliance" ? "compliance" : "crew";
}

export const HEADINGS: Record<Mode, string> = {
  crew: "Request a crew.",
  assessment: "Request a site assessment.",
  compliance: "Get compliance help.",
};

/** The H1, and the compliance variant's extra line. */
export function ContactHeading() {
  const mode = useContactMode();
  return (
    <>
      <h1 className="crew-intro-title">{HEADINGS[mode]}</h1>
      {mode === "compliance" && (
        <p className="crew-reply max-w-sm">
          Missed EPF or ESIC filings, no contract labour licence, registers not kept? We guide you through getting
          compliant, and connect you with CAs, labour lawyers and compliance consultants in the Vayasya Network.
        </p>
      )}
    </>
  );
}

/** The form, started afresh when the mode changes (a link from one variant to another). */
export function ContactFormForMode() {
  return <ContactForm key={useContactMode()} />;
}
