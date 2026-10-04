import type { AnalyticsParams } from "@/lib/analytics";

/**
 * Reading tracked forms for analytics (src/components/analytics-tracker.tsx).
 * Forms opt in with data-analytics-form="<name>". statusOf reports field
 * names and flags only; draftOf reads typed values and is sent with
 * "Allow All" only (trackAbandonedDraft).
 */

/** Forms opt in with data-analytics-form="<name>"; fields report by name, never value. */
export function fieldOf(el: EventTarget | null) {
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) return null;
  const form = el.closest<HTMLElement>("[data-analytics-form]")?.dataset.analyticsForm;
  if (!form) return null;
  const field = (el.name || el.id || el.type || "field").replace(/[^a-z0-9_-]/gi, "").slice(0, 40);
  return { form, field };
}

const DRAFT_MAX = 500; // Umami stores event data strings up to 500 characters

type FormInput = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** A tracked form's visible fields with what each holds (files and the honeypot skipped). */
function formFields(form: string) {
  const el = document.querySelector<HTMLElement>(`[data-analytics-form="${form}"]`);
  if (!el) return null;
  const fields: { field: string; value: string; input: FormInput }[] = [];
  for (const input of el.querySelectorAll<FormInput>("input, textarea, select")) {
    if (input instanceof HTMLInputElement && ["file", "password", "hidden"].includes(input.type)) continue;
    if (input.closest("[aria-hidden='true']")) continue;
    const target = fieldOf(input);
    if (!target) continue;
    const value = input instanceof HTMLInputElement && input.type === "checkbox" ? (input.checked ? "yes" : "") : input.value.trim();
    fields.push({ field: target.field, value, input });
  }
  return { el, fields };
}

/**
 * Where an unfinished form stood, for every visitor: which fields had
 * something in them and how many characters, which were empty, where the
 * cursor was, and which checks failed if Send was pressed. Field names,
 * flags and lengths only, never what was typed. The form marks voice notes, files and failed checks in data-*
 * attributes (data-draft-*, data-form-errors).
 */
export function statusOf(form: string): AnalyticsParams {
  const found = formFields(form);
  if (!found) return {};
  const { el, fields } = found;
  const filled = fields.filter((f) => f.value).map((f) => f.field);
  const empty = fields.filter((f) => !f.value).map((f) => f.field);
  if (el.dataset.draftVoiceSeconds) filled.push("voice");
  if (el.dataset.draftFiles) filled.push("files");
  const focused = fields.find((f) => f.input === document.activeElement)?.field;
  // How many digits each phone field holds, never the number itself.
  const digits = fields
    .filter((f) => f.input instanceof HTMLInputElement && f.input.type === "tel")
    .map((f) => `${f.field}:${f.value.replace(/\D/g, "").length}`);
  // How much was typed in each text field (phone fields count digits above).
  const chars = fields
    .filter((f) => f.value && !(f.input instanceof HTMLInputElement && ["tel", "checkbox", "radio"].includes(f.input.type)) && !(f.input instanceof HTMLSelectElement))
    .map((f) => `${f.field}:${f.value.length}`);
  return {
    ...(digits.length && { phone_digits: digits.join(",") }),
    ...(chars.length && { chars: chars.join(",").slice(0, DRAFT_MAX) }),
    focused_field: focused ?? "none",
    filled: filled.join(",") || "none",
    empty: empty.join(",") || "none",
    errors: el.dataset.formErrors || "none",
    tried_send: el.dataset.formErrors !== undefined ? "yes" : "no",
  };
}

/**
 * The typed contents of an unfinished form, by field name ("Allow All" only,
 * see trackAbandonedDraft). Files and voice notes are never read: the form
 * marks only their count and length.
 */
export function draftOf(form: string): AnalyticsParams | null {
  const found = formFields(form);
  if (!found) return null;
  const draft: AnalyticsParams = {};
  for (const { field, value } of found.fields) if (value) draft[field] = value.slice(0, DRAFT_MAX);
  for (const [key, value] of Object.entries(found.el.dataset)) {
    if (key.startsWith("draft") && value) draft[key.slice(5).replace(/^./, (c) => c.toLowerCase())] = value;
  }
  return draft;
}


/** "a:12,b:3" for a count per field, capped to fit an Umami property. */
const perField = (counts: Map<string, number>) =>
  [...counts].map(([field, n]) => `${field}:${n}`).join(",").slice(0, DRAFT_MAX) || "none";

/**
 * Behaviour inside tracked forms, per page view: seconds spent in each field,
 * corrections (deletions) and pastes per field, and time since the first
 * field was used. Counts only, never content.
 */
export function createFormWatch() {
  type State = { start: number; seconds: Map<string, number>; corrections: Map<string, number>; pastes: Map<string, number>; focus?: { field: string; at: number } };
  const forms = new Map<string, State>();
  const state = (form: string, now: number) => {
    let s = forms.get(form);
    if (!s) forms.set(form, (s = { start: now, seconds: new Map(), corrections: new Map(), pastes: new Map() }));
    return s;
  };
  const bump = (counts: Map<string, number>, field: string, by = 1) => counts.set(field, (counts.get(field) ?? 0) + by);
  const settle = (s: State, now: number) => {
    if (!s.focus) return;
    bump(s.seconds, s.focus.field, (now - s.focus.at) / 1000);
    s.focus = undefined;
  };

  return {
    focus(form: string, field: string, now = Date.now()) {
      const s = state(form, now);
      settle(s, now);
      s.focus = { field, at: now };
    },
    blur(form: string, now = Date.now()) {
      const s = forms.get(form);
      if (s) settle(s, now);
    },
    correction(form: string, field: string) {
      bump(state(form, Date.now()).corrections, field);
    },
    paste(form: string, field: string) {
      bump(state(form, Date.now()).pastes, field);
    },
    /** Timing for the abandonment or completion event; ends the field in focus. */
    stats(form: string, now = Date.now()): AnalyticsParams {
      const s = forms.get(form);
      if (!s) return {};
      settle(s, now);
      const seconds = new Map([...s.seconds].map(([f, n]) => [f, Math.round(n)]));
      return {
        form_seconds: Math.round((now - s.start) / 1000),
        field_seconds: perField(seconds),
        corrections: perField(s.corrections),
        pastes: perField(s.pastes),
      };
    },
    reset(form: string) {
      forms.delete(form);
    },
  };
}

const INTERACTIVE =
  "a[href], button, input, select, textarea, label, summary, details, video, audio, [role=button], [role=link], [role=tab], [role=checkbox], [role=switch], [tabindex]:not([tabindex='-1']), [contenteditable=true]";

/** A short, stable name for a clicked element: never its text. */
export function describeTarget(el: Element) {
  const named = el.closest<HTMLElement>("[data-analytics], [id]");
  const label = named?.dataset.analytics || named?.id;
  const tag = el.tagName.toLowerCase();
  const cls = typeof el.className === "string" ? el.className.trim().split(/\s+/)[0] : "";
  return (label ? `${label}>${tag}` : cls ? `${tag}.${cls}` : tag).slice(0, 60);
}

/** A click on something that looks clickable (pointer cursor) but isn't. */
export function isDeadClick(el: Element) {
  if (el.closest(INTERACTIVE)) return false;
  return getComputedStyle(el).cursor === "pointer";
}

/**
 * Rage clicks: three or more clicks within a second, close together. Returns
 * true on the click that crosses the threshold.
 */
export function createRageDetector() {
  let clicks: { x: number; y: number; t: number }[] = [];
  return (x: number, y: number, t = Date.now()) => {
    clicks = clicks.filter((c) => t - c.t < 1000 && Math.hypot(c.x - x, c.y - y) < 30);
    clicks.push({ x, y, t });
    return clicks.length === 3;
  };
}
