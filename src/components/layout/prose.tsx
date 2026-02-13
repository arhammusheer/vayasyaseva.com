import ReactMarkdown from "react-markdown";

export function Prose({ content }: { content: string }) {
  return (
    <div className="prose prose-neutral mx-auto max-w-3xl prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-3xl prose-h1:sm:text-4xl prose-h2:text-xl prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-h2:mt-10 prose-a:text-seva prose-a:no-underline hover:prose-a:underline prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:font-data prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-li:marker:text-muted-foreground">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
