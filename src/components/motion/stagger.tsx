import { Children } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
  amount?: number;
}

export function Stagger({
  children,
  className,
  staggerDelay = 0.08,
  once = true,
  amount = 0.15,
}: StaggerProps) {
  return (
    <div className={cn(className)}>
      {Children.map(children, (child, index) => (
        <Reveal delay={index * staggerDelay} once={once} amount={amount}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(className)}>{children}</div>;
}
