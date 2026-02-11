import Link from "next/link";
import { Clock, FileCheck, BarChart3, Eye, UserCheck, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { setuFeatures } from "@/content/home";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Clock,
  FileCheck,
  BarChart3,
  Eye,
  UserCheck,
  AlertTriangle,
};

export function SetuBlock() {
  return (
    <Section id="vayasya-setu">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-wider text-setu">
            Operational Control Layer
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Vayasya Setu
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            The internal operating engine that manages the controls layer of
            VSPL&apos;s workforce deployment — attendance integrity, structured
            documentation, payroll-aligned outputs, and compliance workflows.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/vayasya-setu">
              Learn More
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </Reveal>

        <Stagger className="grid gap-4 sm:grid-cols-2">
          {setuFeatures.map((feature) => {
            const Icon = iconMap[feature.icon];
            return (
              <StaggerItem key={feature.title}>
                <div className="rounded-xl border border-border bg-background p-5 transition-[shadow,transform] duration-[var(--motion-base)] ease-[var(--motion-ease)] hover:-translate-y-0.5 hover:shadow-md">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-setu/10">
                    {Icon && <Icon className="h-4 w-4 text-setu" />}
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </Section>
  );
}
