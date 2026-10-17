"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { metaPageView, metaPixelSnippet } from "@/lib/measurement/vendors/meta";

/**
 * Meta Pixel, rendered only when meta-pixel is allowed ("Allow All" and a
 * pixel id). Page views on load and on each in-app navigation; outcome
 * events come from the gateway (routes.ts META_EVENTS).
 */
export function MetaPixel({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();
  const first = useRef(true);
  // The first page view goes out with the script; later navigations from here.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    metaPageView();
  }, [pathname]);
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {metaPixelSnippet(pixelId)}
    </Script>
  );
}
