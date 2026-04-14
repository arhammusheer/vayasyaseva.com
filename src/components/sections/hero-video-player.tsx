"use client";

import { useEffect, useRef, useState } from "react";

const HERO_VIDEO_SRC = "/assets/video/hero/video.mp4";
const POSTER_SRC = "/assets/video/hero/poster.png";

export function HeroVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.play().catch(() => {});
  }, []);

  return (
    <video
      ref={videoRef}
      muted
      playsInline
      autoPlay
      loop
      preload="metadata"
      poster={POSTER_SRC}
      src={HERO_VIDEO_SRC}
      className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-[var(--motion-ease)]"
      style={{ opacity: isPlaying ? 1 : 0 }}
      aria-hidden="true"
      onCanPlay={() => {
        videoRef.current?.play().catch(() => {});
      }}
      onPlaying={() => {
        setIsPlaying(true);
      }}
    />
  );
}
