/**
 * The gateway's route tables (pure), kept apart from the catalogue so that
 * production routing never depends on catalogue lookups; tests check the two
 * agree.
 */

/** Site events that map to Meta's standard events (Meta Pixel, Allow All only, no parameters). */
export const META_EVENTS: Readonly<Record<string, string>> = {
  job_form_submit: "SubmitApplication",
  generate_lead: "Lead",
  contact_click: "Contact",
};

/** Events that complete a tracked form, so it doesn't count as abandoned (AnalyticsTracker). */
export const FORM_DONE: Readonly<Record<string, string>> = { generate_lead: "contact", job_form_submit: "jobs", quick_apply_submit: "quick" };

/** The window event that carries FORM_DONE's form name. */
export const FORM_DONE_EVENT = "vayasya:form-done";
