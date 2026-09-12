import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-start justify-center bg-white px-6 sm:px-12">
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
        <p className="font-data text-6xl font-medium text-gold-700">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-foreground">
          Page not found
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          There is nothing at this address.
        </p>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <Button asChild>
          <Link href="/">Home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/contact">Contact</Link>
        </Button>
      </div>

      <p className="mt-16 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Vayasya Seva Private Limited
      </p>
    </div>
  );
}
