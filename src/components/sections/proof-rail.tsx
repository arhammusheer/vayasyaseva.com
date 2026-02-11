import { proofRail } from "@/content/home";
import { siteConfig } from "@/content/site";

export function ProofRail() {
  return (
    <section className="bg-foreground/95">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        {proofRail.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-sm">
            <span className="font-data text-xs font-medium text-background/50">
              {item.label}
            </span>
            <span className="font-medium text-background/90">{item.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
