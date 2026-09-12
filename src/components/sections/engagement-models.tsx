import { Section, SectionHeader } from "@/components/layout/section";
import { engagementModels } from "@/content/home";

export function EngagementModels() {
  return (
    <Section id="engagement">
      <SectionHeader
        title="Three ways a contract is set up"
        align="left"
      />

      <div className="grid gap-10 border-t border-foreground/80 pt-8 md:grid-cols-3 md:gap-8">
        {engagementModels.map((model) => (
          <div key={model.type}>
            <p className="font-display text-4xl font-bold leading-none text-gold-500 tabular sm:text-5xl">
              {model.typicalDuration}
            </p>
            <h3 className="mt-5 text-xl font-bold sm:text-2xl">{model.type}</h3>
            <p className="mt-2 max-w-sm leading-relaxed text-muted-foreground">
              {model.description}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
