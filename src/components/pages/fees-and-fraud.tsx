import { Mail } from "lucide-react";
import { pageMetadata } from "@/lib/metadata";
import { Section } from "@/components/layout/section";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLd, webPageSchema } from "@/lib/structured-data";
import { FRAUD_REPORT_EMAIL, feesAndFraudCopy } from "@/content/pages/fees-and-fraud";
import { localePath, locales, type Locale } from "@/lib/i18n";

const PATH = "/jobs/fees-and-fraud";

export function feesAndFraudMetadata(locale: Locale) {
  const t = feesAndFraudCopy[locale];
  return pageMetadata({
    title: { absolute: `${t.title} | Vayasya Seva` },
    description: t.description,
    alternates: { canonical: localePath(PATH, locale) },
    locale,
  });
}

/**
 * No fee, one way to report a fee demand, and two facts that tell our
 * messages apart. The report goes by email (prefilled subject and prompts),
 * never to the business phone. No apply link: the header has Apply.
 */
export function FeesAndFraudPage({ locale }: { locale: Locale }) {
  const t = feesAndFraudCopy[locale];
  const url = localePath(PATH, locale);
  const mailto = `mailto:${FRAUD_REPORT_EMAIL}?subject=${encodeURIComponent(t.mail.subject)}&body=${encodeURIComponent(`${t.mail.body.join("\r\n")}\r\n`)}`;
  return (
    <>
      <JsonLd data={webPageSchema({ name: t.title, description: t.description, url, inLanguage: locales[locale].hreflang })} />
      <section className="quick-top">
        <div className="site-shell grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <div>
            <Breadcrumbs path={PATH} locale={locale} name={t.breadcrumb} />
            <h1 className="fraud-title">{t.heading}</h1>
            <p className="quick-lede">{t.lede}</p>
          </div>
          <div className="fraud-report">
            <a href={mailto} className="jobs-submit">
              <Mail size={20} aria-hidden="true" /> {t.report}
            </a>
            <p>
              {t.note} <span className="font-data">{FRAUD_REPORT_EMAIL}</span>
            </p>
          </div>
        </div>
      </section>
      <Section variant="subtle">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          <h2 className="text-4xl font-medium">{t.checkHeading}</h2>
          <ol className="jobs-steps">
            {t.checks.map((c, i) => (
              <li key={c.title}>
                <span className="jobs-step-number" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="jobs-step-title">{c.title}</h3>
                  <p className="jobs-step-hint">{c.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>
    </>
  );
}
