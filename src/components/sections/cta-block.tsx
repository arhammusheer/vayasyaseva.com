import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export function CtaBlock() {
  return (
    <section className="contact-invitation">
      <div className="site-shell invitation-inner">
        <div>
          <p className="eyebrow">START A CONVERSATION</p>
          <h2>
            What’s next for
            <br />
            your business?
          </h2>
          <p>Tell us what you have in mind. We’ll take it from there.</p>
        </div>
        <Link
          href="/contact"
          className="round-link"
          aria-label="Contact Vayasya Seva"
        >
          <ArrowUpRight aria-hidden="true" />
          <span>Let’s talk</span>
        </Link>
      </div>
    </section>
  );
}
