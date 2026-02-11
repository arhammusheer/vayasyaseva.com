import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hero } from "@/content/home";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_-20%,rgba(201,122,43,0.05),transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="max-w-3xl">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {hero.headline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {hero.subheadline}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button asChild size="lg" className="text-base">
              <Link href={hero.primaryCta.href}>
                {hero.primaryCta.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <Link href={hero.secondaryCta.href}>
                <Calendar className="mr-2 h-4 w-4" />
                {hero.secondaryCta.label}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
