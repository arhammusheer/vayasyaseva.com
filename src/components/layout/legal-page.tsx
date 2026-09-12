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

/**
 * Legal documents share the inner-page skeleton: a plain hero with the
 * document title and revision date, a sticky section index on the left, and
 * the numbered clauses on the right.
 */
export function LegalPage({ content }: { content: string }) {
  const lines = content.trim().split("\n");
  const title = lines.find((l) => l.startsWith("# "))?.slice(2) ?? "";
  const updated = lines
    .find((l) => /^\*Last updated/i.test(l))
    ?.replace(/^\*|\*$/g, "");
  const sections = lines
    .filter((l) => l.startsWith("## "))
    .map((l) => l.slice(3))
    .map((h) => ({ heading: h, id: slug(h) }));
  const body = lines
    .filter((l) => !l.startsWith("# ") && !/^\*Last updated/i.test(l))
    .join("\n");

  return (
    <>
      <PageHero title={title} lede={updated} />
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
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
            <ReactMarkdown
              components={{
                h2: ({ children }) => (
                  <h2 id={slug(textOf(children))}>{children}</h2>
                ),
              }}
            >
              {body}
            </ReactMarkdown>
          </div>
        </div>
      </Section>
    </>
  );
}
