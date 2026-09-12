"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Section, SectionHeader } from "@/components/layout/section";
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
    <Section id="faq">
      <SectionHeader
        title="Questions we get asked"
        subtitle="Filter by what you are responsible for."
        align="left"
      />

      <div className="max-w-3xl">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-8 flex h-auto w-full flex-wrap justify-start gap-6 rounded-none border-b border-border bg-transparent p-0">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="rounded-none border-b-2 border-transparent bg-transparent px-0 py-2 text-sm text-muted-foreground shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
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
                      <AccordionTrigger className="py-5 text-left text-lg font-semibold hover:no-underline">
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
    </Section>
  );
}
