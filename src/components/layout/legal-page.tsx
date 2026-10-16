import { Fragment } from "react";
import ReactMarkdown from "react-markdown";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/^\d+\.\s*/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const textOf = (node: React.ReactNode): string =>
  Array.isArray(node)
    ? node.map(textOf).join("")
    : typeof node === "string" || typeof node === "number"
      ? String(node)
      : node && typeof node === "object" && "props" in node
        ? textOf((node as React.ReactElement<{ children?: React.ReactNode }>).props.children)
        : "";

/** "3. Your analytics choices {#analytics}": the heading's own id, if it names one. */
const ID_SUFFIX = /\s*\{#([a-z0-9-]+)\}\s*$/;
const headingId = (text: string) => ID_SUFFIX.exec(text)?.[1] ?? slug(text);
const headingText = (text: string) => text.replace(ID_SUFFIX, "");

/** A line "[[insert:name]]" in the document is replaced by inserts[name]. */
const INSERT = /^\[\[insert:([a-z0-9-]+)\]\]$/;

/**
 * Legal documents share the inner-page skeleton: a plain hero with the
 * document title and revision date, a sticky section index on the left, and
 * the numbered clauses on the right. `inserts` places a rendered block (a
 * table, a conditional line) where the Markdown has its [[insert:name]] line.
 */
export function LegalPage({ content, inserts = {} }: { content: string; inserts?: Record<string, React.ReactNode> }) {
  const lines = content.trim().split("\n");
  const title = lines.find((l) => l.startsWith("# "))?.slice(2) ?? "";
  const updated = lines
    .find((l) => /^\*Last updated/i.test(l))
    ?.replace(/^\*|\*$/g, "");
  const sections = lines
    .filter((l) => l.startsWith("## "))
    .map((l) => l.slice(3))
    .map((h) => ({ heading: headingText(h), id: headingId(h) }));
  // Markdown runs between the inserts.
  const chunks: ({ markdown: string } | { insert: string })[] = [{ markdown: "" }];
  for (const line of lines.filter((l) => !l.startsWith("# ") && !/^\*Last updated/i.test(l))) {
    const name = INSERT.exec(line.trim())?.[1];
    if (name) chunks.push({ insert: name }, { markdown: "" });
    else (chunks.at(-1) as { markdown: string }).markdown += `${line}\n`;
  }

  return (
    <>
      <PageHero title={title} lede={updated} />
      <Section>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_2fr]">
          <nav
            aria-label="Sections"
            className="hidden lg:sticky lg:top-24 lg:block lg:self-start"
          >
            <p className="eyebrow text-gold-700">CONTENTS</p>
            <ol className="mt-5 text-sm">
              {sections.map((s) => (
                <li key={s.id} className="border-t first:border-0">
                  <a
                    href={`#${s.id}`}
                    className="block py-2.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="legal-body max-w-2xl">
            {chunks.map((chunk, i) =>
              "insert" in chunk ? (
                <Fragment key={i}>{inserts[chunk.insert] ?? null}</Fragment>
              ) : (
                <ReactMarkdown
                  key={i}
                  components={{
                    h2: ({ children }) => (
                      <h2 id={headingId(textOf(children))}>
                        {typeof children === "string" ? headingText(children) : children}
                      </h2>
                    ),
                  }}
                >
                  {chunk.markdown}
                </ReactMarkdown>
              ),
            )}
          </div>
        </div>
      </Section>
    </>
  );
}
