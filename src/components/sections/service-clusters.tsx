import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/layout/section";
import { servicesClusters } from "@/content/home";

export function ServiceClusters() {
  return (
    <Section id="services">
      <SectionHeader
        title="Six things we put crews on"
        subtitle="Each comes with a VSPL supervisor on site, ESIC/EPF enrolment for eligible workers, and a daily attendance report."
        align="left"
        size="lg"
      />

      <ul className="border-t border-foreground/80">
        {servicesClusters.map((service) => (
          <li key={service.id} className="border-b border-border">
            <Link
              href={service.href}
              className="group grid gap-x-8 gap-y-3 py-7 transition-colors duration-[var(--motion-fast)] hover:bg-seva-50/70 sm:py-8 lg:grid-cols-12 lg:items-baseline"
            >
              <h3 className="flex items-start gap-3 text-2xl font-bold leading-tight sm:text-3xl lg:col-span-5 lg:text-[2.25rem]">
                <span className="transition-transform duration-[var(--motion-base)] ease-[var(--motion-ease)] group-hover:translate-x-1">
                  {service.title}
                </span>
                <ArrowUpRight className="mt-1.5 h-5 w-5 shrink-0 text-muted-foreground opacity-0 transition-all duration-[var(--motion-base)] ease-[var(--motion-ease)] group-hover:translate-x-0.5 group-hover:text-seva group-hover:opacity-100 sm:h-6 sm:w-6" />
              </h3>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground lg:col-span-4">
                {service.description}
              </p>
              <p className="font-data text-xs leading-relaxed text-muted-foreground lg:col-span-3 lg:text-right">
                {service.roles.join(" · ")}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
