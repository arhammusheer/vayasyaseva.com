import { cn } from "@/lib/utils";

interface PageHeroProps {
  title: React.ReactNode;
  lede?: string;
  tone?: "light" | "dark" | "setu";
  aside?: React.ReactNode;
  className?: string;
}

/**
 * Opening band for inner pages. Display type at full strength, lede capped
 * at a readable measure, optional aside column for a fact list or index.
 */
export function PageHero({
  title,
  lede,
  tone = "light",
  aside,
  className,
}: PageHeroProps) {
  const dark = tone !== "light";
  return (
    <section
      data-header-theme={dark ? "dark" : undefined}
      className={cn(
        "pb-14 pt-16 sm:pb-16 sm:pt-24 lg:pb-20 lg:pt-24",
        tone === "dark" && "bg-neutral-900 text-background",
        tone === "setu" && "bg-setu-900 text-background",
        tone === "light" && "border-b border-border",
        className,
      )}
    >
      <div className="site-shell">
        <div
          className={cn("grid gap-10", aside && "lg:grid-cols-12 lg:items-end")}
        >
          <div className={cn(aside && "lg:col-span-8")}>
            <h1 className="rise rise-1 max-w-4xl text-balance text-[2.5rem] font-medium leading-[1.06] tracking-[-0.03em] sm:text-6xl lg:text-[4.5rem]">
              {title}
            </h1>
            {lede && (
              <p
                className={cn(
                  "rise rise-2 mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl",
                  dark ? "text-background/75" : "text-muted-foreground",
                )}
              >
                {lede}
              </p>
            )}
          </div>
          {aside && <div className="rise rise-3 lg:col-span-4">{aside}</div>}
        </div>
      </div>
    </section>
  );
}
