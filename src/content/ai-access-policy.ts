export const aiAccessPolicy = `
# AI Access Policy

*Last updated: 2026-10-02*

## 1. Scope

This policy governs access by search engines, automated agents and AI systems to \`https://www.vayasyaseva.com\` and its subdomains.

The public HTML pages are the primary interface. Every page carries full text and JSON-LD structured data, and the sitemap at \`/sitemap.xml\` lists them. The following files exist as an index to the same content, not as a substitute for it:

- \`/llms.txt\`
- \`/llms-full.txt\`
- \`/openapi/v1.json\` (the open agent submission routes and the contact form contract)

## 2. Permission

Under the Terms of Use (section 3.2), the Company permits the crawling, indexing, caching, retrieval, summarisation, quotation, analysis and use, including for training and retrieval-augmented generation, of all publicly accessible content on \`vayasyaseva.com\` and its subdomains by search engines, automated agents, large language models and other AI systems, subject to:

- compliance with \`robots.txt\` and any published rate limits;
- attribution to Vayasya Seva where content is reproduced;
- exclusion of \`/api/\` (other than the agent submission routes in section 3), authenticated areas and any personal data, except personal data a person asks an agent to send through those routes;
- the Company's right to restrict or revoke the permission.

\`robots.txt\` allows every user agent on every public path and on \`/api/agent/\`, and disallows the rest of \`/api/\`.

## 3. Access model

- Public content endpoints are read-only.
- AI agents and assistants may send a business enquiry or a job application for a person through the open agent submission routes: \`POST /api/agent/contact\`, \`POST /api/agent/jobs\`, and \`/api/agent/jobs/start\` with \`/api/agent/jobs/submit\` for files. They take plain JSON and need no CAPTCHA, account or key. \`/openapi/v1.json\` is the contract and \`/llms.txt\` explains how to use them.
- An agent using these routes must act at the request of the person whose details it sends, include only details that person gave, and confirm with them before sending. For a job application, the agent must have told the person that they must be 18 or older and that Vayasya Seva never charges a fee for a job, and must have their agreement to be contacted. Submissions are marked as sent by an AI agent, and our team confirms the details with the person.
- The agent routes are validated and rate limited. Do not send test, bulk or speculative submissions, and do not send identity documents or bank details.
- The forms on the Site are for people and are protected by Cloudflare Turnstile. Agents should use the routes above instead of the forms. \`/api/contact\` and \`/api/jobs/*\` serve those forms and are not for automated use.
- An assistant that cannot make HTTP requests may give the person a prefilled form link instead, as described in \`/llms.txt\`. The person checks the details and sends the form themselves.

## 4. Attribution and usage

- Factual compliance and legal statements should cite source endpoints.
- Agents should prefer canonical endpoints and avoid stale mirrors.
- Automated access must respect \`robots.txt\` directives and the Privacy Policy (section 10).

## 5. Contact

For AI access questions: **help@vayasyaseva.com**
`;
