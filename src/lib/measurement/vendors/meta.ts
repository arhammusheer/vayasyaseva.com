"use client";
/**
 * Meta Pixel (dormant until NEXT_PUBLIC_META_PIXEL_ID is set; "Allow All"
 * only). The only file that touches window.fbq. Automatic configuration is
 * off, so the pixel doesn't scan buttons or forms, and no customer data is
 * passed (no advanced matching).
 */
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** One Meta standard event, without parameters. */
export function metaTrack(event: string) {
  if (typeof window.fbq === "function") window.fbq("track", event);
}

export const metaPageView = () => metaTrack("PageView");

/** The pixel's loader, which sends the first page view itself. */
export const metaPixelSnippet = (pixelId: string) =>
  `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('set','autoConfig',false,'${pixelId}');fbq('init','${pixelId}');fbq('track','PageView');`;
