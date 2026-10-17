"use client";
import Image from "next/image";
import NextLink from "next/link";
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
import { FALLBACK_LOCALE, languageLinks, nearestLocalePath, splitLocalePath, type Locale } from "@/lib/i18n";
import {
  BUSINESS_LINKS,
  JOB_HUB_LINKS,
  JOBS_NAV,
  SETU_LOGIN,
  WORK_DOOR,
  jobGroupLinks,
  jobsDoorHref,
  referenceLinks,
  type NavLink,
} from "@/components/layout/nav-links";
import { clusterById } from "@/content/registry";
import { LOCATIONS_PATH, jobsHubPath, type ClusterId } from "@/content/registry/identifiers";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { useAreaDecision } from "@/lib/intent/use-area";
import { noteChoice } from "@/lib/intent/store";
import { MODEL_VERSION } from "@/lib/intent/model";
import { reportChoice } from "@/lib/intent/report";
import { JOBS_AREA_LABEL, businessLabel, jobsAreaHref, orderedJobMarkets } from "@/lib/intent/surfaces";

/** A header link that names an area: clicking it records the visitor's pick. */
/**
 * A link to one market. `pick`: its label names the market, so following it
 * is an explicit pick (remembered, src/lib/intent/store.ts). An unlabelled
 * door ("Jobs") is not; it is still reported, as surface "jobs-door".
 */
type AreaLink = NavLink & { neutral?: boolean; cluster?: string; surface?: "business" | "jobs" | "jobs-door"; pick?: boolean; position?: number };

/**
 * "Request a crew" on business pages, in the page's language. The Hindi and
 * Hinglish labels name the company, so a seeker does not read them as
 * "workers wanted" (drafts for native review).
 */
const CREW_LABEL: Record<Locale, string> = {
  "en-IN": "Request a crew",
  "hi-IN": "कंपनी के लिए कामगार",
  "hi-Latn-IN": "Company ke liye workers",
  "pa-IN": "ਕੰਪਨੀ ਲਈ ਕਾਮੇ",
};

/** The quick switch's "More" (languages outside the page's regional set). */
const MORE_LABEL: Record<Locale, string> = { "en-IN": "More", "hi-IN": "और भाषाएँ", "hi-Latn-IN": "Aur bhasha", "pa-IN": "ਹੋਰ ਭਾਸ਼ਾਵਾਂ" };

/** Legal pages sit in the reference layout (no phone) but take the business header. */
const LEGAL = new Set(["/privacy", "/terms"]);

/**
 * Which section the page belongs to; each has its own header. Business:
 * four pages, the Jobs door (in the phone bar too on Hindi and Hinglish
 * pages), the phone (wide screens) and Request a crew.
 * Reference (wages, guides): Minimum wages and the two doors, no phone and
 * no button. Jobs: languages, the "For businesses" door and Apply, and
 * never a phone.
 */
export type HeaderDoor = "business" | "jobs" | "reference";

/**
 * The business line, passed in by the business layout only. This component
 * must not import it (eslint.config.mjs): a jobs or reference layout cannot
 * hand it a phone, so it cannot show one there.
 */
export type HeaderPhone = { display: string; href: string };

/** A menu row: one link, or several on one line, with an optional lead-in. */
type SheetRow = { links: (NavLink & { neutral?: boolean })[]; lead?: string; lang?: string };

export function Header({ door = "business", phone }: { door?: HeaderDoor; phone?: HeaderPhone }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const moreRef = useRef<HTMLDetailsElement>(null);

  // The quick switch's "More" closes on Escape, a tap outside it, and a new
  // page (the header stays mounted across client navigations).
  useEffect(() => {
    const more = moreRef.current;
    if (!more) return;
    more.open = false;
    const close = (event: Event) => {
      if (!more.open) return;
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !more.contains(event.target as Node)) more.open = false;
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", close);
    };
  }, [pathname]);

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
  // The page's regional languages in the bar; any others under "More"
  // (the menu on phones lists them all).
  const languages = languageLinks(pathname);
  const quick = languages.filter((l) => !l.more);
  const more = languages.filter((l) => l.more);
  // The business and reference headers are English; links follow the
  // page's language where they can. The jobs header is in the page's language.
  const split = splitLocalePath(pathname);
  const pageLocale = split.locale ?? FALLBACK_LOCALE;
  const path = split.path;
  // Which area(s) to show (src/lib/intent): the no-signal default until
  // the page has loaded, then the visitor's intent, or both when their
  // region and intent disagree with no clear winner.
  const area = useAreaDecision(path);
  const isHome = path === "/";
  const view: HeaderDoor = door === "reference" && LEGAL.has(path) ? "business" : door;
  const isJobs = view === "jobs";
  // The number is the business line, and only the business layout passes it.
  const showPhone = view === "business" && phone;
  const pageLang = pageLocale === "en-IN" ? undefined : pageLocale;
  const t = JOBS_NAV[pageLocale];
  // Doors to the other sections. A jobs door opens the decided market's
  // hub, or /jobs (every market) when nothing is decided; neutral from
  // English pages. "For businesses" opens the home page.
  // Reference pages keep them English, as their footer does.
  const doorLocale = view === "reference" ? FALLBACK_LOCALE : pageLocale;
  const doorLang = doorLocale === "en-IN" ? undefined : doorLocale;
  const work = WORK_DOOR[doorLocale];
  const jobsDoors: AreaLink[] = area.jobs.length
    ? area.jobs.map((id) => ({
        href: jobsAreaHref(id, doorLocale),
        label: area.jobs.length > 1 ? (JOBS_AREA_LABEL[doorLocale][id] ?? work.label) : work.label,
        lang: doorLang,
        neutral: true,
        cluster: id,
        surface: area.jobs.length > 1 ? ("jobs" as const) : ("jobs-door" as const),
        pick: area.jobs.length > 1,
      }))
    : [{ href: jobsDoorHref(doorLocale), label: work.label, lang: doorLang, neutral: true }];
  // The business bar's area slot: the buyer page(s) of the decided area, or
  // Locations (every market) when nothing is decided.
  const areaLinks: AreaLink[] = area.business
    .map((id) => ({ id, hub: clusterById(id)?.buyerHub }))
    .filter((a): a is { id: string; hub: string } => Boolean(a.hub))
    .map(({ id, hub }, i) => ({ href: hub, label: businessLabel(id), cluster: id, surface: "business" as const, pick: true, position: i + 1 }));
  const businessLinks: AreaLink[] = BUSINESS_LINKS.flatMap((l) => (l.href === LOCATIONS_PATH && areaLinks.length ? areaLinks : [l]));
  // Every market's jobs hub in the jobs menu, the decided ones first.
  const jobsHubs = orderedJobMarkets(area.jobs).map((id, i) => ({
    href: nearestLocalePath(jobsHubPath(id as Exclude<ClusterId, "other">), pageLocale),
    label: JOBS_AREA_LABEL[pageLocale][id] ?? clusterById(id)?.name[pageLocale] ?? clusterById(id)?.name["en-IN"] ?? id,
    cluster: id,
    surface: "jobs" as const,
    pick: true,
    position: i + 1,
  }));
  // Apply: the decided market's hub (its form), else the form that asks
  // which market (/jobs/apply).
  const applyHref = area.jobs.length ? jobsHubs[0].href : nearestLocalePath("/jobs/apply", pageLocale);
  const businessDoor = { href: "/", label: JOBS_NAV[doorLocale].business, lang: doorLang };
  const jobsHome = nearestLocalePath("/jobs", pageLocale);
  const nav: { bar: NavLink[]; doors: SheetRow["links"]; sheet: SheetRow[]; more: SheetRow[]; cta?: NavLink } =
    view === "jobs"
      ? {
          // "All jobs" is the logo; "No fee" is in the menu, the footer and
          // the form, not the bar.
          bar: [],
          doors: [businessDoor],
          sheet: [
            { links: jobsHubs },
            ...jobGroupLinks(pageLocale).map((g) => ({ links: [g] })),
            { links: JOB_HUB_LINKS[pageLocale].map((h) => ({ href: nearestLocalePath(`/jobs/${h.slug}`, pageLocale), label: h.label })) },
          ],
          more: [
            { links: [{ href: nearestLocalePath("/jobs/fees-and-fraud", pageLocale), label: t.fee }] },
            { links: [businessDoor] },
          ],
          cta: { href: applyHref, label: t.apply },
        }
      : view === "reference"
        ? {
            bar: referenceLinks().slice(0, 1),
            doors: [businessDoor, ...jobsDoors],
            sheet: referenceLinks().map((l) => ({ links: [l] })),
            more: [{ links: [businessDoor] }, { links: jobsDoors }],
          }
        : {
            bar: businessLinks,
            doors: jobsDoors,
            sheet: businessLinks.map((l) => ({ links: [l] })),
            // Setu login stays here for returning clients: the Setu page's
            // traffic is mostly people looking for it.
            more: [
              { lead: work.lead, lang: doorLang, links: jobsDoors },
              { links: [{ href: SETU_LOGIN, label: "Setu login ↗" }] },
            ],
            cta: { href: "/contact", label: CREW_LABEL[pageLocale], lang: pageLang },
          };
  const current = (href: string) => (href === pathname || href === path ? "page" : undefined);
  // Jobs pages: links a job seeker rarely follows are not prefetched, to
  // spare data on patchy 4G (as in the jobs footer).
  const prefetch = isJobs ? false : undefined;
  // Apply opens /jobs/haridwar, the one form page. A jobs page with the
  // form on it (#apply: /jobs/haridwar, role and hub pages) scrolls to that
  // form instead, keeping the role it pre-selects. /jobs/apply is left for
  // agent and legacy links.
  const applyHere = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!isJobs || href !== applyHref) return;
    const form = document.getElementById("apply");
    if (!form) return;
    event.preventDefault();
    setOpen(false);
    form.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    form.querySelector<HTMLElement>(".quick-question")?.focus({ preventScroll: true });
  };
  // One link in the bar or the menu: external, neutral (no locale added),
  // or an in-site link through the i18n Link.
  // An area link remembers the pick and reports it (area_nav_click).
  const picked = (item: AreaLink, then?: () => void) => () => {
    if (item.cluster) {
      if (item.pick) {
        noteChoice(item.cluster);
        reportChoice(item.cluster, item.surface === "business" ? area.business : area.jobs, item.surface ?? "business");
      }
      // What the visitor followed, beside what the site had decided, so the
      // decision's accuracy can be measured (docs/area-intent.md).
      const decided = item.surface === "business" ? area.business : area.jobs;
      trackAnalyticsEvent("area_nav_click", {
        cluster: item.cluster,
        surface: item.surface ?? "business",
        mode: area.mode,
        decided: decided.join("+") || "none",
        is_decided: decided.includes(item.cluster) ? "yes" : "no",
        position: item.position ?? 0,
        explicit: item.pick ? "yes" : "no",
        v: MODEL_VERSION,
      });
    }
    then?.();
  };
  const navLink = (item: AreaLink, extra: { className?: string; onClick?: () => void } = {}) =>
    item.href.startsWith("http") ? (
      <a key={item.href} href={item.href} className={extra.className}>
        {item.label}
      </a>
    ) : item.neutral ? (
      <NextLink key={item.href} href={item.href} lang={item.lang} prefetch={false} className={extra.className} onClick={picked(item, extra.onClick)}>
        {item.label}
      </NextLink>
    ) : (
      <Link
        key={item.href}
        href={item.href}
        lang={item.lang}
        prefetch={prefetch}
        className={extra.className}
        onClick={picked(item, extra.onClick)}
        aria-current={current(item.href)}
      >
        {item.label}
      </Link>
    );
  const close = () => setOpen(false);
  return (
    <header
      ref={headerRef}
      className="site-header"
      lang={isJobs ? pageLocale : "en-IN"}
      data-door={view}
      data-locale={pageLocale}
      data-theme={isHome ? "dark" : "light"}
      data-home={isHome ? "true" : undefined}
      data-clear={isHome ? "true" : undefined}
      data-top="true"
    >
      <a href="#main-content" className="skip-link">
        {!isJobs || pageLocale === "en-IN" ? "Skip to content" : pageLocale === "hi-IN" ? "सीधे पेज पर जाएँ" : pageLocale === "pa-IN" ? "ਸਿੱਧੇ ਪੰਨੇ 'ਤੇ ਜਾਓ" : "Seedhe page par jaayein"}
      </a>
      <div className="site-shell header-inner">
        <Link
          href={isJobs ? jobsHome : "/"}
          aria-label={isJobs ? t.logo : "Vayasya Seva home"}
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
        {nav.bar.length > 0 && (
          <nav aria-label="Main navigation" className="desktop-nav">
            {nav.bar.map((item) => navLink(item))}
          </nav>
        )}
        <div className="header-end">
          {languages.length > 0 && (
            <nav aria-label={isJobs ? t.language : "Language"} className="header-lang">
              {quick.map((l) => (
                <Link key={l.href} href={l.href} lang={l.lang} hrefLang={l.lang} title={l.hint} prefetch={false}>
                  {l.label}
                </Link>
              ))}
              {more.length > 0 && (
                <details className="header-lang-more" ref={moreRef}>
                  <summary lang={isJobs ? pageLocale : "en-IN"}>{MORE_LABEL[isJobs ? pageLocale : "en-IN"]}</summary>
                  <div>
                    {more.map((l) => (
                      <Link key={l.href} href={l.href} lang={l.lang} hrefLang={l.lang} title={l.hint} prefetch={false}>
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </details>
              )}
            </nav>
          )}
          <nav aria-label={isJobs ? t.sections : "Site sections"} className="header-doors">
            {nav.doors.map((d) => navLink(d))}
          </nav>
          {showPhone && (
            <a className="header-phone" href={phone.href}>
              {phone.display}
            </a>
          )}
          {nav.cta && (
            <Link
              href={nav.cta.href}
              className="header-contact"
              lang={nav.cta.lang}
              prefetch={prefetch}
              onClick={(event) => applyHere(event, nav.cta!.href)}
              aria-current={current(nav.cta.href)}
            >
              {nav.cta.label} <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="mobile-menu" aria-label={isJobs ? t.openMenu : "Open navigation"}>
              <Menu size={24} />
            </SheetTrigger>
            <SheetContent className="w-[min(360px,90vw)] p-7" lang={isJobs ? pageLang : "en-IN"}>
              <SheetTitle className="mt-8 text-2xl">{isJobs ? t.menu : "Vayasya Seva"}</SheetTitle>
              <nav aria-label={isJobs ? t.menu : "Mobile navigation"} className="sheet-nav">
                {nav.sheet.map((row) => (
                  <p key={row.links[0].href} className="sheet-row">
                    {row.links.map((item) => navLink(item, { onClick: close }))}
                  </p>
                ))}
              </nav>
              <nav aria-label={isJobs ? t.more : "More"} className="sheet-more">
                {nav.more.map((row) => (
                  <p key={row.links[0].href} lang={row.lang}>
                    {row.lead && <span>{row.lead} </span>}
                    {row.links.map((item) => navLink(item, { onClick: close }))}
                  </p>
                ))}
              </nav>
              {!isJobs && languages.length > 0 && (
                <nav aria-label="Language" className="sheet-lang">
                  {languages.map((l) => (
                    <Link key={l.href} href={l.href} lang={l.lang} hrefLang={l.lang} title={l.hint} prefetch={false} onClick={close}>
                      {l.label}
                    </Link>
                  ))}
                </nav>
              )}
              {showPhone && (
                <a href={phone.href} className="sheet-phone font-data">
                  {phone.display}
                </a>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
