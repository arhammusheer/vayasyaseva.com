import { pageMetadata } from "@/lib/metadata";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CtaBlock } from "@/components/sections/cta-block";
import { JsonLd, webPageSchema, breadcrumbSchema } from "@/lib/structured-data";
export const metadata = pageMetadata({
  title: "Our Approach to Workforce Management",
  description:
    "How Vayasya Seva plans a labour engagement, coordinates mobilisation and supervision, and connects site operations with workforce records and reporting.",
  alternates: { canonical: "/how-we-operate" },
});
const approach = [
  {
    title: "Understand the work",
    text: "We start with your site, the people you need and the priorities behind the requirement. A visit or a detailed conversation helps us understand the working environment.",
  },
  {
    title: "Plan the engagement",
    text: "Together, we establish the team, supervision, working arrangements and commercial terms. The plan brings operational needs and workforce requirements into the same conversation.",
  },
  {
    title: "Prepare the team",
    text: "Recruitment, documentation and site onboarding prepare people for the work. Mobilisation is coordinated with your team and the readiness of the site.",
  },
  {
    title: "Stay involved",
    text: "Site coordination, attendance and reporting continue through the engagement. As requirements change, we review the arrangements with you.",
  },
];
export default function ApproachPage() {
  return (
    <>
      <JsonLd
        data={webPageSchema({
          type: "WebPage",
          name: "Our Approach to Workforce Management",
          description:
            "How Vayasya Seva plans a labour engagement, coordinates mobilisation and supervision, and connects site operations with workforce records and reporting.",
          url: "/how-we-operate",
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", href: "/" },
          { name: "Our approach", href: "/how-we-operate" },
        ])}
      />
      <PageHero
        title={
          <>
            First, understand.
            <br />
            Then, get to work.
          </>
        }
        lede="Every site has its own demands. We work with your team to put the people, supervision and supporting processes in place."
      />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="eyebrow text-gold-700">HOW AN ENGAGEMENT RUNS</p>
            <p className="mt-5 max-w-sm text-lg text-muted-foreground leading-relaxed">
              Four stages, from the first conversation to the everyday
              coordination of the team on your site.
            </p>
          </div>
          <div>
            {approach.map((a, i) => (
              <div
                key={a.title}
                className="grid grid-cols-[40px_1fr] gap-6 border-t py-8 first:border-0 first:pt-0 sm:grid-cols-[72px_1fr]"
              >
                <span className="pt-2 font-data text-sm text-gold-700">
                  0{i + 1}
                </span>
                <div>
                  <h2 className="text-3xl font-medium">{a.title}</h2>
                  <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">
                    {a.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>
      <Section variant="subtle">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="eyebrow text-gold-700">CONNECTED OPERATIONS</p>
            <h2 className="mt-5 text-4xl font-medium">
              The site and the office,
              <br />
              working together.
            </h2>
          </div>
          <div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Our site coordination is supported by Vayasya Setu, our internal
              workforce system. It helps bring attendance, deployment
              information and compliance records together for the team managing
              your engagement.
            </p>
            <Link href="/vayasya-setu" className="text-link">
              A closer look at Setu <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </Section>
      <CtaBlock />
    </>
  );
}
