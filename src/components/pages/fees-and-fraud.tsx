import Link from "@/components/i18n/link";
import { ArrowRight, Mail } from "lucide-react";
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

const number = (i: number) => String(i + 1).padStart(2, "0");

/**
 * No fee, how to tell it's us, and how to report a fee demand. The report
 * goes by email (prefilled subject and prompts), never to the business phone.
 */
export function FeesAndFraudPage({ locale }: { locale: Locale }) {
  const t = feesAndFraudCopy[locale];
  const url = localePath(PATH, locale);
  const mailto = `mailto:${FRAUD_REPORT_EMAIL}?subject=${encodeURIComponent(t.mail.subject)}&body=${encodeURIComponent(`${t.mail.body.join("\r\n")}\r\n`)}`;
  const report = (
    <div className="fraud-report">
      <a href={mailto} className="jobs-submit">
        <Mail size={20} aria-hidden="true" /> {t.report}
      </a>
      <p className="font-data">{FRAUD_REPORT_EMAIL}</p>
    </div>
  );
  return (
    <>
      <JsonLd data={webPageSchema({ name: t.title, description: t.description, url, inLanguage: locales[locale].hreflang })} />
      <Breadcrumbs path={PATH} locale={locale} name={t.breadcrumb} visible={false} />
      <section className="quick-top">
        <div className="site-shell grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <div>
            <p className="eyebrow text-gold-700">
              <Link href={localePath("/jobs", locale)} className="hover:underline underline-offset-4">
                {t.eyebrow}
              </Link>
            </p>
            <h1 className="fraud-title">{t.heading}</h1>
            <p className="quick-lede">{t.lede}</p>
          </div>
          <div>
            {report}
            <Link href={localePath("/jobs/apply", locale)} className="text-link mt-6">
              {t.apply} <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
      <Section variant="subtle">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          <div>
            <p className="eyebrow text-gold-700">{t.checkEyebrow}</p>
            <h2 className="mt-5 text-4xl font-medium">{t.checkHeading}</h2>
          </div>
          <ol className="jobs-steps">
            {t.checks.map((c, i) => (
              <li key={c.title}>
                <span className="jobs-step-number" aria-hidden="true">{number(i)}</span>
                <div>
                  <h3 className="jobs-step-title">{c.title}</h3>
                  <p className="jobs-step-hint">{c.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Section>
      <section className="fraud-band">
        <div className="site-shell grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-20">
          <div>
            <p className="eyebrow">{t.reportEyebrow}</p>
            <h2>{t.reportHeading}</h2>
            {report}
          </div>
          <ol className="fraud-steps">
            {t.steps.map((step, i) => (
              <li key={step.title}>
                <span aria-hidden="true">{number(i)}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <Section>
        <Link href={localePath("/jobs/apply", locale)} className="fraud-closer">
          {t.closer} <ArrowRight size={28} aria-hidden="true" />
        </Link>
      </Section>
    </>
  );
}
