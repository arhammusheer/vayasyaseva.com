"use client";

import { ArrowLeft } from "lucide-react";

/** A same-origin jobs page this tab was reached from, if any. */
function jobsReferrer(): string | undefined {
  try {
    const from = new URL(document.referrer);
    if (from.origin === window.location.origin && /^\/[^/]+\/jobs(\/|$)/.test(from.pathname)) return from.href;
  } catch {
    // No referrer.
  }
  return undefined;
}

/**
 * "Back to Apply" on /jobs/privacy. Reached from the form's checkbox line,
 * which opens this page in a new tab: there it closes the tab, so the
 * person is back on the form they were filling, answers intact. In the
 * same tab it goes back (the form restores its draft). If the tab cannot
 * close, it opens the jobs page it came from, and /jobs/haridwar last.
 */
export function BackToApply({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="jobs-submit"
      onClick={(event) => {
        const from = jobsReferrer();
        if (!from) return;
        event.preventDefault();
        if (window.history.length > 1) {
          window.history.back();
          return;
        }
        // A tab opened from a link, with one history entry, is closable by script.
        window.close();
        window.setTimeout(() => {
          if (!window.closed) window.location.assign(from);
        }, 300);
      }}
    >
      <ArrowLeft size={20} aria-hidden="true" /> {label}
    </a>
  );
}
