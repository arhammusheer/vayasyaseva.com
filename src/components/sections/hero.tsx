import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { hero } from "@/content/home";

export function Hero() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
      <div className="max-w-4xl">
        <Reveal>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-background sm:text-5xl lg:text-6xl">
            {hero.headline}
          </h1>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-background/80 sm:text-xl">
            {hero.subheadline}
          </p>
        </Reveal>
        <Reveal delay={0.16}>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary-hover text-base"
            >
              <Link href={hero.primaryCta.href}>
                {hero.primaryCta.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-background/30 text-gold-600 bg-subtle hover:text-gold-300 hover:bg-gold/10 text-base"
            >
              <Link href={hero.secondaryCta.href}>
                <ClipboardList className="mr-2 h-4 w-4" />
                {hero.secondaryCta.label}
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
