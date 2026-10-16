"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { z } from "zod/v4";
import { ArrowRight, ArrowUpRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTurnstile } from "@/lib/use-turnstile";
import { useSessionDraft } from "@/lib/use-session-draft";
import { FormDraftNotice } from "@/components/form-draft-notice";
import { revealFormTarget } from "@/lib/form-navigation";
import { cn } from "@/lib/utils";
import { localePath } from "@/lib/i18n";
import { trackAdsConversion, trackAnalyticsEvent } from "@/lib/analytics";
import { ENQUIRY_PREFILL_FIELDS, readPrefill } from "@/lib/prefill";
import { TURNSTILE_SCRIPT_URL } from "@/lib/turnstile";
import {
  contactFieldSchema,
  DURATION_BAND_OPTIONS,
  HEADCOUNT_BAND_OPTIONS,
  ROLE_OPTIONS,
  SHIFT_PATTERN_OPTIONS,
  START_WINDOW_OPTIONS,
  STATE_OPTIONS,
  type ContactFormData,
} from "@/lib/contact-contract";
import { assessCrewRequest, crewPrefill, requirementLines } from "@/lib/crew-request";

/**
 * "Request a crew" (PLAN §8.1): step 1 the requirement, step 2 who to talk
 * to. The contract (contact.contract.json) accepts older, looser enquiries;
 * this form asks for the structured requirement and the company.
 */

type Values = {
  roles: string[];
  headcountBand: string;
  siteState: string;
  siteCity: string;
  sitePincode: string;
  startWindow: string;
  durationBand: string;
  shiftPattern: string;
  details: string;
  name: string;
  company: string;
  role: string;
  phone: string;
  email: string;
  /** Set by the page or link, never typed. */
  pageCluster: string;
};
type Field = keyof Values;

const EMPTY: Values = {
  roles: [], headcountBand: "", siteState: "", siteCity: "", sitePincode: "", startWindow: "", durationBand: "",
  shiftPattern: "", details: "", name: "", company: "", role: "", phone: "", email: "", pageCluster: "",
};
const TEXT_FIELDS = (Object.keys(EMPTY) as Field[]).filter((key) => key !== "roles");

const STEP_1 = z.object({
  roles: contactFieldSchema("roles", { required: true }),
  headcountBand: contactFieldSchema("headcountBand", { required: true }),
  siteState: contactFieldSchema("siteState", { required: true }),
  siteCity: contactFieldSchema("siteCity", { required: true }),
  sitePincode: contactFieldSchema("sitePincode"),
  startWindow: contactFieldSchema("startWindow", { required: true }),
  durationBand: contactFieldSchema("durationBand", { required: true }),
  shiftPattern: contactFieldSchema("shiftPattern"),
  details: contactFieldSchema("details"),
});
const STEP_2 = z.object({
  name: contactFieldSchema("name"),
  company: contactFieldSchema("company", { required: true }),
  role: contactFieldSchema("role"),
  phone: contactFieldSchema("phone"),
  email: contactFieldSchema("email"),
});
/** Fields in page order, for focusing the first problem. */
/** States listed first in the picker: where we run crews or have wage pages. */
const FIRST_STATES: string[] = ["UK", "UP", "DL"];

const STEP_1_ORDER: Field[] = ["roles", "headcountBand", "siteState", "siteCity", "sitePincode", "startWindow", "durationBand", "shiftPattern", "details"];
const STEP_2_ORDER: Field[] = ["name", "company", "role", "phone", "email"];

function errorsOf(schema: z.ZodType, values: Values) {
  const result = schema.safeParse(values);
  if (result.success) return {};
  const errors: Partial<Record<Field, string>> = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as Field;
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

/** The request body: blanks left out, as the contract expects. */
function payloadOf(values: Values, sourcePath: string | null, assessment = false): ContactFormData {
  const body: Record<string, unknown> = {};
  if (assessment) body.requestType = "site-assessment";
  for (const key of TEXT_FIELDS) if (values[key].trim()) body[key] = values[key].trim();
  if (values.roles.length) body.roles = values.roles;
  if (sourcePath) body.sourcePath = sourcePath;
  return body as unknown as ContactFormData;
}

function decodeDraft(raw: unknown): Values | null {
  if (!raw || typeof raw !== "object") return null;
  const saved = raw as Record<string, unknown>;
  const draft: Values = { ...EMPTY };
  for (const key of TEXT_FIELDS) if (typeof saved[key] === "string") draft[key] = saved[key] as string;
  if (Array.isArray(saved.roles)) draft.roles = saved.roles.filter((id): id is string => typeof id === "string" && id in ROLE_OPTIONS);
  return draft.roles.length || TEXT_FIELDS.some((key) => draft[key]) ? draft : null;
}

/**
 * The page the visitor came from on this site, for the team (no query, no
 * fragment). Only when /contact was loaded directly: after an in-app
 * navigation, document.referrer still names the page that loaded the app.
 */
function referringPath() {
  try {
    const entry = performance.getEntriesByType("navigation")[0];
    if (!entry || new URL(entry.name).pathname !== window.location.pathname) return null;
    const referrer = new URL(document.referrer);
    if (referrer.origin !== window.location.origin) return null;
    const path = referrer.pathname.replace(/^\/(en-in|hi-in|hi-latn-in)(?=\/|$)/, "") || "/";
    return /^\/[A-Za-z0-9/_-]*$/.test(path) && path !== "/contact" ? path.slice(0, 200) : null;
  } catch {
    return null;
  }
}

const field =
  "form-scroll-target mt-2 h-12 rounded-lg border-neutral-300 bg-background px-4 text-base text-foreground shadow-none placeholder:text-neutral-400 focus-visible:border-gold-500 focus-visible:ring-gold-500/25 md:text-base";

function Optional() {
  return <span className="quick-optional"> Optional</span>;
}

function FieldError({ id, error }: { id: string; error?: string }) {
  return error ? <p id={`${id}-error`} className="mt-1.5 text-sm text-destructive">{error}</p> : null;
}

function Pills({
  id,
  options,
  value,
  onPick,
  disabled,
  invalid,
}: {
  id: string;
  options: Record<string, string>;
  value: string | string[];
  onPick: (id: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const selected = (option: string) => (Array.isArray(value) ? value.includes(option) : value === option);
  return (
    // Plain toggle buttons (aria-pressed) for single and multiple choice
    // alike: every option is one tap and one Tab stop, with no radio
    // keyboard pattern to promise. The error is tied to the first button.
    <div className="quick-pills crew-pills" role="group" aria-labelledby={`${id}-q`}>
      {Object.entries(options).map(([option, label], index) => (
        <button
          key={option}
          id={index === 0 ? id : undefined}
          type="button"
          disabled={disabled}
          aria-pressed={selected(option)}
          aria-invalid={index === 0 && invalid ? true : undefined}
          aria-describedby={index === 0 && invalid ? `${id}-error` : undefined}
          className={cn("quick-pill form-scroll-target", selected(option) && "is-selected")}
          onClick={() => onPick(option)}
        >
          {selected(option) && <Check size={16} aria-hidden="true" />}
          {label}
        </button>
      ))}
    </div>
  );
}

export function ContactForm() {
  const searchParams = useSearchParams();
  const isAssessment = searchParams.get("type") === "assessment";
  const formType = isAssessment ? "site_assessment" : "contact";
  const initial = useCallback((): Values => ({ ...EMPTY }), []);

  const [values, setValues] = useState<Values>(initial);
  const [step, setStep] = useState<1 | 2>(1);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [triedStep, setTriedStep] = useState<0 | 1 | 2>(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  // Why the last Send failed after validation passed, for analytics.
  const [sendFailure, setSendFailure] = useState<string | null>(null);
  const [formStartedAt] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [sourcePath, setSourcePath] = useState<string | null>(null);
  const { token: turnstileToken, box: turnstileBox, onReady: onVerificationReady, reset: resetTurnstile } = useTurnstile("contact", "contact");
  const trackedStart = useRef(false);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const doneHeading = useRef<HTMLHeadingElement>(null);
  const errorSummary = useRef<HTMLParagraphElement>(null);
  const movedStep = useRef(false);

  const markStarted = useCallback(() => {
    if (trackedStart.current) return;
    trackedStart.current = true;
    trackAnalyticsEvent("contact_form_start", { form_type: formType });
  }, [formType]);

  // Prefilled link (#roles=packing&headcount=50-99&location=haridwar&…), e.g.
  // from /haridwar-sidcul or an AI assistant. Values only fill fields.
  useEffect(() => {
    // Reads the browser once on mount: the referrer and the link's fragment.
    /* eslint-disable react-hooks/set-state-in-effect */
    setSourcePath(referringPath());
    const prefill = readPrefill(ENQUIRY_PREFILL_FIELDS);
    if (!prefill) return;
    const { fields: mapped, extraLines } = crewPrefill(prefill);
    setValues((current) => {
      const next = { ...current, ...mapped } as Values;
      const details = [...extraLines, prefill.details].filter(Boolean).join("\n");
      if (details) next.details = [current.details, details].filter(Boolean).join("\n");
      return next;
    });
    /* eslint-enable react-hooks/set-state-in-effect */
    trackAnalyticsEvent("form_prefilled", { form: "contact", fields: Object.keys(prefill).length });
  }, []);

  const hasDraft = values.roles.length > 0 || TEXT_FIELDS.some((key) => key !== "pageCluster" && values[key]);
  const restoreDraft = useCallback((saved: Values) => setValues(saved), []);
  const draft = useSessionDraft(isAssessment ? "vayasya-assessment-draft" : "vayasya-contact-draft", hasDraft ? values : null, decodeDraft, restoreDraft, !submitted);

  function set<K extends Field>(key: K, value: Values[K]) {
    markStarted();
    setValues((current) => ({ ...current, [key]: value }));
    // Clear a field's error as soon as it is answered; never add one while typing.
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function toggleRole(id: string) {
    set("roles", values.roles.includes(id) ? values.roles.filter((role) => role !== id) : [...values.roles, id]);
  }

  function focusFirst(found: Partial<Record<Field, string>>, order: Field[]) {
    const first = order.find((key) => found[key]);
    if (!first) return;
    // A chip group scrolls to its question, so the question and the chips
    // show together under the sticky header; focus goes to the first chip.
    const control = document.getElementById(first);
    revealFormTarget(document.getElementById(`${first}-q`) ?? control, { focus: control });
  }

  function goToStep(next: 1 | 2) {
    movedStep.current = true;
    setStep(next);
    setError(null);
    trackAnalyticsEvent("contact_form_step", {
      form_type: formType,
      step: next === 2 ? "contact" : "requirement",
      ...(next === 2 && { headcount_band: values.headcountBand, start_window: values.startWindow, duration_band: values.durationBand, roles: values.roles.length }),
    });
  }

  function onContinue() {
    markStarted();
    setTriedStep(1);
    const found = errorsOf(STEP_1, values);
    setErrors(found);
    if (Object.keys(found).length) {
      trackAnalyticsEvent("contact_form_error", { form_type: formType, reason: "validation", step: "requirement", checks: Object.keys(found).join(",") });
      focusFirst(found, STEP_1_ORDER);
      return;
    }
    goToStep(2);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 1) return onContinue();
    setTriedStep(2);
    setError(null);
    setSendFailure(null);
    const found = errorsOf(STEP_2, values);
    setErrors(found);
    if (Object.keys(found).length) {
      trackAnalyticsEvent("contact_form_error", { form_type: formType, reason: "validation", step: "contact", checks: Object.keys(found).join(",") });
      focusFirst(found, STEP_2_ORDER);
      return;
    }
    if (!turnstileToken) {
      setSendFailure("verification");
      trackAnalyticsEvent("contact_form_error", { form_type: formType, reason: "verification" });
      setError("Please wait a moment while we check this browser, then send again.");
      return;
    }
    const body = payloadOf(values, sourcePath, isAssessment);
    setSubmitting(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-contact-form-started-at": String(formStartedAt),
        "x-turnstile-token": turnstileToken,
      };
      if (honeypot.trim().length > 0) headers["x-contact-form-honeypot"] = honeypot;
      const response = await fetch("/api/contact", { method: "POST", headers, body: JSON.stringify(body) });
      resetTurnstile(); // tokens are single-use
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const reason = response.status === 429 ? "rate_limit" : response.status === 403 ? "verification" : "server";
        setSendFailure(reason);
        trackAnalyticsEvent("contact_form_error", { form_type: formType, reason });
        setError(result.error ?? "Submission failed. Please try again.");
        return;
      }
      draft.clear();
      if (typeof result.caseId === "string" && /^[A-Z]{3}-[0-9A-Z-]{6,40}$/.test(result.caseId)) setReference(result.caseId);
      setSubmitted(true);
      trackAdsConversion("businessEnquiry");
      const { qualified } = assessCrewRequest(body);
      trackAnalyticsEvent("generate_lead", {
        form_type: formType,
        form: "crew",
        cluster: values.pageCluster || "none",
        headcount_band: values.headcountBand,
        duration_band: values.durationBand,
        start_window: values.startWindow,
        qualified: qualified ? "yes" : "no",
      });
    } catch {
      // The server may have used the token before the connection dropped.
      resetTurnstile();
      setSendFailure("network");
      trackAnalyticsEvent("contact_form_error", { form_type: formType, reason: "network" });
      setError("The requirement could not be sent. Please try again, or call us.");
    } finally {
      setSubmitting(false);
    }
  }

  function clearDraft() {
    draft.clear();
    setValues(initial());
    setErrors({});
    setTriedStep(0);
    setError(null);
    setSendFailure(null);
    resetTurnstile();
    movedStep.current = true;
    setStep(1);
  }

  useEffect(() => {
    if (submitted) return revealFormTarget(doneHeading.current, { instant: true });
    if (error) return revealFormTarget(errorSummary.current);
  }, [submitted, error]);

  useEffect(() => {
    if (!movedStep.current) return;
    movedStep.current = false;
    return revealFormTarget(stepHeading.current);
  }, [step]);

  if (submitted) {
    return (
      <div role="status" className="crew-done">
        <h2 ref={doneHeading} tabIndex={-1} className="form-scroll-target crew-question">Received. Thank you.</h2>
        <p className="mt-3 max-w-md text-muted-foreground leading-relaxed">
          We aim to reply within two working days (Monday to Saturday, IST). We will contact you on the phone
          number or email you gave.
        </p>
        {reference && (
          <p className="mt-5 text-sm text-muted-foreground">
            Your reference: <span className="font-data text-foreground">{reference}</span>
            <br />
            Quote it if you write to us about this requirement.
          </p>
        )}
      </div>
    );
  }

  const invalid = (key: Field) => Boolean(errors[key]) || undefined;
  const describedBy = (key: Field) => (errors[key] ? `${key}-error` : undefined);
  const failedChecks = triedStep ? [...Object.keys(errors).filter((key) => errors[key as Field]), sendFailure].filter(Boolean).join(",") : undefined;

  return (
    <form
      aria-busy={submitting}
      data-analytics-form="contact"
      data-step={step}
      // Failed checks from the last Next or Send ("" if they passed), for the
      // abandonment event: field names and failure kinds only.
      data-form-errors={failedChecks}
      onSubmit={onSubmit}
      onKeyDownCapture={(event) => {
        if (event.key !== "Enter" || event.nativeEvent.isComposing || !(event.target instanceof HTMLInputElement)) return;
        // Visible, enabled fields only: Turnstile injects a hidden input, and
        // treating it as "next" would swallow Enter on the last field.
        const inputs = Array.from(
          event.currentTarget.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
            'input:not([type="hidden"]):not([tabindex="-1"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
          )
        ).filter((element) => element.offsetParent !== null);
        const next = inputs[inputs.indexOf(event.target) + 1];
        if (next) {
          event.preventDefault();
          revealFormTarget(next);
        }
      }}
      onFocusCapture={(event) => {
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) markStarted();
      }}
      noValidate
      className="crew-form"
    >
      {hasDraft && draft.restored && (
        <FormDraftNotice
          restored={draft.restored}
          disabled={submitting}
          onClear={clearDraft}
          onResume={() => revealFormTarget(stepHeading.current)}
        />
      )}
      <Script src={TURNSTILE_SCRIPT_URL} onReady={onVerificationReady} />
      <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
        <Label htmlFor="website">Website</Label>
        <Input id="website" autoComplete="new-password" tabIndex={-1} value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
      </div>

      <div className="quick-progress" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }} aria-hidden="true">
        <span className="is-done" />
        <span className={cn(step === 2 && "is-done")} />
      </div>
      <p className="crew-step eyebrow text-gold-700">STEP {step} OF 2</p>
      <h2 ref={stepHeading} tabIndex={-1} className="crew-step-title form-scroll-target">
        {step === 1 ? "The requirement" : "Who should we talk to?"}
      </h2>

      {step === 1 ? (
        <div className="crew-step-body">
          <section className="crew-section">
            <h3 id="roles-q" className="crew-question">What work is it?</h3>
            <p className="quick-hint">Choose one or more.</p>
            <Pills id="roles" options={ROLE_OPTIONS} value={values.roles} onPick={toggleRole} invalid={invalid("roles")} />
            <FieldError id="roles" error={errors.roles} />
          </section>

          <section className="crew-section">
            <h3 id="headcountBand-q" className="crew-question">How many workers?</h3>
            <Pills id="headcountBand" options={HEADCOUNT_BAND_OPTIONS} value={values.headcountBand} onPick={(id) => set("headcountBand", id)} invalid={invalid("headcountBand")} />
            <FieldError id="headcountBand" error={errors.headcountBand} />
          </section>

          <section className="crew-section">
            <h3 className="crew-question">Where is the site?</h3>
            <p className="quick-hint">Tell us where the site is. We&rsquo;ll tell you plainly whether we can staff it.</p>
            <div className="crew-site">
              <div>
                <Label htmlFor="siteState" className="text-sm font-medium">State</Label>
                <select
                  id="siteState"
                  name="siteState"
                  value={values.siteState}
                  aria-invalid={invalid("siteState")}
                  aria-describedby={describedBy("siteState")}
                  onChange={(event) => set("siteState", event.target.value)}
                  className={cn(field, "crew-select w-full border", !values.siteState && "text-neutral-400", errors.siteState && "border-destructive")}
                >
                  <option value="" disabled>Choose a state</option>
                  {/* Where we run crews or publish wage pages first, then every state. */}
                  <optgroup label="Uttarakhand, UP and Delhi">
                    {FIRST_STATES.map((code) => (
                      <option key={code} value={code} className="text-foreground">{STATE_OPTIONS[code]}</option>
                    ))}
                  </optgroup>
                  <optgroup label="All states and union territories">
                    {Object.entries(STATE_OPTIONS)
                      .filter(([code]) => !FIRST_STATES.includes(code))
                      .map(([code, name]) => (
                        <option key={code} value={code} className="text-foreground">{name}</option>
                      ))}
                  </optgroup>
                </select>
                <FieldError id="siteState" error={errors.siteState} />
              </div>
              <div>
                <Label htmlFor="siteCity" className="text-sm font-medium">City or industrial area</Label>
                <Input
                  id="siteCity"
                  name="siteCity"
                  value={values.siteCity}
                  aria-invalid={invalid("siteCity")}
                  aria-describedby={describedBy("siteCity")}
                  enterKeyHint="next"
                  autoComplete="address-level2"
                  placeholder="e.g. SIDCUL Haridwar"
                  maxLength={120}
                  onChange={(event) => set("siteCity", event.target.value)}
                  className={cn(field, errors.siteCity && "border-destructive")}
                />
                <FieldError id="siteCity" error={errors.siteCity} />
              </div>
              <div>
                <Label htmlFor="sitePincode" className="text-sm font-medium">PIN code<Optional /></Label>
                <Input
                  id="sitePincode"
                  name="sitePincode"
                  value={values.sitePincode}
                  aria-invalid={invalid("sitePincode")}
                  aria-describedby={describedBy("sitePincode")}
                  inputMode="numeric"
                  enterKeyHint="next"
                  autoComplete="postal-code"
                  placeholder="6 digits"
                  maxLength={6}
                  onChange={(event) => set("sitePincode", event.target.value.replace(/\D/g, ""))}
                  className={cn(field, "font-data", errors.sitePincode && "border-destructive")}
                />
                <FieldError id="sitePincode" error={errors.sitePincode} />
              </div>
            </div>
          </section>

          <section className="crew-section">
            <h3 id="startWindow-q" className="crew-question">When should work start?</h3>
            <Pills id="startWindow" options={START_WINDOW_OPTIONS} value={values.startWindow} onPick={(id) => set("startWindow", id)} invalid={invalid("startWindow")} />
            <FieldError id="startWindow" error={errors.startWindow} />
          </section>

          <section className="crew-section">
            <h3 id="durationBand-q" className="crew-question">For how long?</h3>
            <Pills id="durationBand" options={DURATION_BAND_OPTIONS} value={values.durationBand} onPick={(id) => set("durationBand", id)} invalid={invalid("durationBand")} />
            <FieldError id="durationBand" error={errors.durationBand} />
          </section>

          <p className="crew-skip">The next two are optional. Skip them if you like.</p>

          <section className="crew-section">
            <h3 id="shiftPattern-q" className="crew-question">Shift pattern<Optional /></h3>
            <p className="quick-hint">Every shift is 8 hours.</p>
            <Pills id="shiftPattern" options={SHIFT_PATTERN_OPTIONS} value={values.shiftPattern} onPick={(id) => set("shiftPattern", values.shiftPattern === id ? "" : id)} />
          </section>

          <section className="crew-section">
            <Label htmlFor="details" className="crew-question block">Anything else?<Optional /></Label>
            <Textarea
              id="details"
              name="details"
              value={values.details}
              aria-invalid={invalid("details")}
              aria-describedby={describedBy("details")}
              rows={4}
              placeholder="The work, the site, timings."
              onChange={(event) => set("details", event.target.value)}
              className={cn(field, "h-auto min-h-28 resize-y py-3 leading-relaxed", errors.details && "border-destructive")}
            />
            <FieldError id="details" error={errors.details} />
          </section>

          <div className="crew-actions">
            <Button type="submit" size="lg" className="crew-next">
              Next: who to talk to
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="crew-step-body">
          <div className="crew-recap">
            <p className="text-sm font-semibold">Your requirement</p>
            <ul className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {requirementLines(payloadOf(values, null, isAssessment)).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-1 inline-flex min-h-12 items-center text-sm font-medium text-gold-700 underline underline-offset-4 hover:text-foreground"
              disabled={submitting}
              onClick={() => goToStep(1)}
            >
              Change the requirement
            </button>
          </div>

          <div className="crew-people">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">Your name</Label>
              <Input id="name" name="name" value={values.name} aria-invalid={invalid("name")} aria-describedby={describedBy("name")} enterKeyHint="next" autoComplete="name" placeholder="Full name" onChange={(event) => set("name", event.target.value)} className={cn(field, errors.name && "border-destructive")} />
              <FieldError id="name" error={errors.name} />
            </div>
            <div>
              <Label htmlFor="company" className="text-sm font-medium">Company</Label>
              <Input id="company" name="company" value={values.company} aria-invalid={invalid("company")} aria-describedby={describedBy("company")} enterKeyHint="next" autoComplete="organization" placeholder="Company name" onChange={(event) => set("company", event.target.value)} className={cn(field, errors.company && "border-destructive")} />
              <FieldError id="company" error={errors.company} />
            </div>
            <div>
              <Label htmlFor="role" className="text-sm font-medium">Designation<Optional /></Label>
              <Input id="role" name="role" value={values.role} enterKeyHint="next" autoComplete="organization-title" placeholder="e.g. HR Manager" onChange={(event) => set("role", event.target.value)} className={field} />
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
              <Input id="phone" name="phone" type="tel" inputMode="tel" value={values.phone} aria-invalid={invalid("phone")} aria-describedby={describedBy("phone")} enterKeyHint="next" autoComplete="tel" placeholder="+91 98765 43210" onChange={(event) => set("phone", event.target.value)} className={cn(field, "font-data", errors.phone && "border-destructive")} />
              <FieldError id="phone" error={errors.phone} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="email" className="text-sm font-medium">Email<Optional /></Label>
              <Input id="email" name="email" type="email" value={values.email} aria-invalid={invalid("email")} aria-describedby={describedBy("email") ?? "email-hint"} enterKeyHint="send" autoComplete="email" placeholder="you@company.com" onChange={(event) => set("email", event.target.value)} className={cn(field, errors.email && "border-destructive")} />
              {errors.email ? <FieldError id="email" error={errors.email} /> : <p id="email-hint" className="mt-1.5 text-sm text-muted-foreground">We will send a copy of your requirement here.</p>}
            </div>
          </div>
        </div>
      )}

      <div ref={turnstileBox} className="mt-6" />

      {error && (
        <p ref={errorSummary} tabIndex={-1} role="alert" className="form-scroll-target mt-6 text-sm text-destructive">
          {error}
        </p>
      )}

      {step === 2 && (
        <div className="crew-actions">
          <Button type="submit" size="lg" className="crew-next" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending
              </>
            ) : (
              <>
                Send requirement
                <ArrowUpRight className="h-4 w-4" />
              </>
            )}
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            We use these details to reply to this enquiry.{" "}
            <a href={localePath("/privacy", "en-IN")} target="_blank" rel="noopener" className="underline underline-offset-4">
              Privacy Policy
            </a>
          </p>
        </div>
      )}
    </form>
  );
}
