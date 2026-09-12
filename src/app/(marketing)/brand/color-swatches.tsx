"use client";
import { useEffect, useState } from "react";
import { palette } from "@/content/brand";
import { cn } from "@/lib/utils";

/** Palette strips. Click any swatch to copy its hex. */
export function ColorSwatches() {
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
    } catch {
      // Older browsers or non-secure contexts: fall back to a hidden selection.
      const el = document.createElement("textarea");
      el.value = hex;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(hex);
  };

  return (
    <div className="space-y-9">
      {palette.map((scale) => (
        <div key={scale.id}>
          <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h3 className="text-xl font-medium">{scale.title}</h3>
            <p className="max-w-2xl text-sm text-muted-foreground">{scale.role}</p>
          </div>
          <ul
            className="grid gap-1 [grid-template-columns:repeat(auto-fit,minmax(3.5rem,1fr))]"
            aria-label={`${scale.title} scale`}
          >
            {scale.swatches.map((s) => {
              const light = luminance(s.hex) > 0.5;
              const isCopied = copied === s.hex;
              return (
                <li key={s.hex}>
                  <button
                    type="button"
                    onClick={() => copy(s.hex)}
                    title={`Copy ${s.hex}`}
                    aria-label={`${s.name}, ${s.hex}. Copy to clipboard`}
                    style={{ background: s.hex }}
                    className={cn(
                      "flex h-16 w-full flex-col justify-end rounded-md border p-1.5 text-left transition-transform hover:-translate-y-px",
                      light ? "border-neutral-200 text-neutral-900" : "border-transparent text-white",
                    )}
                  >
                    <span className="font-data text-[10px] leading-tight opacity-80">
                      {s.name.split(" ").pop()}
                    </span>
                    <span className="font-data text-[11px] leading-tight">
                      {isCopied ? "Copied" : s.hex.slice(1)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <p
        role="status"
        aria-live="polite"
        className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-neutral-900 px-4 py-2 font-data text-sm text-background shadow-lg transition-opacity"
        style={{ opacity: copied ? 1 : 0, pointerEvents: "none" }}
      >
        {copied ? `Copied ${copied}` : ""}
      </p>
    </div>
  );
}

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
