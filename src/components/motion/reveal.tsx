"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { useHydrated } from "./use-hydrated";

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
  const reduced = useReducedMotion();
  const hydrated = useHydrated();

  // SSR / pre-hydration: render plain div with full visibility
  if (!hydrated) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{
        duration: reduced ? 0.2 : 0.45,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        delay,
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
