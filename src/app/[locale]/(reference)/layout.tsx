import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { JsonLd, phoneFreeGraphSchema } from "@/lib/structured-data";

/**
 * Reference pages, read by buyers and workers alike: the privacy notice and
 * terms (every jobs form links the privacy notice), and later the minimum
 * wage pages and guides. The reference header (Minimum wages and both
 * doors; privacy and terms get the business header without the phone) and
 * no phone. Like the jobs layout, it cannot import the phone
 * (eslint.config.mjs).
 */
export default function ReferenceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <JsonLd data={phoneFreeGraphSchema("reference")} />
      <Header door="reference" />
      <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
      <Footer door="reference" />
    </div>
  );
}
