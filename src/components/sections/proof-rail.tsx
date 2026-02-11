import { proofRail } from "@/content/home";
import { siteConfig } from "@/content/site";

export function ProofRail() {
  return (
    <section className="border-b border-border bg-subtle">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        {proofRail.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-1.5 text-sm"
          >
            <span className="font-data text-xs font-medium text-muted-foreground">
              {item.label}
            </span>
            <span className="font-medium text-foreground">{item.value}</span>
          </div>
        ))}
        <a
          href={`tel:${siteConfig.phone}`}
          className="flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-seva"
        >
          {siteConfig.phone}
        </a>
      </div>
    </section>
  );
}
