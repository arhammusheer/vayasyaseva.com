import { pageMetadata } from "@/lib/metadata";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { JsonLd, breadcrumbSchema } from "@/lib/structured-data";
import { localBusinessSchema, faqSchema } from "@/lib/structured-data";
import type { FaqItem } from "@/content/types";
export const metadata = pageMetadata({
  title: "Labour Contractor in Haridwar & SIDCUL",
  description:
    "Vayasya Seva provides contract labour, manpower supply, housekeeping and industrial services in Haridwar and SIDCUL, with EPF and ESIC compliance support.",
  alternates: { canonical: "/haridwar-sidcul" },
});
const questions: FaqItem[] = [
  {
    question: "Do you supply contract labour for SIDCUL factories?",
    answer:
      "Yes. We support factory and warehouse operations with workers for production, packing, material handling, dispatch and related roles. We plan the workforce and supervision with your site team.",
    category: "operations",
  },
  {
    question: "Can you support labour compliance documentation?",
    answer:
      "We maintain workforce records and coordinate applicable EPF and ESIC documentation as part of our labour engagements. Registration certificates and relevant records can be shared for review.",
    category: "compliance",
  },
  {
    question: "Can an engagement include work beyond manpower supply?",
    answer:
      "Yes. Our capabilities include housekeeping, civil work, fabrication, maintenance and other site support. We can discuss a combined requirement with your team.",
    category: "commercial",
  },
  {
    question: "How do we discuss a site or a start date?",
    answer:
      "Share the location, the kind of work and your intended timing. Our team will discuss the requirement and mobilisation plan with you, including enquiries for sites beyond Haridwar.",
    category: "commercial",
  },
];
export default function HaridwarPage() {
  return (
    <>
      <JsonLd data={localBusinessSchema()} />
      <JsonLd data={faqSchema(questions)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Haridwar & SIDCUL", href: "/haridwar-sidcul" },
        ])}
      />
      <PageHero
        title={
          <>
            Rooted in Haridwar.
            <br />
            Working alongside industry.
          </>
        }
        lede="Contract labour, workforce management and industrial support for businesses in Haridwar and the SIDCUL region."
      />
      <Section>
        <div className="grid gap-10 md:grid-cols-2">
          <h2 className="text-4xl font-medium">
            A local conversation.
            <br />A practical way forward.
          </h2>
          <div className="text-lg text-muted-foreground leading-relaxed space-y-5">
            <p>
              Based in Haridwar, Vayasya Seva works with the needs of the
              surrounding industrial community: factory shifts, warehouse
              activity, facility upkeep and project work.
            </p>
            <p>
              We bring workforce coordination and labour compliance into the
              same engagement, helping your operations and HR teams work with a
              common understanding.
            </p>
            <Link href="/contact" className="text-link text-foreground">
              Tell us about your site <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </Section>
      <Section variant="subtle">
        <p className="eyebrow text-seva">SUPPORT FOR YOUR SITE</p>
        <div className="grid gap-8 mt-8 md:grid-cols-3">
          {[
            {
              title: "Factory & warehouse labour",
              text: "Production helpers, packers, loaders and material handlers for daily operations and changing workloads.",
              href: "/services#manufacturing-shopfloor",
            },
            {
              title: "Facilities & contract works",
              text: "Housekeeping, grounds, civil repairs, fabrication and maintenance support for business premises.",
              href: "/services#housekeeping-facility",
            },
            {
              title: "Labour compliance",
              text: "Worker records, attendance, wage documentation and applicable EPF and ESIC contributions.",
              href: "/compliance",
            },
          ].map((s) => (
            <div key={s.title}>
              <h2 className="text-2xl font-medium">{s.title}</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                {s.text}
              </p>
              <Link href={s.href} className="text-link">
                Read about {s.title.toLowerCase()} <ArrowUpRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </Section>
      <Section>
        <div className="grid gap-10 md:grid-cols-[1fr_1.6fr]">
          <h2 className="text-4xl font-medium">Before we talk.</h2>
          <div className="detail-list">
            {questions.map((f) => (
              <details key={f.question}>
                <summary>{f.question}</summary>
                <div className="detail-body">{f.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </Section>
      <CtaBlock />
    </>
  );
}
