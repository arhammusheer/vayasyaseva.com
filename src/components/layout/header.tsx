"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { navigation, siteConfig } from "@/content/site";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Sample only the surfaces behind the header. Blend at section boundaries,
  // without React renders or changing the blur radius during scroll.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const surfaces = Array.from(
      document.querySelectorAll<HTMLElement>("main section, footer"),
    )
      .filter((el) => !el.parentElement?.closest("section"))
      .map((el) => {
        const rgb = getComputedStyle(el)
          .backgroundColor.match(/[\d.]+/g)
          ?.map(Number);
        return {
          el,
          color:
            rgb && rgb.length >= 3 && rgb[3] !== 0
              ? rgb.slice(0, 3)
              : [255, 255, 255],
        };
      });
    let frame = 0;
    const update = () => {
      frame = 0;
      const height = header.offsetHeight;
      let covered = 0;
      const mixed = [0, 0, 0];
      let heroOverlap = 0;
      for (const { el, color } of surfaces) {
        const rect = el.getBoundingClientRect();
        const overlap = Math.max(
          0,
          Math.min(height, rect.bottom) - Math.max(0, rect.top),
        );
        if (!overlap) continue;
        covered += overlap;
        color.forEach((channel, i) => (mixed[i] += channel * overlap));
        if (el.classList.contains("home-hero")) heroOverlap = overlap / height;
      }
      const rgb = mixed.map((channel) =>
        Math.round((channel + Math.max(0, height - covered) * 255) / height),
      );
      const dark = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 < 140;
      header.style.setProperty(
        "--header-surface",
        `rgba(${rgb.join(",")},${heroOverlap > 0.95 ? 0.36 : 0.94})`,
      );
      header.dataset.theme = dark ? "dark" : "light";
      header.dataset.gold = String(rgb[0] > 190 && rgb[1] > 120 && rgb[1] < 200 && rgb[2] < 100);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pathname]);
  const primary = navigation.filter((item) =>
    [
      "/services",
      "/industries",
      "/how-we-operate",
      "/compliance",
      "/about",
    ].includes(item.href),
  );
  return (
    <header
      ref={headerRef}
      className="site-header"
      data-theme={pathname === "/" ? "dark" : "light"}
    >
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className="site-shell header-inner">
        <Link href="/" aria-label="Vayasya Seva home" className="brand-lockup">
          <Image
            src="/brand/logos/master-logo-light.svg"
            alt=""
            width={48}
            height={48}
            priority
          />
          <span>
            Vayasya Seva<span className="brand-caption">Private Limited</span>
          </span>
        </Link>
        <nav aria-label="Main navigation" className="desktop-nav">
          {primary.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.href === "/how-we-operate" ? "Our approach" : item.label}
            </Link>
          ))}
        </nav>
        <a
          className="header-phone"
          href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
        >
          {siteConfig.phone}
        </a>
        <Link href="/contact" className="header-contact">
          Let’s talk <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="mobile-menu" aria-label="Open navigation">
            <Menu size={24} />
          </SheetTrigger>
          <SheetContent className="w-[min(360px,90vw)] p-7">
            <SheetTitle className="mt-8 text-2xl">Vayasya Seva</SheetTitle>
            <nav aria-label="Mobile navigation" className="flex flex-col mt-8">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className="border-b py-3 text-lg"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <a
              href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
              className="mt-6 text-sm"
            >
              {siteConfig.phone}
            </a>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
