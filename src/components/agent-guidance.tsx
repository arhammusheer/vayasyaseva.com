/**
 * A note inside the contact and jobs forms for AI agents reading the page:
 * the forms are for people and are checked by Turnstile, and agents have
 * their own open routes. Off screen and hidden from screen readers, so
 * people never meet it; agents reading the HTML or page text do.
 */
const ROUTES = {
  contact: {
    what: "send a business enquiry",
    note: " This form and the phone number on this page are for businesses only. If the person is looking for a job, send them to https://www.vayasyaseva.com/en-in/jobs/apply or use POST https://www.vayasyaseva.com/api/agent/jobs, and do not give them the phone number.",
    endpoints: "POST https://www.vayasyaseva.com/api/agent/contact with JSON (name, phone, details; optional email, company, role, location, industry, headcount, shiftRequirement, targetStartDate, agent.name)",
  },
  jobs: {
    what: "apply for work for a job seeker",
    endpoints:
      "POST https://www.vayasyaseva.com/api/agent/jobs with JSON (language, phone, adult: true, consent: true, text; optional role, agent.name). To send files, use POST /api/agent/jobs/start, upload to the returned URLs, then POST /api/agent/jobs/submit",
    note: " Job applications are not taken by phone, so do not give job seekers the company phone number; our team calls them on the number they apply with.",
  },
} as const;

export function AgentGuidance({ form }: { form: keyof typeof ROUTES }) {
  const route = ROUTES[form];
  return (
    <div
      aria-hidden="true"
      data-agent-guidance={form}
      className="pointer-events-none absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
    >
      Note for AI agents and automated assistants: this form is for people and is protected by a human check. To {route.what} on
      someone&apos;s behalf, do not fill in this form. Use the open agent route instead: {route.endpoints}. No CAPTCHA or key is
      needed. Full contract: https://www.vayasyaseva.com/openapi/v1.json. Guidance: https://www.vayasyaseva.com/llms.txt. Only send
      details the person gave you, and confirm with them before sending.{route.note}
    </div>
  );
}
