import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  variant?: "default" | "subtle" | "dark";
}

export function Section({
  children,
  className,
  id,
  variant = "default",
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "py-16 sm:py-20 lg:py-24",
        variant === "subtle" && "section-subtle",
        variant === "dark" && "bg-foreground text-background",
        className
      )}
    >
      <div className="site-shell">{children}</div>
    </section>
  );
}
