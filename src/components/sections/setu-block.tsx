import Image from "next/image";
import Link from "next/link";
import { Clock, FileCheck, BarChart3, Eye, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";
import { setuFeatures } from "@/content/home";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Clock,
  FileCheck,
  BarChart3,
  Eye,
};

export function SetuBlock() {
  return (
    <Section id="vayasya-setu">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <Image
            src="/brand/logos/vertical-setu.svg"
            alt="Vayasya Setu"
            width={120}
            height={40}
            className="mb-3 h-10 w-auto"
          />
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {setuFeatures.map((feature) => {
            const Icon = iconMap[feature.icon];
            return (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-background p-5"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-setu/10">
                  {Icon && <Icon className="h-4 w-4 text-setu" />}
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
