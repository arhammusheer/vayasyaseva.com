export const aiAccessPolicy = `
# AI Access Policy

*Last updated: 2026-09-13*

## 1. Scope

This policy governs access by search engines, automated agents and AI systems to \`https://www.vayasyaseva.com\` and its subdomains.

The public HTML pages are the primary interface. Every page carries full text and JSON-LD structured data, and the sitemap at \`/sitemap.xml\` lists them. The following files exist as an index to the same content, not as a substitute for it:

- \`/llms.txt\`
- \`/llms-full.txt\`
- \`/openapi/v1.json\` (contact form contract only)

## 2. Permission

Under the Terms of Use (section 3.2), the Company permits the crawling, indexing, caching, retrieval, summarisation, quotation, analysis and use, including for training and retrieval-augmented generation, of all publicly accessible content on \`vayasyaseva.com\` and its subdomains by search engines, automated agents, large language models and other AI systems, subject to:

- compliance with \`robots.txt\` and any published rate limits;
- attribution to Vayasya Seva where content is reproduced;
- exclusion of \`/api/\`, authenticated areas, form submissions and any personal data;
- the Company's right to restrict or revoke the permission.

\`robots.txt\` allows every user agent on every public path and disallows only \`/api/\`.

## 3. Access model

- Public content endpoints are read-only.
- Contact submission remains available only through \`POST /api/contact\`, which is not for automated use.

## 4. Attribution and usage

- Factual compliance and legal statements should cite source endpoints.
- Agents should prefer canonical endpoints and avoid stale mirrors.
- Automated access must respect \`robots.txt\` directives and the Privacy Policy (section 10).

## 5. Contact

For AI access questions: **help@vayasyaseva.com**
`;
