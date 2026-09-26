/**
 * Hindi pages share the site header and footer; only the page content is
 * Hindi. The wrapper sets the language for screen readers and CSS.
 */
export default function HindiLayout({ children }: { children: React.ReactNode }) {
  return <div lang="hi">{children}</div>;
}
