import type { Metadata } from "next";
import {
  Warehouse,
  Factory,
  Building2,
  Users,
  TreePine,
  TrendingUp,
  Hammer,
  Cog,
  Package,
  Wrench,
  Check,
  X,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Section, SectionHeader } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { services } from "@/content/services";
import { JsonLd, servicePageSchema, breadcrumbSchema } from "@/lib/structured-data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Integrated industrial services across workforce deployment, civil and fabrication works, housekeeping, equipment provisioning, and machinery maintenance.",
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Warehouse,
  Factory,
  Building2,
  Users,
  TreePine,
  TrendingUp,
  Hammer,
  Cog,
  Package,
  Wrench,
};

export default function ServicesPage() {
  return (
    <>
      <JsonLd data={servicePageSchema(services)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Services", href: "/services" },
        ])}
      />
      <Section className="section-glow-seva">
        <SectionHeader
          as="h1"
          title="Our Services"
          subtitle="Integrated industrial services across ten operational domains — each with defined scope, roles, supervision, and compliance coverage."
        />
      </Section>

      {services.map((service, index) => {
        const Icon = iconMap[service.icon];
        const isBanded = index % 2 !== 0;
        const isLast = index === services.length - 1;

        return (
          <Section
            key={service.id}
            id={service.id}
            className={cn(
              "border-t border-gold/20 py-16 sm:py-20 lg:py-24",
              isBanded ? "bg-gold/5" : "bg-background",
              isLast && "border-b border-gold/20"
            )}
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
                  <CardHeader className="pb-1">
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
