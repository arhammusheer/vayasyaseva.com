import { Suspense } from "react";
import { pageMetadata } from "@/lib/metadata";
import { Section } from "@/components/layout/section";
import { siteConfig } from "@/content/site";
import { businessPhone, businessPhoneHref } from "@/content/business-contact";
import { JsonLd, webPageSchema, breadcrumbSchema } from "@/lib/structured-data";
import { HEADINGS } from "./contact-headings";
import { ContactFormForMode, ContactHeading } from "./contact-mode";
import { CallbackForm } from "./callback-form";
import { ClipboardList, Mail, MessageCircle, Phone } from "lucide-react";
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
    "Need contract labour? Tell Vayasya Seva the work, how many workers, the site and the start date. We aim to reply within one working day, Monday to Saturday.",
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

/** WhatsApp on the business line (owner, 24 Nov 2026), opening with the three questions. */
const WHATSAPP_HREF = `https://wa.me/${businessPhoneHref.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
  "Hi Vayasya Seva, we’re looking for a crew.\nWork: \nHow many workers: \nSite (town or industrial area): ",
)}`;

/** The response-time wording (PLAN §8.1): here and in the sent message only. */
const RESPONSE_LINE = "We aim to reply within one working day (Monday to Saturday, IST).";

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
        {/* Two doors (owner direction, 24 Nov 2026): the three things we need, then the form or a
            conversation that asks the same three. Phone: the talk card first
            (one tap), then the form. Desktop: form left, talk card right. */}
        <div className="max-w-3xl">
          <p className="eyebrow text-gold-700">FOR BUSINESSES</p>
          <Suspense fallback={<h1 className="crew-intro-title">{HEADINGS.crew}</h1>}>
            <ContactHeading />
          </Suspense>
          <p className="talk-lede">
            Three answers get us started. Fill them in here, or tell us on WhatsApp or a call: we ask the same three.
          </p>
          <ol className="talk-three" aria-label="What we need to know">
            {["The work", "How many workers", "Where the site is"].map((q, i) => (
              <li key={q}>
                <span className="talk-three-n">{i + 1}</span>
                {q}
              </li>
            ))}
          </ol>
          {/* Phone: both doors on the first screen. */}
          <div className="talk-doors lg:hidden">
            <a href="#crew-form" className="talk-door-btn">
              <ClipboardList aria-hidden="true" />
              Fill in the form
            </a>
            <a href={WHATSAPP_HREF} target="_blank" rel="noopener" className="talk-door-btn talk-door-btn-wa">
              <MessageCircle aria-hidden="true" />
              WhatsApp us
            </a>
          </div>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-12 lg:mt-16 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-16">
          <div id="crew-form" className="scroll-mt-24">
            <p className="talk-door-note">2 minutes. We tell you whether we can staff it.</p>
            <Suspense fallback={<ContactFormFallback />}>
              <ContactFormForMode />
            </Suspense>
          </div>
          <aside aria-labelledby="talk-title">
            <div className="talk-card lg:sticky lg:top-28">
              <h2 id="talk-title" className="talk-title">Or talk to us</h2>
              <p className="talk-sub">{RESPONSE_LINE}</p>
              <a className="talk-row talk-row-primary" href={WHATSAPP_HREF} target="_blank" rel="noopener">
                <MessageCircle className="talk-row-icon" aria-hidden="true" />
                <span className="talk-row-label">WhatsApp</span>
                <span className="talk-row-note">Say hello, we’ll take it from there</span>
              </a>
              {/* Call-back before the number (owner direction, 24 Nov 2026). */}
              <Suspense fallback={null}>
                <CallbackForm variant="row" />
              </Suspense>
              <div className="talk-row talk-call">
                <Phone className="talk-row-icon" aria-hidden="true" />
                <span className="talk-row-label">
                  <a href={businessPhoneHref} className="font-data hover:text-gold-700">
                    {businessPhone.display}
                  </a>
                </span>
                <span className="talk-row-note">Monday to Saturday</span>
              </div>
              <a className="talk-row" href={`mailto:${siteConfig.email}`}>
                <Mail className="talk-row-icon" aria-hidden="true" />
                <span className="talk-row-label">{siteConfig.email}</span>
              </a>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
