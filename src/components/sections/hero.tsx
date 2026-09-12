import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hero, proofRail } from "@/content/home";

export function Hero() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-32 lg:px-8 lg:pb-24 lg:pt-40">
      <div className="max-w-5xl">
        <h1 className="rise rise-1 text-balance text-[2.5rem] font-bold leading-[1.02] tracking-[-0.03em] text-background sm:text-6xl lg:text-[5.5rem]">
          {hero.headline}
        </h1>
        <p className="rise rise-2 mt-8 max-w-2xl text-lg leading-relaxed text-background/80 sm:text-xl">
          {hero.subheadline}
        </p>
        <div className="rise rise-3 mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Button
            asChild
            size="lg"
            className="h-12 bg-gold-500 px-6 text-base text-neutral-900 hover:bg-gold-400"
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
            className="h-12 border-background/40 bg-transparent px-6 text-base text-background hover:bg-background/10 hover:text-background"
          >
            <Link href={hero.secondaryCta.href}>
              <ClipboardList className="mr-2 h-4 w-4" />
              {hero.secondaryCta.label}
            </Link>
          </Button>
        </div>
      </div>

      <p className="rise rise-4 mt-16 flex flex-wrap items-center gap-x-3 gap-y-1 font-data text-xs uppercase tracking-[0.18em] text-background/60 sm:mt-24">
        {proofRail.map((item, i) => (
          <span key={item.label} className="flex items-center gap-3">
            {i > 0 && <span aria-hidden="true" className="h-1 w-1 bg-gold-500" />}
            <span>
              <span className="text-gold-400">{item.label}</span> {item.value}
            </span>
          </span>
        ))}
      </p>
    </div>
  );
}
