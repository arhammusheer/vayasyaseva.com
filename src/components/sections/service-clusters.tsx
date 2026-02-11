import Link from "next/link";
import {
  Warehouse,
  Factory,
  Building2,
  Users,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Section, SectionHeader } from "@/components/layout/section";
import { servicesClusters } from "@/content/home";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Warehouse,
  Factory,
  Building2,
  Users,
};

export function ServiceClusters() {
  return (
    <Section variant="subtle" id="services">
      <SectionHeader
        title="What We Deliver"
        subtitle="Structured workforce deployment across four core operational domains — each backed by supervision, compliance, and reporting discipline."
      />

      <div className="grid gap-6 md:grid-cols-2">
        {servicesClusters.map((service) => {
          const Icon = iconMap[service.icon];
          return (
            <Link key={service.id} href={service.href} className="group">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                    {Icon && <Icon className="h-5 w-5 text-brand" />}
                  </div>
                  <CardTitle className="text-xl group-hover:text-brand transition-colors">
                    {service.title}
                  </CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {service.roles.slice(0, 4).map((role) => (
                      <Badge
                        key={role}
                        variant="outline"
                        className="text-xs font-normal"
                      >
                        {role}
                      </Badge>
                    ))}
                    {service.roles.length > 4 && (
                      <Badge variant="outline" className="text-xs font-normal">
                        +{service.roles.length - 4} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}
