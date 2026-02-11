import {
  ClipboardList,
  Search,
  ShieldCheck,
  UserCheck,
  FileText,
} from "lucide-react";
import { Section, SectionHeader } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { operationsTimeline } from "@/content/home";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ClipboardList,
  Search,
  ShieldCheck,
  UserCheck,
  FileText,
};

export function OperationsTimeline() {
  return (
    <Section id="how-we-operate">
      <Reveal>
        <SectionHeader
          title="How We Operate"
          subtitle="A disciplined five-step process from requirement intake to compliance closure — ensuring accountability at every stage."
        />
      </Reveal>

      <div className="relative">
        {/* Vertical line for desktop */}
        <div className="absolute left-8 top-0 hidden h-full w-px bg-border lg:left-1/2 lg:block" />

        <div className="flex flex-col gap-8 lg:gap-12">
          {operationsTimeline.map((step, index) => {
            const Icon = iconMap[step.icon];
            const isEven = index % 2 === 0;

            return (
              <Reveal key={step.step} delay={index * 0.06}>
                <div className="relative grid grid-cols-[2.5rem_1fr] items-start gap-4 lg:grid-cols-[1fr_3rem_1fr] lg:items-center lg:gap-8">
                  {/* Icon — first on mobile, center on desktop */}
                  <div
                    className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-seva bg-background lg:col-start-2 lg:h-12 lg:w-12 ${
                      isEven ? "lg:col-start-2" : "lg:col-start-2"
                    }`}
                  >
                    {Icon && (
                      <Icon className="h-4 w-4 text-seva lg:h-5 lg:w-5" />
                    )}
                  </div>

                  {/* Text content — appears once */}
                  <div
                    className={`lg:row-start-1 ${
                      isEven
                        ? "lg:col-start-1 lg:text-right"
                        : "lg:col-start-3 lg:text-left"
                    }`}
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-seva lg:hidden">
                      Step {step.step}
                    </span>
                    <h3 className="mt-1 text-lg font-semibold lg:mt-0">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground lg:mt-2 lg:text-base">
                      {step.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
