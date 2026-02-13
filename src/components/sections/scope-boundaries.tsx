import { Check, X, Info } from "lucide-react";
import { Section, SectionHeader } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { scopeBoundaries } from "@/content/home";

export function ScopeBoundaries() {
  return (
    <Section id="scope">
      <Reveal>
        <SectionHeader
          title="Scope Boundaries"
          subtitle="Transparency on what VSPL delivers by default, what remains out of scope, and what can be added on request."
        />
      </Reveal>

      <div className="space-y-6">
        {scopeBoundaries.map((boundary, index) => (
          <Reveal key={boundary.category} delay={index * 0.08}>
            <div className="rounded-xl border border-border bg-background overflow-hidden">
              <div className="border-b border-border bg-subtle px-5 py-3">
                <h3 className="font-semibold">{boundary.category}</h3>
              </div>
              <div className="grid gap-px bg-border md:grid-cols-3">
                {/* Included */}
                <div className="bg-background p-5">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-success">
                    Included
                  </p>
                  <ul className="space-y-2">
                    {boundary.included.map((item) => (
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

                {/* Not Included */}
                <div className="bg-background p-5">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Not Included
                  </p>
                  <ul className="space-y-2">
                    {boundary.notIncluded.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"
                      >
                        <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* On Request */}
                <div className="bg-background p-5">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-info">
                    On Request
                  </p>
                  <ul className="space-y-2">
                    {boundary.onRequest.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm leading-relaxed"
                      >
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
