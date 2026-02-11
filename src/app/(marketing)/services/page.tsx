import type { Metadata } from "next";
import {
  Warehouse,
  Factory,
  Building2,
  Users,
  TreePine,
  TrendingUp,
  Check,
  X,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Section, SectionHeader } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { services } from "@/content/services";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Workforce deployment services for warehouses, factories, facilities, and industrial operations — with defined scope, supervision, and compliance coverage.",
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Warehouse,
  Factory,
  Building2,
  Users,
  TreePine,
  TrendingUp,
};

export default function ServicesPage() {
  return (
    <>
      <Section className="section-glow-seva">
        <SectionHeader
          title="Our Services"
          subtitle="Structured workforce deployment across six operational domains — each with defined scope, roles, and compliance coverage."
        />
      </Section>

      {services.map((service, index) => {
        const Icon = iconMap[service.icon];
        const isSubtle = index % 2 !== 0;

        return (
          <Section
            key={service.id}
            id={service.id}
            variant={isSubtle ? "subtle" : "default"}
          >
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Service Info */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-seva/10">
                    {Icon && <Icon className="h-5 w-5 text-seva" />}
                  </div>
                  <h2 className="text-2xl font-bold">{service.title}</h2>
                </div>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  {service.description}
                </p>

                {/* Roles */}
                <div className="mt-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Typical Roles Deployed
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {service.roles.map((role) => (
                      <Badge key={role} variant="outline">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Shift Patterns */}
                <div className="mt-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Shift Patterns
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {service.shiftPatterns.map((pattern) => (
                      <Badge key={pattern} variant="secondary">
                        {pattern}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Included / Not Included */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-success">
                      Included in Scope
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {service.included.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-sm"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base text-muted-foreground">
                      Not Included
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {service.notIncluded.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <X className="mt-0.5 h-4 w-4 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Section>
        );
      })}

      <CtaBlock />
    </>
  );
}
