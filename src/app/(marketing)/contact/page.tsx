import { Suspense } from "react";
import type { Metadata } from "next";
import { Mail, Phone, MapPin } from "lucide-react";
import { Section } from "@/components/layout/section";
import { siteConfig } from "@/content/site";
import {
  JsonLd,
  localBusinessSchema,
  breadcrumbSchema,
} from "@/lib/structured-data";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to Vayasya Seva about contract labour, workforce services, compliance support or a project. Contact our Haridwar team by phone, email or enquiry form.",
};

function ContactFormFallback() {
  return (
    <div aria-hidden="true" className="mt-6 space-y-4">
      <div className="h-12 rounded-xl border border-border bg-background/70" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-12 rounded-lg border border-border bg-background/70" />
        <div className="h-12 rounded-lg border border-border bg-background/70" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-12 rounded-lg border border-border bg-background/70" />
        <div className="h-12 rounded-lg border border-border bg-background/70" />
      </div>
      <div className="h-32 rounded-lg border border-border bg-background/70" />
    </div>
  );
}

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
      <Section>
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Contact Info */}
          <div className="lg:col-span-2 lg:sticky lg:top-28 lg:self-start">
            <h1 className="text-4xl font-bold leading-[1.02] tracking-[-0.03em] sm:text-5xl">
              Let’s talk.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              A workforce requirement, a project or an early idea. Tell us what
              you have in mind and our team will be in touch.
            </p>

            <div className="mt-8 space-y-4">
              <a
                href={`mailto:${siteConfig.email}`}
                className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">
                    {siteConfig.email}
                  </p>
                </div>
              </a>

              <a
                href={`tel:${siteConfig.phone}`}
                className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
              >
                <Phone className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-data font-medium text-foreground">
                    {siteConfig.phone}
                  </p>
                </div>
              </a>

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium text-foreground">
                    {siteConfig.address}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact channels */}
          <div className="lg:col-span-3">
            <div className="border-t border-foreground/80 pt-8">
              <h2 className="text-xl font-bold">Tell us a little about it</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Your name, phone number and a few lines about your requirement
                are enough to start.
              </p>
              <Suspense fallback={<ContactFormFallback />}>
                <ContactForm />
              </Suspense>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-background transition-all hover:-translate-y-px hover:bg-neutral-800 active:translate-y-0"
                >
                  <Mail className="h-4 w-4" />
                  {siteConfig.email}
                </a>
                <a
                  href={`tel:${siteConfig.phone}`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-background px-5 font-data text-sm font-medium transition-all hover:-translate-y-px hover:border-neutral-900 active:translate-y-0"
                >
                  <Phone className="h-4 w-4" />
                  {siteConfig.phone}
                </a>
              </div>
            </div>

            {/* Compliance documentation request */}
            <div className="mt-12 border-t border-border pt-8">
              <h3 className="text-lg font-semibold">
                Need compliance documents?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                For due diligence, audit preparation, or to verify a
                registration, email operations directly.
              </p>
              <a
                href={`mailto:${siteConfig.email}?subject=Compliance%20Documentation%20Request`}
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-seva transition-colors hover:text-seva/80"
              >
                <Mail className="h-4 w-4" />
                Request via email
              </a>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
