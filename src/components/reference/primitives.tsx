import Link from "@/components/i18n/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/layout/section";
import { PageHero } from "@/components/layout/page-hero";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Faqs } from "@/components/pages/minimum-wages";
import { linkable } from "@/content/registry";
import { statutorySources } from "@/content/statutory";
import { formatDate } from "@/content/wages";
import { EDITORIAL_HREF } from "@/content/editorial";
import { COMPLIANCE_HELP } from "@/content/compliance";

/**
 * Building blocks of the reference topic pages (EPF, ESIC, Labour Welfare
 * Fund, Professional Tax). Each page composes its own order around one
 * signature figure; these keep the parts consistent with the wage pages.
 */

export type GlanceItem = { label: string; note?: string; value: string; key?: boolean };

/** The numbers that answer the page, ruled, in the hero beside the lede. */
export function Glance({ items, label }: { items: GlanceItem[]; label: string }) {
  return (
    <dl className="ref-glance" aria-label={label}>
      {items.map((i) => (
        <div key={i.label} className={i.key ? "is-key" : undefined}>
          <dt>
            {i.label}
            {i.note && <small>{i.note}</small>}
          </dt>
          <dd>{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Under the H1, as on the wage pages: when it was checked, and how. */
export function UpdatedLine({ date, from }: { date: string; from: string }) {
  return (
    <p className="wage-checked">
      Updated {formatDate(date)} from {from}.{" "}
      <Link href={EDITORIAL_HREF}>
        How we check <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </p>
  );
}

/** A section with its heading (and an optional line) on the left and the body on the right. */
export function RefSection({
  id,
  heading,
  intro,
  children,
  subtle,
  first,
}: {
  id: string;
  heading: string;
  intro?: string;
  children: React.ReactNode;
  subtle?: boolean;
  first?: boolean;
}) {
  return (
    <Section id={id} variant={subtle ? "subtle" : undefined} className={first ? "pt-10 sm:pt-14 lg:pt-16" : "border-t border-border"}>
      <div className="ref-split">
        <div>
          <h2 className="ref-h2">{heading}</h2>
          {intro && <p className="ref-intro">{intro}</p>}
        </div>
        <div className="ref-body">{children}</div>
      </div>
    </Section>
  );
}

/** A full-width section: the signature figure gets the whole measure. */
export function RefWide({ id, heading, intro, children }: { id: string; heading: string; intro?: string; children: React.ReactNode }) {
  return (
    <Section id={id} className="pt-10 sm:pt-14 lg:pt-16">
      <h2 className="ref-h2">{heading}</h2>
      {intro && <p className="ref-intro max-w-[62ch]!">{intro}</p>}
      <div className="ref-wide mt-8">{children}</div>
    </Section>
  );
}

export type RuleGroup = { heading: string; rows: { label: string; text: React.ReactNode }[] };

/** The rules, in a few named groups of short label and value rows. */
export function RuleGroups({ groups }: { groups: RuleGroup[] }) {
  return (
    <div className="ref-rules">
      {groups.map((g) => (
        <div key={g.heading}>
          <h3>{g.heading}</h3>
          <dl className="ref-rows">
            {g.rows.map((r) => (
              <div key={r.label}>
                <dt>{r.label}</dt>
                <dd>{r.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

/** The documents, folded as on the wage pages, with one line on compliance help. */
export function Sources({ ids }: { ids: string[] }) {
  const sources = ids.map((id) => {
    const s = statutorySources.find((x) => x.id === id);
    if (!s) throw new Error(`unknown source ${id}`);
    return s;
  });
  return (
    <>
      <details className="wage-more is-section">
        <summary>Sources ({sources.length})</summary>
        <ol className="wage-sources topic-sources mt-4">
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
      </details>
      <p className="wage-note">
        Behind on any of this? The Vayasya Network of CAs, labour lawyers and compliance consultants can help.{" "}
        <Link href={COMPLIANCE_HELP.href} className="wage-inline-link">
          {COMPLIANCE_HELP.label} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </p>
    </>
  );
}

/** The opening of a topic page: crumbs, the H1, the answer, the updated line, and the glance list beside it. */
export function TopicHero({
  path,
  breadcrumb,
  heading,
  lede,
  glance,
  checked,
  updatedFrom,
}: {
  path: string;
  breadcrumb: string;
  heading: string;
  lede: string;
  glance: GlanceItem[];
  checked: string;
  updatedFrom: string;
}) {
  return (
    <PageHero
      crumbs={<Breadcrumbs path={path} locale="en-IN" name={breadcrumb} />}
      title={heading}
      lede={lede}
      footnote={<UpdatedLine date={checked} from={updatedFrom} />}
      aside={<Glance items={glance} label={`${breadcrumb} at a glance`} />}
      className="pb-10 pt-6 sm:pb-12 sm:pt-14 lg:pb-14 lg:pt-14"
    />
  );
}

/** Questions and the links to the other reference pages, then the documents. */
export function TopicEnd({ faqs, self, links, sources }: { faqs: { question: string; answer: string }[]; self: string; links: { href: string; label: string }[]; sources: string[] }) {
  const shown = links.filter((l) => linkable(l.href, "en-IN"));
  return (
    <>
      <Faqs faqs={faqs} self={self}>
        {shown.length > 0 && (
          <p className="method-back">
            {shown.map((l) => (
              <Link key={l.href} href={l.href} className="text-link">
                {l.label} <ArrowRight size={18} aria-hidden="true" />
              </Link>
            ))}
          </p>
        )}
      </Faqs>
      <Section id="documents" className="pt-10 sm:pt-12 lg:pt-14">
        <Sources ids={sources} />
      </Section>
    </>
  );
}
