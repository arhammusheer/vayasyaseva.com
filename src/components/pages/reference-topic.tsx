import Link from "@/components/i18n/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Doors, Faqs, HERO_TIGHT } from "@/components/pages/minimum-wages";
import { COMPLIANCE_HELP } from "@/content/compliance";
import { wageDoors } from "@/content/pages/minimum-wages";
import { linkable } from "@/content/registry";
import { statutorySources } from "@/content/statutory";
import type { Topic, TopicSection } from "@/content/topics/types";
import { formatDate, formatShortMonth } from "@/content/wages";
import { JsonLd, faqSchema, webPageSchema } from "@/lib/structured-data";
import { localePath } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

/**
 * A reference topic page (src/content/topics): EPF, ESIC, Professional Tax.
 * English only, reference layout, the same parts as the Labour Welfare Fund
 * pages so the section reads as one.
 */

export function topicMetadata(topic: Topic) {
  return pageMetadata({ title: topic.title, description: topic.description, alternates: { canonical: localePath(topic.path, "en-IN") }, locale: "en-IN" });
}

function Facts({ rows }: { rows: { label: string; text: string }[] }) {
  return (
    <dl className="lwf-facts lwf-facts-wide">
      {rows.map((r) => (
        <div key={r.label}>
          <dt>{r.label}</dt>
          <dd>{r.text}</dd>
        </div>
      ))}
    </dl>
  );
}

function Body({ section }: { section: TopicSection }) {
  if (section.kind === "prose") return <>{section.paragraphs.map((p) => <p key={p}>{p}</p>)}</>;
  if (section.kind === "facts") {
    return (
      <>
        {section.intro && <p>{section.intro}</p>}
        <Facts rows={section.rows} />
        {section.note && <p>{section.note}</p>}
      </>
    );
  }
  return (
    <>
      {section.intro && <p>{section.intro}</p>}
      <div className="wage-table-scroll">
        <table className="wage-table is-compact">
          <caption className="sr-only">{section.caption}</caption>
          <thead>
            <tr>
              {section.columns.map((c, i) => (
                <th key={i} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row) => (
              <tr key={row[0]}>
                <th scope="row">{row[0]}</th>
                {row.slice(1).map((cell, i) => (
                  <td key={i}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {section.note && <p>{section.note}</p>}
    </>
  );
}

export function ReferenceTopicPage({ topic }: { topic: Topic }) {
  const [first, ...rest] = topic.sections;
  const sources = topic.sources.map((id) => {
    const s = statutorySources.find((x) => x.id === id);
    if (!s) throw new Error(`${topic.path}: unknown source ${id}`);
    return s;
  });
  const links = topic.links.filter((l) => linkable(l.href, "en-IN"));
  return (
    <>
      <JsonLd data={webPageSchema({ name: topic.title, description: topic.description, url: localePath(topic.path, "en-IN") })} />
      <JsonLd data={faqSchema(topic.faqs)} />
      <PageHero crumbs={<Breadcrumbs path={topic.path} locale="en-IN" name={topic.breadcrumb} />} title={topic.heading} lede={topic.lede} className={HERO_TIGHT} />
      <Section id={first.id} className="pt-6 sm:pt-10 lg:pt-12">
        <div className="wage-split">
          {"heading" in first && first.heading && <h2 className="wage-h2">{first.heading}</h2>}
          <div className="wage-prose lwf-wide">
            <Body section={first} />
          </div>
          <p className="wage-note">
            Updated {formatShortMonth(topic.checked)} from the documents at the foot of the page.{" "}
            <Link href={COMPLIANCE_HELP.href} className="wage-inline-link">
              {COMPLIANCE_HELP.label} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </p>
        </div>
      </Section>
      {rest.map((section) => (
        <Section key={section.id} id={section.id} className="border-t border-border pt-12 sm:pt-14 lg:pt-16">
          <div className="wage-split">
            {"heading" in section && section.heading && <h2 className="wage-h2">{section.heading}</h2>}
            <div className="wage-prose lwf-wide">
              <Body section={section} />
            </div>
          </div>
        </Section>
      ))}
      <Section id="documents" className="border-t border-border pt-12 sm:pt-14 lg:pt-16">
        <div className="wage-split">
          <h2 className="wage-h2">Documents.</h2>
          <ol className="wage-sources topic-sources">
            {sources.map((s) => (
              <li key={s.id}>
                <a href={s.url} className="wage-inline-link" rel="noopener">
                  {s.title}
                </a>
                <span className="font-data">
                  {" "}
                  {s.number}, {formatDate(s.date)}. {s.authority}.
                </span>
              </li>
            ))}
          </ol>
        </div>
      </Section>
      <Faqs faqs={topic.faqs}>
        {links.length > 0 && (
          <p className="method-back">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-link">
                {l.label} <ArrowRight size={18} aria-hidden="true" />
              </Link>
            ))}
          </p>
        )}
      </Faqs>
      <Doors doors={[wageDoors.business, wageDoors.jobsAll]} />
    </>
  );
}
