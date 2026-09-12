import Image from "next/image";
import { trustClients } from "@/content/home";

export function TrustStrip() {
  const visibleClients = trustClients.filter((c) => c.visible);

  if (visibleClients.length === 0) return null;

  return (
    <div className="border-t border-background/15 bg-black/40 py-7 sm:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:gap-12 sm:px-6 lg:px-8">
        <p className="shrink-0 font-data text-[0.7rem] uppercase tracking-[0.18em] text-background/50">
          Enterprise associations
        </p>
        <div className="flex flex-wrap items-center gap-10 lg:gap-16">
          {visibleClients.map((client) => (
            <div key={client.name} className="relative h-12 w-28 opacity-75 transition-opacity hover:opacity-100">
              <Image
                src={client.logoLight}
                alt={client.name}
                fill
                sizes="112px"
                className="object-contain object-left brightness-0 invert"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
