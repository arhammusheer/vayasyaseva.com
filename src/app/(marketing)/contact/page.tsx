import { Suspense } from "react";
import { pageMetadata } from "@/lib/metadata";
import { Section } from "@/components/layout/section";
import { siteConfig } from "@/content/site";
import {
  JsonLd,
  localBusinessSchema,
  breadcrumbSchema,
} from "@/lib/structured-data";
import { ContactForm } from "./contact-form";

export const metadata = pageMetadata({
  title: "Contact",
  description:
    "Talk to Vayasya Seva about contract labour, workforce services, compliance support or a project. Contact our Haridwar team by phone, email or enquiry form.",
  alternates: { canonical: "/contact" },
});

function ContactFormFallback() {
  return (
    <div aria-hidden="true" className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i}>
          <div className="h-3.5 w-16 rounded bg-neutral-100" />
          <div className="mt-2 h-12 rounded-lg border border-neutral-200" />
        </div>
      ))}
      <div className="sm:col-span-2">
        <div className="h-3.5 w-28 rounded bg-neutral-100" />
        <div className="mt-2 h-40 rounded-lg border border-neutral-200" />
      </div>
    </div>
  );
}

const lines = [
  { label: "Email", value: siteConfig.email, href: `mailto:${siteConfig.email}` },
  {
    label: "Phone",
    value: siteConfig.phone,
    href: `tel:${siteConfig.phone.replace(/\s/g, "")}`,
    data: true,
  },
  { label: "Office", value: siteConfig.address },
];

export default function ContactPage() {
  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Contact", href: "/contact" },
        ])}
      />
      <Section className="pt-10 sm:pt-14 lg:pt-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="eyebrow text-gold-700">CONTACT</p>
            <h1 className="mt-5 text-5xl font-medium leading-[1.04] tracking-[-0.03em] sm:text-6xl">
              Let’s talk.
            </h1>
            <p className="mt-5 max-w-sm text-lg leading-relaxed text-muted-foreground">
              A workforce requirement, a project or an early idea. Tell us what
              you have in mind and our team will be in touch.
            </p>
            <dl className="mt-10">
              {lines.map((l) => (
                <div
                  key={l.label}
                  className="flex items-baseline justify-between gap-6 border-t py-4"
                >
                  <dt className="text-sm text-muted-foreground">{l.label}</dt>
                  <dd className={l.data ? "font-data" : undefined}>
                    {l.href ? (
                      <a href={l.href} className="hover:text-gold-700">
                        {l.value}
                      </a>
                    ) : (
                      l.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <Suspense fallback={<ContactFormFallback />}>
              <ContactForm />
            </Suspense>
          </div>
        </div>
      </Section>
    </>
  );
}
