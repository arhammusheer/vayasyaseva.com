import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { editorialPolicy } from "@/content/editorial";
import { WAGE_METHOD_PATH } from "@/content/registry/identifiers";
import { notFound } from "next/navigation";
import { localeFromSegment, localeParams, localesOf } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

/**
 * Sources, method, checks and corrections for the wage pages and guides.
 * A static segment beside the dynamic [state] route (Next.js matches it
 * first; content:check reserves the slug). A draft in the registry until its
 * content lands: the proxy answers 404 for it (isGone) except in preview
 * builds (VSPL_SHOW_DRAFTS=1). A route whose static params come back empty
 * is still built in every language, so the page also 404s itself in a
 * language it is not built in.
 */
export const dynamicParams = false;
export const generateStaticParams = localeParams(WAGE_METHOD_PATH);

export const metadata = pageMetadata({
  title: "How We Check Our Minimum Wage Pages",
  description: editorialPolicy.intro,
  alternates: { canonical: WAGE_METHOD_PATH },
});

type Props = { params: Promise<{ locale: string }> };

export default async function HowWeCheckPage({ params }: Props) {
  const locale = localeFromSegment((await params).locale);
  if (!locale || !localesOf(WAGE_METHOD_PATH).includes(locale)) notFound();
  return (
    <>
      <PageHero
        crumbs={<Breadcrumbs path={WAGE_METHOD_PATH} locale={locale} name="How we check" />}
        title="How we check these pages."
        lede={editorialPolicy.intro}
      />
      <Section>
        <ul className="jobs-work guide-rows">
          {editorialPolicy.items.map((item) => (
            <li key={item.title}>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
