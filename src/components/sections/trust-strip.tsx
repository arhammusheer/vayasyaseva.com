import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";
import { trustClients } from "@/content/home";

export function TrustStrip() {
  const visibleClients = trustClients.filter((c) => c.visible);

  if (visibleClients.length === 0) return null;

  return (
    <div className="relative py-10 sm:py-12">
      {/* Gradient: clear at top → frosted glass with seva tint at bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(201,162,74,0.08)] to-[rgba(201,162,74,0.15)] backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20 backdrop-blur-sm [mask-image:linear-gradient(to_bottom,transparent_0%,black_50%,black_100%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-background/50">
            Enterprise associations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 lg:gap-16">
            {visibleClients.map((client) => (
              <div key={client.name} className="flex flex-col items-center gap-2">
                <div className="relative h-18 w-36 opacity-70 transition-opacity hover:opacity-100">
                  <Image
                    src={client.logoLight}
                    alt={client.name}
                    fill
                    className="object-contain brightness-0 invert"
                  />
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
