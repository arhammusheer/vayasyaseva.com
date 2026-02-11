import type { Metadata } from "next";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Section } from "@/components/layout/section";
import { siteConfig } from "@/content/site";
import { JsonLd, localBusinessSchema, breadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Vayasya Seva Private Limited. Share your workforce requirements or request compliance documentation.",
};

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
      <Section className="section-glow-contained section-glow-seva glow-left">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Contact Info */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Get in Touch
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Share your workforce requirements and we&apos;ll respond with an
              initial assessment.
            </p>

            <div className="mt-8 space-y-4">
              <a
                href={`mailto:${siteConfig.email}`}
                className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-seva/10">
                  <Mail className="h-5 w-5 text-seva" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Email
                  </p>
                  <p className="font-medium text-foreground">{siteConfig.email}</p>
                </div>
              </a>

              <a
                href={`tel:${siteConfig.phone}`}
                className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-seva/10">
                  <Phone className="h-5 w-5 text-seva" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Phone
                  </p>
                  <p className="font-medium text-foreground">{siteConfig.phone}</p>
                </div>
              </a>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-seva/10">
                  <MapPin className="h-5 w-5 text-seva" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Location
                  </p>
                  <p className="font-medium text-foreground">{siteConfig.address}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-seva/10">
                  <Clock className="h-5 w-5 text-seva" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Response Window
                  </p>
                  <p className="font-medium text-foreground">
                    2 business days (IST, Mon–Sat)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact channels */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-border bg-subtle p-6 sm:p-8">
              <h2 className="text-xl font-bold">Share Your Requirement</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Our online inquiry form is temporarily unavailable. Please
                reach out directly via email or phone — our operations team
                targets a response within 2 business days (IST, Mon–Sat).
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-seva px-4 py-2.5 text-sm font-medium text-seva-foreground transition-colors hover:bg-seva/90"
                >
                  <Mail className="h-4 w-4" />
                  {siteConfig.email}
                </a>
                <a
                  href={`tel:${siteConfig.phone}`}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-subtle"
                >
                  <Phone className="h-4 w-4" />
                  {siteConfig.phone}
                </a>
              </div>
            </div>

            {/* Compliance documentation request */}
            <div className="mt-6 rounded-2xl border border-border bg-background p-6 sm:p-8">
              <h3 className="text-lg font-semibold">
                Request Compliance Documentation
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                For due diligence reviews, audit preparation, or registration
                verification, contact our operations team directly via email.
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
