"use client";

import { cn } from "@/lib/utils";
import { useInView } from "./use-in-view";
import { useHydrated } from "./use-hydrated";
import { usePrefersReducedMotion } from "./use-reduced-motion";

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  once?: boolean;
  amount?: number;
}

export function Reveal({
  children,
  delay = 0,
  className,
  once = true,
  amount = 0.2,
}: RevealProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const hydrated = useHydrated();
  const { ref, inView } = useInView<HTMLDivElement>({ once, amount });
  const transitionDelay = `${Math.round(delay * 1000)}ms`;

  if (!hydrated || prefersReducedMotion) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      className={cn(className)}
      data-visible={inView ? "true" : "false"}
    >
      <div
        style={{ transitionDelay }}
        className={cn(
          "translate-y-3 transform-gpu opacity-0 transition-all duration-[450ms] ease-[var(--motion-ease)] will-change-[opacity,transform]",
          inView && "translate-y-0 opacity-100"
        )}
      >
        {children}
      </div>
    </div>
  );
}
