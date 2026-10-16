import { Fragment } from "react";
import Link from "@/components/i18n/link";
import { ArrowRight } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { JsonLd, faqSchema, guideSchema } from "@/lib/structured-data";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { builtLocales, linkable } from "@/content/registry";
import { guidePath } from "@/content/registry/identifiers";
import { formatDate } from "@/content/wages";
import { EDITORIAL_HREF } from "@/content/editorial";
import { wageDoors } from "@/content/pages/minimum-wages";
import { blockTexts, citedSources, citesIn, getGuide, plainText, type Guide, type GuideBlock, type GuideSection, type GuideSlug } from "@/content/guides";
import { guideSource, type GuideSource } from "@/content/guides/sources";

/**
 * Guide pages (PLAN §5.6): reference documents with literal headings, ruled
 * tables, and each section's sources listed at its foot, numbered against
 * the document list at the end of the page. The method, checks and
 * corrections live on /minimum-wages/how-we-check. They are in the
 * (reference) layout, so no phone on any of them.
 */

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

/** "Sources: 1, 6, 9", each number a link to the document list. */
function SourcesLine({ texts, numbers }: { texts: string[]; numbers: Map<string, number> }) {
  const cited = [...new Set(texts.flatMap(citesIn).map((id) => numbers.get(id)!))].sort((a, b) => a - b);
  if (!cited.length) return null;
  return (
    <p className="guide-cites">
      Sources:{" "}
      {cited.map((n, i) => (
        <Fragment key={n}>
          {i > 0 && ", "}
          <a href={`#source-${n}`} aria-label={`Source ${n}`}>
            {n}
          </a>
        </Fragment>
      ))}
    </p>
  );
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
    : `Checked against these documents on ${formatDate(guide.checkedOn)}. Legal review pending.`;
}

function Block({ block, guide, rowHeading }: { block: GuideBlock; guide: Guide; rowHeading: "h3" | "h4" }) {
  switch (block.type) {
    case "p":
      return <p>{plainText(block.text)}</p>;
    case "h3":
      return <h3>{block.text}</h3>;
    case "link":
      return showLink(block.href, guide) ? (
        <p className="guide-link">
          <Link href={block.href} className="text-link">
            {block.label} <ArrowRight size={18} aria-hidden="true" />
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
              <p>{plainText(item.text)}</p>
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
                    {plainText(row.head)}
                  </th>
                  {row.cells.map((cell, i) => (
                    <td key={i} data-label={block.columns[i + 1]} role="cell">
                      {plainText(cell)}
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
  return `${detail}.${s.language === "hi" ? " In Hindi." : ""}${s.url ? "" : " Read from a copy of the gazette notice and cited by number and date: no official copy online to link."}`;
}

function GuideSectionBlock({ section, guide, numbers, subtle }: { section: GuideSection; guide: Guide; numbers: Map<string, number>; subtle: boolean }) {
  const rowHeading = section.blocks.some((b) => b.type === "h3") ? "h4" : "h3";
  return (
    <Section id={section.id} variant={subtle ? "subtle" : "default"}>
      <div className="wage-split">
        <h2 className="wage-h2">{section.heading}</h2>
        <div className="wage-prose guide-prose">
          {section.blocks.map((block, j) => (
            <Block key={j} block={block} guide={guide} rowHeading={rowHeading} />
          ))}
          <SourcesLine texts={blockTexts(section.blocks)} numbers={numbers} />
        </div>
      </div>
    </Section>
  );
}

export function GuidePage({ slug }: { slug: GuideSlug }) {
  const guide = getGuide(slug);
  const numbers = numbering(guide);
  const sources = guide.sources.map(guideSource);
  const path = guidePath(slug);
  // A neutral door: the guide is read by plant HR anywhere, and we staff sites in Haridwar.
  const door = wageDoors.neutral;
  return (
    <>
      <JsonLd data={guideSchema(guide, { url: path, sources, headline: guide.title, description: guide.description })} />
      <JsonLd data={faqSchema(guide.faqs.map((f) => ({ question: f.question, answer: plainText(f.answer) })))} />
      {!guide.review && (
        <div className="wage-notice is-stale" role="note">
          <div className="site-shell">
            <p>
              <strong>Draft for legal review.</strong> This guide is not yet listed on the site. It has been checked against
              the documents it cites, but not yet reviewed by a labour-law practitioner.
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
                <dd>{f.value}</dd>
              </div>
            ))}
            <div>
              <dt>Checked</dt>
              <dd>
                <a href="#documents">{formatDate(guide.checkedOn)}</a>
              </dd>
            </div>
          </dl>
        }
      />
      {guide.sections.map((section, i) => (
        <GuideSectionBlock key={section.id} section={section} guide={guide} numbers={numbers} subtle={i % 2 === 1} />
      ))}
      <Section id="questions" variant={guide.sections.length % 2 === 1 ? "subtle" : "default"}>
        <div className="wage-split">
          <h2 className="wage-h2">Questions</h2>
          <div className="faq-prose">
            {guide.faqs.map((f) => (
              <div key={f.question}>
                <h3>{f.question}</h3>
                <p>{plainText(f.answer)}</p>
              </div>
            ))}
            <SourcesLine texts={guide.faqs.map((f) => f.answer)} numbers={numbers} />
          </div>
        </div>
      </Section>
      <section className="wage-doors" data-header-theme="dark">
        <div className="site-shell wage-doors-inner is-single">
          <div>
            <p className="eyebrow">{door.eyebrow}</p>
            <h2>{door.heading}</h2>
            <p>{door.text}</p>
            <Link href={door.link.href} className="light-link">
              {door.link.label} <ArrowRight size={19} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
      <Section id="documents" className="border-t border-border">
        <div className="wage-split">
          <h2 className="wage-h2">Documents cited</h2>
          <div className="wage-prose">
            <p className="wage-reviewed">{reviewLine(guide)}</p>
            <ol className="wage-sources">
              {sources.map((s, i) => (
                <li key={s.id} id={`source-${i + 1}`}>
                  {s.url ? <a href={s.url}>{s.title}</a> : <strong className="guide-source-title">{s.title}</strong>}
                  <span>{sourceDetail(s)}</span>
                </li>
              ))}
            </ol>
            <Link href={EDITORIAL_HREF} className="text-link">
              How we check <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
