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
                <div className="relative flex items-start gap-6 lg:items-center">
                  {/* Desktop: alternating layout */}
                  <div
                    className={`hidden w-full items-center gap-8 lg:flex ${
                      isEven ? "flex-row" : "flex-row-reverse"
                    }`}
                  >
                    <div
                      className={`flex-1 ${isEven ? "text-right" : "text-left"}`}
                    >
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                      <p className="mt-2 text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    {/* Center icon */}
                    <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-seva bg-background">
                      {Icon && <Icon className="h-5 w-5 text-seva" />}
                    </div>

                    <div className="flex-1" />
                  </div>

                  {/* Mobile layout */}
                  <div className="flex items-start gap-4 lg:hidden">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-seva bg-background">
                      {Icon && <Icon className="h-4 w-4 text-seva" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-seva">
                          Step {step.step}
                        </span>
                      </div>
                      <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
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
