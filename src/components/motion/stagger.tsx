"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
  amount?: number;
}

const containerVariants = (stagger: number, reduced: boolean) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: reduced ? 0 : stagger,
    },
  },
});

const itemVariants = (reduced: boolean) => ({
  hidden: { opacity: 0, y: reduced ? 0 : 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: reduced ? 0.2 : 0.45,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
});

export function Stagger({
  children,
  className,
  staggerDelay = 0.08,
  once = true,
  amount = 0.15,
}: StaggerProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      variants={containerVariants(staggerDelay, !!reduced)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div variants={itemVariants(!!reduced)} className={cn(className)}>
      {children}
    </motion.div>
  );
}
