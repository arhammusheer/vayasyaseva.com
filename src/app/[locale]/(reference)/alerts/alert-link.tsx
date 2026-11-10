"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "@/components/i18n/link";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/measurement/gateway";
import { WAGE_HUB_PATH } from "@/content/registry/identifiers";

/**
 * Reads the link's fragment once: #confirm=<token> confirms straight away
 * (opening the link is the confirmation); #stop=<token> asks first, so a
 * mail scanner that opens links cannot unsubscribe anyone. The fragment is
 * then cleared from the address bar. Without one, the page says what the
 * alerts are.
 */

type State =
  | { step: "idle" }
  | { step: "working" }
  | { step: "ask-stop"; token: string }
  | { step: "confirmed" | "stopped"; states: string[] }
  | { step: "invalid" | "failed" };

const TOKEN = /^[A-Za-z0-9_-]{32,64}$/;

const stateName = (slug: string) =>
  slug
    .split("-")
    .map((word) => (word === "and" ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
const stateList = (slugs: string[]) => {
  const names = slugs.map(stateName);
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
};

async function post(action: "confirm" | "unsubscribe", token: string): Promise<State> {
  try {
    const response = await fetch(`/api/alerts/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    const result = await response.json().catch(() => ({}));
    if (response.ok) {
      track(action === "confirm" ? "rate_alert_confirm" : "rate_alert_unsubscribe", { states: Array.isArray(result.states) ? result.states.length : 0 });
      return { step: action === "confirm" ? "confirmed" : "stopped", states: Array.isArray(result.states) ? result.states.filter((s: unknown) => typeof s === "string") : [] };
    }
    return { step: response.status === 404 || response.status === 400 ? "invalid" : "failed" };
  } catch {
    return { step: "failed" };
  }
}

export function AlertLink() {
  const [state, setState] = useState<State>({ step: "idle" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const confirm = params.get("confirm");
    const stop = params.get("stop");
    if (!confirm && !stop) return;
    history.replaceState(history.state, "", window.location.pathname + window.location.search);
    /* eslint-disable react-hooks/set-state-in-effect */
    if (confirm) {
      if (!TOKEN.test(confirm)) return setState({ step: "invalid" });
      setState({ step: "working" });
      void post("confirm", confirm).then(setState);
    } else if (stop) {
      setState(TOKEN.test(stop) ? { step: "ask-stop", token: stop } : { step: "invalid" });
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const wages = (
    <Link href={WAGE_HUB_PATH} className="text-link">
      Minimum wages by state <ArrowRight size={18} aria-hidden="true" />
    </Link>
  );

  return (
    <div className="alert-link" aria-live="polite">
      {state.step === "idle" && (
        <>
          <p>Each state&rsquo;s minimum wage page can email you when its rates change. Sign up on the page of the state you follow.</p>
          {wages}
        </>
      )}
      {state.step === "working" && <p>One moment.</p>}
      {state.step === "confirmed" && (
        <>
          <h2>Confirmed.</h2>
          <p>
            We will email you when minimum wage rates change{state.states.length ? ` in ${stateList(state.states)}` : ""}. Every email has a link to stop them.
          </p>
          {wages}
        </>
      )}
      {state.step === "ask-stop" && (
        <>
          <h2>Stop these emails?</h2>
          <p>You will get no more minimum wage alerts from us, and we delete your address.</p>
          <Button
            type="button"
            size="lg"
            onClick={() => {
              const { token } = state;
              setState({ step: "working" });
              void post("unsubscribe", token).then(setState);
            }}
          >
            Stop the emails
          </Button>
        </>
      )}
      {state.step === "stopped" && (
        <>
          <h2>Stopped.</h2>
          <p>You will get no more minimum wage alerts from us, and your address is deleted.</p>
          {wages}
        </>
      )}
      {state.step === "invalid" && (
        <>
          <h2>This link is no longer valid.</h2>
          <p>It may have been used already, or the address was not confirmed within 7 days and has been deleted. You can sign up again on a state&rsquo;s page.</p>
          {wages}
        </>
      )}
      {state.step === "failed" && (
        <>
          <h2>That did not go through.</h2>
          <p>Please open the link from the email again in a few minutes.</p>
        </>
      )}
    </div>
  );
}
