import { ShieldCheck, FileCheck, Scale } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Section, SectionHeader } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { complianceItems } from "@/content/home";

const icons = [ShieldCheck, FileCheck, Scale];

export function ComplianceBlock() {
  return (
    <Section variant="subtle" id="compliance">
      <Reveal>
        <SectionHeader
          title="Compliance Posture"
          subtitle="Statutory registrations, structured documentation, and governance controls — built into the operating model for deployed teams."
        />
      </Reveal>

      <Stagger className="grid gap-6 md:grid-cols-3">
        {complianceItems.map((item, index) => {
          const Icon = icons[index];
          return (
            <StaggerItem key={item.title}>
              <Card className="h-full transition-[shadow,transform] duration-[var(--motion-base)] ease-[var(--motion-ease)] hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                    <Icon className="h-5 w-5 text-success" />
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {item.description}
                  </CardDescription>
                  {item.registrations && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.registrations.map((reg) => (
                        <Badge
                          key={reg}
                          variant="secondary"
                          className="text-xs"
                        >
                          {reg}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>
              </Card>
            </StaggerItem>
          );
        })}
      </Stagger>

      <Reveal delay={0.2}>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Last reviewed: February 2026
        </p>
      </Reveal>
    </Section>
  );
}
