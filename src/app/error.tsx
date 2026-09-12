"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="site-shell flex min-h-screen flex-col justify-center py-24">
      <Link href="/" aria-label="Vayasya Seva home" className="inline-block">
        <Image
          src="/brand/logos/master-logo-light.svg"
          alt=""
          width={44}
          height={44}
          priority
        />
      </Link>
      <p className="eyebrow mt-12 text-gold-700">ERROR</p>
      <h1 className="mt-5 text-5xl font-medium leading-[1.04] tracking-[-0.03em] sm:text-6xl">
        Something went wrong.
      </h1>
      <p className="mt-5 max-w-sm text-lg leading-relaxed text-muted-foreground">
        The page failed to load. Try again, or call us on +91 72920 14101.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
