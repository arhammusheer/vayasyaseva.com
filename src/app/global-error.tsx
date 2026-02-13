"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { brandDisplay, brandMono, brandSerif } from "@/lib/fonts";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        className={`${brandDisplay.variable} ${brandSerif.variable} ${brandMono.variable} font-serif antialiased`}
      >
        <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-start justify-center bg-background px-6 sm:px-12">
          <Link href="/">
            <Image
              src="/brand/logos/master-logo-dark.svg"
              alt="Vayasya Seva Private Limited"
              width={180}
              height={46}
              className="h-10 w-auto"
              priority
            />
          </Link>

          <div className="mt-12">
            <p className="font-data text-6xl font-medium text-danger">
              500
            </p>
            <h1 className="mt-4 text-2xl font-semibold text-foreground">
              Something went wrong
            </h1>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              An unexpected error occurred. Please try again or contact us if
              the problem persists.
            </p>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <Button onClick={reset}>Try Again</Button>
            <Button asChild variant="outline">
              <Link href="/">Return to Home</Link>
            </Button>
          </div>

          <p className="mt-16 text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Vayasya Seva Private Limited
          </p>
        </div>
      </body>
    </html>
  );
}
