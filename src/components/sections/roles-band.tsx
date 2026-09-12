import { services } from "@/content/services";

/**
 * Kinetic band of the roles we actually deploy. Content is pulled from the
 * services register so it never drifts from what the Services page says.
 */
export function RolesBand() {
  const roles = Array.from(new Set(services.flatMap((s) => s.roles)));
  const track = [...roles, ...roles];

  return (
    <section
      aria-label="Roles we deploy"
      className="corrugated overflow-hidden border-y border-gold-500/20 bg-neutral-950 py-6 sm:py-8"
    >
      <div className="marquee flex w-max items-center gap-10 whitespace-nowrap font-display text-3xl font-semibold leading-none text-background/85 sm:gap-14 sm:text-5xl">
        {track.map((role, i) => (
          <span key={`${role}-${i}`} className="flex items-center gap-10 sm:gap-14">
            {role}
            <span aria-hidden="true" className="h-2 w-2 bg-gold-500 sm:h-2.5 sm:w-2.5" />
          </span>
        ))}
      </div>
    </section>
  );
}
