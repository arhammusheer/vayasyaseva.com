import Image from "next/image";
import { trustClients } from "@/content/home";

/**
 * Client logos, straight under the hero: proof within the first screen.
 * On the home page and every location page (the logos are SIDCUL Haridwar plants).
 */
export function ClientStrip({ label = "Our experience includes work with", afterRule = false }: { label?: string; afterRule?: boolean }) {
  return (
    // Under a hero that already ends in a rule, the strip drops its own (no double rule).
    <section className={afterRule ? "client-section is-after-rule site-shell" : "client-section site-shell"} aria-label={label}>
      <p>{label}</p>
      <div>
        {trustClients
          .filter((c) => c.visible)
          .map((c) => (
            <Image key={c.name} src={c.logoLight} alt={c.name} width={130} height={70} sizes="130px" className="client-logo" />
          ))}
      </div>
    </section>
  );
}
