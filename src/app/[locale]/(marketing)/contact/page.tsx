import { Suspense } from "react";
import { pageMetadata } from "@/lib/metadata";
import { Section } from "@/components/layout/section";
import { siteConfig } from "@/content/site";
import { businessPhone, businessPhoneHref } from "@/content/business-contact";
import { JsonLd, webPageSchema, breadcrumbSchema } from "@/lib/structured-data";
import { ContactFormForMode, ContactHeading, HEADINGS } from "./contact-mode";
import { AgentGuidance } from "@/components/agent-guidance";
import { JobsLink } from "@/components/i18n/jobs-link";
import { localeParams } from "@/lib/i18n";

export const dynamicParams = false;
export const generateStaticParams = localeParams("/contact");

/**
 * One static page. The ?type=assessment and ?type=compliance variants
 * (canonical /contact) change the heading and the form in the browser
 * (./contact-mode.tsx); title and description are the crew request's, which
 * is what search shows for the canonical URL.
 */
export const metadata = pageMetadata({
  title: "Request a Crew: Contract Labour Enquiry",
  description:
    "Need contract labour? Tell Vayasya Seva the work, how many workers, the site and the start date. We aim to reply within two working days, Monday to Saturday.",
  alternates: { canonical: "/contact" },
});

function ContactFormFallback() {
  return (
    <div aria-hidden="true" className="crew-form">
      <div className="h-1 rounded bg-neutral-100" />
      <div className="mt-6 h-8 w-56 rounded bg-neutral-100" />
      {[0, 1].map((i) => (
        <div key={i} className="mt-9">
          <div className="h-5 w-40 rounded bg-neutral-100" />
          <div className="mt-4 flex flex-wrap gap-2">
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="h-12 w-28 rounded-lg border border-neutral-200" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** The response-time wording (PLAN §8.1): here and in the sent message only. */
const RESPONSE_LINE = "We aim to reply within two working days (Monday to Saturday, IST).";

const lines = [
  {
    label: "Email",
    value: siteConfig.email,
    href: `mailto:${siteConfig.email}`,
  },
  {
    label: "Phone",
    value: businessPhone.display,
    href: businessPhoneHref,
    data: true,
  },
];

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={webPageSchema({
          type: "ContactPage",
          name: "Request a crew",
          description:
            "Send Vayasya Seva a contract labour requirement: the work, the number of workers, the site and the start date.",
          url: "/contact",
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Request a crew", href: "/contact" },
        ])}
      />
      <Section className="pt-8 sm:pt-14 lg:pt-16">
        {/* Phone order: intro, form, contact lines. Desktop: intro and lines
            on the left, the form on the right. */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:grid-rows-[auto_1fr] lg:gap-x-20 lg:gap-y-0">
          <div className="lg:col-start-1 lg:row-start-1">
            {/* One quiet line for job seekers, a full thumb target (48px), to
                /jobs, every market, in their saved language (JobsLink). */}
            <JobsLink
              path="/jobs"
              locale="en-IN"
              className="mb-4 inline-flex min-h-12 items-center text-sm leading-relaxed text-muted-foreground hover:text-gold-700"
            >
              Looking for work?&nbsp;<span className="text-gold-700 underline underline-offset-4">Jobs →</span>
            </JobsLink>
            <p className="eyebrow text-gold-700">FOR BUSINESSES</p>
            <Suspense fallback={<h1 className="crew-intro-title">{HEADINGS.crew}</h1>}>
              <ContactHeading />
            </Suspense>
            <p className="crew-reply max-w-sm">{RESPONSE_LINE}</p>
          </div>
          <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2">
            {/* Outside Suspense: the form renders on the client only, and agents read the server HTML. */}
            <AgentGuidance form="contact" />
            <Suspense fallback={<ContactFormFallback />}>
              <ContactFormForMode />
            </Suspense>
          </div>
          <div className="lg:col-start-1 lg:row-start-2 lg:pt-12">
            <p className="text-sm text-muted-foreground">Prefer to write or call?</p>
            <dl className="mt-3">
              {lines.map((l, i) => (
                <div
                  key={l.label}
                  className={i === 0 ? "flex items-baseline justify-between gap-6 py-4" : "flex items-baseline justify-between gap-6 border-t py-4"}
                >
                  <dt className="text-sm text-muted-foreground">{l.label}</dt>
                  <dd className={l.data ? "font-data text-right" : "text-right"}>
                    {l.href ? (
                      <a href={l.href} className="inline-flex min-h-12 items-center hover:text-gold-700">
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
        </div>
      </Section>
    </>
  );
}
