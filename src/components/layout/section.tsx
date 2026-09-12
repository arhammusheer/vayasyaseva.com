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

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  size?: "md" | "lg";
  tone?: "light" | "dark";
}

export function SectionHeader({
  title,
  subtitle,
  className,
  align = "center",
  as: Heading = "h2",
  size = "md",
  tone = "light",
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-12",
        align === "center" && "text-center",
        className
      )}
    >
      <Heading
        className={cn(
          "text-balance font-medium tracking-tight",
          size === "md" && "text-3xl sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]",
          size === "lg" && "text-4xl sm:text-5xl lg:text-6xl lg:leading-[1.02]",
          tone === "dark" && "text-background"
        )}
      >
        {title}
      </Heading>
      {subtitle && (
        <p
          className={cn(
            "mt-4 max-w-3xl text-balance text-lg leading-relaxed sm:text-xl",
            tone === "light" ? "text-muted-foreground" : "text-background/70",
            align === "center" && "mx-auto"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
