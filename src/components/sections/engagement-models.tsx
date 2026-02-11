import { CalendarDays, TrendingUp, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Section, SectionHeader } from "@/components/layout/section";
import { engagementModels } from "@/content/home";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  CalendarDays,
  TrendingUp,
  Clock,
};

export function EngagementModels() {
  return (
    <Section variant="subtle" id="engagement">
      <SectionHeader
        title="Engagement Models"
        subtitle="Deployment structures aligned to your operational cadence — from stable long-term operations to rapid seasonal scaling."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {engagementModels.map((model) => {
          const Icon = iconMap[model.icon];
          return (
            <Card key={model.type} className="h-full">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-seva/10">
                  {Icon && <Icon className="h-5 w-5 text-seva" />}
                </div>
                <CardTitle className="text-lg">{model.type}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {model.description}
                </CardDescription>
                <Badge variant="secondary" className="mt-3 w-fit font-data text-xs">
                  {model.typicalDuration}
                </Badge>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
