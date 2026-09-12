import { Check, X, Plus } from "lucide-react";
import { Section, SectionHeader } from "@/components/layout/section";
import { scopeBoundaries } from "@/content/home";

const columns = [
  { key: "included", label: "Included", Icon: Check, tone: "text-success" },
  { key: "notIncluded", label: "Not included", Icon: X, tone: "text-muted-foreground" },
  { key: "onRequest", label: "On request", Icon: Plus, tone: "text-info" },
] as const;

export function ScopeBoundaries() {
  return (
    <Section variant="subtle" id="scope">
      <SectionHeader
        title="What is in scope"
        subtitle="What a standard engagement includes, what it doesn't, and what can be added."
        align="left"
      />

      <div className="divide-y divide-foreground/80 border-y border-foreground/80">
        {scopeBoundaries.map((boundary) => (
          <div key={boundary.category} className="grid gap-8 py-10 lg:grid-cols-12">
            <h3 className="text-2xl font-bold leading-tight lg:col-span-3 lg:text-3xl">
              {boundary.category}
            </h3>
            <div className="grid gap-8 sm:grid-cols-3 lg:col-span-9">
              {columns.map(({ key, label, Icon, tone }) => (
                <div key={key}>
                  <p className={`text-sm font-semibold ${tone}`}>{label}</p>
                  <ul className="mt-3 space-y-2">
                    {boundary[key].map((item) => (
                      <li
                        key={item}
                        className={`flex items-start gap-2 text-sm leading-relaxed ${key === "notIncluded" ? "text-muted-foreground" : ""}`}
                      >
                        <Icon className={`mt-1 h-3.5 w-3.5 shrink-0 ${tone}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
