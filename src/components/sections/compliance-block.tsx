import { ShieldCheck, FileCheck, Scale } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Section, SectionHeader } from "@/components/layout/section";
import { complianceItems } from "@/content/home";

const icons = [ShieldCheck, FileCheck, Scale];

export function ComplianceBlock() {
  return (
    <Section variant="subtle" id="compliance">
      <SectionHeader
        title="Compliance Posture"
        subtitle="Every deployed worker operates under a compliance framework — statutory registrations, structured documentation, and governance controls."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {complianceItems.map((item, index) => {
          const Icon = icons[index];
          return (
            <Card key={item.title} className="h-full">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                  <Icon className="h-5 w-5 text-green-700" />
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
          );
        })}
      </div>
    </Section>
  );
}
