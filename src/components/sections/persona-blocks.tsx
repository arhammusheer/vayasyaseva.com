import { Check, ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/layout/section";
import { personaBlocks } from "@/content/home";

export function PersonaBlocks() {
  return (
    <Section id="personas">
      <SectionHeader
        title="What You Get, What You Don\u2019t Have to Manage"
        subtitle="Role-specific outcomes for the stakeholders evaluating workforce operations partners."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {personaBlocks.map((persona) => (
          <div
            key={persona.role}
            className="rounded-xl border border-border bg-background p-6"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {persona.role}
            </p>
            <h3 className="mt-2 text-lg font-semibold leading-snug">
              {persona.headline}
            </h3>

            <div className="mt-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-success">
                What you get
              </p>
              <ul className="space-y-1.5">
                {persona.whatYouGet.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm leading-relaxed"
                  >
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                What you don&apos;t manage
              </p>
              <ul className="space-y-1.5">
                {persona.whatYouDontManage.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"
                  >
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
