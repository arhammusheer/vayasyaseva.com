"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { navigation, siteConfig } from "@/content/site";

const HEADER_HEIGHT = 65;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  const [open, setOpen] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [shouldOverlayVideo, setShouldOverlayVideo] = useState(isHomePage);

  const overlay1Ref = useRef<HTMLDivElement>(null);
  const overlay2Ref = useRef<HTMLDivElement>(null);

  const applyHeroProgress = useCallback((p: number) => {
    const el1 = overlay1Ref.current;
    const el2 = overlay2Ref.current;
    if (!el1 || !el2) return;

    // Layer 1: backdrop blur + background gradient
    const blur = lerp(6, 8, p);
    const sat = lerp(150, 100, p);
    el1.style.backdropFilter = `blur(${blur}px) saturate(${sat}%)`;
    el1.style.setProperty("-webkit-backdrop-filter", `blur(${blur}px) saturate(${sat}%)`);

    const bgTop = lerp(0.12, 0.95, p);
    const bgMid = lerp(0.04, 0.9, p);
    const bgBot = lerp(0, 0.8, p);
    el1.style.background = `linear-gradient(to bottom, rgba(255,255,255,${bgTop}), rgba(255,255,255,${bgMid}), rgba(255,255,255,${bgBot}))`;

    if (p < 0.95) {
      const maskStop = lerp(68, 100, p);
      const mask = `linear-gradient(to bottom, black 0%, black ${maskStop}%, transparent 100%)`;
      el1.style.maskImage = mask;
      el1.style.setProperty("-webkit-mask-image", mask);
    } else {
      el1.style.maskImage = "none";
      el1.style.setProperty("-webkit-mask-image", "none");
    }

    // Layer 2: color accent gradient
    const sevaA = lerp(0.18, 0.08, p);
    const whiteA = lerp(0.05, 0, p);
    const setuA = lerp(0.16, 0.07, p);
    const whiteStop = lerp(40, 42, p);
    el2.style.background = `linear-gradient(112deg, rgba(201,122,43,${sevaA}) 0%, rgba(255,255,255,${whiteA}) ${whiteStop}%, rgba(47,62,92,${setuA}) 100%)`;

    if (p < 0.95) {
      const maskStop2 = lerp(56, 100, p);
      const mask2 = `linear-gradient(to bottom, black 0%, black ${maskStop2}%, transparent 100%)`;
      el2.style.maskImage = mask2;
      el2.style.setProperty("-webkit-mask-image", mask2);
    } else {
      el2.style.maskImage = "none";
      el2.style.setProperty("-webkit-mask-image", "none");
    }
  }, []);

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
        setShouldOverlayVideo(false);
        applyHeroProgress(1);
        return;
      }

      const heroBottom = heroZone.getBoundingClientRect().bottom;
      const transitionZone = Math.min(heroZone.offsetHeight * 0.5, 300);
      const transitionStart = HEADER_HEIGHT + transitionZone;

      let progress: number;
      if (heroBottom >= transitionStart) {
        progress = 0;
      } else if (heroBottom <= HEADER_HEIGHT) {
        progress = 1;
      } else {
        progress = 1 - (heroBottom - HEADER_HEIGHT) / transitionZone;
      }

      // Boolean for text colors — switch at 50%
      const textOverlay = progress < 0.5;
      setShouldOverlayVideo((current) =>
        current === textOverlay ? current : textOverlay
      );

      // Smooth visual transition via refs
      applyHeroProgress(progress);
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
  }, [isHomePage, applyHeroProgress]);

  const showVideoText = isHomePage && shouldOverlayVideo;
  const shouldBlendAtTop = !isHomePage && isAtTop;

  return (
    <header
      className="sticky top-0 z-50 w-full overflow-hidden transition-colors duration-300"
    >
      <div
        ref={isHomePage ? overlay1Ref : undefined}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0",
          !isHomePage && "transition-all duration-300",
          !isHomePage &&
            (shouldBlendAtTop
              ? "bg-gradient-to-b from-background/35 via-background/15 to-transparent backdrop-blur-[5px] [mask-image:linear-gradient(to_bottom,black_0%,black_60%,transparent_100%)]"
              : "bg-gradient-to-b from-background/95 via-background/90 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60")
        )}
      />
      <div
        ref={isHomePage ? overlay2Ref : undefined}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0",
          !isHomePage && "transition-all duration-300",
          !isHomePage &&
            (shouldBlendAtTop
              ? "bg-[linear-gradient(112deg,rgba(201,122,43,0.05)_0%,rgba(255,255,255,0)_40%,rgba(47,62,92,0.04)_100%)] [mask-image:linear-gradient(to_bottom,black_0%,black_50%,transparent_100%)]"
              : "bg-[linear-gradient(112deg,rgba(201,122,43,0.08)_0%,rgba(255,255,255,0)_42%,rgba(47,62,92,0.07)_100%)]")
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
            className={cn(
              "h-9 w-auto origin-top transition-transform duration-300 ease-in-out",
              isHomePage && isAtTop ? "scale-[1.33]" : "scale-100"
            )}
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
                showVideoText
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
              showVideoText
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
                showVideoText && "text-white hover:bg-white/10 hover:text-white"
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
