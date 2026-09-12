import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/layout/section";
import { operationsTimeline } from "@/content/home";

export function OperationsTimeline() {
  return (
    <Section id="how-we-operate">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeader
            title="How an engagement runs"
            subtitle="Five steps, from the first conversation to the monthly compliance pack. Same sequence every time."
            align="left"
            className="mb-6 lg:sticky lg:top-28"
          />
          <Link
            href="/how-we-operate"
            className="inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline lg:sticky lg:top-72"
          >
            Escalation paths and who owns what
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <ol className="border-t border-foreground/80 lg:col-span-8">
          {operationsTimeline.map((step) => (
            <li
              key={step.step}
              className="grid grid-cols-[4.5rem_1fr] items-start gap-4 border-b border-border py-7 sm:grid-cols-[6.5rem_1fr] sm:gap-8"
            >
              <span className="font-display text-5xl font-bold leading-none text-gold-500 tabular sm:text-6xl">
                {String(step.step).padStart(2, "0")}
              </span>
              <div className="pt-1">
                <h3 className="text-xl font-bold sm:text-2xl">{step.title}</h3>
                <p className="mt-2 max-w-xl leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
