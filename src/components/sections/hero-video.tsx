"use client";

import { useRef, useEffect } from "react";
import { useReducedMotion } from "motion/react";

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced && videoRef.current) {
      videoRef.current.pause();
    }
  }, [reduced]);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-subtle">
      <video
        ref={videoRef}
        muted
        autoPlay={!reduced}
        loop
        playsInline
        preload="metadata"
        // TODO: Replace with actual poster image
        // poster="/assets/video/hero/vspl-operations-poster.jpg"
        className="h-full w-full object-cover"
      >
        {/* TODO: Add actual video files
        <source src="/assets/video/hero/vspl-operations.webm" type="video/webm" />
        <source src="/assets/video/hero/vspl-operations.mp4" type="video/mp4" />
        */}
      </video>
      {/* Fallback state when no video files are available */}
      <div className="absolute inset-0 flex items-center justify-center bg-subtle">
        <div className="text-center px-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-seva/10">
            <svg
              className="h-6 w-6 text-seva"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Operations on the ground
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Warehouse &middot; Shopfloor &middot; Facility
          </p>
        </div>
      </div>
      {/* Subtle overlay for readability harmony */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/10 to-transparent" />
    </div>
  );
}
