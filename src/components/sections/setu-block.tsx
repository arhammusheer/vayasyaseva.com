import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setuFeatures } from "@/content/home";

export function SetuBlock() {
  return (
    <section
      id="vayasya-setu"
      data-header-theme="dark"
      className="corrugated-setu relative overflow-hidden bg-setu-900 py-20 text-background sm:py-24 lg:py-32"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <h2 className="text-balance text-[2.25rem] font-bold leading-[1.02] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
              Vayasya <span className="text-setu-300">Setu</span>
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-background/75 sm:text-xl">
              The software we run our operations on. It holds attendance, ESIC
              and EPF status, payroll inputs, and the reports you receive. You
              don&apos;t log in to it; you get the output.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-12 bg-background px-6 text-base text-setu-900 hover:bg-setu-100"
            >
              <Link href="/vayasya-setu">
                What Setu produces
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <dl className="grid gap-x-8 sm:grid-cols-2 lg:col-span-7">
            {setuFeatures.map((feature, i) => (
              <div
                key={feature.title}
                className="border-t border-background/20 py-5"
              >
                <dt className="flex items-baseline gap-3">
                  <span className="font-data text-xs text-setu-300 tabular">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-lg font-semibold">{feature.title}</span>
                </dt>
                <dd className="mt-1.5 pl-8 text-sm leading-relaxed text-background/65">
                  {feature.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
