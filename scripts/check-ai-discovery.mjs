import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function read(filePath) {
  return fs.readFileSync(path.join(projectRoot, filePath), "utf8");
}

const requiredFiles = [
  "src/app/llms.txt/route.ts",
  "src/app/llms-full.txt/route.ts",
  "src/app/openapi/v1.json/route.ts",
  "src/app/mcp/route.ts",
  "src/app/.well-known/agent-card.json/route.ts",
  "src/app/.well-known/agent.json/route.ts",
  "src/app/ai-access-policy.txt/route.ts",
  "src/lib/agent-card.ts",
  "src/app/robots.ts",
  "src/app/sitemap.ts",
];

const requiredEndpointPaths = [
  "/llms-full.txt",
  "/openapi/v1.json",
  "/mcp",
  "/.well-known/agent-card.json",
  "/.well-known/agent.json",
  "/ai-access-policy.txt",
];

const errors = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(projectRoot, file))) {
    errors.push(`Missing required file: ${file}`);
  }
}

if (errors.length === 0) {
  const llms = read("src/app/llms.txt/route.ts");
  const llmsFull = read("src/app/llms-full.txt/route.ts");
  const robots = read("src/app/robots.ts");
  const sitemap = read("src/app/sitemap.ts");
  const agentCard = read("src/lib/agent-card.ts");
  const mcpRoute = read("src/app/mcp/route.ts");

  for (const endpoint of requiredEndpointPaths) {
    if (!llms.includes(endpoint)) {
      errors.push(`llms.txt is missing endpoint reference: ${endpoint}`);
    }
  }

  const llmsFullChecks = ["/openapi/v1.json", "/mcp", "/.well-known/agent-card.json"];
  for (const endpoint of llmsFullChecks) {
    if (!llmsFull.includes(endpoint)) {
      errors.push(`llms-full.txt is missing endpoint reference: ${endpoint}`);
    }
  }

  const robotAllowChecks = [
    "/llms.txt",
    "/llms-full.txt",
    "/openapi/v1.json",
    "/mcp",
    "/.well-known/agent-card.json",
    "/ai-access-policy.txt",
  ];
  for (const endpoint of robotAllowChecks) {
    if (!robots.includes(endpoint)) {
      errors.push(`robots.ts allow list is missing: ${endpoint}`);
    }
  }

  const sitemapChecks = [
    "/openapi/v1.json",
    "/.well-known/agent-card.json",
    "/.well-known/agent.json",
    "/ai-access-policy.txt",
  ];
  for (const endpoint of sitemapChecks) {
    if (!sitemap.includes(endpoint)) {
      errors.push(`sitemap.ts is missing endpoint: ${endpoint}`);
    }
  }

  const agentCardChecks = ["/mcp", "/openapi/v1.json", "/llms.txt", "/llms-full.txt"];
  for (const value of agentCardChecks) {
    if (!agentCard.includes(value)) {
      errors.push(`agent-card metadata is missing: ${value}`);
    }
  }

  const mcpGovernanceChecks = [
    "isAuthorized",
    "applyRateLimit",
    "X-RateLimit-Limit",
    "X-MCP-Request-Id",
    "logMcpAudit",
  ];
  for (const token of mcpGovernanceChecks) {
    if (!mcpRoute.includes(token)) {
      errors.push(`mcp route governance check missing token: ${token}`);
    }
  }
}

if (errors.length > 0) {
  console.error("AI discovery consistency checks failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("AI discovery consistency checks passed.");
