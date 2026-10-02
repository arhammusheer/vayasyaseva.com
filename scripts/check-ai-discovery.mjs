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
  "src/app/ai-access-policy.txt/route.ts",
  "src/app/robots.ts",
  "src/app/sitemap.ts",
];

const requiredEndpointPaths = [
  "/llms-full.txt",
  "/openapi/v1.json",
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

  // The open agent routes must be documented wherever agents look.
  const agentRoutes = ["/api/agent/contact", "/api/agent/jobs"];
  const policy = read("src/content/ai-access-policy.ts");
  const openApi = read("src/openapi/v1.json");
  for (const route of agentRoutes) {
    for (const [name, text] of [["llms.txt", llms], ["llms-full.txt", llmsFull], ["ai-access-policy", policy], ["openapi/v1.json", openApi]]) {
      if (!text.includes(route)) {
        errors.push(`${name} is missing agent route: ${route}`);
      }
    }
  }

  for (const endpoint of requiredEndpointPaths) {
    if (!llms.includes(endpoint)) {
      errors.push(`llms.txt is missing endpoint reference: ${endpoint}`);
    }
  }

  // llms.txt list items must be Markdown links (llmstxt.org); bare URLs are not parsed as links.
  const bareUrlItems = llms.match(/^- (?:(?:GET|POST) )?(?:https?:\/\/|\$\{baseUrl\}).*$/gm) ?? [];
  for (const line of bareUrlItems) {
    errors.push(`llms.txt list item is not a Markdown link: ${line}`);
  }

  const llmsFullChecks =["/openapi/v1.json", "/ai-access-policy.txt"];
  for (const endpoint of llmsFullChecks) {
    if (!llmsFull.includes(endpoint)) {
      errors.push(`llms-full.txt is missing endpoint reference: ${endpoint}`);
    }
  }

  // robots.txt must stay fully open: a blanket allow, the agent routes allowed and only /api/ disallowed.
  const allowed = [...robots.matchAll(/(?<!dis)allow:\s*(\[[^\]]*\]|"[^"]*")/g)]
    .flatMap((m) => m[1].match(/"[^"]+"/g) ?? [])
    .map((v) => v.replace(/"/g, ""));
  for (const path of ["/", "/api/agent/"]) {
    if (!allowed.includes(path)) {
      errors.push(`robots.ts must allow "${path}" for every user agent`);
    }
  }
  const disallowed = [...robots.matchAll(/disallow:\s*\[([^\]]*)\]/g)]
    .flatMap((m) => m[1].match(/"[^"]+"/g) ?? [])
    .map((v) => v.replace(/"/g, ""));
  for (const path of disallowed) {
    if (path !== "/api/") {
      errors.push(`robots.ts disallows ${path}; only /api/ may be excluded`);
    }
  }

  // Search sitemap lists marketing pages; machine discovery remains in llms.txt.
  const sitemapChecks = ["/services", "/compliance", "/haridwar-sidcul", "/contact"];
  for (const endpoint of sitemapChecks) {
    if (!sitemap.includes(endpoint)) {
      errors.push(`sitemap.ts is missing endpoint: ${endpoint}`);
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
