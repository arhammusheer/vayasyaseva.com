import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { editorialPolicy } from "@/content/editorial";
import { siteConfig } from "@/content/site";
import { JsonLd, webPageSchema } from "@/lib/structured-data";
import { WAGE_METHOD_PATH } from "@/content/registry/identifiers";
import { notFound } from "next/navigation";
import { localeFromSegment, localeParams, localesOf } from "@/lib/i18n";
import { pageMetadata } from "@/lib/metadata";

/**
 * Sources, method, checks and corrections for the wage pages and guides.
 * A static segment beside the dynamic [state] route (Next.js matches it
 * first; content:check reserves the slug). English only: a route whose
 * static params come back empty is still built in every language, so the
 * page 404s itself in a language it is not built in.
 */
export const dynamicParams = false;
export const generateStaticParams = localeParams(WAGE_METHOD_PATH);

const TITLE = "How We Check Our Minimum Wage Pages";

export const metadata = pageMetadata({
  title: TITLE,
  description: editorialPolicy.intro,
  alternates: { canonical: WAGE_METHOD_PATH },
});

/** The item's text with its one phrase linked to the site email. */
function WithMailto({ text, phrase }: { text: string; phrase: string }) {
  const [before, after] = text.split(phrase);
  return (
    <>
      {before}
      <a href={`mailto:${siteConfig.email}?subject=Correction`} className="underline underline-offset-4 hover:text-gold-700">
        {phrase}
      </a>
      {after}
    </>
  );
}

type Props = { params: Promise<{ locale: string }> };

export default async function HowWeCheckPage({ params }: Props) {
  const locale = localeFromSegment((await params).locale);
  if (!locale || !localesOf(WAGE_METHOD_PATH).includes(locale)) notFound();
  return (
    <>
      <JsonLd data={webPageSchema({ name: TITLE, description: editorialPolicy.intro, url: WAGE_METHOD_PATH })} />
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
              <p>{item.mailto ? <WithMailto text={item.text} phrase={item.mailto} /> : item.text}</p>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
