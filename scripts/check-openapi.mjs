import fs from "node:fs";
import { execFileSync } from "node:child_process";
import {
  buildOpenApiSpec,
  loadContactContract,
  openApiOutputPath,
  stringifyOpenApiSpec,
} from "./openapi-spec.mjs";

// The components come from packages/contracts/generated: check those first.
try {
  execFileSync(process.execPath, ["packages/contracts/scripts/generate.mjs", "--check"], { stdio: "inherit" });
} catch {
  console.error("Run: pnpm contracts:generate && pnpm openapi:generate");
  process.exit(1);
}

if (!fs.existsSync(openApiOutputPath)) {
  console.error(`Missing ${openApiOutputPath}`);
  console.error("Run: pnpm openapi:generate");
  process.exit(1);
}

const contract = loadContactContract();
const expected = stringifyOpenApiSpec(buildOpenApiSpec(contract));
const current = fs.readFileSync(openApiOutputPath, "utf8");

if (current !== expected) {
  console.error("OpenAPI spec is out of date with the contracts package.");
  console.error("Run: pnpm openapi:generate");
  process.exit(1);
}

console.log("OpenAPI spec matches the contracts package.");
