"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useReducedMotion } from "motion/react";

const POSTER_SRC = "/assets/video/hero/poster.png";

const videos = [
  "/assets/video/hero/video.mp4",
  "/assets/video/hero/video-1.mp4",
  "/assets/video/hero/video-2.mp4",
  "/assets/video/hero/video-3.mp4",
];

/**
 * Dual-buffer video crossfade.
 *
 * Two video elements (A and B) alternate roles:
 *   active  = currently visible and playing
 *   buffer  = invisible, preloading the next video
 *
 * On crossfade the active fades out, the buffer fades in,
 * then roles swap. The NEW buffer loads the next video —
 * since it's invisible, no flash occurs.
 */
export function HeroVideo() {
  const refA = useRef<HTMLVideoElement>(null);
  const refB = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();

  // Which slot is the active (visible, playing) one
  const [activeSlot, setActiveSlot] = useState<"A" | "B">("A");
  // Sources managed as state so React keeps them in sync with the DOM
  const [srcA, setSrcA] = useState(videos[0]);
  const [srcB, setSrcB] = useState(videos[1]);
  const [fading, setFading] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  // Tracks which video index to preload next after a swap
  const nextIdx = useRef(2);

  const isAActive = activeSlot === "A";
  const activeRef = isAActive ? refA : refB;
  const bufferRef = isAActive ? refB : refA;

  // Detect when the active video nears its end
  const handleTimeUpdate = useCallback(() => {
    const v = activeRef.current;
    if (!v || fading) return;
    const remaining = v.duration - v.currentTime;
    if (remaining <= 0.8 && remaining > 0) {
      setFading(true);
    }
  }, [fading, activeRef]);

  // Start the buffer video when crossfade begins
  useEffect(() => {
    if (!fading) return;
    const buf = bufferRef.current;
    if (buf) {
      buf.currentTime = 0;
      buf.play().catch(() => {});
    }
  }, [fading, bufferRef]);

  // After the active video's opacity transition finishes, swap roles
  const handleFadeEnd = useCallback(() => {
    if (!fading) return;
    // Buffer is now visible → promote it to active
    setActiveSlot((prev) => (prev === "A" ? "B" : "A"));
    setFading(false);
  }, [fading]);

  // After role swap, load the next video into the new buffer (invisible)
  useEffect(() => {
    const buf = bufferRef.current;
    if (!buf || reduced) return;

    const idx = nextIdx.current;
    if (isAActive) {
      setSrcB(videos[idx]);
    } else {
      setSrcA(videos[idx]);
    }
    nextIdx.current = (idx + 1) % videos.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlot, reduced]);

  // Preload buffer video whenever its src changes
  useEffect(() => {
    const buf = bufferRef.current;
    if (!buf || reduced) return;
    buf.load();
  }, [srcA, srcB, bufferRef, reduced]);

  // Fallback: if the video ends before timeUpdate fires
  const handleEnded = useCallback(() => {
    if (!fading) setFading(true);
  }, [fading]);

  // Initial playback
  useEffect(() => {
    const a = refA.current;
    if (a && !reduced) a.play().catch(() => {});
  }, [reduced]);

  // Pause on reduced motion
  useEffect(() => {
    if (reduced) {
      refA.current?.pause();
      refB.current?.pause();
    }
  }, [reduced]);

  const handlePlaying = useCallback(() => {
    setVideoReady(true);
  }, []);

  // Active video: z-20, opacity 1 → fades to 0
  // Buffer video: z-10, always opacity 1 (but hidden behind active)
  return (
    <div className="absolute inset-0 isolate">
      <video
        ref={refA}
        muted
        playsInline
        autoPlay={isAActive && !reduced}
        preload="auto"
        src={srcA}
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-[var(--motion-ease)]"
        style={{
          opacity: isAActive ? (fading ? 0 : 1) : 1,
          zIndex: isAActive ? 20 : 10,
        }}
        onTimeUpdate={isAActive ? handleTimeUpdate : undefined}
        onEnded={isAActive ? handleEnded : undefined}
        onTransitionEnd={isAActive ? handleFadeEnd : undefined}
        onPlaying={isAActive && !videoReady ? handlePlaying : undefined}
      />
      <video
        ref={refB}
        muted
        playsInline
        preload="auto"
        src={srcB}
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-[var(--motion-ease)]"
        style={{
          opacity: !isAActive ? (fading ? 0 : 1) : 1,
          zIndex: !isAActive ? 20 : 10,
        }}
        onTimeUpdate={!isAActive ? handleTimeUpdate : undefined}
        onEnded={!isAActive ? handleEnded : undefined}
        onTransitionEnd={!isAActive ? handleFadeEnd : undefined}
        onPlaying={!isAActive && !videoReady ? handlePlaying : undefined}
      />
      {/* Poster — on top of everything, fades out once first video plays */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={POSTER_SRC}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-[var(--motion-ease)]"
        style={{ opacity: videoReady ? 0 : 1, zIndex: 30 }}
        fetchPriority="high"
      />
    </div>
  );
}
