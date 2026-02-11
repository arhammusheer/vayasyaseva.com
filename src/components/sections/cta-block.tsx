import Link from "next/link";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { siteConfig } from "@/content/site";

export function CtaBlock() {
  return (
    <section className="bg-foreground py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-background sm:text-4xl">
            Ready to discuss your workforce requirements?
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-background/70">
            Share your operational needs and we&apos;ll respond with a deployment
            assessment — our target response time is 2 business days (IST, Mon–Sat).
          </p>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-seva text-seva-foreground hover:bg-seva/90 text-base"
            >
              <Link href="/contact">
                Share Your Requirement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 text-sm text-background/60 sm:flex-row sm:gap-6">
            <a
              href={`mailto:${siteConfig.email}`}
              className="flex items-center gap-2 transition-colors hover:text-background/80"
            >
              <Mail className="h-4 w-4" />
              {siteConfig.email}
            </a>
            <a
              href={`tel:${siteConfig.phone}`}
              className="flex items-center gap-2 transition-colors hover:text-background/80"
            >
              <Phone className="h-4 w-4" />
              {siteConfig.phone}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
