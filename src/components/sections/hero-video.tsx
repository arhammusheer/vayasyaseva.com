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

export function HeroVideo() {
  const frontRef = useRef<HTMLVideoElement>(null);
  const backRef = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [fading, setFading] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  // When the front video nears its end, start the crossfade
  const handleTimeUpdate = useCallback(() => {
    const video = frontRef.current;
    if (!video || fading) return;

    const remaining = video.duration - video.currentTime;
    if (remaining <= 0.8 && remaining > 0) {
      setFading(true);
    }
  }, [fading]);

  // When crossfade transition ends, swap: back becomes front
  const handleTransitionEnd = useCallback(() => {
    if (!fading) return;

    setCurrentIndex(nextIndex);
    setNextIndex((nextIndex + 1) % videos.length);
    setFading(false);
  }, [fading, nextIndex]);

  // Preload the next video in the back element
  useEffect(() => {
    const back = backRef.current;
    if (!back || reduced) return;

    back.load();
  }, [nextIndex, reduced]);

  // Play the front video when its source changes
  useEffect(() => {
    const front = frontRef.current;
    if (!front || reduced) return;

    front.load();
    front.play().catch(() => {});
  }, [currentIndex, reduced]);

  // Start back video playback when fade begins
  useEffect(() => {
    if (!fading) return;

    const back = backRef.current;
    if (back) {
      back.currentTime = 0;
      back.play().catch(() => {});
    }
  }, [fading]);

  // Fallback: if front video ends before the transition fires, force swap
  const handleEnded = useCallback(() => {
    if (!fading) {
      setFading(true);
      // Immediate swap after a brief fade
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % videos.length);
        setNextIndex((prev) => (prev + 1) % videos.length);
        setFading(false);
      }, 600);
    }
  }, [fading]);

  useEffect(() => {
    if (reduced) {
      frontRef.current?.pause();
      backRef.current?.pause();
    }
  }, [reduced]);

  const handlePlaying = useCallback(() => {
    setVideoReady(true);
  }, []);

  return (
    <div className="absolute inset-0">
      {/* Poster fallback — visible until first video starts playing */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={POSTER_SRC}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-[var(--motion-ease)]"
        style={{ opacity: videoReady ? 0 : 1 }}
        fetchPriority="high"
      />
      {/* Back video (incoming) */}
      <video
        ref={backRef}
        muted
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover"
        src={videos[nextIndex]}
      />
      {/* Front video (current) — fades out to reveal back */}
      <video
        ref={frontRef}
        muted
        autoPlay={!reduced}
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-[var(--motion-ease)]"
        style={{ opacity: fading ? 0 : 1 }}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onTransitionEnd={handleTransitionEnd}
        onPlaying={handlePlaying}
        src={videos[currentIndex]}
      />
    </div>
  );
}
