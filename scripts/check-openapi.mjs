import fs from "node:fs";
import {
  buildOpenApiSpec,
  loadContactContract,
  openApiOutputPath,
  stringifyOpenApiSpec,
} from "./openapi-spec.mjs";

if (!fs.existsSync(openApiOutputPath)) {
  console.error(`Missing ${openApiOutputPath}`);
  console.error("Run: npm run openapi:generate");
  process.exit(1);
}

const contract = loadContactContract();
const expected = stringifyOpenApiSpec(buildOpenApiSpec(contract));
const current = fs.readFileSync(openApiOutputPath, "utf8");

if (current !== expected) {
  console.error("OpenAPI spec is out of date with contact contract.");
  console.error("Run: npm run openapi:generate");
  process.exit(1);
}

console.log("OpenAPI spec matches the canonical contact contract.");
