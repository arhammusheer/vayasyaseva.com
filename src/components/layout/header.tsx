"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { navigation, siteConfig } from "@/content/site";

const HEADER_HEIGHT = 65;

export function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  const [open, setOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [onHeroVideo, setOnHeroVideo] = useState(isHomePage);

  useEffect(() => {
    let frame = 0;

    const updateTopState = () => {
      const nextIsAtTop = window.scrollY <= 4;
      setIsAtTop((current) => (current === nextIsAtTop ? current : nextIsAtTop));
    };

    const requestUpdate = () => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateTopState);
    };

    requestUpdate();

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  useEffect(() => {
    if (!isHomePage) return;

    let frame = 0;

    const updateHeaderMode = () => {
      const heroZone = document.getElementById("hero-zone");
      if (!heroZone) {
        setOnHeroVideo(false);
        return;
      }

      const shouldOverlay = heroZone.getBoundingClientRect().bottom > HEADER_HEIGHT;
      setOnHeroVideo((current) => (current === shouldOverlay ? current : shouldOverlay));
    };

    const requestUpdate = () => {
      cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateHeaderMode);
    };

    requestUpdate();

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [isHomePage]);

  const shouldOverlayVideo = isHomePage && onHeroVideo;
  const shouldBlendAtTop = !isHomePage && isAtTop;

  return (
    <header
      className="sticky top-0 z-50 w-full overflow-hidden transition-colors duration-300"
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 transition-all duration-300",
          shouldOverlayVideo
            ? "bg-gradient-to-b from-white/12 via-white/4 to-transparent backdrop-blur-[6px] backdrop-saturate-150 [mask-image:linear-gradient(to_bottom,black_0%,black_68%,transparent_100%)]"
            : shouldBlendAtTop
              ? "bg-gradient-to-b from-background/96 via-background/86 to-transparent backdrop-blur-[8px] [mask-image:linear-gradient(to_bottom,black_0%,black_72%,transparent_100%)]"
              : "bg-gradient-to-b from-background/95 via-background/90 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        )}
      />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 transition-all duration-300",
          shouldOverlayVideo
            ? "bg-[linear-gradient(112deg,rgba(201,122,43,0.18)_0%,rgba(255,255,255,0.05)_40%,rgba(47,62,92,0.16)_100%)] [mask-image:linear-gradient(to_bottom,black_0%,black_56%,transparent_100%)]"
            : shouldBlendAtTop
              ? "bg-[linear-gradient(112deg,rgba(201,122,43,0.1)_0%,rgba(255,255,255,0)_40%,rgba(47,62,92,0.08)_100%)] [mask-image:linear-gradient(to_bottom,black_0%,black_62%,transparent_100%)]"
              : "bg-[linear-gradient(112deg,rgba(201,122,43,0.08)_0%,rgba(255,255,255,0)_42%,rgba(47,62,92,0.07)_100%)]"
        )}
      />

      <div className="relative z-10 mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/brand/logos/master-logo-light.svg"
            alt={siteConfig.legalName}
            width={140}
            height={36}
            className="h-9 w-auto"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                shouldOverlayVideo
                  ? "text-white/85 hover:text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={`tel:${siteConfig.phone}`}
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium transition-colors",
              shouldOverlayVideo
                ? "text-white/85 hover:text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Phone className="h-4 w-4" />
            {siteConfig.phone}
          </a>
          <Button asChild size="sm">
            <Link href="/contact">Get in Touch</Link>
          </Button>
        </div>

        {/* Mobile Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                shouldOverlayVideo && "text-white hover:bg-white/10 hover:text-white"
              )}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[350px]">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <nav className="flex flex-col gap-1 pt-8">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2.5 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-4 border-t pt-4">
                <a
                  href={`tel:${siteConfig.phone}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground"
                >
                  <Phone className="h-4 w-4" />
                  {siteConfig.phone}
                </a>
                <Button asChild className="mt-2 w-full">
                  <Link href="/contact" onClick={() => setOpen(false)}>
                    Get in Touch
                  </Link>
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
