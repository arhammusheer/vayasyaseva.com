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
        variant === "subtle" && "bg-subtle",
        variant === "dark" && "bg-foreground text-background",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: "left" | "center";
}

export function SectionHeader({
  title,
  subtitle,
  className,
  align = "center",
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-12",
        align === "center" && "text-center",
        className
      )}
    >
      <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 max-w-3xl text-balance text-lg text-muted-foreground sm:text-xl leading-relaxed mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
