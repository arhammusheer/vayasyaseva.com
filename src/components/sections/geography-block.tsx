import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/layout/section";

const facts = [
  { value: "2,000+", label: "acres in the SIDCUL Haridwar estate" },
  { value: "170+", label: "manufacturing units on the estate" },
  { value: "7–14", label: "working days to first shift, inside the area" },
];

export function GeographyBlock() {
  return (
    <Section variant="subtle" id="geography">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="font-data text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Where we operate
          </p>
          <h2 className="mt-4 text-balance text-[2.25rem] font-bold leading-[1.02] tracking-[-0.03em] sm:text-5xl lg:text-[4.5rem]">
            Haridwar–SIDCUL, and the industrial belt around it.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Pharma, FMCG, packaging, auto components, engineering, and
            textiles, all within a short drive of our office. Sites outside
            the belt are taken case by case, on whether we can put a
            supervisor there.
          </p>
          <Link
            href="/haridwar-sidcul"
            className="mt-8 inline-flex items-center gap-2 font-medium underline-offset-4 hover:underline"
          >
            Industrial services in Haridwar–SIDCUL
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <dl className="grid gap-6 border-t border-foreground/80 pt-6 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-1 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="font-display text-4xl font-bold leading-none tabular sm:text-5xl">
                {f.value}
              </dt>
              <dd className="mt-2 text-sm text-muted-foreground">{f.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}
