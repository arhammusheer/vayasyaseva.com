import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/layout/section";
import { trustClients, registrations } from "@/content/home";

export function TrustStrip() {
  const visibleClients = trustClients.filter((c) => c.visible);

  return (
    <Section className="py-10 sm:py-12">
      <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
        {/* Client logos */}
        {visibleClients.length > 0 && (
          <div className="flex flex-col items-center gap-4 lg:items-start">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Trusted by enterprise operations
            </p>
            <div className="flex items-center gap-8">
              {visibleClients.map((client) => (
                <div
                  key={client.name}
                  className="relative h-8 w-24 grayscale opacity-60 transition-all hover:grayscale-0 hover:opacity-100"
                >
                  <Image
                    src={client.logoLight}
                    alt={client.name}
                    fill
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Registration badges */}
        <div className="flex flex-col items-center gap-4 lg:items-end">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Statutory registrations
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {registrations.map((reg) => (
              <Badge
                key={reg.label}
                variant="secondary"
                className="text-xs font-medium"
              >
                {reg.label} {reg.value}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
