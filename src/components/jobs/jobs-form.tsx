"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, ImageIcon, Loader2, Mic, RotateCcw, Square, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { jobsCopy } from "@/content/pages/jobs";
import { localePath, type Locale } from "@/lib/i18n";
import {
  ATTACHMENT_MIME,
  INTAKE_LIMITS,
  normaliseIndianMobile,
  type AttachmentKind,
  type IntakeSource,
  type JobRole,
} from "@/lib/talent-intake/rules";
import type { JobsStartResponse } from "@/lib/talent-intake/contract";

/** Public site key; Cloudflare's always-pass test key outside production. */
const TURNSTILE_SITE_KEY =
  process.env.NODE_ENV === "production" ? "0x4AAAAAAFEAUg5yU699cqnZ" : "1x00000000000000000000AA";
/** Intake source per page. These are stored values shared with n8n and its database; don't rename them here alone. */
const SOURCE: Record<Locale, IntakeSource> = { "en-IN": "web_en", "hi-IN": "web_hi", "hi-Latn-IN": "web_hinglish" };
const MAX_FILES = INTAKE_LIMITS.maxAttachments - 1; // one slot is the voice note
const RECORDER_TYPES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
const EXTENSION_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};
const FILE_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf,.pdf,.doc,.docx,application/msword";

type Turnstile = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

interface PickedFile {
  file: File;
  kind: AttachmentKind;
  mime: string;
}

type Voice =
  | { state: "idle" }
  | { state: "recording"; seconds: number }
  | { state: "recorded"; blob: Blob; url: string; seconds: number };

type Phase =
  | { name: "form" }
  | { name: "sending"; message: string }
  | { name: "done"; ref: string };

const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

function classify(file: File): PickedFile | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mime = file.type || EXTENSION_TYPES[ext] || "";
  for (const kind of ["image", "document"] as const) {
    if (ATTACHMENT_MIME[kind].test(mime)) return { file, kind, mime };
  }
  return null;
}

/** PUT with progress (fetch can't report upload progress), three attempts. */
async function upload(url: string, headers: Record<string, string>, body: Blob, onProgress: (p: number) => void) {
  for (let attempt = 1; ; attempt++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url);
        for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
        xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`upload ${xhr.status}`)));
        xhr.onerror = () => reject(new Error("network"));
        xhr.send(body);
      });
      return;
    } catch (error) {
      if (attempt >= 3) throw error;
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }
}

/** `role`: set on a role page (/jobs/<slug>) so the submission is tagged with it. */
export function JobsForm({ locale, role = null }: { locale: Locale; role?: JobRole | null }) {
  const t = jobsCopy[locale].form;
  const noFee = jobsCopy[locale].noFee;
  const [voice, setVoice] = useState<Voice>({ state: "idle" });
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [phone, setPhone] = useState("");
  const [adult, setAdult] = useState(false);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>({ name: "form" });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const turnstileBox = useRef<HTMLDivElement>(null);
  const turnstileId = useRef<string | null>(null);
  const doneHeading = useRef<HTMLHeadingElement>(null);
  const trackedStart = useRef(false);

  const markStarted = () => {
    if (trackedStart.current) return;
    trackedStart.current = true;
    trackAnalyticsEvent("job_form_start", { locale });
  };

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
      setVoiceError(t.record.unsupported);
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setVoiceError(t.record.noMic);
      return;
    }
    const mimeType = RECORDER_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    let seconds = 0;
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      if (timer.current) clearInterval(timer.current);
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunks, { type: rec.mimeType || mimeType || "audio/webm" });
      setVoice({ state: "recorded", blob, url: URL.createObjectURL(blob), seconds });
    };
    recorder.current = rec;
    rec.start(1000);
    setVoice({ state: "recording", seconds: 0 });
    timer.current = setInterval(() => {
      seconds += 1;
      setVoice({ state: "recording", seconds });
      if (seconds >= INTAKE_LIMITS.maxAudioSeconds) rec.stop();
    }, 1000);
  }

  function discardVoice() {
    if (voice.state === "recorded") URL.revokeObjectURL(voice.url);
    setVoice({ state: "idle" });
  }

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
      recorder.current?.stream.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  // --- Files ---------------------------------------------------------------
  function addFiles(list: FileList | null) {
    markStarted();
    setFileError(null);
    if (!list) return;
    const next = [...files];
    const problems: string[] = [];
    for (const file of Array.from(list)) {
      const picked = classify(file);
      if (!picked) problems.push(`${file.name} ${t.files.wrongType}`);
      else if (file.size > INTAKE_LIMITS.maxBytes[picked.kind]) problems.push(`${file.name} ${t.files.tooLarge}`);
      else if (next.length >= MAX_FILES) problems.push(t.files.tooMany);
      else next.push(picked);
    }
    setFiles(next);
    if (problems.length) setFileError([...new Set(problems)].join(" "));
  }

  // --- Submit ----------------------------------------------------------------
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const problems: string[] = [];
    const hasVoice = voice.state === "recorded";
    if (!hasVoice && files.length === 0 && !text.trim()) problems.push(t.errors.empty);
    if (!normaliseIndianMobile(phone)) problems.push(t.errors.phone);
    if (!adult) problems.push(t.errors.adult);
    if (!consent) problems.push(t.errors.consent);
    if (!turnstileToken) problems.push(t.errors.verification);
    setErrors(problems);
    if (problems.length) {
      trackAnalyticsEvent("job_form_error", { locale, reason: "validation" });
      return;
    }

    const bodies: Blob[] = [...(hasVoice ? [voice.blob] : []), ...files.map((f) => f.file)];
    const declared = [
      ...(hasVoice ? [{ kind: "audio" as const, mime: voice.blob.type, size: voice.blob.size, name: null }] : []),
      ...files.map((f) => ({ kind: f.kind, mime: f.mime, size: f.file.size, name: f.file.name.slice(0, 200) })),
    ];

    setPhase({ name: "sending", message: t.sending });
    try {
      const start = await fetch("/api/jobs/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: SOURCE[locale], role, turnstileToken, files: declared }),
      });
      resetTurnstile(); // tokens are single-use
      if (start.status === 403) throw new Error("verification");
      if (!start.ok) throw new Error("server");
      const started = (await start.json()) as JobsStartResponse;

      for (const [i, target] of started.uploads.entries()) {
        await upload(target.url, target.headers, bodies[i], (percent) =>
          setPhase({ name: "sending", message: t.sendingFile(i + 1, started.uploads.length, percent) }),
        );
      }

      setPhase({ name: "sending", message: t.sending });
      const done = await fetch("/api/jobs/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ticket: started.ticket, phone, adult: true, consent: true, text: text.trim() || null }),
      });
      if (!done.ok) throw new Error("server");
      setPhase({ name: "done", ref: started.ref });
      trackAnalyticsEvent("job_form_submit", { locale, voice: hasVoice ? "yes" : "no" });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "server";
      const key = reason === "verification" ? "verification" : reason === "server" ? "server" : "network";
      setErrors([t.errors[key]]);
      setPhase({ name: "form" });
      trackAnalyticsEvent("job_form_error", { locale, reason: key });
    }
  }

  useEffect(() => {
    if (phase.name === "done") doneHeading.current?.focus();
  }, [phase.name]);

  function reset() {
    discardVoice();
    setFiles([]);
    setText("");
    setAdult(false);
    setConsent(false);
    setErrors([]);
    setPhase({ name: "form" });
  }

  // --- Render ------------------------------------------------------------------
  if (phase.name === "done") {
    return (
      <div role="status" className="jobs-done">
        <h2 ref={doneHeading} tabIndex={-1} className="text-4xl font-medium sm:text-5xl">
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
    <form data-clarity-mask="true" onSubmit={submit} noValidate className="jobs-form" aria-busy={sending}>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={renderTurnstile} />

      {/* Three tiers. Tier 01 holds the voice note with typing as its
          alternative, so one tier is "tell us" however suits; the number and
          documents follow. Order and weight say what matters. */}
      <ol className="jobs-steps">
        <li>
          <span className="jobs-step-number" aria-hidden="true">01</span>
          <div>
            <h2 className="jobs-step-title">{t.steps.record.title}</h2>
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
              rows={3}
              maxLength={INTAKE_LIMITS.maxTextLength}
              placeholder={t.steps.text.placeholder}
              value={text}
              onFocus={markStarted}
              onChange={(e) => setText(e.target.value)}
              disabled={sending}
              className={cn(fieldClass, "mt-2 h-auto min-h-20 resize-y py-3 leading-relaxed")}
            />
          </div>
        </li>

        <li>
          <span className="jobs-step-number" aria-hidden="true">02</span>
          <div>
            <label htmlFor="jobs-phone" className="jobs-step-title block">{t.steps.phone.title}</label>
            <Input
              id="jobs-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder={t.steps.phone.placeholder}
              value={phone}
              onFocus={markStarted}
              onChange={(e) => setPhone(e.target.value)}
              disabled={sending}
              className={cn(fieldClass, "mt-3 max-w-xs font-data")}
            />
          </div>
        </li>

        <li>
          <span className="jobs-step-number" aria-hidden="true">03</span>
          <div>
            <h2 className="jobs-step-title">{t.steps.files.title}</h2>
            <p className="jobs-step-hint">{t.steps.files.hint}</p>
            <p className="jobs-step-warning">{t.steps.files.warning}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <label className="jobs-file-button">
                <ImageIcon size={18} aria-hidden="true" /> {t.files.camera}
                <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" disabled={sending} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              </label>
              <label className="jobs-file-button">
                <FileText size={18} aria-hidden="true" /> {t.files.choose}
                <input type="file" accept={FILE_ACCEPT} multiple className="sr-only" disabled={sending} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
              </label>
            </div>
            {files.length > 0 && (
              <ul className="jobs-file-list">
                {files.map((f, i) => (
                  <li key={`${f.file.name}-${i}`}>
                    <span className="truncate">
                      {f.kind === "image" ? t.labels.photo : t.labels.document} · {f.file.name}
                    </span>
                    <button type="button" aria-label={`${t.files.remove} ${f.file.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))} disabled={sending}>
                      <X size={16} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {fileError && <p className="jobs-error">{fileError}</p>}
          </div>
        </li>
      </ol>

      <div className="jobs-consent">
        <label className="jobs-check">
          <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} disabled={sending} />
          <span>{t.steps.phone.adult}</span>
        </label>
        <label className="jobs-check">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} disabled={sending} />
          <span>
            {t.steps.phone.consent}{" "}
            <a href={localePath("/privacy", "en-IN")} target="_blank" rel="noopener" className="underline underline-offset-4">
              {t.steps.phone.privacyLink}
            </a>
          </span>
        </label>
      </div>

      <div ref={turnstileBox} className="mt-5" />

      {errors.length > 0 && (
        <ul className="jobs-errors" role="alert">
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
