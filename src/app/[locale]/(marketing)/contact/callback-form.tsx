"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { z } from "zod/v4";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTurnstile } from "@/lib/use-turnstile";
import { forgetIdempotencyKey, idempotencyKeyFor } from "@/lib/idempotency-key";
import { revealFormTarget } from "@/lib/form-navigation";
import { cn } from "@/lib/utils";
import { localePath } from "@/lib/i18n";
import { track, trackConversion } from "@/lib/measurement/gateway";
import { readEnquiryPrefill } from "@/lib/prefill";
import { TURNSTILE_SCRIPT_URL } from "@/lib/turnstile";
import { contactFieldSchema, HEADCOUNT_BAND_OPTIONS, type ContactFormData } from "@/lib/contact-contract";
import { CALLBACK_WINDOW, crewPrefill } from "@/lib/crew-request";
import { noteAudience } from "@/context/runtime";
import { FieldError, field, referringPath } from "./contact-form";
import { useContactMode } from "./contact-mode";

/**
 * The short way to ask for a crew (10 Nov 2026): a name, the company, a
 * phone and the number of workers, and we phone back. For a buyer who will
 * not fill in the requirement. It is a business enquiry like the long form
 * (/api/contact, requestType "callback", contract 1.4.0): the same staff
 * email, case ID and Twenty record; the rest is asked on the call.
 *
 * The company is asked here too (the contract leaves it optional): it keeps
 * job seekers off a form that ends in a phone call.
 */

type Values = { name: string; company: string; phone: string; headcountBand: string };
type Field = keyof Values;
const EMPTY: Values = { name: "", company: "", phone: "", headcountBand: "" };
const ORDER: Field[] = ["name", "company", "phone", "headcountBand"];
const SCHEMA = z.object({
  name: contactFieldSchema("name"),
  company: contactFieldSchema("company", { required: true }),
  phone: contactFieldSchema("phone"),
  headcountBand: contactFieldSchema("headcountBand", { required: true }),
});
const IDEMPOTENCY = "vayasya-callback:idempotency";
const FORM_TYPE = "callback";

export function CallbackForm() {
  const mode = useContactMode();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [formStartedAt] = useState(() => Date.now());
  // Set by the page or link (#location=…), never typed: the market and the page they came from.
  const [origin, setOrigin] = useState<{ pageCluster?: string; sourcePath?: string }>({});
  const { token, box, onReady, reset } = useTurnstile("contact", "callback");
  const started = useRef(false);
  const done = useRef<HTMLParagraphElement>(null);
  const problem = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    // Reads the browser once on mount: the referrer and the link's fragment
    // (a location page's #location=…, or an assistant's link with the person's details).
    /* eslint-disable react-hooks/set-state-in-effect */
    const prefill = readEnquiryPrefill();
    const mapped = prefill ? crewPrefill(prefill).fields : {};
    setOrigin({ pageCluster: mapped.pageCluster, sourcePath: referringPath() ?? undefined });
    if (mapped.name || mapped.company || mapped.phone || mapped.headcountBand) {
      setValues((current) => ({
        name: mapped.name ?? current.name,
        company: mapped.company ?? current.company,
        phone: mapped.phone ?? current.phone,
        headcountBand: mapped.headcountBand ?? current.headcountBand,
      }));
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (submitted) return revealFormTarget(done.current, { instant: true });
    if (error) return revealFormTarget(problem.current);
  }, [submitted, error]);

  // The other requests (a site assessment, compliance help) have their own questions.
  if (mode !== "crew") return null;

  function markStarted() {
    if (started.current) return;
    started.current = true;
    noteAudience("business");
    track("contact_form_start", { form_type: FORM_TYPE });
  }

  function set(key: Field, value: string) {
    markStarted();
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    markStarted();
    setError(null);
    const parsed = SCHEMA.safeParse(values);
    if (!parsed.success) {
      const found: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) found[issue.path[0] as Field] ??= issue.message;
      setErrors(found);
      track("contact_form_error", { form_type: FORM_TYPE, reason: "validation", checks: Object.keys(found).join(",") });
      const first = ORDER.find((key) => found[key]);
      if (first) revealFormTarget(document.getElementById(`cb-${first}`));
      return;
    }
    if (!token) {
      track("contact_form_error", { form_type: FORM_TYPE, reason: "verification" });
      setError("Please wait a moment while we check this browser, then send again.");
      return;
    }
    const body = {
      requestType: "callback",
      name: values.name.trim(),
      company: values.company.trim(),
      phone: values.phone.trim(),
      headcountBand: values.headcountBand,
      ...origin,
    } satisfies Partial<ContactFormData>;
    setSubmitting(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-contact-form-started-at": String(formStartedAt),
        "x-turnstile-token": token,
        // The same key for the same request: a retry after a lost answer gets the first case ID back.
        "idempotency-key": await idempotencyKeyFor(IDEMPOTENCY, body),
      };
      if (honeypot.trim().length > 0) headers["x-contact-form-honeypot"] = honeypot;
      const response = await fetch("/api/contact", { method: "POST", headers, body: JSON.stringify(body) });
      reset(); // tokens are single-use
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        track("contact_form_error", { form_type: FORM_TYPE, reason: response.status === 429 ? "rate_limit" : response.status === 403 ? "verification" : "server" });
        setError(result.error ?? "That could not be sent. Please try again.");
        return;
      }
      forgetIdempotencyKey(IDEMPOTENCY);
      if (typeof result.caseId === "string" && /^[A-Z]{3}-[0-9A-Z-]{6,40}$/.test(result.caseId)) setReference(result.caseId);
      setSubmitted(true);
      trackConversion("businessEnquiry");
      track("generate_lead", {
        form_type: FORM_TYPE,
        form: "callback",
        cluster: origin.pageCluster ?? "none",
        headcount_band: values.headcountBand,
        // No duration yet, so not judged (src/lib/crew-request.ts).
        qualified: "no",
      });
    } catch {
      reset(); // the server may have used the token before the connection dropped
      track("contact_form_error", { form_type: FORM_TYPE, reason: "network" });
      setError("That could not be sent. Please try again, or call us.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div role="status" className="callback">
        <p ref={done} tabIndex={-1} className="form-scroll-target callback-title">We will call you.</p>
        <p className="callback-note">{CALLBACK_WINDOW}, on the number you gave.</p>
        {reference && (
          <p className="callback-note">
            Your reference: <span className="font-data text-foreground">{reference}</span>
          </p>
        )}
      </div>
    );
  }

  const invalid = (key: Field) => Boolean(errors[key]) || undefined;
  const describedBy = (key: Field) => (errors[key] ? `cb-${key}-error` : undefined);

  return (
    <form aria-busy={submitting} aria-labelledby="callback-title" onSubmit={onSubmit} noValidate className="callback">
      {/* onLoad as well: two forms on this page ask for the script, and
          next/script calls only onLoad on the one that waited for the other. */}
      <Script src={TURNSTILE_SCRIPT_URL} onReady={onReady} onLoad={onReady} />
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <Label htmlFor="cb-website">Website</Label>
        <Input id="cb-website" autoComplete="new-password" tabIndex={-1} value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
      </div>
      <h2 id="callback-title" className="callback-title">Short on time? We&rsquo;ll call you.</h2>
      <p className="callback-note">{CALLBACK_WINDOW}.</p>
      <div className="callback-fields">
        <div>
          <Label htmlFor="cb-name" className="text-sm font-medium">Your name</Label>
          <Input id="cb-name" name="name" value={values.name} aria-invalid={invalid("name")} aria-describedby={describedBy("name")} enterKeyHint="next" autoComplete="name" onChange={(event) => set("name", event.target.value)} className={cn(field, errors.name && "border-destructive")} />
          <FieldError id="cb-name" error={errors.name} />
        </div>
        <div>
          <Label htmlFor="cb-company" className="text-sm font-medium">Company</Label>
          <Input id="cb-company" name="company" value={values.company} aria-invalid={invalid("company")} aria-describedby={describedBy("company")} enterKeyHint="next" autoComplete="organization" onChange={(event) => set("company", event.target.value)} className={cn(field, errors.company && "border-destructive")} />
          <FieldError id="cb-company" error={errors.company} />
        </div>
        <div>
          <Label htmlFor="cb-phone" className="text-sm font-medium">Phone</Label>
          <Input id="cb-phone" name="phone" type="tel" inputMode="tel" value={values.phone} aria-invalid={invalid("phone")} aria-describedby={describedBy("phone")} enterKeyHint="next" autoComplete="tel" onChange={(event) => set("phone", event.target.value)} className={cn(field, "font-data", errors.phone && "border-destructive")} />
          <FieldError id="cb-phone" error={errors.phone} />
        </div>
        <div>
          <Label htmlFor="cb-headcountBand" className="text-sm font-medium">How many workers?</Label>
          <select
            id="cb-headcountBand"
            name="headcountBand"
            value={values.headcountBand}
            aria-invalid={invalid("headcountBand")}
            aria-describedby={describedBy("headcountBand")}
            onChange={(event) => set("headcountBand", event.target.value)}
            className={cn(field, "crew-select w-full border", !values.headcountBand && "text-neutral-400", errors.headcountBand && "border-destructive")}
          >
            <option value="" disabled>Choose</option>
            {Object.entries(HEADCOUNT_BAND_OPTIONS).map(([id, label]) => (
              <option key={id} value={id} className="text-foreground">{label}</option>
            ))}
          </select>
          <FieldError id="cb-headcountBand" error={errors.headcountBand} />
        </div>
      </div>
      <div ref={box} className="mt-4" />
      {error && (
        <p ref={problem} tabIndex={-1} role="alert" className="form-scroll-target mt-4 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" variant="outline" className="callback-send" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending
          </>
        ) : (
          <>
            Call me back
            <ArrowUpRight className="h-4 w-4" />
          </>
        )}
      </Button>
      <p className="callback-note">
        We use these details to call you about this enquiry.{" "}
        <a href={localePath("/privacy", "en-IN")} target="_blank" rel="noopener" className="underline underline-offset-4">
          Privacy Policy
        </a>
      </p>
    </form>
  );
}
