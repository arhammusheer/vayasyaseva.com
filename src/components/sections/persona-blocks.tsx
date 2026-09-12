import { Check, ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/layout/section";
import { personaBlocks } from "@/content/home";

export function PersonaBlocks() {
  return (
    <Section variant="subtle" id="personas">
      <SectionHeader
        title="What you get. What we handle."
        subtitle="Depends on who you are on the client side."
        align="left"
      />

      <div className="grid gap-10 lg:grid-cols-3 lg:gap-8">
        {personaBlocks.map((persona) => (
          <div key={persona.role} className="rule-top pt-5">
            <p className="font-data text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {persona.role}
            </p>
            <h3 className="mt-3 text-2xl font-bold leading-tight sm:text-[1.75rem]">
              {persona.headline}
            </h3>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <p className="text-sm font-semibold text-seva">You get</p>
                <ul className="mt-2 space-y-2">
                  {persona.whatYouGet.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed">
                      <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-seva" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground">We handle</p>
                <ul className="mt-2 space-y-2">
                  {persona.whatYouDontManage.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
                      <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
