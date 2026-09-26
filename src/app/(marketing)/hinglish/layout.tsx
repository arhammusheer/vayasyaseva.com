/**
 * Hinglish (Hindi in Latin script) pages share the site header and footer;
 * only the page content is Hinglish.
 */
export default function HinglishLayout({ children }: { children: React.ReactNode }) {
  return <div lang="hi-Latn">{children}</div>;
}
