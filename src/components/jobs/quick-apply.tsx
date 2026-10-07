"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTurnstile } from "@/lib/use-turnstile";
import { useSessionDraft } from "@/lib/use-session-draft";
import { FormDraftNotice } from "@/components/form-draft-notice";
import { revealFormTarget } from "@/lib/form-navigation";
import { cn } from "@/lib/utils";
import { formPage, trackAdsConversion, trackAnalyticsEvent } from "@/lib/analytics";
import { jobsCopy } from "@/content/pages/jobs";
import { STEP_DEFS, quickApplyCopy, roleFor, type Answers, type StepDef } from "@/content/pages/quick-apply";
import { readPrefill } from "@/lib/prefill";
import { localePath, type Locale } from "@/lib/i18n";
import { MAX_APPLICANT_NAME_LENGTH, cleanQuickAnswers, isJobRole, isJobHub, normaliseIndianMobile, type IntakeSource, type JobHub, type JobRole } from "@/lib/talent-intake/rules";
import { JobSubmissionFailure, useJobSubmission } from "@/lib/use-job-submission";
import { TURNSTILE_SCRIPT_URL } from "@/lib/turnstile";
import { adClick } from "@/lib/ad-click";
import { JobFilePicker, declareFiles, uploadAll, useJobFiles } from "@/components/jobs/job-files";

/** Stored values shared with n8n; same as the long form. */
const SOURCE: Record<Locale, IntakeSource> = { "en-IN": "web_en", "hi-IN": "web_hi", "hi-Latn-IN": "web_hinglish" };
/**
 * Answers kept in this browser tab only (sessionStorage), so switching
 * language or going back does not clear them. Never sent anywhere; cleared
 * once the application is sent.
 */
const SAVED_KEY = "vayasya-quick-apply";
type Saved = { answers: Answers; confirmed: string[]; name: string; phone: string; hadFiles: boolean };
function decodeSaved(raw: unknown): Saved | null {
  if (!raw || typeof raw !== "object") return null;
  const saved = raw as Partial<Saved>;
  const answers = cleanQuickAnswers(saved.answers) as Answers | null;
  const name = typeof saved.name === "string" ? saved.name.slice(0, MAX_APPLICANT_NAME_LENGTH) : "";
  const phone = typeof saved.phone === "string" ? saved.phone.slice(0, 20) : "";
  if (!answers && !name && !phone && !saved.hadFiles) return null;
  return { answers: answers ?? {}, confirmed: Array.isArray(saved.confirmed) ? saved.confirmed.filter((id) => typeof id === "string" && STEP_DEFS.some((s) => s.id === id)) : [], name, phone, hadFiles: saved.hadFiles === true };
}

/** Trade pages answer the ITI question and its trade follow-up. */
const WORK_FOR_ROLE: Record<string, string> = { electrician: "iti-trades", welder: "iti-trades", fitter: "iti-trades" };

function pageAnswers(role?: JobRole, hub?: JobHub): Answers {
  const trade = role && WORK_FOR_ROLE[role];
  return {
    ...(role ? { work: [trade ?? role], ...(trade ? { trade: [role] } : {}) } : {}),
    ...(hub === "freshers" ? { experience: ["fresher"] } : {}),
    ...(hub === "10th-pass" ? { education: ["10th"] } : {}),
    ...(hub === "12th-pass" ? { education: ["12th"] } : {}),
  };
}

type Phase = { name: "form" } | { name: "sending"; message: string } | { name: "done"; ref: string };

/** Answers as large buttons: a radio group, or toggles when `multi`. */
function Pills({
  options,
  labels,
  selected,
  onPick,
  labelledBy,
  multi = false,
  small = false,
  disabled = false,
}: {
  options: readonly string[];
  labels: Record<string, string>;
  selected: (value: string) => boolean;
  onPick: (value: string) => void;
  labelledBy: string;
  multi?: boolean;
  small?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className={cn("quick-pills", small && "is-small")} role={multi ? "group" : "radiogroup"} aria-labelledby={labelledBy}>
      {options.map((value) => (
        <button
          key={value}
          type="button"
          disabled={disabled}
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
 * follow-ups depend on the work chosen (STEP_DEFS), area last. Then only
 * name and mobile number, an optional file, and Send. Same intake as the long form (/api/jobs/start and /submit, with
 * Turnstile); the answers reach staff as a short note. Events carry
 * variant "quick" so the two forms can be compared.
 */
export function QuickApply({ locale, role: pageRole, hub: pageHub }: { locale: Locale; role?: JobRole; hub?: JobHub }) {
  const t = quickApplyCopy[locale];
  const form = jobsCopy[locale].form;
  const [answers, setAnswers] = useState<Answers>({});
  // Multi-choice questions count as answered once Next is pressed.
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [failedChecks, setFailedChecks] = useState<string[] | null>(null);
  const [phase, setPhase] = useState<Phase>({ name: "form" });
  const { token: turnstileToken, box: turnstileBox, onReady: onVerificationReady, reset: resetTurnstile } = useTurnstile("jobs_start", "quick", locale === "hi-IN" ? "hi" : "en");
  const started = useRef(false);
  const linkAnswers = useRef<Answers>({});
  const [hub, setHub] = useState<JobHub | null>(null);
  const entry = useRef<"preset" | "fresh" | "restored">("fresh");
  const [missingFiles, setMissingFiles] = useState(false);
  const submission = useJobSubmission("vayasya-quick-submission");
  const root = useRef<HTMLDivElement>(null);
  const doneHeading = useRef<HTMLHeadingElement>(null);
  const errorSummary = useRef<HTMLUListElement>(null);
  const pendingStep = useRef<string | null>(null);

  // Which questions apply, and how far the visitor has unlocked: every
  // applicable question up to and including the first unanswered one.
  const active = STEP_DEFS.filter((s) => !s.when || s.when(answers));
  const isDone = (s: StepDef) => (answers[s.id]?.length ?? 0) > 0 && (s.kind === "single" || confirmed.includes(s.id));
  const firstOpen = active.findIndex((s) => !isDone(s));
  const visible = firstOpen === -1 ? active : active.slice(0, firstOpen + 1);
  const detailsUnlocked = firstOpen === -1;

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    trackAnalyticsEvent("job_form_start", { locale, variant: "quick", page: formPage() });
    trackAnalyticsEvent("quick_apply_start", { locale, entry: entry.current });
  };
  const filePicker = useJobFiles(locale, markStarted);
  const { files } = filePicker;

  // Answers in the link, from ads, hub pages or AI assistants:
  // ?work=packing,warehouse&experience=fresher (any question, comma-separated
  // answer ids) or ?role=<job role page>. Name and phone come from the hash
  // (#name=…&phone=…), which never reaches the server.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryHub = params.get("hub");
    const raw: Record<string, string[]> = pageAnswers(pageRole, pageHub ?? (isJobHub(queryHub) ? queryHub : undefined));
    for (const [key, value] of params) raw[key] = value.split(",").map((v) => v.trim());
    const role = params.get("role");
    if (isJobRole(role) && !raw.work) {
      const trade = WORK_FOR_ROLE[role];
      raw.work = [trade ?? role];
      if (trade) raw.trade = [role];
    }
    const preset = cleanQuickAnswers(raw);
    linkAnswers.current = (preset ?? {}) as Answers;
    const hash = readPrefill(["name", "phone"] as const);
    // Public landing-page defaults and explicit query answers take priority
    // over conflicting draft choices; the remaining saved fields survive.
    /* eslint-disable react-hooks/set-state-in-effect */
    setHub(pageHub ?? (isJobHub(params.get("hub")) ? params.get("hub") as JobHub : null));
    if (preset) {
      entry.current = "preset";
      setAnswers(preset as Answers);
      setConfirmed(Object.keys(preset));
    }
    if (hash?.name) setName(hash.name.slice(0, MAX_APPLICANT_NAME_LENGTH));
    if (hash?.phone) setPhone(hash.phone);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [pageRole, pageHub]);

  const restoreDraft = useCallback((saved: Saved) => {
    entry.current = "restored";
    setAnswers({ ...saved.answers, ...linkAnswers.current }); setConfirmed([...new Set([...saved.confirmed, ...Object.keys(linkAnswers.current)])]);
    setName(saved.name); setPhone(saved.phone); setMissingFiles(saved.hadFiles);
  }, []);
  const hasDraft = Object.keys(answers).length > 0 || Boolean(name || phone || files.length || missingFiles);
  const draft = useSessionDraft(SAVED_KEY, hasDraft ? { answers, confirmed, name, phone, hadFiles: missingFiles || files.length > 0 } : null, decodeSaved, restoreDraft, phase.name !== "done" && !submission.attempt);

  useEffect(() => {
    const payload = submission.attempt?.payload;
    if (!payload) return;
    // An interrupted send restores the exact request, rather than new edits.
    /* eslint-disable react-hooks/set-state-in-effect */
    setName(payload.name ?? ""); setPhone(payload.phone); setAgreed(true);
    setAnswers((payload.answers ?? {}) as Answers); setConfirmed(Object.keys(payload.answers ?? {}));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [submission.attempt]);

  const visibleChecks = useMemo(() => (failedChecks ?? []).filter((key) => {
    if (key === "name") return name.trim().length < 2;
    if (key === "phone") return !normaliseIndianMobile(phone);
    if (key === "agree") return !agreed;
    if (key === "verification") return !turnstileToken && !submission.attempt;
    return true;
  }), [failedChecks, name, phone, agreed, turnstileToken, submission.attempt]);
  const errorFor = (key: string) => visibleChecks.includes(key) ? (key === "name" ? t.errors.name : form.errors[key as keyof typeof form.errors]) : undefined;
  const summaryChecks = visibleChecks.filter((key) => key !== "name" && key !== "phone" && key !== "agree");
  function clearDraft() {
    draft.clear(); submission.clear(); filePicker.clear();
    const defaults = pageAnswers(pageRole, pageHub);
    setAnswers(defaults); setConfirmed(Object.keys(defaults)); setName(""); setPhone(""); setAgreed(false); setMissingFiles(false); setFailedChecks(null);
    started.current = false;
    resetTurnstile();
    requestAnimationFrame(() => revealFormTarget(root.current?.querySelector<HTMLElement>(".quick-question") ?? null, { instant: true }));
  }

  // Only explicit choices navigate: restored/prefilled answers never move
  // the page. Re-selecting an answer or revisiting Next still advances.
  useEffect(() => {
    const step = pendingStep.current;
    if (!step) return;
    pendingStep.current = null;
    const applicable = STEP_DEFS.filter((s) => !s.when || s.when(answers));
    const next = applicable[applicable.findIndex((s) => s.id === step) + 1]?.id ?? "details";
    const section = root.current?.querySelector<HTMLElement>(`[data-step="${next}"]`);
    return revealFormTarget(section ?? null, { focus: section?.querySelector<HTMLElement>(".quick-question") });
  }, [answers, confirmed]);

  useEffect(() => {
    if (phase.name === "done") return revealFormTarget(doneHeading.current, { instant: true });
    if (phase.name !== "form" || !failedChecks?.length) return;
    const field = failedChecks?.find((key) => key === "name" || key === "phone" || key === "agree");
    const target = field ? root.current?.querySelector<HTMLElement>(field === "agree" ? '[name="agree"]' : `#quick-${field}`) : errorSummary.current;
    return revealFormTarget(target ?? null);
  }, [phase.name, failedChecks]);


  function pick(step: StepDef, value: string) {
    markStarted();
    // changed = yes when an answer already given is changed: a sign the
    // question or its choices confused someone.
    if (step.kind === "single") {
      pendingStep.current = step.id;
      const before = answers[step.id]?.[0];
      setAnswers((a) => ({ ...a, [step.id]: [value] }));
      trackAnalyticsEvent("quick_step", { locale, step: step.id, answer: value, ...(before && before !== value ? { changed: "yes" } : {}) });
      return;
    }
    if (confirmed.includes(step.id)) trackAnalyticsEvent("quick_step", { locale, step: step.id, answer: value, changed: "yes" });
    setAnswers((a) => {
      const current = a[step.id] ?? [];
      let next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      // "Any work" stands alone: choosing it clears the rest, and the reverse.
      if (step.id === "work") next = value === "any" ? (next.includes("any") ? ["any"] : []) : next.filter((v) => v !== "any");
      return { ...a, [step.id]: next };
    });
  }

  function confirm(step: StepDef) {
    pendingStep.current = step.id;
    setConfirmed((c) => [...c.filter((id) => id !== step.id), step.id]);
    trackAnalyticsEvent("quick_step", { locale, step: step.id, answer: (answers[step.id] ?? []).join(",").slice(0, 200) });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const failed: string[] = [];
    if (name.trim().length < 2) failed.push("name");
    if (!normaliseIndianMobile(phone)) failed.push("phone");
    if (!agreed) failed.push("agree");
    if (!turnstileToken && !submission.attempt) failed.push("verification");
    setFailedChecks(failed);
    if (failed.length) {
      trackAnalyticsEvent("job_form_error", { locale, variant: "quick", page: formPage(), reason: "validation", checks: failed.join(",") });
      return;
    }

    const role = roleFor(answers);
    // Only the questions that applied: n8n stores them as data.
    const sent = cleanQuickAnswers(Object.fromEntries(active.map((s) => [s.id, answers[s.id] ?? []])));

    const declared = declareFiles(files);
    setPhase({ name: "sending", message: form.sending });
    try {
      const ref = await submission.send({
        start: { source: SOURCE[locale], role, hub, turnstileToken: turnstileToken ?? "", files: declared },
        payload: { phone, adult: true, consent: true, text: null, form: "quick", name: name.trim().slice(0, MAX_APPLICANT_NAME_LENGTH), answers: sent, adClick: adClick() },
        resetVerification: resetTurnstile,
        upload: async (uploads) => {
          await uploadAll(uploads, files.map((f) => f.file), declared.map((d) => d.kind), locale, (n, total, percent) => setPhase({ name: "sending", message: form.sendingFile(n, total, percent) }));
          setPhase({ name: "sending", message: form.sending });
        },
      });
      if (!ref) return;
      draft.clear();
      setPhase({ name: "done", ref });
      const summary = {
        locale,
        variant: "quick",
        work: (answers.work ?? []).join(",") || "none",
        experience: answers.experience?.[0] ?? "none",
        questions: active.length,
        files: files.length,
      };
      trackAnalyticsEvent("job_form_submit", { ...summary, page: formPage(), voice: "no" });
      trackAnalyticsEvent("quick_apply_submit", summary);
      trackAdsConversion("jobApplication");
    } catch (error) {
      const key = error instanceof JobSubmissionFailure ? error.reason : "network";
      setFailedChecks([key]);
      setPhase({ name: "form" });
      trackAnalyticsEvent("job_form_error", { locale, variant: "quick", page: formPage(), reason: key });
    }
  }

  if (phase.name === "done") {
    return (
      <div role="status" className="jobs-done">
        <h2 ref={doneHeading} tabIndex={-1} className="form-scroll-target text-4xl font-medium sm:text-5xl">{form.done.title}</h2>
        <p className="mt-8 text-sm text-muted-foreground">{form.done.refLabel}</p>
        <p className="font-data text-3xl tracking-wide text-gold-700 sm:text-4xl">{phase.ref}</p>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">{form.done.body}</p>
        <button type="button" className="text-link mt-8" onClick={() => { clearDraft(); setPhase({ name: "form" }); }}>{form.done.again}</button>
      </div>
    );
  }

  const sending = phase.name === "sending";
  const locked = sending || Boolean(submission.attempt);
  const fieldClass =
    "h-12 rounded-lg border-neutral-300 bg-background px-4 text-base shadow-none placeholder:text-neutral-400 focus-visible:border-gold-500 focus-visible:ring-gold-500/25 md:text-base";
  const total = active.length + 1;
  const doneCount = active.filter(isDone).length + (detailsUnlocked && name && phone ? 1 : 0);

  // Questions stay on the page once unlocked, so earlier answers can be
  // changed in place; each new one appears below the last.
  return (
    <div ref={root} className="quick-apply">
      {hasDraft && draft.restored && !submission.attempt && <FormDraftNotice locale={locale} restored={draft.restored} missingFiles={missingFiles && files.length === 0} disabled={sending} onClear={clearDraft} onResume={() => revealFormTarget(root.current?.querySelector<HTMLElement>(`#quick-q-${detailsUnlocked ? "details" : visible[visible.length - 1]?.id}`) ?? null)} />}
      {submission.attempt && phase.name === "form" && <p role="status" className="mb-6 text-sm leading-relaxed" data-retry-notice>{form.retryNotice} <strong className="font-data">{submission.attempt.started.ref}</strong></p>}
      <Script src={TURNSTILE_SCRIPT_URL} onReady={onVerificationReady} />
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
            <h2 id={`quick-q-${step.id}`} tabIndex={-1} className="quick-question form-scroll-target">{q.question}</h2>
            {q.hint && <p className="quick-hint">{q.hint}</p>}
            <Pills
              labelledBy={`quick-q-${step.id}`}
              options={step.options}
              labels={t.labels}
              multi={step.kind === "multi"}
              disabled={locked}
              selected={(v) => values.includes(v)}
              onPick={(v) => pick(step, v)}
            />
            {step.kind === "multi" && (
              <button type="button" className="jobs-submit mt-6" disabled={locked || values.length === 0} onClick={() => confirm(step)}>
                {t.next}
              </button>
            )}
          </section>
        );
      })}

      {detailsUnlocked && (
        <section className="quick-section" data-step="details">
          <form
            data-analytics-form="quick"
            data-form-errors={failedChecks === null ? undefined : visibleChecks.join(",")}
            data-draft-files={files.length || undefined}
            onSubmit={submit}
            noValidate
            aria-busy={sending}
          >
            <h2 id="quick-q-details" tabIndex={-1} className="quick-question form-scroll-target">{t.details.question}</h2>
            <label htmlFor="quick-name" className="quick-label">{t.details.name}</label>
            <Input
              id="quick-name"
              aria-invalid={visibleChecks.includes("name") || undefined}
              aria-describedby={errorFor("name") ? "quick-name-error" : undefined}
              enterKeyHint="next"
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
                event.preventDefault();
                revealFormTarget(root.current?.querySelector<HTMLElement>("#quick-phone") ?? null);
              }}
              autoComplete="name"
              maxLength={MAX_APPLICANT_NAME_LENGTH}
              placeholder={t.details.namePlaceholder}
              value={name}
              onFocus={markStarted}
              onChange={(e) => setName(e.target.value)}
              disabled={locked}
              className={cn(fieldClass, "form-scroll-target mt-2 max-w-sm")}
            />
            {errorFor("name") && <p id="quick-name-error" className="jobs-error" role="alert">{errorFor("name")}</p>}
            <label htmlFor="quick-phone" className="quick-label">{t.details.phone}</label>
            <Input
              id="quick-phone"
              type="tel"
              aria-invalid={visibleChecks.includes("phone") || undefined}
              aria-describedby={errorFor("phone") ? "quick-phone-error" : undefined}
              enterKeyHint="done"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder={t.details.phonePlaceholder}
              value={phone}
              onFocus={markStarted}
              onChange={(e) => setPhone(e.target.value)}
              disabled={locked}
              className={cn(fieldClass, "form-scroll-target mt-2 max-w-xs font-data")}
            />
            {errorFor("phone") && <p id="quick-phone-error" className="jobs-error" role="alert">{errorFor("phone")}</p>}
            <JobFilePicker locale={locale} picker={filePicker} disabled={locked} compact optionalLabel={t.details.optional} />
            <label className="jobs-check mt-6">
              <input type="checkbox" name="agree" aria-invalid={visibleChecks.includes("agree") || undefined} aria-describedby={errorFor("agree") ? "quick-agree-error" : undefined} checked={agreed} onChange={(e) => setAgreed(e.target.checked)} disabled={locked} />
              <span>
                {form.steps.phone.agree}{" "}
                <a href={localePath("/privacy", "en-IN")} target="_blank" rel="noopener" className="underline underline-offset-4">
                  {form.steps.phone.privacyLink}
                </a>
              </span>
            </label>
            {errorFor("agree") && <p id="quick-agree-error" className="jobs-error" role="alert">{errorFor("agree")}</p>}
            {summaryChecks.length > 0 && (
              <ul ref={errorSummary} id="quick-errors" tabIndex={-1} className="jobs-errors form-scroll-target" role="alert">
                {summaryChecks.map((key) => form.errors[key as keyof typeof form.errors]).map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
            <button type="submit" className="jobs-submit mt-6" disabled={sending}>
              {sending && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
              {submission.attempt ? form.retry : t.details.send}
            </button>
            {phase.name === "sending" && (
              <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
                {phase.message}
              </p>
            )}
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
