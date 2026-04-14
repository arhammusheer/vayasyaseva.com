"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/components/motion/use-reduced-motion";

const POSTER_SRC = "/assets/video/hero/poster.png";
const LOAD_DELAY_MS = 1500;
const MIN_VIDEO_WIDTH = 1024;
const SLOW_CONNECTION_TYPES = new Set(["slow-2g", "2g", "3g"]);

const HeroVideoPlayer = dynamic(
  () =>
    import("./hero-video-player").then((mod) => ({
      default: mod.HeroVideoPlayer,
    })),
  { ssr: false }
);

interface NetworkInformationLike {
  effectiveType?: string;
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

  useEffect(() => {
    if (prefersReducedMotion || window.innerWidth < MIN_VIDEO_WIDTH) {
      return;
    }

    const navigatorWithConnection = navigator as NavigatorWithConnection;
    const connection =
      navigatorWithConnection.connection ??
      navigatorWithConnection.mozConnection ??
      navigatorWithConnection.webkitConnection;

    if (connection?.saveData) {
      return;
    }

    if (
      connection?.effectiveType &&
      SLOW_CONNECTION_TYPES.has(connection.effectiveType)
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShouldLoadVideo(true);
    }, LOAD_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [prefersReducedMotion]);

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
      {shouldLoadVideo ? (
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
