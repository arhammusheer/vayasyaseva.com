import fs from "node:fs";
import path from "node:path";
import {
  buildOpenApiSpec,
  loadContactContract,
  openApiOutputPath,
  stringifyOpenApiSpec,
} from "./openapi-spec.mjs";

const contract = loadContactContract();
const spec = buildOpenApiSpec(contract);
const output = stringifyOpenApiSpec(spec);

fs.mkdirSync(path.dirname(openApiOutputPath), { recursive: true });
fs.writeFileSync(openApiOutputPath, output, "utf8");

console.log(`OpenAPI spec written to ${openApiOutputPath}`);
