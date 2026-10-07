"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, RotateCcw, Square, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { revealFormTarget } from "@/lib/form-navigation";
import { cn } from "@/lib/utils";
import { formPage, trackAdsConversion, trackAnalyticsEvent } from "@/lib/analytics";
import { JOB_PREFILL_FIELDS, labelledLines, readPrefill } from "@/lib/prefill";
import { jobsCopy } from "@/content/pages/jobs";
import { localePath, type Locale } from "@/lib/i18n";
import {
  INTAKE_LIMITS,
  normaliseIndianMobile,
  type IntakeSource,
  type JobHub,
  type JobRole,
} from "@/lib/talent-intake/rules";
import type { JobsStartResponse } from "@/lib/talent-intake/contract";
import { TURNSTILE_SCRIPT_URL, TURNSTILE_SITE_KEY } from "@/lib/turnstile";
import { AgentGuidance } from "@/components/agent-guidance";
import { adClick } from "@/lib/ad-click";
import { JobFilePicker, declareFiles, uploadAll, useJobFiles } from "@/components/jobs/job-files";

/** Intake source per page. These are stored values shared with n8n and its database; don't rename them here alone. */
const SOURCE: Record<Locale, IntakeSource> = { "en-IN": "web_en", "hi-IN": "web_hi", "hi-Latn-IN": "web_hinglish" };
const RECORDER_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
type Voice =
  | { state: "idle" }
  | { state: "recording"; seconds: number }
  | { state: "recorded"; blob: Blob; url: string; seconds: number };

type Phase =
  | { name: "form" }
  | { name: "sending"; message: string }
  | { name: "done"; ref: string };

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * `role`: set on a role page (/jobs/<slug>) so the submission is tagged with it.
 * `hub`: the same for the unlinked hub pages (/jobs/freshers…).
 */
/** Voice note length for analytics, in ranges rather than exact seconds. */
function secondsBucket(seconds: number) {
  if (seconds < 10) return "under_10s";
  if (seconds < 30) return "10_30s";
  if (seconds < 60) return "30_60s";
  return "60s_plus";
}

export function JobsForm({
  locale,
  role = null,
  hub = null,
}: {
  locale: Locale;
  role?: JobRole | null;
  hub?: JobHub | null;
}) {
  const t = jobsCopy[locale].form;
  const noFee = jobsCopy[locale].noFee;
  const [voice, setVoice] = useState<Voice>({ state: "idle" });
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [phone, setPhone] = useState("");
  // One checkbox covers both: 18 or older, and consent to be contacted.
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  // Which checks failed on the last Send (null: not pressed yet), for analytics.
  const [failedChecks, setFailedChecks] = useState<string[] | null>(null);
  const [phase, setPhase] = useState<Phase>({ name: "form" });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const turnstileBox = useRef<HTMLDivElement>(null);
  const turnstileId = useRef<string | null>(null);
  const doneHeading = useRef<HTMLHeadingElement>(null);
  const trackedStart = useRef(false);
  const formRoot = useRef<HTMLFormElement>(null);
  const errorSummary = useRef<HTMLUListElement>(null);
  const resetRequested = useRef(false);
  const goToStep = (step: string) => revealFormTarget(formRoot.current?.querySelector<HTMLElement>(`[data-form-step="${step}"]`) ?? null);

  const markStarted = () => {
    if (trackedStart.current) return;
    trackedStart.current = true;
    trackAnalyticsEvent("job_form_start", { locale, variant: "long", page: formPage() });
  };
  const filePicker = useJobFiles(locale, markStarted);
  const { files } = filePicker;

  // --- Prefilled link (#phone=…&work=…) --------------------------------------
  useEffect(() => {
    const values = readPrefill(JOB_PREFILL_FIELDS);
    if (!values) return;
    const lines = labelledLines(values, t.prefill);
    if (values.about) lines.push(values.about);
    // Reading the link happens once, after hydration; the fields stay editable.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (values.phone) setPhone(values.phone);
    if (lines.length) setText(lines.join("\n").slice(0, INTAKE_LIMITS.maxTextLength));
    /* eslint-enable react-hooks/set-state-in-effect */
    trackAnalyticsEvent("form_prefilled", { form: "jobs", locale, fields: Object.keys(values).length });
  }, [t, locale]);

  // --- Turnstile ---------------------------------------------------------
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
      // Cloudflare is about to ask for an interaction: friction worth counting.
      "before-interactive-callback": () => trackAnalyticsEvent("verification_shown", { form: "jobs", page: formPage() }),
    });
  }, [locale]);
  useEffect(() => renderTurnstile(), [renderTurnstile]);
  const resetTurnstile = () => {
    setTurnstileToken(null);
    if (window.turnstile && turnstileId.current) window.turnstile.reset(turnstileId.current);
  };

  // --- Voice ---------------------------------------------------------------
  const stopRecording = () => recorder.current?.state === "recording" && recorder.current.stop();

  async function startRecording() {
    markStarted();
    setVoiceError(null);
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      trackAnalyticsEvent("voice_error", { locale, reason: "unsupported" });
      setVoiceError(t.record.unsupported);
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      const name = error instanceof Error ? error.name : "";
      // Denied permission and a missing microphone need different fixes.
      const reason = name === "NotAllowedError" || name === "SecurityError" ? "denied" : name === "NotFoundError" ? "no_mic" : "mic_error";
      trackAnalyticsEvent("voice_error", { locale, reason });
      setVoiceError(t.record.noMic);
      return;
    }
    const mimeType = RECORDER_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    let seconds = 0;
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onerror = () => trackAnalyticsEvent("voice_error", { locale, reason: "recorder" });
    rec.onstop = () => {
      if (timer.current) clearInterval(timer.current);
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunks, { type: rec.mimeType || mimeType || "audio/webm" });
      setVoice({ state: "recorded", blob, url: URL.createObjectURL(blob), seconds });
      trackAnalyticsEvent("voice_recorded", { locale, length: secondsBucket(seconds) });
    };
    recorder.current = rec;
    rec.start(1000);
    trackAnalyticsEvent("voice_record_start", { locale });
    setVoice({ state: "recording", seconds: 0 });
    timer.current = setInterval(() => {
      seconds += 1;
      setVoice({ state: "recording", seconds });
      if (seconds >= INTAKE_LIMITS.maxAudioSeconds) rec.stop();
    }, 1000);
  }

  function discardVoice() {
    if (voice.state === "recorded") {
      URL.revokeObjectURL(voice.url);
      trackAnalyticsEvent("voice_discard", { locale });
    }
    setVoice({ state: "idle" });
  }

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      recorder.current?.stream.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  // --- Submit ----------------------------------------------------------------
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const failed: (keyof typeof t.errors)[] = [];
    const hasVoice = voice.state === "recorded";
    if (!hasVoice && files.length === 0 && !text.trim()) failed.push("empty");
    if (!normaliseIndianMobile(phone)) failed.push("phone");
    if (!agreed) failed.push("agree");
    if (!turnstileToken) failed.push("verification");
    setErrors(failed.map((key) => t.errors[key]));
    setFailedChecks(failed);
    if (failed.length) {
      trackAnalyticsEvent("job_form_error", { locale, variant: "long", page: formPage(), reason: "validation", checks: failed.join(",") });
      return;
    }

    const bodies: Blob[] = [...(hasVoice ? [voice.blob] : []), ...files.map((f) => f.file)];
    const declared = [
      ...(hasVoice ? [{ kind: "audio" as const, mime: voice.blob.type, size: voice.blob.size, name: null }] : []),
      ...declareFiles(files),
    ];

    setPhase({ name: "sending", message: t.sending });
    try {
      const start = await fetch("/api/jobs/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: SOURCE[locale], role, hub, turnstileToken, files: declared }),
      });
      resetTurnstile(); // tokens are single-use
      if (start.status === 403) throw new Error("verification");
      if (!start.ok) throw new Error("server");
      const started = (await start.json()) as JobsStartResponse;

      await uploadAll(started.uploads, bodies, declared.map((d) => d.kind), locale, (n, total, percent) =>
        setPhase({ name: "sending", message: t.sendingFile(n, total, percent) }),
      );

      setPhase({ name: "sending", message: t.sending });
      const done = await fetch("/api/jobs/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticket: started.ticket, phone, adult: true, consent: true, text: text.trim() || null, adClick: adClick() }),
      });
      if (!done.ok) throw new Error("server");
      setPhase({ name: "done", ref: started.ref });
      trackAnalyticsEvent("job_form_submit", { locale, variant: "long", page: formPage(), voice: hasVoice ? "yes" : "no" });
      trackAdsConversion("jobApplication");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "server";
      const key = reason === "verification" ? "verification" : reason === "server" ? "server" : "network";
      setErrors([t.errors[key]]);
      setFailedChecks([key]);
      setPhase({ name: "form" });
      trackAnalyticsEvent("job_form_error", { locale, variant: "long", page: formPage(), reason: key });
    }
  }

  useEffect(() => {
    if (phase.name === "done") return revealFormTarget(doneHeading.current, { instant: true });
    if (phase.name !== "form") return;
    if (resetRequested.current) {
      resetRequested.current = false;
      return revealFormTarget(formRoot.current?.querySelector<HTMLElement>('[data-form-step="about"]') ?? null, { instant: true });
    }
    if (!errors.length) return;
    const first = failedChecks?.[0];
    const selector = first === "empty" ? "#jobs-text" : first === "phone" ? "#jobs-phone" : first === "agree" ? '[name="agree"]' : null;
    return revealFormTarget(selector ? formRoot.current?.querySelector<HTMLElement>(selector) ?? null : errorSummary.current);
  }, [phase.name, errors, failedChecks]);

  function reset() {
    resetRequested.current = true;
    discardVoice();
    filePicker.clear();
    setText("");
    setAgreed(false);
    setErrors([]);
    setFailedChecks(null);
    setPhase({ name: "form" });
  }

  // --- Render ------------------------------------------------------------------
  if (phase.name === "done") {
    return (
      <div role="status" className="jobs-done">
        <h2 ref={doneHeading} tabIndex={-1} className="form-scroll-target text-4xl font-medium sm:text-5xl">
          {t.done.title}
        </h2>
        <p className="mt-8 text-sm text-muted-foreground">{t.done.refLabel}</p>
        <p className="font-data text-3xl tracking-wide text-gold-700 sm:text-4xl">{phase.ref}</p>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">{t.done.body}</p>
        <button type="button" onClick={reset} className="text-link mt-8">
          {t.done.again}
        </button>
      </div>
    );
  }

  const sending = phase.name === "sending";
  const fieldClass =
    "h-12 rounded-lg border-neutral-300 bg-background px-4 text-base shadow-none placeholder:text-neutral-400 focus-visible:border-gold-500 focus-visible:ring-gold-500/25 md:text-base";

  return (
    <form
      ref={formRoot}
      data-analytics-form="jobs"
      // Read by the analytics draft log if the form is left unfinished: only
      // whether a voice note or files were added, never their content.
      data-draft-voice-seconds={voice.state === "recorded" ? voice.seconds : undefined}
      data-draft-files={files.length || undefined}
      // Failed checks from the last Send ("" if it passed), for the
      // abandonment event: names only, e.g. "phone,agree".
      data-form-errors={failedChecks?.join(",")}
      onSubmit={submit}
      noValidate
      className="jobs-form"
      aria-busy={sending}
    >
      <Script src={TURNSTILE_SCRIPT_URL} onReady={renderTurnstile} />
      <AgentGuidance form="jobs" />

      {/* Three tiers. Tier 01 holds the voice note with typing as its
          alternative, so one tier is "tell us" however suits; the number and
          documents follow. Order and weight say what matters. */}
      <ol className="jobs-steps">
        <li>
          <span className="jobs-step-number" aria-hidden="true">01</span>
          <div>
            <h2 data-form-step="about" tabIndex={-1} className="jobs-step-title form-scroll-target">{t.steps.record.title}</h2>
            <p className="jobs-step-hint">{t.steps.record.lead}</p>
            <ul className="jobs-say">
              {t.steps.record.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <div className="jobs-recorder">
              {voice.state === "recording" ? (
                <button type="button" className="jobs-record-button is-recording" onClick={stopRecording}>
                  <Square aria-hidden="true" />
                  <span>{t.record.stop}</span>
                </button>
              ) : voice.state === "idle" ? (
                <button type="button" className="jobs-record-button" onClick={startRecording} disabled={sending}>
                  <Mic aria-hidden="true" />
                  <span>{t.record.start}</span>
                </button>
              ) : null}
              {voice.state === "recording" && (
                <p className="jobs-record-clock" aria-live="polite">
                  <span className="jobs-record-dot" aria-hidden="true" />
                  {t.record.recording} · <span className="font-data">{clock(voice.seconds)} / {clock(INTAKE_LIMITS.maxAudioSeconds)}</span>
                </p>
              )}
              {voice.state === "recorded" && (
                <div className="jobs-recorded">
                  <p className="text-sm font-medium">
                    {t.record.recorded} · <span className="font-data">{clock(voice.seconds)}</span>
                  </p>
                  <audio controls src={voice.url} className="mt-3 w-full max-w-md" />
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                    <button type="button" className="text-link mt-0" onClick={() => { discardVoice(); void startRecording(); }} disabled={sending}>
                      <RotateCcw size={16} aria-hidden="true" /> {t.record.again}
                    </button>
                    <button type="button" className="text-link mt-0" onClick={discardVoice} disabled={sending}>
                      <X size={16} aria-hidden="true" /> {t.record.remove}
                    </button>
                  </div>
                </div>
              )}
              {voiceError && <p className="jobs-error">{voiceError}</p>}
            </div>

            <label htmlFor="jobs-text" className="jobs-or block">
              <strong>{t.steps.or}</strong>
              {t.steps.text.title}
            </label>
            <Textarea
              id="jobs-text"
              aria-invalid={failedChecks?.includes("empty") || undefined}
              aria-describedby={errors.length ? "jobs-errors" : undefined}
              rows={3}
              maxLength={INTAKE_LIMITS.maxTextLength}
              placeholder={t.steps.text.placeholder}
              value={text}
              onFocus={markStarted}
              onChange={(e) => setText(e.target.value)}
              disabled={sending}
              className={cn(fieldClass, "form-scroll-target mt-2 h-auto min-h-20 resize-y py-3 leading-relaxed")}
            />
            <button type="button" className="text-link mt-5 min-h-11" disabled={sending || voice.state === "recording"} onClick={() => goToStep("phone")}>{t.next}</button>
          </div>
        </li>

        <li>
          <span className="jobs-step-number" aria-hidden="true">02</span>
          <div>
            <label data-form-step="phone" tabIndex={-1} htmlFor="jobs-phone" className="jobs-step-title form-scroll-target block">{t.steps.phone.title}</label>
            <Input
              id="jobs-phone"
              type="tel"
              aria-invalid={failedChecks?.includes("phone") || undefined}
              aria-describedby={errors.length ? "jobs-errors" : undefined}
              enterKeyHint="next"
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
                event.preventDefault();
                goToStep("files");
              }}
              inputMode="tel"
              autoComplete="tel-national"
              placeholder={t.steps.phone.placeholder}
              value={phone}
              onFocus={markStarted}
              onChange={(e) => setPhone(e.target.value)}
              disabled={sending}
              className={cn(fieldClass, "form-scroll-target mt-3 max-w-xs font-data")}
            />
            <button type="button" className="text-link mt-5 min-h-11" disabled={sending} onClick={() => goToStep("files")}>{t.next}</button>
          </div>
        </li>

        <li>
          <span className="jobs-step-number" aria-hidden="true">03</span>
          <div>
            <h2 data-form-step="files" tabIndex={-1} className="jobs-step-title form-scroll-target">{t.steps.files.title}</h2>
            <p className="jobs-step-hint">{t.steps.files.hint}</p>
            <p className="jobs-step-warning">{t.steps.files.warning}</p>
            <JobFilePicker locale={locale} picker={filePicker} disabled={sending} />
            <button type="button" className="text-link mt-5 min-h-11" disabled={sending} onClick={() => goToStep("consent")}>{t.next}</button>
          </div>
        </li>
      </ol>

      <div className="jobs-consent">
        <label data-form-step="consent" tabIndex={-1} className="jobs-check form-scroll-target">
          <input type="checkbox" name="agree" aria-invalid={failedChecks?.includes("agree") || undefined} aria-describedby={errors.length ? "jobs-errors" : undefined} checked={agreed} onChange={(e) => setAgreed(e.target.checked)} disabled={sending} />
          <span>
            {t.steps.phone.agree}{" "}
            <a href={localePath("/privacy", "en-IN")} target="_blank" rel="noopener" className="underline underline-offset-4">
              {t.steps.phone.privacyLink}
            </a>
          </span>
        </label>
      </div>

      <div ref={turnstileBox} className="mt-5" />

      {errors.length > 0 && (
        <ul ref={errorSummary} id="jobs-errors" tabIndex={-1} className="jobs-errors form-scroll-target" role="alert">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-5">
        <button type="submit" className="jobs-submit" disabled={sending || voice.state === "recording"}>
          {sending && <Loader2 className="animate-spin" size={18} aria-hidden="true" />}
          {sending ? t.sending : t.submit}
        </button>
        {sending && (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {phase.message}
          </p>
        )}
      </div>
      <p className="jobs-fine mt-4">{noFee}</p>
    </form>
  );
}
