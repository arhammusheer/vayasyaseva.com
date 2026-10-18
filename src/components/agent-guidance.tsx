/**
 * One visible line on the contact page for people sending an enquiry through
 * an AI assistant or an app: the form is checked by Turnstile, so it points
 * them at the open route and its spec. Visible on purpose: the old version
 * was off screen and addressed to AI agents, the pattern answer engines treat
 * as prompt injection (19 Oct 2026). The full routes live in llms.txt and the
 * OpenAPI spec.
 */
export function AgentGuidance() {
  return (
    <p data-agent-guidance="contact" className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
      Sending this through an AI assistant or an app? It can use our open enquiry route instead of the form:{" "}
      <a href="/openapi/v1.json" className="underline underline-offset-4 hover:text-gold-700">
        API spec
      </a>{" "}
      and{" "}
      <a href="/llms.txt" className="underline underline-offset-4 hover:text-gold-700">
        guidance
      </a>
      .
    </p>
  );
}
