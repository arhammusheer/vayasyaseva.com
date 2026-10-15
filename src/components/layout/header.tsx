"use client";
import Image from "next/image";
import Link from "@/components/i18n/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { navigation } from "@/content/site";
import { FALLBACK_LOCALE, languageLinks, localePath, splitLocalePath, type Locale } from "@/lib/i18n";

/** The jobs link follows the page's language (docs/plan-worker-pipeline.md). */
const JOBS_LABEL = { "en-IN": "Jobs", "hi-IN": "नौकरी", "hi-Latn-IN": "Jobs" } as const;

/** The jobs header, in the page's language. "For businesses" is the door back to the business site. */
const JOBS_NAV: Record<Locale, { all: string; fraud: string; business: string; apply: string; menu: string }> = {
  "en-IN": { all: "All jobs", fraud: "Fees and fraud", business: "For businesses", apply: "Apply", menu: "Jobs" },
  "hi-IN": { all: "सभी नौकरियाँ", fraud: "फ़ीस और धोखा", business: "कंपनियों के लिए", apply: "आवेदन करें", menu: "नौकरी" },
  "hi-Latn-IN": { all: "Sabhi jobs", fraud: "Fee aur fraud", business: "Companies ke liye", apply: "Apply karein", menu: "Jobs" },
};

/**
 * Which door the page belongs to. Business pages show the Jobs door and the
 * phone; jobs pages show the "For businesses" door and no phone; reference
 * pages (wages, guides) show both doors and no phone.
 */
export type HeaderDoor = "business" | "jobs" | "reference";

/**
 * The business line, passed in by the business layout only. This component
 * must not import it (eslint.config.mjs): a jobs or reference layout cannot
 * hand it a phone, so it cannot show one there.
 */
export type HeaderPhone = { display: string; href: string };

export function Header({ door = "business", phone }: { door?: HeaderDoor; phone?: HeaderPhone }) {
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
        const color =
          rgb && rgb.length >= 3 && rgb[3] !== 0
            ? rgb.slice(0, 3)
            : [255, 255, 255];
        // Gold surfaces read as dark navy so the header never turns gold
        // behind the gold logo and pill.
        const gold =
          color[0] > 190 && color[1] > 120 && color[1] < 200 && color[2] < 100;
        return { el, color: gold ? [15, 23, 42] : color };
      });
    let frame = 0;
    const update = () => {
      frame = 0;
      const height = header.offsetHeight;
      let covered = 0;
      const mixed = [0, 0, 0];
      let heroOverlap = 0;
      // Inner pages start below the header, so nothing sits under it at the
      // top; fill the gap with the surface directly beneath instead of white.
      let fill = [255, 255, 255];
      let fillTop = Infinity;
      for (const { el, color } of surfaces) {
        const rect = el.getBoundingClientRect();
        if (rect.top >= 0 && rect.top < fillTop) {
          fillTop = rect.top;
          fill = color;
        }
        const overlap = Math.max(
          0,
          Math.min(height, rect.bottom) - Math.max(0, rect.top),
        );
        if (!overlap) continue;
        covered += overlap;
        color.forEach((channel, i) => (mixed[i] += channel * overlap));
        if (el.classList.contains("home-hero")) heroOverlap = overlap / height;
      }
      const rgb = mixed.map((channel, i) =>
        Math.round((channel + Math.max(0, height - covered) * fill[i]) / height),
      );
      const dark = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 < 140;
      // Fully over the hero photo the header goes clear: no plate, no blur.
      const overHero = heroOverlap > 0.95;
      header.style.setProperty(
        "--header-surface",
        `rgba(${rgb.join(",")},${overHero ? 0 : covered ? 0.94 : 1})`,
      );
      header.dataset.clear = String(overHero);
      // Inside the hero the bar has no plate, so instead of sliding its
      // logo and links across the headline it tucks away until the hero ends.
      header.dataset.hidden = String(overHero && window.scrollY > 24);
      header.dataset.theme = dark ? "dark" : "light";
      header.dataset.top = String(window.scrollY <= 4);
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
  const languages = languageLinks(pathname);
  // The business header is English; links follow the page's language where
  // they can. The jobs header is in the page's language.
  const split = splitLocalePath(pathname);
  const pageLocale = split.locale ?? FALLBACK_LOCALE;
  const path = split.path;
  const isHome = path === "/";
  // The number is the business line, and only the business layout passes it.
  const showPhone = door === "business" && phone;
  const pageLang = pageLocale === "en-IN" ? undefined : pageLocale;
  type NavLink = { href: string; label: string; lang?: string };
  const jobsDoor: NavLink = { href: localePath("/jobs/apply", pageLocale), label: JOBS_LABEL[pageLocale], lang: pageLocale === "hi-IN" ? "hi-IN" : undefined };
  const t = JOBS_NAV[pageLocale];
  const nav: { desktop: NavLink[]; sheet: NavLink[]; cta: NavLink } =
    door === "jobs"
      ? {
          desktop: [
            { href: localePath("/jobs", pageLocale), label: t.all },
            { href: localePath("/jobs/fees-and-fraud", pageLocale), label: t.fraud },
            { href: "/", label: t.business },
          ],
          sheet: [
            { href: localePath("/jobs", pageLocale), label: t.all },
            { href: localePath("/jobs/apply", pageLocale), label: t.apply },
            { href: localePath("/jobs/fees-and-fraud", pageLocale), label: t.fraud },
            { href: "/", label: t.business },
          ],
          cta: { href: localePath("/jobs/apply", pageLocale), label: t.apply },
        }
      : {
          desktop: [
            ...navigation
              .filter((item) => ["/services", "/industries", "/how-we-operate", "/compliance", "/about"].includes(item.href))
              .map((item) => ({ href: item.href, label: item.href === "/how-we-operate" ? "Our approach" : item.label })),
            jobsDoor,
          ],
          sheet: [...navigation, jobsDoor],
          cta: { href: "/contact", label: "Let’s talk" },
        };
  const current = (href: string) => (href === pathname || href === path ? "page" : undefined);
  return (
    <header
      ref={headerRef}
      className="site-header"
      lang={door === "jobs" ? pageLocale : "en-IN"}
      data-door={door}
      data-theme={isHome ? "dark" : "light"}
      data-home={isHome ? "true" : undefined}
      data-clear={isHome ? "true" : undefined}
      data-top="true"
    >
      <a href="#main-content" className="skip-link">
        {door !== "jobs" || pageLocale === "en-IN" ? "Skip to content" : pageLocale === "hi-IN" ? "सीधे पेज पर जाएँ" : "Seedhe page par jaayein"}
      </a>
      <div className="site-shell header-inner">
        <Link
          href={door === "jobs" ? localePath("/jobs", pageLocale) : "/"}
          aria-label={door === "jobs" ? "Vayasya Seva jobs" : "Vayasya Seva home"}
          className="brand-lockup"
        >
          <Image
            src="/brand/logos/master-logo-light.svg"
            alt=""
            width={48}
            height={48}
            priority
          />
        </Link>
        <nav aria-label="Main navigation" className="desktop-nav">
          {nav.desktop.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              lang={item.lang}
              aria-current={current(item.href)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {showPhone && (
          <a className="header-phone" href={phone.href}>
            {phone.display}
          </a>
        )}
        {languages.length > 0 && (
          <nav aria-label="Language" className="header-lang">
            {languages.map((l) => (
              <Link key={l.href} href={l.href} lang={l.lang} hrefLang={l.lang}>
                {l.label}
              </Link>
            ))}
          </nav>
        )}
        <Link href={nav.cta.href} className="header-contact" aria-current={current(nav.cta.href)}>
          {nav.cta.label} <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="mobile-menu" aria-label="Open navigation">
            <Menu size={24} />
          </SheetTrigger>
          <SheetContent className="w-[min(360px,90vw)] p-7" lang={door === "jobs" ? pageLang : undefined}>
            <SheetTitle className="mt-8 text-2xl">{door === "jobs" ? t.menu : "Vayasya Seva"}</SheetTitle>
            <nav aria-label="Mobile navigation" className="flex flex-col mt-8">
              {nav.sheet.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  lang={item.lang}
                  onClick={() => setOpen(false)}
                  aria-current={current(item.href)}
                  className="border-b py-3 text-lg"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            {showPhone && (
              <a href={phone.href} className="mt-6 text-sm">
                {phone.display}
              </a>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
