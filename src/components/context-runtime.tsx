"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { pageView } from "@/context/runtime";

/**
 * Records each page view in the visitor context (src/context/runtime.ts):
 * the first adopts the boot script's decision, client navigations
 * recompute it. Renders nothing.
 */
export function ContextRuntime() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => {
    pageView(pathname, search ? `?${search}` : "");
  }, [pathname, search]);
  return null;
}
