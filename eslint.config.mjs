import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * The business phone is for businesses only. Jobs and reference code, and the
 * shared header and footer (which get the phone as a prop from the business
 * layout), must not import it or the business JSON-LD graph that carries it.
 * See src/content/business-contact.ts; `pnpm phone:check` checks the output.
 */
const businessOnly = {
  paths: [
    {
      name: "@/content/business-contact",
      message: "The business phone is for business pages only. Jobs and reference pages never show it.",
    },
    {
      name: "@/lib/business-graph",
      message: "The business graph carries the phone. Use phoneFreeGraphSchema() from @/lib/structured-data.",
    },
  ],
  patterns: [
    {
      group: ["**/business-contact", "**/business-graph"],
      message: "The business phone is for business pages only. Jobs and reference pages never show it.",
    },
  ],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: [
      "src/app/\\[locale\\]/(jobs)/**",
      "src/app/\\[locale\\]/(reference)/**",
      "src/components/jobs/**",
      "src/components/layout/header.tsx",
      "src/components/layout/footer.tsx",
      "src/components/layout/footer-jobs-link.tsx",
      "src/components/pages/{jobs,job-role,job-hub,quick-apply,fees-and-fraud}.tsx",
      "src/content/pages/{jobs,job-roles,job-hubs,quick-apply,fees-and-fraud}.ts",
    ],
    rules: {
      "no-restricted-imports": ["error", businessOnly],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
