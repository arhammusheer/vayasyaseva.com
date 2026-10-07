/** Call after React commits the next step, feedback or replacement form. */
export function revealFormTarget(
  target: HTMLElement | null,
  { focus = target, instant = false }: { focus?: HTMLElement | null; instant?: boolean } = {},
) {
  const frame = requestAnimationFrame(() => {
    if (!target?.isConnected) return;
    // Focus headings without opening the mobile keyboard or triggering a
    // second browser scroll. CSS leaves room for the persistent header.
    focus?.focus({ preventScroll: true });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: instant || reduce ? "instant" : "smooth", block: "start" });
  });
  return () => cancelAnimationFrame(frame);
}
