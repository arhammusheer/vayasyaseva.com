"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { trackAdsConversion, trackAnalyticsEvent } from "@/lib/analytics";
import { jobsCopy } from "@/content/pages/jobs";
import {
  STAFF_LABELS,
  WORK_OPTIONS,
  WORK_ROLE,
  quickApplyCopy,
  type WorkOption,
} from "@/content/pages/quick-apply";
import { localePath, type Locale } from "@/lib/i18n";
import { isJobRole, normaliseIndianMobile, type IntakeSource, type JobRole } from "@/lib/talent-intake/rules";
import type { JobsStartResponse } from "@/lib/talent-intake/contract";
import { TURNSTILE_SCRIPT_URL, TURNSTILE_SITE_KEY } from "@/lib/turnstile";

/** Stored values shared with n8n; same as the long form. */
const SOURCE: Record<Locale, IntakeSource> = { "en-IN": "web_en", "hi-IN": "web_hi", "hi-Latn-IN": "web_hinglish" };
const STEPS = ["work", "experience", "shift", "details"] as const;
/** Trade pages that share the ITI answer; the specific role is still sent. */
const ITI_ROLES: JobRole[] = ["electrician", "welder", "fitter", "iti-trades"];

/** Answers as large buttons: a radio group, or toggles when `multi`. */
function Pills({
  options,
  selected,
  onPick,
  multi = false,
}: {
  options: Record<string, string>;
  selected: (value: string) => boolean;
  onPick: (value: string) => void;
  multi?: boolean;
}) {
  return (
    <div className="quick-pills" role={multi ? "group" : "radiogroup"} aria-labelledby="quick-question">
      {Object.entries(options).map(([value, text]) => (
        <button
          key={value}
          type="button"
          role={multi ? undefined : "radio"}
          aria-checked={multi ? undefined : selected(value)}
          aria-pressed={multi ? selected(value) : undefined}
          className={cn("quick-pill", selected(value) && "is-selected")}
          onClick={() => onPick(value)}
        >
          {selected(value) && <Check size={16} aria-hidden="true" />}
          {text}
        </button>
      ))}
    </div>
  );
}

type Phase = { name: "form" } | { name: "sending" } | { name: "done"; ref: string };

/**
 * The guided jobs form: three tap-to-answer steps, then name, mobile number
 * and area. Same intake as the long form (/api/jobs/start and /submit, with
 * Turnstile); the answers reach staff as a short note. Events carry
 * variant "quick" so the two forms can be compared.
 */
export function QuickApply({ locale }: { locale: Locale }) {
  const t = quickApplyCopy[locale];
  const form = jobsCopy[locale].form;
  const [step, setStep] = useState(0);
  const [work, setWork] = useState<WorkOption | null>(null);
  const [role, setRole] = useState<JobRole | null>(null);
  const [experience, setExperience] = useState<string | null>(null);
  const [shifts, setShifts] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [failedChecks, setFailedChecks] = useState<string[] | null>(null);
  const [phase, setPhase] = useState<Phase>({ name: "form" });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileBox = useRef<HTMLDivElement>(null);
  const turnstileId = useRef<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const started = useRef(false);
  const entry = useRef<"preset" | "fresh">("fresh");

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    trackAnalyticsEvent("job_form_start", { locale, variant: "quick" });
    trackAnalyticsEvent("quick_apply_start", { locale, entry: entry.current });
  };

  // A role in the link (?role=packing, from an ad group) answers step 1.
  useEffect(() => {
    const preset = new URLSearchParams(window.location.search).get("role");
    if (!isJobRole(preset)) return;
    const option: WorkOption = ITI_ROLES.includes(preset) ? "iti-trades" : (WORK_OPTIONS as readonly string[]).includes(preset) ? (preset as WorkOption) : "any";
    entry.current = "preset";
    // Reading the link happens once, after hydration.
    /* eslint-disable react-hooks/set-state-in-effect */
    setWork(option);
    setRole(preset);
    setStep(1);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Move focus to each new question for keyboard and screen reader users.
  useEffect(() => {
    if (started.current) heading.current?.focus();
  }, [step]);

  const renderTurnstile = useCallback(() => {
    if (!window.turnstile || !turnstileBox.current || turnstileId.current) return;
    turnstileId.current = window.turnstile.render(turnstileBox.current, {
      sitekey: TURNSTILE_SITE_KEY,
      action: "jobs_start",
      appearance: "interaction-only",
      language: locale === "hi-IN" ? "hi" : "en",
      callback: (token: string) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(null),
      "error-callback": () => setTurnstileToken(null),
    });
  }, [locale]);
  useEffect(() => renderTurnstile(), [renderTurnstile]);
  const resetTurnstile = () => {
    setTurnstileToken(null);
    if (window.turnstile && turnstileId.current) window.turnstile.reset(turnstileId.current);
  };

  function answer(stepName: string, value: string) {
    markStarted();
    trackAnalyticsEvent("quick_step", { locale, step: stepName, answer: value });
  }

  // Single choice: brief tick, then the next question.
  function chooseSingle(stepName: "work" | "experience", value: string) {
    if (stepName === "work") {
      setWork(value as WorkOption);
      setRole(WORK_ROLE[value as WorkOption]);
    } else setExperience(value);
    answer(stepName, value);
    setTimeout(() => setStep((s) => Math.max(s, STEPS.indexOf(stepName) + 1)), 180);
  }

  function toggleShift(value: string) {
    markStarted();
    setShifts((current) => (current.includes(value) ? current.filter((s) => s !== value) : [...current, value]));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const failed: string[] = [];
    if (name.trim().length < 2) failed.push("name");
    if (!normaliseIndianMobile(phone)) failed.push("phone");
    if (!agreed) failed.push("agree");
    if (!turnstileToken) failed.push("verification");
    setFailedChecks(failed);
    setErrors(failed.map((key) => (key === "name" ? t.errors.name : form.errors[key as keyof typeof form.errors])));
    if (failed.length) {
      trackAnalyticsEvent("job_form_error", { locale, variant: "quick", reason: "validation", checks: failed.join(",") });
      return;
    }

    const label = (v: string | null) => (v ? STAFF_LABELS[v] ?? v : "Not given");
    const text = [
      "Quick apply form (guided, /jobs/apply)",
      `Name: ${name.trim()}`,
      `Work: ${label(work)}${role && ITI_ROLES.includes(role) && role !== "iti-trades" ? ` (${role})` : ""}`,
      `Experience: ${label(experience)}`,
      `Shifts: ${shifts.length ? shifts.map(label).join(", ") : "Not given"}`,
      `Area: ${label(area)}`,
    ].join("\n");

    setPhase({ name: "sending" });
    try {
      const start = await fetch("/api/jobs/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: SOURCE[locale], role, hub: null, turnstileToken, files: [] }),
      });
      resetTurnstile(); // tokens are single-use
      if (start.status === 403) throw new Error("verification");
      if (!start.ok) throw new Error("server");
      const ticket = (await start.json()) as JobsStartResponse;
      const done = await fetch("/api/jobs/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticket: ticket.ticket, phone, adult: true, consent: true, text }),
      });
      if (!done.ok) throw new Error("server");
      setPhase({ name: "done", ref: ticket.ref });
      const summary = { locale, variant: "quick", work: work ?? "none", experience: experience ?? "none" };
      trackAnalyticsEvent("job_form_submit", { ...summary, voice: "no" });
      trackAnalyticsEvent("quick_apply_submit", summary);
      trackAdsConversion("jobApplication");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "server";
      const key = reason === "verification" ? "verification" : reason === "server" ? "server" : "network";
      setErrors([form.errors[key]]);
      setFailedChecks([key]);
      setPhase({ name: "form" });
      trackAnalyticsEvent("job_form_error", { locale, variant: "quick", reason: key });
    }
  }

  if (phase.name === "done") {
    return (
      <div role="status" className="jobs-done">
        <h2 className="text-4xl font-medium sm:text-5xl">{form.done.title}</h2>
        <p className="mt-8 text-sm text-muted-foreground">{form.done.refLabel}</p>
        <p className="font-data text-3xl tracking-wide text-gold-700 sm:text-4xl">{phase.ref}</p>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">{form.done.body}</p>
      </div>
    );
  }

  const sending = phase.name === "sending";
  const current = STEPS[step];
  const fieldClass =
    "h-12 rounded-lg border-neutral-300 bg-background px-4 text-base shadow-none placeholder:text-neutral-400 focus-visible:border-gold-500 focus-visible:ring-gold-500/25 md:text-base";

  return (
    <div className="quick-apply" data-step={current}>
      <Script src={TURNSTILE_SCRIPT_URL} onReady={renderTurnstile} />
      <div className="quick-progress" aria-hidden="true">
        {STEPS.map((s, i) => (
          <span key={s} className={cn(i <= step && "is-done")} />
        ))}
      </div>
      <div className="quick-head">
        <p className="quick-step-count">{t.step(step + 1, STEPS.length)}</p>
        {step > 0 && (
          <button type="button" className="quick-back" onClick={() => setStep(step - 1)} disabled={sending}>
            <ArrowLeft size={16} aria-hidden="true" /> {t.back}
          </button>
        )}
      </div>

      {current === "work" && (
        <>
          <h2 id="quick-question" ref={heading} tabIndex={-1} className="quick-question">{t.work.question}</h2>
          <Pills options={t.work.options} selected={(v) => work === v} onPick={(v) => chooseSingle("work", v)} />
        </>
      )}

      {current === "experience" && (
        <>
          <h2 id="quick-question" ref={heading} tabIndex={-1} className="quick-question">{t.experience.question}</h2>
          <Pills options={t.experience.options} selected={(v) => experience === v} onPick={(v) => chooseSingle("experience", v)} />
        </>
      )}

      {current === "shift" && (
        <>
          <h2 id="quick-question" ref={heading} tabIndex={-1} className="quick-question">{t.shift.question}</h2>
          <p className="quick-hint">{t.shift.hint}</p>
          <Pills options={t.shift.options} selected={(v) => shifts.includes(v)} onPick={toggleShift} multi />
          <button
            type="button"
            className="jobs-submit mt-8"
            disabled={shifts.length === 0}
            onClick={() => {
              answer("shift", shifts.join(","));
              setStep(3);
            }}
          >
            {t.next}
          </button>
        </>
      )}

      {current === "details" && (
        <form
          data-clarity-mask="true"
          data-analytics-form="quick"
          data-form-errors={failedChecks?.join(",")}
          onSubmit={submit}
          noValidate
          aria-busy={sending}
        >
          <h2 id="quick-question" ref={heading} tabIndex={-1} className="quick-question">{t.details.question}</h2>
          <label htmlFor="quick-name" className="quick-label">{t.details.name}</label>
          <Input
            id="quick-name"
            autoComplete="name"
            placeholder={t.details.namePlaceholder}
            value={name}
            onFocus={markStarted}
            onChange={(e) => setName(e.target.value)}
            disabled={sending}
            className={cn(fieldClass, "mt-2 max-w-sm")}
          />
          <label htmlFor="quick-phone" className="quick-label">{t.details.phone}</label>
          <Input
            id="quick-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder={t.details.phonePlaceholder}
            value={phone}
            onFocus={markStarted}
            onChange={(e) => setPhone(e.target.value)}
            disabled={sending}
            className={cn(fieldClass, "mt-2 max-w-xs font-data")}
          />
          <p className="quick-label" id="quick-area">{t.details.area}</p>
          <div className="quick-pills is-small" role="radiogroup" aria-labelledby="quick-area">
            {Object.entries(t.details.areaOptions).map(([value, text]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={area === value}
                className={cn("quick-pill", area === value && "is-selected")}
                onClick={() => {
                  setArea(value);
                  answer("area", value);
                }}
                disabled={sending}
              >
                {area === value && <Check size={16} aria-hidden="true" />}
                {text}
              </button>
            ))}
          </div>

          <label className="jobs-check mt-6">
            <input type="checkbox" name="agree" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} disabled={sending} />
            <span>
              {form.steps.phone.agree}{" "}
              <a href={localePath("/privacy", "en-IN")} target="_blank" rel="noopener" className="underline underline-offset-4">
                {form.steps.phone.privacyLink}
              </a>
            </span>
          </label>
          {errors.length > 0 && (
            <ul className="jobs-errors" role="alert">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
          <button type="submit" className="jobs-submit mt-6" disabled={sending}>
            {sending && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
            {t.details.send}
          </button>
        </form>
      )}
      {/* One Turnstile box for the whole flow: it checks the browser while the
          questions are answered, and only shows if it needs an interaction. */}
      <div ref={turnstileBox} className="mt-5" />
      <p className="quick-note">{t.noFee}</p>
    </div>
  );
}
