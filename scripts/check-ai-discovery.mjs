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

  for (const endpoint of requiredEndpointPaths) {
    if (!llms.includes(endpoint)) {
      errors.push(`llms.txt is missing endpoint reference: ${endpoint}`);
    }
  }

  const llmsFullChecks = ["/openapi/v1.json", "/ai-access-policy.txt"];
  for (const endpoint of llmsFullChecks) {
    if (!llmsFull.includes(endpoint)) {
      errors.push(`llms-full.txt is missing endpoint reference: ${endpoint}`);
    }
  }

  // robots.txt must stay fully open: a blanket allow and only /api/ disallowed.
  if (!/allow:\s*"\/"/.test(robots)) {
    errors.push('robots.ts must allow "/" for every user agent');
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
