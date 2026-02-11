export const aiAccessPolicy = `
# AI Access Policy

*Last updated: 2026-02-11*

## 1. Scope

This policy governs AI and agent access to machine-readable endpoints on \`https://www.vayasyaseva.com\`, including:

- \`/llms.txt\`
- \`/llms-full.txt\`
- \`/openapi/v1.json\`
- \`/mcp\`
- \`/.well-known/agent-card.json\`

## 2. Access model

- Public marketing content endpoints are read-only.
- MCP tools and resources are read-only.
- Contact submission remains available only through \`POST /api/contact\`.
- Agents should not attempt write operations over MCP.

## 3. Authentication

- If \`MCP_BEARER_TOKEN\` is configured by the operator, \`/mcp\` requires a Bearer token.
- If \`MCP_BEARER_TOKEN\` is not configured, \`/mcp\` runs in public read-only mode.

## 4. Rate limiting

- MCP requests are rate-limited per client IP.
- Default limits:
  - Window: 60 seconds
  - Max requests: 60 requests per window
- Limits can be tuned using:
  - \`MCP_RATE_LIMIT_WINDOW_MS\`
  - \`MCP_RATE_LIMIT_MAX_REQUESTS\`

## 5. Audit logging

MCP access events are logged for abuse detection and operational monitoring. Logs include:

- Timestamp
- Method and path
- Response status
- Request duration
- Hashed client IP
- Auth mode used (public or bearer)

Raw request payloads and secret tokens are not logged by governance handlers.

## 6. Attribution and usage

- Factual compliance and legal statements should cite source endpoints.
- Agents should prefer canonical endpoints and avoid stale mirrors.
- Automated access must respect \`robots.txt\` directives.

## 7. Contact

For API and AI access questions: **help@vayasyaseva.com**
`;
