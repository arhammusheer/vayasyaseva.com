"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { FORM_DONE_EVENT, trackAbandonedDraft, trackAnalyticsEvent, trackPageView, type AnalyticsParams } from "@/lib/analytics";
import { safeAnalyticsPath } from "@/lib/analytics-pages";
import { createFormWatch, createRageDetector, describeTarget, draftOf, fieldOf, isDeadClick, statusOf } from "@/lib/form-analytics";
import { FALLBACK_LOCALE, splitLocalePath } from "@/lib/i18n";
import { rememberAdClick } from "@/lib/ad-click";

/**
 * Automatic interaction events, sent through trackAnalyticsEvent: Umami for
 * every visitor, plus Google Analytics with "Allow All". Page speed
 * comes from Umami's own performance tracking (data-performance on the tracker). Every
 * value is a fixed label, a known page path or a number. No link text and no
 * full external URLs. The one exception is draftOf: with "Allow All", what an
 * unfinished form held goes to Umami only (trackAbandonedDraft).
 */

// Half-way and the end: enough to see whether the lower page is read.
const SCROLL_MARKS = [50, 90];
const TIME_MARKS = [10, 30, 60, 180];
const MAX_ERRORS = 3;
const MAX_CLICK_SIGNALS = 5; // rage and dead clicks, each, per page view
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

export function AnalyticsTracker() {
  const pathname = usePathname();

  // Everything below is per page view: thresholds and counters reset on navigation.
  useEffect(() => {
    const page = pageType(splitLocalePath(pathname).path);
    trackPageView(pageViewUrl(pathname));
    rememberAdClick();

    const fired = new Set<string>();
    const once = (key: string, name: string, params: AnalyticsParams) => {
      if (fired.has(key)) return;
      fired.add(key);
      trackAnalyticsEvent(name, params);
    };

    // Clicks: links by kind and page area; rage clicks (three quick clicks in
    // one spot) and dead clicks (on something that looks clickable but isn't).
    const rage = createRageDetector();
    let rageClicks = 0;
    let deadClicks = 0;
    const onClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const zone = zoneOf(event.target);
      if (rage(event.clientX, event.clientY) && rageClicks++ < MAX_CLICK_SIGNALS) {
        trackAnalyticsEvent("rage_click", { target: describeTarget(event.target), zone, page });
      }
      if (isDeadClick(event.target) && deadClicks++ < MAX_CLICK_SIGNALS) {
        trackAnalyticsEvent("dead_click", { target: describeTarget(event.target), zone, page });
      }
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
    // Time in each field, corrections and pastes: counts only (form-analytics).
    const touched = new Map<string, string>();
    const watch = createFormWatch();
    const onFocus = (event: FocusEvent) => {
      const target = fieldOf(event.target);
      if (!target) return;
      touched.set(target.form, target.field);
      watch.focus(target.form, target.field);
      once(`field:${target.form}:${target.field}`, "form_field", { ...target, page });
    };
    const onBlur = (event: FocusEvent) => {
      const target = fieldOf(event.target);
      if (target) watch.blur(target.form);
    };
    const onInput = (event: Event) => {
      const target = fieldOf(event.target);
      if (target && event instanceof InputEvent && event.inputType.startsWith("delete")) watch.correction(target.form, target.field);
    };
    const onPaste = (event: ClipboardEvent) => {
      const target = fieldOf(event.target);
      if (target) watch.paste(target.form, target.field);
    };
    const onDone = (event: Event) => {
      const form = (event as CustomEvent<string>).detail;
      // The same timing for forms that were sent, to compare with abandoned ones.
      trackAnalyticsEvent("form_complete", { form, page, ...watch.stats(form) });
      watch.reset(form);
      touched.delete(form);
    };
    const onLeave = () => {
      for (const [form, last_field] of touched) {
        if (fired.has(`abandon:${form}`)) continue;
        once(`abandon:${form}`, "form_abandon", { form, last_field, page, ...statusOf(form), ...watch.stats(form) });
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
    document.addEventListener("focusout", onBlur);
    document.addEventListener("input", onInput, true);
    document.addEventListener("paste", onPaste, true);
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
      document.removeEventListener("focusout", onBlur);
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("paste", onPaste, true);
      window.removeEventListener(FORM_DONE_EVENT, onDone);
      window.removeEventListener("pagehide", onLeave);
      document.removeEventListener("copy", onCopy);
      window.removeEventListener("error", onWindowError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [pathname]);

  return null;
}

/** Page language for session data. */
export function pageLocale(pathname: string) {
  return splitLocalePath(pathname).locale ?? FALLBACK_LOCALE;
}
