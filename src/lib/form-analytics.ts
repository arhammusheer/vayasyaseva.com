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
 * something in them, which were empty, where the cursor was, and which
 * checks failed if Send was pressed. Field names and flags only, never what
 * was typed. The form marks voice notes, files and failed checks in data-*
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
  return {
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

