"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { Bell, Loader2, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTurnstile } from "@/lib/use-turnstile";
import { cn } from "@/lib/utils";
import { localePath } from "@/lib/i18n";
import { track } from "@/lib/measurement/gateway";
import { TURNSTILE_SCRIPT_URL } from "@/lib/turnstile";

/**
 * "Email me when rates change", under a wage page's rates (10 Nov 2026).
 * Most readers of these pages are HR, compliance and contractor staff who
 * come back each revision; this is the one thing the page asks of them. On
 * the page it is a line and a button; the email field opens in a dialog
 * (one visible form per page, owner direction, 10 Nov 2026).
 *
 * Double opt-in: /api/alerts/subscribe saves the address as pending and
 * sends one email with a link; nothing else is sent until it is opened
 * (docs/rate-alerts.md). The address goes to that route only: no analytics
 * event carries it.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const field =
  "mt-2 h-12 rounded-lg border-neutral-300 bg-background px-4 text-base text-foreground shadow-none placeholder:text-neutral-400 focus-visible:border-gold-500 focus-visible:ring-gold-500/25 md:text-base";

export function RateAlertSignup({ state, name }: { state: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  return (
    <div className="rate-alert">
      {sentTo ? (
        <p role="status" className="rate-alert-line">
          Check your inbox: open the link we sent to <span className="text-foreground">{sentTo}</span> to start the alerts.
        </p>
      ) : (
        <p className="rate-alert-line">Get an email when {name}&rsquo;s rates change.</p>
      )}
      <Dialog.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) track("rate_alert_open", { state });
        }}
      >
        {!sentTo && (
          <Dialog.Trigger asChild>
            <Button type="button" variant="outline" className="rate-alert-open">
              <Bell className="h-4 w-4" aria-hidden="true" />
              Email me when rates change
            </Button>
          </Dialog.Trigger>
        )}
        <Dialog.Portal>
          <Dialog.Overlay className="callback-overlay" />
          <Dialog.Content className="callback-dialog" aria-describedby="rate-alert-about">
            <Dialog.Title className="callback-title">{sentTo ? "Check your inbox." : `${name} rate alerts.`}</Dialog.Title>
            {sentTo ? (
              <>
                <Dialog.Description id="rate-alert-about" className="callback-note">
                  We sent a link to {sentTo}. Open it to confirm the address. Until you do, nothing else is sent.
                </Dialog.Description>
                <Dialog.Close asChild>
                  <Button type="button" size="lg" variant="outline" className="callback-send">Close</Button>
                </Dialog.Close>
              </>
            ) : (
              <>
                <Dialog.Description id="rate-alert-about" className="callback-note">
                  One email when a new notification changes {name}&rsquo;s minimum wages. Nothing else.
                </Dialog.Description>
                <SignupFields state={state} onSent={setSentTo} />
              </>
            )}
            <Dialog.Close className="callback-close" aria-label="Close">
              <X size={20} aria-hidden="true" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

/** The email field, mounted while the dialog is open. */
function SignupFields({ state, onSent }: { state: string; onSent: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [startedAt] = useState(() => Date.now());
  const { token, box, onReady, reset } = useTurnstile("alerts", "rate-alert");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (invalid) input.current?.focus();
  }, [invalid]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const address = email.trim();
    if (!EMAIL.test(address) || address.length > 200) {
      setInvalid(true);
      track("rate_alert_error", { state, reason: "validation" });
      return;
    }
    if (!token) {
      track("rate_alert_error", { state, reason: "verification" });
      setError("Please wait a moment while we check this browser, then try again.");
      return;
    }
    setSubmitting(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-contact-form-started-at": String(startedAt),
        "x-turnstile-token": token,
      };
      if (honeypot.trim().length > 0) headers["x-contact-form-honeypot"] = honeypot;
      const path = window.location.pathname.replace(/^\/(en-in|hi-in|hi-latn-in|pa-in|kn-in)(?=\/|$)/, "");
      const response = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers,
        body: JSON.stringify({ email: address, states: [state], ...(/^\/[A-Za-z0-9/_-]*$/.test(path) ? { sourcePath: path.slice(0, 200) } : {}) }),
      });
      reset(); // tokens are single-use
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        track("rate_alert_error", { state, reason: response.status === 429 ? "rate_limit" : response.status === 403 ? "verification" : "server" });
        setError(typeof result.error === "string" ? result.error : "That did not go through. Please try again.");
        return;
      }
      track("rate_alert_subscribe", { state });
      onSent(address);
    } catch {
      reset(); // the server may have used the token before the connection dropped
      track("rate_alert_error", { state, reason: "network" });
      setError("That did not go through. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form aria-busy={submitting} onSubmit={onSubmit} noValidate>
      {/* onLoad as well: next/script calls only onLoad on a second request for the same script. */}
      <Script src={TURNSTILE_SCRIPT_URL} onReady={onReady} onLoad={onReady} />
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <Label htmlFor="ra-website">Website</Label>
        <Input id="ra-website" autoComplete="new-password" tabIndex={-1} value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
      </div>
      <div className="callback-fields">
        <div>
          <Label htmlFor="ra-email" className="text-sm font-medium">Your email</Label>
          <Input
            ref={input}
            id="ra-email"
            name="email"
            type="email"
            value={email}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? "ra-email-error" : undefined}
            enterKeyHint="send"
            autoComplete="email"
            placeholder="you@company.com"
            maxLength={200}
            onChange={(event) => {
              setEmail(event.target.value);
              if (invalid) setInvalid(false);
            }}
            className={cn(field, invalid && "border-destructive")}
          />
          {invalid && <p id="ra-email-error" className="mt-1.5 text-sm text-destructive">Enter a valid email address.</p>}
        </div>
      </div>
      <div ref={box} className="mt-4" />
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="callback-send" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending
          </>
        ) : (
          "Send me the confirmation link"
        )}
      </Button>
      <p className="callback-note">
        We use this address only for these alerts. Every email has a link to stop them.{" "}
        <a href={localePath("/privacy", "en-IN")} target="_blank" rel="noopener" className="underline underline-offset-4">
          Privacy Policy
        </a>
      </p>
    </form>
  );
}
