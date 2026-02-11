import Image from "next/image";
import { Section } from "@/components/layout/section";
import { trustClients } from "@/content/home";

export function TrustStrip() {
  const visibleClients = trustClients.filter((c) => c.visible);

  if (visibleClients.length === 0) return null;

  return (
    <Section className="py-10 sm:py-12">
      <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Enterprise associations
      </p>
      <div className="flex flex-wrap items-center justify-center gap-10 lg:gap-16">
        {visibleClients.map((client) => (
          <div key={client.name} className="flex flex-col items-center gap-2">
            <div className="relative h-10 w-32 opacity-70 transition-opacity hover:opacity-100">
              <Image
                src={client.logoLight}
                alt={client.name}
                fill
                className="object-contain"
              />
            </div>
            {client.context && (
              <span className="text-xs text-muted-foreground">
                {client.context}
              </span>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
