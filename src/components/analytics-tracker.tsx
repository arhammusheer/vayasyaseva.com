"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { FORM_DONE_EVENT, trackAbandonedDraft, trackAnalyticsEvent, trackPageView, type AnalyticsParams } from "@/lib/analytics";
import { safeAnalyticsPath } from "@/lib/analytics-pages";
import { FALLBACK_LOCALE, splitLocalePath } from "@/lib/i18n";

/**
 * Automatic interaction events, sent through trackAnalyticsEvent: Umami for
 * every visitor, plus Google Analytics and Clarity with "Allow All". Every
 * value is a fixed label, a known page path or a number. No link text and no
 * full external URLs. The one exception is draftOf: with "Allow All", what an
 * unfinished form held goes to Umami only (trackAbandonedDraft).
 */

const SCROLL_MARKS = [25, 50, 75, 90];
const TIME_MARKS = [10, 30, 60, 180];
const MAX_ERRORS = 3;
const CAMPAIGN_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

export function pageType(path: string) {
  if (path === "/") return "home";
  if (path === "/jobs") return "jobs";
  if (path.startsWith("/jobs/")) return "job_role";
  if (path === "/services") return "services";
  if (path.startsWith("/services/")) return "service";
  if (path === "/haridwar-sidcul") return "local";
  if (path === "/contact") return "contact";
  if (path === "/privacy" || path === "/terms") return "legal";
  return safeAnalyticsPath(path) === "/other" ? "other" : "company";
}

/** The page path for analytics, keeping only campaign tags (utm_*). */
function pageViewUrl(pathname: string) {
  const params = new URLSearchParams(window.location.search);
  const kept = new URLSearchParams();
  for (const key of CAMPAIGN_PARAMS) {
    const value = params.get(key);
    if (value) kept.set(key, value.slice(0, 100));
  }
  const query = kept.toString();
  return `${safeAnalyticsPath(pathname)}${query ? `?${query}` : ""}`;
}

function zoneOf(el: Element) {
  if (el.closest(".language-choices")) return "picker";
  if (el.closest("[role=dialog]")) return "mobile_menu";
  if (el.closest("header")) return "header";
  if (el.closest("footer")) return "footer";
  if (el.closest("[aria-label='Privacy choices']")) return "privacy_banner";
  return "main";
}

function linkEvent(link: HTMLAnchorElement, page: string): [string, AnalyticsParams] | null {
  const href = link.getAttribute("href") ?? "";
  const zone = zoneOf(link);
  if (href.startsWith("tel:")) return ["contact_click", { contact_method: "phone", zone, page }];
  if (href.startsWith("mailto:")) return ["contact_click", { contact_method: "email", zone, page }];
  let url: URL;
  try {
    url = new URL(link.href);
  } catch {
    return null;
  }
  if (/(^|\.)(wa\.me|whatsapp\.com)$/.test(url.hostname)) return ["contact_click", { contact_method: "whatsapp", zone, page }];
  if (url.origin !== window.location.origin) return ["outbound_click", { domain: url.hostname, zone, page }];
  const file = /\/([^/]+\.[a-z0-9]+)$/i.exec(url.pathname)?.[1];
  if (file) return ["file_download", { file: file.slice(0, 80), zone, page }];
  if (link.closest(".header-lang")) return ["language_switch", { to: link.getAttribute("hreflang") ?? "unknown", page }];
  const { path } = splitLocalePath(url.pathname);
  if (path === "/contact") {
    return ["contact_intent", { intent_type: url.searchParams.get("type") === "assessment" ? "assessment" : "general", zone, page }];
  }
  if (path === "/jobs" || path.startsWith("/jobs/")) return ["jobs_intent", { target: safeAnalyticsPath(path), zone, page }];
  if (link.hash && url.pathname === window.location.pathname) return ["anchor_click", { anchor: link.hash.slice(1, 40), zone, page }];
  return ["nav_click", { target: safeAnalyticsPath(path), zone, page }];
}

/** Forms opt in with data-analytics-form="<name>"; fields report by name, never value. */
function fieldOf(el: EventTarget | null) {
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) return null;
  const form = el.closest<HTMLElement>("[data-analytics-form]")?.dataset.analyticsForm;
  if (!form) return null;
  const field = (el.name || el.id || el.type || "field").replace(/[^a-z0-9_-]/gi, "").slice(0, 40);
  return { form, field };
}

const DRAFT_MAX = 500; // Umami stores event data strings up to 500 characters

/**
 * The typed contents of an unfinished form, by field name. Files and voice
 * notes are never read: the form marks only their count and length
 * (data-draft-* attributes on the form element).
 */
function draftOf(form: string): AnalyticsParams | null {
  const el = document.querySelector<HTMLElement>(`[data-analytics-form="${form}"]`);
  if (!el) return null;
  const draft: AnalyticsParams = {};
  for (const input of el.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("input, textarea, select")) {
    if (input instanceof HTMLInputElement && ["file", "password", "hidden"].includes(input.type)) continue;
    const target = fieldOf(input);
    if (!target) continue;
    const value = input instanceof HTMLInputElement && input.type === "checkbox" ? (input.checked ? "yes" : "") : input.value.trim();
    if (value) draft[target.field] = value.slice(0, DRAFT_MAX);
  }
  for (const [key, value] of Object.entries(el.dataset)) {
    if (key.startsWith("draft") && value) draft[key.slice(5).replace(/^./, (c) => c.toLowerCase())] = value;
  }
  return draft;
}

// Stable reference and one report per metric id: useReportWebVitals
// re-subscribes when given a new function, which repeats reports.
const reportedVitals = new Set<string>();
function reportWebVital(metric: Parameters<Parameters<typeof useReportWebVitals>[0]>[0]) {
  if (reportedVitals.has(metric.id)) return;
  reportedVitals.add(metric.id);
  trackAnalyticsEvent("web_vital", {
    metric: metric.name,
    rating: metric.rating,
    value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
    page: pageType(splitLocalePath(window.location.pathname).path),
  });
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  useReportWebVitals(reportWebVital);

  // Everything below is per page view: thresholds and counters reset on navigation.
  useEffect(() => {
    const page = pageType(splitLocalePath(pathname).path);
    trackPageView(pageViewUrl(pathname));

    const fired = new Set<string>();
    const once = (key: string, name: string, params: AnalyticsParams) => {
      if (fired.has(key)) return;
      fired.add(key);
      trackAnalyticsEvent(name, params);
    };

    // Clicks: links by kind and page area.
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (link) {
        const tracked = linkEvent(link, page);
        if (tracked) trackAnalyticsEvent(...tracked);
        return;
      }
      const button = event.target.closest<HTMLButtonElement>("button[data-analytics]");
      if (button?.dataset.analytics) trackAnalyticsEvent("button_click", { button: button.dataset.analytics, page });
    };

    // Scroll depth.
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const doc = document.documentElement;
        const depth = ((window.scrollY + window.innerHeight) / Math.max(doc.scrollHeight, 1)) * 100;
        for (const mark of SCROLL_MARKS) {
          if (depth >= mark) once(`scroll:${mark}`, "scroll_depth", { percent: mark, page });
        }
      });
    };

    // Visible time on the page.
    let visible = 0;
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      visible += 1;
      for (const mark of TIME_MARKS) {
        if (visible === mark) once(`time:${mark}`, "engaged_time", { seconds: mark, page });
      }
    }, 1000);

    // FAQ answers opened (<details> in FaqSection).
    const onToggle = (event: Event) => {
      const details = event.target;
      if (!(details instanceof HTMLDetailsElement) || !details.open) return;
      const question = details.querySelector("summary")?.textContent?.trim().slice(0, 100);
      if (question) once(`faq:${question}`, "faq_open", { question, page });
    };

    // Form steps: first focus per field, and abandonment when the page is left
    // (not when the tab is hidden: people switch apps mid-form and come back).
    const touched = new Map<string, string>();
    const onFocus = (event: FocusEvent) => {
      const target = fieldOf(event.target);
      if (!target) return;
      touched.set(target.form, target.field);
      once(`field:${target.form}:${target.field}`, "form_field", { ...target, page });
    };
    const onDone = (event: Event) => touched.delete((event as CustomEvent<string>).detail);
    const onLeave = () => {
      for (const [form, last_field] of touched) {
        if (fired.has(`abandon:${form}`)) continue;
        once(`abandon:${form}`, "form_abandon", { form, last_field, page });
        const draft = draftOf(form);
        if (draft && Object.keys(draft).length) trackAbandonedDraft({ form, last_field, page, ...draft });
      }
    };

    // Copying text (what was copied is not sent).
    const onCopy = (event: ClipboardEvent) => {
      if (event.target instanceof Element) once(`copy:${zoneOf(event.target)}`, "text_copy", { zone: zoneOf(event.target), page });
    };

    // Script errors, by kind only.
    let errors = 0;
    const onError = (kind: string, name: string) => {
      if (errors++ < MAX_ERRORS) trackAnalyticsEvent("js_error", { kind, name: name.slice(0, 40), page });
    };
    const onWindowError = (event: ErrorEvent) => onError("error", event.error?.name ?? "Error");
    const onRejection = (event: PromiseRejectionEvent) => onError("rejection", event.reason?.name ?? "Rejection");

    document.addEventListener("click", onClick, true);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("toggle", onToggle, true);
    document.addEventListener("focusin", onFocus);
    window.addEventListener(FORM_DONE_EVENT, onDone);
    window.addEventListener("pagehide", onLeave);
    document.addEventListener("copy", onCopy);
    window.addEventListener("error", onWindowError);
    window.addEventListener("unhandledrejection", onRejection);
    onScroll();
    return () => {
      onLeave();
      clearInterval(timer);
      cancelAnimationFrame(frame);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("toggle", onToggle, true);
      document.removeEventListener("focusin", onFocus);
      window.removeEventListener(FORM_DONE_EVENT, onDone);
      window.removeEventListener("pagehide", onLeave);
      document.removeEventListener("copy", onCopy);
      window.removeEventListener("error", onWindowError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [pathname]);

  return null;
}

/** Page language for session data and Clarity tags. */
export function pageLocale(pathname: string) {
  return splitLocalePath(pathname).locale ?? FALLBACK_LOCALE;
}
