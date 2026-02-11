"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Section, SectionHeader } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { faqs } from "@/content/home";

const categories = [
  { id: "all", label: "All" },
  { id: "operations", label: "Operations" },
  { id: "compliance", label: "Compliance" },
  { id: "integration", label: "Integration / Setu" },
  { id: "commercial", label: "Commercial" },
] as const;

export function FaqSection() {
  return (
    <Section variant="subtle" id="faq">
      <Reveal>
        <SectionHeader
          title="Frequently Asked Questions"
          subtitle="Grouped by the concerns most relevant to your role."
        />
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mx-auto max-w-3xl">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6 flex w-full flex-wrap justify-start gap-1 bg-transparent p-0">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-sm data-[state=active]:border-seva data-[state=active]:bg-seva/10 data-[state=active]:text-seva"
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((cat) => {
              const categoryFaqs =
                cat.id === "all"
                  ? faqs
                  : faqs.filter((f) => f.category === cat.id);
              return (
                <TabsContent key={cat.id} value={cat.id}>
                  <Accordion type="single" collapsible className="w-full">
                    {categoryFaqs.map((faq, index) => (
                      <AccordionItem key={index} value={`${cat.id}-${index}`}>
                        <AccordionTrigger className="text-left text-base font-medium">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </Reveal>
    </Section>
  );
}
