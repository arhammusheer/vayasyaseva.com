import Link from "@/components/i18n/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { editorialPolicy, type EditorialItem } from "@/content/editorial";
import { siteConfig } from "@/content/site";
import { JsonLd, webPageSchema } from "@/lib/structured-data";
import { GUIDE_SLUGS, WAGE_HUB_PATH, WAGE_METHOD_PATH, guidePath } from "@/content/registry/identifiers";
import { linkable } from "@/content/registry";
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

/** Published guides. The Guides item and its back link show only once one is. */
const publishedGuides = () => GUIDE_SLUGS.filter((slug) => linkable(guidePath(slug), "en-IN"));

type Props = { params: Promise<{ locale: string }> };

export default async function HowWeCheckPage({ params }: Props) {
  const locale = localeFromSegment((await params).locale);
  if (!locale || !localesOf(WAGE_METHOD_PATH).includes(locale)) notFound();
  const guides = publishedGuides();
  // Guides sit before Corrections, the last item.
  const items: EditorialItem[] = guides.length ? [...editorialPolicy.items.slice(0, -1), editorialPolicy.guides, ...editorialPolicy.items.slice(-1)] : editorialPolicy.items;
  const { notAdvice } = editorialPolicy;
  return (
    <>
      <JsonLd data={webPageSchema({ name: TITLE, description: editorialPolicy.intro, url: WAGE_METHOD_PATH })} />
      <PageHero
        crumbs={<Breadcrumbs path={WAGE_METHOD_PATH} locale={locale} name="How we check" />}
        title="How we check these pages."
        lede={editorialPolicy.intro}
      />
      <Section>
        <div className="method-rows">
          {items.map((item) => (
            <section key={item.title} className="wage-split">
              <h2>{item.title}</h2>
              <div className="wage-prose">
                {item.text.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="method-foot">
          <p>
            {notAdvice.before} <Link href="/terms#nature-of-the-website">{notAdvice.link}</Link>
            {notAdvice.after}
          </p>
          <p className="method-back">
            <a href={`mailto:${siteConfig.email}?subject=Correction`} className="text-link">
              {editorialPolicy.correction} <ArrowRight size={18} aria-hidden="true" />
            </a>
            <Link href={WAGE_HUB_PATH} className="text-link">
              All states <ArrowRight size={18} aria-hidden="true" />
            </Link>
            {guides.map((slug) => (
              <Link key={slug} href={guidePath(slug)} className="text-link">
                {slug === "new-labour-codes" ? "Labour codes guide" : "Guide"} <ArrowRight size={18} aria-hidden="true" />
              </Link>
            ))}
          </p>
        </div>
      </Section>
    </>
  );
}
