import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <section className="site-shell py-24 sm:py-32">
          <p className="eyebrow text-gold-700">404</p>
          <h1 className="mt-5 text-5xl font-medium leading-[1.04] tracking-[-0.03em] sm:text-6xl">
            Page not found.
          </h1>
          <p className="mt-5 max-w-sm text-lg leading-relaxed text-muted-foreground">
            There is nothing at this address. The page may have moved, or the
            link may be out of date.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/">Home</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">Contact</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
