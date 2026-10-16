import { Suspense } from "react";
import { pageMetadata } from "@/lib/metadata";
import { Section } from "@/components/layout/section";
import NextLink from "next/link";
import { siteConfig } from "@/content/site";
import { businessPhone, businessPhoneHref } from "@/content/business-contact";
import { JsonLd, webPageSchema, breadcrumbSchema } from "@/lib/structured-data";
import { ContactForm } from "./contact-form";
import { AgentGuidance } from "@/components/agent-guidance";
import { jobsDoorHref } from "@/components/layout/nav-links";
import { localeParams } from "@/lib/i18n";

export const dynamicParams = false;
export const generateStaticParams = localeParams("/contact");

type Mode = "crew" | "assessment" | "compliance";

/** ?type=assessment and ?type=compliance: variants of one page (canonical /contact). */
function modeOf(type: string | string[] | undefined): Mode {
  return type === "assessment" ? "assessment" : type === "compliance" ? "compliance" : "crew";
}

const META: Record<Mode, { title: string; description: string; shareVariant: string }> = {
  crew: {
    title: "Request a Crew: Contract Labour Enquiry",
    description:
      "Need contract labour? Tell Vayasya Seva the work, how many workers, the site and the start date. We aim to reply within two working days, Monday to Saturday.",
    shareVariant: "",
  },
  assessment: {
    title: "Request a Site Assessment",
    description:
      "Ask Vayasya Seva to look at your site before a crew starts. Tell us the work, the site and when. We aim to reply within two working days, Monday to Saturday.",
    shareVariant: "assessment",
  },
  compliance: {
    title: "Get Compliance Help: EPF, ESIC and Labour Law",
    description:
      "Behind on EPF, ESIC, PT, LWF, a contract labour licence or registers? Vayasya Seva guides you to get compliant and connects you with CAs and labour lawyers.",
    shareVariant: "compliance",
  },
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { title, description, shareVariant } = META[modeOf((await searchParams).type)];
  return pageMetadata({ title, description, alternates: { canonical: "/contact" }, shareVariant });
}

const HEADINGS: Record<Mode, string> = {
  crew: "Request a crew.",
  assessment: "Request a site assessment.",
  compliance: "Get compliance help.",
};

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

export default async function ContactPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const mode = modeOf((await searchParams).type);
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
                Jobs in Haridwar (neutral, so not the i18n Link). */}
            <NextLink
              href={jobsDoorHref("en-IN")}
              prefetch={false}
              className="mb-4 inline-flex min-h-12 items-center text-sm leading-relaxed text-muted-foreground hover:text-gold-700"
            >
              Looking for work?&nbsp;<span className="text-gold-700 underline underline-offset-4">Jobs in Haridwar →</span>
            </NextLink>
            <p className="eyebrow text-gold-700">FOR BUSINESSES</p>
            <h1 className="crew-intro-title">{HEADINGS[mode]}</h1>
            {mode === "compliance" && (
              <p className="crew-reply max-w-sm">
                Missed EPF or ESIC filings, no contract labour licence, registers not kept? We guide you through
                getting compliant, and connect you with CAs, labour lawyers and compliance consultants in the
                Vayasya Network.
              </p>
            )}
            <p className="crew-reply max-w-sm">{RESPONSE_LINE}</p>
          </div>
          <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2">
            {/* Outside Suspense: the form renders on the client only, and agents read the server HTML. */}
            <AgentGuidance form="contact" />
            <Suspense fallback={<ContactFormFallback />}>
              <ContactForm key={mode} />
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
