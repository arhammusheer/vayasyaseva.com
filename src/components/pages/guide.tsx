import { Fragment } from "react";
import Link from "@/components/i18n/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { JsonLd, faqSchema, guideSchema } from "@/lib/structured-data";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { builtLocales, linkable } from "@/content/registry";
import { guidePath } from "@/content/registry/identifiers";
import { siteConfig } from "@/content/site";
import { formatDate } from "@/content/wages";
import { EDITORIAL_HREF } from "@/content/editorial";
import { wageDoors } from "@/content/pages/minimum-wages";
import { citedSources, getGuide, plainText, type Guide, type GuideBlock, type GuideSlug } from "@/content/guides";
import { guideSource, type GuideSource } from "@/content/guides/sources";

/**
 * Guide pages (PLAN §5.6): reference documents with literal headings, ruled
 * tables, numbered citations to primary sources, and the reviewer line.
 * They live in the (reference) layout, so no phone on any of them.
 */

const CITE = /\[\[([a-z0-9-]+)\]\]/;

/** Source numbers follow the guide's `sources` order. A citation that isn't listed fails the build. */
function numbering(guide: Guide) {
  const numbers = new Map(guide.sources.map((id, i) => [id, i + 1]));
  for (const id of citedSources(guide)) {
    if (!numbers.has(id)) throw new Error(`Guide ${guide.slug} cites "${id}" but does not list it in sources`);
  }
  for (const id of guide.sources) {
    if (!citedSources(guide).includes(id)) throw new Error(`Guide ${guide.slug} lists source "${id}" but never cites it`);
  }
  return numbers;
}

/** Text with its [[citations]] turned into numbered links; adjacent citations share one bracket. */
function Cited({ text, numbers }: { text: string; numbers: Map<string, number> }) {
  const parts = text.split(CITE);
  const out: React.ReactNode[] = [];
  let group: number[] = [];
  const flush = (key: number) => {
    if (!group.length) return;
    const ids = [...new Set(group)].sort((a, b) => a - b);
    out.push(
      <span key={`c${key}`} className="cite">
        {ids.map((n, i) => (
          <Fragment key={n}>
            {i > 0 && <span aria-hidden="true">,</span>}
            <a href={`#source-${n}`} aria-label={`Source ${n}`}>
              {n}
            </a>
          </Fragment>
        ))}
      </span>,
    );
    group = [];
  };
  parts.forEach((part, i) => {
    if (i % 2 === 1) group.push(numbers.get(part)!);
    else if (part) {
      flush(i);
      out.push(<Fragment key={i}>{part}</Fragment>);
    }
  });
  flush(parts.length);
  return <>{out}</>;
}

/**
 * Links between guides follow the registry: a published guide links only to
 * published pages; a guide in review may also link to other guides in review,
 * so the reviewer can follow them. A page that isn't built is never linked.
 */
function showLink(href: string, from: Guide) {
  if (!builtLocales(href.split("#")[0]).length) return false;
  return linkable(href.split("#")[0], "en-IN") || !linkable(guidePath(from.slug), "en-IN");
}

export function guideMetadata(slug: GuideSlug) {
  const guide = getGuide(slug);
  return pageMetadata({
    title: guide.title,
    description: guide.description,
    alternates: { canonical: guidePath(slug) },
    locale: "en-IN",
  });
}

function reviewLine(guide: Guide) {
  return guide.review
    ? `Reviewed by ${guide.review.name}, ${guide.review.role} (${guide.review.credentials}), on ${formatDate(guide.review.on)}.`
    : "Legal review pending. This guide has not yet been reviewed by a labour-law practitioner.";
}

function Block({ block, guide, numbers, rowHeading }: { block: GuideBlock; guide: Guide; numbers: Map<string, number>; rowHeading: "h3" | "h4" }) {
  switch (block.type) {
    case "p":
      return (
        <p>
          <Cited text={block.text} numbers={numbers} />
        </p>
      );
    case "h3":
      return <h3>{block.text}</h3>;
    case "vspl":
      return (
        <p className="wage-vspl">
          <Cited text={block.text} numbers={numbers} />
        </p>
      );
    case "link":
      return showLink(block.href, guide) ? (
        <p className="guide-link">
          <Link href={block.href} className="text-link">
            {block.label} <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </p>
      ) : null;
    case "rows": {
      const Heading = rowHeading;
      return (
        <ul className="jobs-work guide-rows">
          {block.items.map((item) => (
            <li key={item.title}>
              <Heading>{item.title}</Heading>
              <p>
                <Cited text={item.text} numbers={numbers} />
              </p>
            </li>
          ))}
        </ul>
      );
    }
    case "table":
      return (
        <div className="guide-table-wrap">
          {/* Explicit roles: on a phone the table is display:block, which drops its semantics in Safari and Chromium. */}
          <table role="table" className={block.columns.length > 3 ? "guide-table is-wide" : "guide-table"}>
            <caption className="sr-only">{block.caption}</caption>
            <thead role="rowgroup">
              <tr role="row">
                {block.columns.map((c, i) => (
                  <th key={i} scope="col" role="columnheader">
                    {c || <span className="sr-only">Question</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody role="rowgroup">
              {block.rows.map((row) => (
                <tr key={row.head} role="row">
                  <th scope="row" role="rowheader">
                    <Cited text={row.head} numbers={numbers} />
                  </th>
                  {row.cells.map((cell, i) => (
                    <td key={i} data-label={block.columns[i + 1]} role="cell">
                      <Cited text={cell} numbers={numbers} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

/** A listing is a web page, so its date is when we checked it, not a publication date. */
function sourceDetail(s: GuideSource) {
  const date = s.kind === "listing" ? `page checked ${formatDate(s.date)}` : formatDate(s.date);
  const parts = [s.number, date, s.authority].filter(Boolean).join(", ");
  const detail = parts.charAt(0).toUpperCase() + parts.slice(1);
  return `${detail}.${s.language === "hi" ? " In Hindi." : ""}${s.url ? "" : " Read from a copy of the gazette notice; no official copy online that we could link, so it is cited by number and date."}`;
}

export function GuidePage({ slug }: { slug: GuideSlug }) {
  const guide = getGuide(slug);
  const numbers = numbering(guide);
  const sources = guide.sources.map(guideSource);
  const path = guidePath(slug);
  const mixed = guide.doors === "mixed";
  return (
    <>
      <JsonLd data={guideSchema(guide, { url: path, sources, headline: guide.title, description: guide.description })} />
      <JsonLd data={faqSchema(guide.faqs.map((f) => ({ question: f.question, answer: plainText(f.answer) })))} />
      {!guide.review && (
        <div className="wage-notice is-stale" role="note">
          <div className="site-shell">
            <p>
              <strong>Draft for legal review.</strong> This guide is not yet listed on the site. It has been checked against
              the sources below, but not yet reviewed by a labour-law practitioner.
            </p>
          </div>
        </div>
      )}
      <PageHero
        crumbs={<Breadcrumbs path={path} locale="en-IN" name={guide.crumb} />}
        title={guide.h1}
        lede={guide.lede}
        aside={
          <dl className="wage-facts">
            {guide.facts.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>
                  {f.value}
                  {f.cite && <Cited text={`[[${f.cite}]]`} numbers={numbers} />}
                </dd>
              </div>
            ))}
            <div>
              <dt>Checked</dt>
              <dd>
                <a href="#how-this-guide-was-checked">
                  {formatDate(guide.checkedOn)}
                  {guide.review ? `, reviewed by ${guide.review.name}` : ", against the Gazette"}
                </a>
              </dd>
            </div>
          </dl>
        }
        footnote={
          <div className="wage-quick-doors">
            <p>
              Hiring for a unit?
              <Link href="/contact" className="text-link">
                Request a crew <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </p>
            {mixed && (
              <p>
                Looking for work?
                <Link href={wageDoors.jobs.link.href} className="text-link">
                  {wageDoors.jobs.link.label} <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </p>
            )}
          </div>
        }
      />
      <nav aria-label="On this page" className="guide-contents">
        <div className="site-shell">
          <p className="eyebrow text-gold-700">ON THIS PAGE</p>
          <ol>
            {guide.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.short ?? s.heading}</a>
              </li>
            ))}
            <li>
              <a href="#questions">Common questions</a>
            </li>
            <li>
              <a href="#how-this-guide-was-checked">Sources and review</a>
            </li>
          </ol>
        </div>
      </nav>
      {guide.sections.map((section, i) => {
        const rowHeading = section.blocks.some((b) => b.type === "h3") ? "h4" : "h3";
        return (
          <Section key={section.id} id={section.id} variant={i % 2 === 1 ? "subtle" : "default"}>
            <div className="wage-split">
              <div>
                <p className="eyebrow text-gold-700">{section.eyebrow}</p>
                <h2 className="wage-h2">{section.heading}</h2>
              </div>
              <div className="wage-prose guide-prose">
                {section.blocks.map((block, j) => (
                  <Block key={j} block={block} guide={guide} numbers={numbers} rowHeading={rowHeading} />
                ))}
              </div>
            </div>
          </Section>
        );
      })}
      <Section id="questions" variant={guide.sections.length % 2 === 1 ? "subtle" : "default"}>
        <div className="wage-split">
          <div>
            <p className="eyebrow text-gold-700">QUESTIONS</p>
            <h2 className="wage-h2">Common questions</h2>
          </div>
          <div className="faq-prose">
            {guide.faqs.map((f) => (
              <div key={f.question}>
                <h3>{f.question}</h3>
                <p>
                  <Cited text={f.answer} numbers={numbers} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>
      <section className="wage-doors" data-header-theme="dark">
        <div className="site-shell wage-doors-inner">
          <div>
            <p className="eyebrow">HIRING FOR A UNIT</p>
            <h2>Need a crew on your site?</h2>
            <p>Tell us the work, the headcount and the shifts.</p>
            <Link href="/contact" className="light-link">
              Request a crew <ArrowUpRight size={19} aria-hidden="true" />
            </Link>
          </div>
          {mixed ? (
            <div>
              <p className="eyebrow">{wageDoors.jobs.eyebrow}</p>
              <h2>{wageDoors.jobs.heading}</h2>
              <p>{wageDoors.jobs.text}</p>
              <Link href={wageDoors.jobs.link.href} className="light-link">
                {wageDoors.jobs.link.label} <ArrowUpRight size={19} aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div>
              <p className="eyebrow">HOW WE WORK</p>
              <h2>From site visit to monthly records.</h2>
              <p>Wages, EPF and ESIC, supervision and replacements.</p>
              <Link href="/services#engagement" className="light-link">
                How an engagement runs <ArrowUpRight size={19} aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </section>
      <Section id="how-this-guide-was-checked" className="border-t border-border">
        <div className="wage-split">
          <div>
            <p className="eyebrow text-gold-700">SOURCES AND REVIEW</p>
            <h2 className="wage-h2">How this guide was checked</h2>
          </div>
          <div className="wage-prose">
            <p className="wage-reviewed">{reviewLine(guide)}</p>
            <p>
              We checked every statement on this page against the documents listed below on {formatDate(guide.checkedOn)}. Each
              number in the text points to the document it comes from. The Codes are cited as Parliament enacted them.
            </p>
            <p>
              This guide explains the law in general terms. For a decision about your own site, check the current
              notification or ask a labour-law adviser.
            </p>
            <p>
              Spotted an error? Email us with the page and the document that shows it:{" "}
              <a href={`mailto:${siteConfig.email}`} className="font-data">
                {siteConfig.email}
              </a>
            </p>
            <Link href={EDITORIAL_HREF} className="text-link">
              Our editorial policy <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
            <h3>Documents cited</h3>
            <ol className="wage-sources">
              {sources.map((s, i) => (
                <li key={s.id} id={`source-${i + 1}`}>
                  {s.url ? (
                    <a href={s.url}>
                      {s.title}
                    </a>
                  ) : (
                    <strong className="guide-source-title">{s.title}</strong>
                  )}
                  <span>{sourceDetail(s)}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>
    </>
  );
}
