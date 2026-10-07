"use client";

import { useCallback, useEffect, useState } from "react";
import { formPage, trackAnalyticsEvent } from "./analytics";
import { TURNSTILE_SITE_KEY } from "./turnstile";

/** Own the widget with its DOM container, including replacement forms. */
export function useTurnstile(action: string, form: string, language = "en") {
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [widget, setWidget] = useState<string | null>(null);
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    if (!box || !ready || !window.turnstile) return;
    let active = true;
    const id = window.turnstile.render(box, {
      sitekey: TURNSTILE_SITE_KEY, action, language, appearance: "interaction-only",
      callback: (value: string) => { if (active) setToken(value); },
      "expired-callback": () => { if (active) setToken(null); },
      "error-callback": () => { if (active) setToken(null); },
      "before-interactive-callback": () => trackAnalyticsEvent("verification_shown", { form, page: formPage() }),
    });
    // The public reset handler uses state so callers never read refs during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWidget(id);
    return () => {
      active = false;
      window.turnstile?.remove(id);
      setWidget(null);
      setToken(null);
    };
  }, [box, ready, action, form, language]);

  const reset = useCallback(() => {
    setToken(null);
    if (widget) window.turnstile?.reset(widget);
  }, [widget]);
  return { box: setBox, onReady, token, reset };
}
