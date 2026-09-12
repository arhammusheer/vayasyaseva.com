import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "@/components/layout/section";
import { complianceItems, trustClients } from "@/content/home";
import { siteConfig } from "@/content/site";

const registrations = [
  { label: "ESIC", value: "Registered", note: "Workers enrolled at onboarding" },
  { label: "EPF", value: "Registered", note: "Contributions paid monthly" },
  { label: "GST", value: siteConfig.gstin, note: "On every invoice" },
  { label: "MSME", value: siteConfig.msme, note: "UDYAM certified" },
];

export function ComplianceBlock() {
  const clients = trustClients.filter((c) => c.visible);
  const [, records, escalation] = complianceItems;

  return (
    <>
      {/* Statement band on the site footage */}
      <section
        data-header-theme="dark"
        className="relative isolate overflow-hidden bg-neutral-950 py-28 text-background sm:py-36 lg:py-44"
      >
        <Image
          src="/assets/video/hero/poster.png"
          alt=""
          fill
          sizes="100vw"
          className="-z-20 object-cover"
          aria-hidden="true"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-neutral-950/80" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="font-data text-xs uppercase tracking-[0.18em] text-gold-400">
            Mobilisation, inside Haridwar–SIDCUL
          </p>
          <h2 className="mt-6 max-w-5xl text-balance text-[2.75rem] font-bold leading-[0.98] tracking-[-0.03em] sm:text-7xl lg:text-[7rem]">
            First shift in 7 to 14 working days.
          </h2>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-background/75 sm:text-xl">
            For standard warehouse and shopfloor roles, from the day the
            requirement is confirmed. Skilled roles and larger headcounts take
            longer; the date is agreed during scoping.
          </p>
        </div>
      </section>

      <Section id="compliance">
        <SectionHeader
          title="The paperwork is the product"
          subtitle="Registrations you can verify, records you receive on a schedule, and a written path for when something goes wrong."
          align="left"
          size="lg"
        />

        <dl className="grid gap-x-8 gap-y-10 border-t border-foreground/80 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {registrations.map((r) => (
            <div key={r.label}>
              <dt className="font-display text-4xl font-bold leading-none sm:text-5xl">
                {r.label}
              </dt>
              <dd className="mt-4 font-data text-sm tabular">{r.value}</dd>
              <dd className="mt-1 text-sm text-muted-foreground">{r.note}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-16 grid gap-10 border-t border-border pt-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <h3 className="text-2xl font-bold">{records.title}</h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">{records.description}</p>
          </div>
          <div className="lg:col-span-4">
            <h3 className="text-2xl font-bold">{escalation.title}</h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">{escalation.description}</p>
          </div>
          <div className="lg:col-span-4">
            <p className="font-data text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Enterprise associations
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-10 gap-y-6">
              {clients.map((client) => (
                <div key={client.name} className="relative h-9 w-24 opacity-70 grayscale transition-opacity hover:opacity-100">
                  <Image
                    src={client.logoLight}
                    alt={client.name}
                    fill
                    sizes="96px"
                    className="object-contain object-left"
                  />
                </div>
              ))}
            </div>
            <Link
              href="/compliance"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
            >
              Full registrations and document list
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Registrations last reviewed February 2026.
        </p>
      </Section>
    </>
  );
}
