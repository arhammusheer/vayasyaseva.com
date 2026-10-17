"use client";
/** Migration shim (roadmap 1C): the ad-click report lives in the measurement gateway. */
export { rememberAdClick, currentAdClick as adClick } from "@/lib/measurement/gateway";
