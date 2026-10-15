import { Section } from "@/components/layout/section";
import { clusterById, liveRegistrations } from "@/content/registry/clusters";
import type { ClusterId } from "@/content/registry/identifiers";
import type { Locale } from "@/lib/i18n";

/**
 * "What we hold" on a buyer hub (PLAN §5.2): the registrations in the
 * cluster's registry entry that the owner has signed off and that have not
 * expired. Renders nothing while the list is empty, so the page needs no
 * placeholder copy and nothing is written ahead of the signed-off record.
 */
export function WhatWeHold({ cluster, locale, eyebrow, heading }: { cluster: ClusterId; locale: Locale; eyebrow: string; heading: string }) {
  const entry = clusterById(cluster);
  const items = entry ? liveRegistrations(entry) : [];
  if (!items.length) return null;
  return (
    // A hairline, since it follows another white section on the buyer hub.
    <Section id="what-we-hold" className="border-t border-border">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div>
          <p className="eyebrow text-gold-700">{eyebrow}</p>
          <h2 className="mt-5 text-4xl font-medium">{heading}</h2>
        </div>
        <ul className="jobs-work">
          {items.map((r) => (
            <li key={`${r.issuedBy["en-IN"]}-${r.name["en-IN"]}`}>
              <h3>{r.name[locale] ?? r.name["en-IN"]}</h3>
              <p>
                {r.issuedBy[locale] ?? r.issuedBy["en-IN"]}
                {r.number && (
                  <>
                    {" · "}
                    <span className="font-data">{r.number}</span>
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
