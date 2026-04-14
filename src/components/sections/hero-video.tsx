"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/components/motion/use-reduced-motion";
import { HeroVideoPlayer } from "./hero-video-player";

const POSTER_SRC = "/assets/video/hero/poster.png";
const LOAD_DELAY_MS = 300;

interface NetworkInformationLike {
  saveData?: boolean;
}

type NavigatorWithConnection = Navigator & {
  connection?: NetworkInformationLike;
  mozConnection?: NetworkInformationLike;
  webkitConnection?: NetworkInformationLike;
};

export function HeroVideo() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const navigatorWithConnection =
    typeof navigator === "undefined"
      ? null
      : (navigator as NavigatorWithConnection);
  const connection =
    navigatorWithConnection?.connection ??
    navigatorWithConnection?.mozConnection ??
    navigatorWithConnection?.webkitConnection;
  const canLoadVideo = !prefersReducedMotion && !connection?.saveData;

  useEffect(() => {
    if (!canLoadVideo) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShouldLoadVideo(true);
    }, LOAD_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [canLoadVideo]);

  return (
    <div className="absolute inset-0 isolate">
      <Image
        src={POSTER_SRC}
        alt=""
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden="true"
      />
      {canLoadVideo && shouldLoadVideo ? (
        <HeroVideoPlayer />
      ) : null}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_48%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.08)_0%,rgba(2,6,23,0.28)_100%)]"
      />
    </div>
  );
}
