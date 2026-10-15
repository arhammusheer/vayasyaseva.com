import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { JsonLd, phoneFreeGraphSchema } from "@/lib/structured-data";
import { localeOfParams } from "@/lib/i18n";

/**
 * Jobs pages (/jobs/**): the "For businesses" door, and no business phone
 * anywhere. This layout cannot import the phone (eslint.config.mjs), and
 * `pnpm phone:check` fails the build check if the number reaches a jobs page.
 */
export default async function JobsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = localeOfParams(await params);
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <JsonLd data={phoneFreeGraphSchema("jobs")} />
      <Header door="jobs" />
      <main id="main-content" tabIndex={-1} className="flex-1">{children}</main>
      <Footer door="jobs" locale={locale} />
    </div>
  );
}
