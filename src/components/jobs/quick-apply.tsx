"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { trackAdsConversion, trackAnalyticsEvent } from "@/lib/analytics";
import { jobsCopy } from "@/content/pages/jobs";
import { AREA_OPTIONS, STAFF_LABELS, STEP_DEFS, quickApplyCopy, roleFor, type Answers, type StepDef } from "@/content/pages/quick-apply";
import { localePath, type Locale } from "@/lib/i18n";
import { isJobRole, normaliseIndianMobile, type IntakeSource } from "@/lib/talent-intake/rules";
import type { JobsStartResponse } from "@/lib/talent-intake/contract";
import { TURNSTILE_SCRIPT_URL, TURNSTILE_SITE_KEY } from "@/lib/turnstile";

/** Stored values shared with n8n; same as the long form. */
const SOURCE: Record<Locale, IntakeSource> = { "en-IN": "web_en", "hi-IN": "web_hi", "hi-Latn-IN": "web_hinglish" };
/** Trade pages answer the ITI question and its trade follow-up. */
const WORK_FOR_ROLE: Record<string, string> = { electrician: "iti-trades", welder: "iti-trades", fitter: "iti-trades" };

type Phase = { name: "form" } | { name: "sending" } | { name: "done"; ref: string };

/** Answers as large buttons: a radio group, or toggles when `multi`. */
function Pills({
  options,
  labels,
  selected,
  onPick,
  labelledBy,
  multi = false,
  small = false,
}: {
  options: readonly string[];
  labels: Record<string, string>;
  selected: (value: string) => boolean;
  onPick: (value: string) => void;
  labelledBy: string;
  multi?: boolean;
  small?: boolean;
}) {
  return (
    <div className={cn("quick-pills", small && "is-small")} role={multi ? "group" : "radiogroup"} aria-labelledby={labelledBy}>
      {options.map((value) => (
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
          {labels[value] ?? value}
        </button>
      ))}
    </div>
  );
}

/**
 * The guided jobs form. Questions unlock one below another and stay editable;
 * follow-ups depend on the work chosen (STEP_DEFS). Then name, mobile number
 * and area. Same intake as the long form (/api/jobs/start and /submit, with
 * Turnstile); the answers reach staff as a short note. Events carry
 * variant "quick" so the two forms can be compared.
 */
export function QuickApply({ locale }: { locale: Locale }) {
  const t = quickApplyCopy[locale];
  const form = jobsCopy[locale].form;
  const [answers, setAnswers] = useState<Answers>({});
  // Multi-choice questions count as answered once Next is pressed.
  const [confirmed, setConfirmed] = useState<string[]>([]);
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
  const started = useRef(false);
  const entry = useRef<"preset" | "fresh">("fresh");

  // Which questions apply, and how far the visitor has unlocked: every
  // applicable question up to and including the first unanswered one.
  const active = STEP_DEFS.filter((s) => !s.when || s.when(answers));
  const isDone = (s: StepDef) => (answers[s.id]?.length ?? 0) > 0 && (s.kind === "single" || confirmed.includes(s.id));
  const firstOpen = active.findIndex((s) => !isDone(s));
  const visible = firstOpen === -1 ? active : active.slice(0, firstOpen + 1);
  const detailsUnlocked = firstOpen === -1;
  const newest = detailsUnlocked ? "details" : visible[visible.length - 1]?.id;

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    trackAnalyticsEvent("job_form_start", { locale, variant: "quick" });
    trackAnalyticsEvent("quick_apply_start", { locale, entry: entry.current });
  };

  // A role in the link (?role=packing, from an ad group) answers the first question.
  useEffect(() => {
    const preset = new URLSearchParams(window.location.search).get("role");
    if (!isJobRole(preset)) return;
    entry.current = "preset";
    const trade = WORK_FOR_ROLE[preset];
    // Reading the link happens once, after hydration.
    /* eslint-disable react-hooks/set-state-in-effect */
    setAnswers(trade ? { work: [trade], trade: [preset] } : { work: [preset] });
    setConfirmed(trade ? ["work", "trade"] : ["work"]);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Bring each newly unlocked question into view and give it focus, so the
  // next step is obvious on a phone and announced to screen readers.
  useEffect(() => {
    if (!started.current || !newest) return;
    const el = document.querySelector<HTMLElement>(`.quick-section[data-step="${newest}"]`);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    el.querySelector<HTMLElement>(".quick-question")?.focus({ preventScroll: true });
  }, [newest]);

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

  function pick(step: StepDef, value: string) {
    markStarted();
    if (step.kind === "single") {
      setAnswers((a) => ({ ...a, [step.id]: [value] }));
      trackAnalyticsEvent("quick_step", { locale, step: step.id, answer: value });
      return;
    }
    setAnswers((a) => {
      const current = a[step.id] ?? [];
      let next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      // "Any work" stands alone: choosing it clears the rest, and the reverse.
      if (step.id === "work") next = value === "any" ? (next.includes("any") ? ["any"] : []) : next.filter((v) => v !== "any");
      return { ...a, [step.id]: next };
    });
  }

  function confirm(step: StepDef) {
    setConfirmed((c) => (c.includes(step.id) ? c : [...c, step.id]));
    trackAnalyticsEvent("quick_step", { locale, step: step.id, answer: (answers[step.id] ?? []).join(",").slice(0, 200) });
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

    const role = roleFor(answers);
    const label = (v: string) => STAFF_LABELS[v] ?? v;
    const text = [
      "Quick apply form (guided, /jobs/apply)",
      `Name: ${name.trim()}`,
      ...active.map((s) => `${label(s.id)}: ${(answers[s.id] ?? []).map(label).join(", ") || "Not given"}`),
      `${label("area")}: ${area ? label(area) : "Not given"}`,
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
      const summary = {
        locale,
        variant: "quick",
        work: (answers.work ?? []).join(",") || "none",
        experience: answers.experience?.[0] ?? "none",
        questions: active.length,
      };
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
  const fieldClass =
    "h-12 rounded-lg border-neutral-300 bg-background px-4 text-base shadow-none placeholder:text-neutral-400 focus-visible:border-gold-500 focus-visible:ring-gold-500/25 md:text-base";
  const total = active.length + 1;
  const doneCount = active.filter(isDone).length + (detailsUnlocked && name && phone ? 1 : 0);

  // Questions stay on the page once unlocked, so earlier answers can be
  // changed in place; each new one appears below the last.
  return (
    <div className="quick-apply">
      <Script src={TURNSTILE_SCRIPT_URL} onReady={renderTurnstile} />
      <div className="quick-progress" style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }} aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={cn(i < doneCount && "is-done")} />
        ))}
      </div>

      {visible.map((step) => {
        const q = t.questions[step.id];
        const values = answers[step.id] ?? [];
        return (
          <section key={step.id} className="quick-section" data-step={step.id}>
            <h2 id={`quick-q-${step.id}`} tabIndex={-1} className="quick-question">{q.question}</h2>
            {q.hint && <p className="quick-hint">{q.hint}</p>}
            <Pills
              labelledBy={`quick-q-${step.id}`}
              options={step.options}
              labels={t.labels}
              multi={step.kind === "multi"}
              selected={(v) => values.includes(v)}
              onPick={(v) => pick(step, v)}
            />
            {step.kind === "multi" && !confirmed.includes(step.id) && (
              <button type="button" className="jobs-submit mt-6" disabled={values.length === 0} onClick={() => confirm(step)}>
                {t.next}
              </button>
            )}
          </section>
        );
      })}

      {detailsUnlocked && (
        <section className="quick-section" data-step="details">
          <form
            data-clarity-mask="true"
            data-analytics-form="quick"
            data-form-errors={failedChecks?.join(",")}
            onSubmit={submit}
            noValidate
            aria-busy={sending}
          >
            <h2 id="quick-q-details" tabIndex={-1} className="quick-question">{t.details.question}</h2>
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
            <Pills
              labelledBy="quick-area"
              small
              options={AREA_OPTIONS}
              labels={t.labels}
              selected={(v) => area === v}
              onPick={(v) => {
                setArea(v);
                trackAnalyticsEvent("quick_step", { locale, step: "area", answer: v });
              }}
            />
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
        </section>
      )}

      {/* One Turnstile box for the whole flow: it checks the browser while the
          questions are answered, and only shows if it needs an interaction. */}
      <div ref={turnstileBox} className="mt-5" />
      <p className="quick-note">{t.noFee}</p>
    </div>
  );
}
