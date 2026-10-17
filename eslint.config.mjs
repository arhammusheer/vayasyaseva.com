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

/**
 * Measurement goes through src/lib/measurement (docs/marketing-stack.md):
 * call sites use the gateway (browser) or server.ts (server); only its
 * vendors/ files load a vendor's library or touch its globals, and only its
 * store reads or writes the consent keys.
 */
const MEASUREMENT = "Measurement goes through src/lib/measurement: the gateway in the browser, server.ts on the server.";
const measurementOnly = {
  paths: [
    { name: "@next/third-parties/google", message: MEASUREMENT },
    { name: "@vercel/analytics", message: MEASUREMENT },
    { name: "@/lib/server-events", message: `${MEASUREMENT} Use reportServerCount.` },
    { name: "@/lib/google-ads-conversions", message: `${MEASUREMENT} Use reportAdClickConversion.` },
  ],
  patterns: [{ group: ["@vercel/analytics/*"], message: MEASUREMENT }],
};
const CONSENT_KEYS = "The consent keys belong to src/lib/measurement/store.ts. Use allowed() or useAllowed().";
const measurementSyntax = [
  { selector: "MemberExpression[object.name='window'][property.name='umami']", message: `${MEASUREMENT} Umami is vendors/umami.ts.` },
  { selector: "MemberExpression[object.name='window'][property.name='fbq']", message: `${MEASUREMENT} Meta is vendors/meta.ts.` },
  { selector: "Identifier[name='dataLayer']", message: `${MEASUREMENT} The Google tag is vendors/ga4.ts and vendors/google-ads.ts.` },
  { selector: "Literal[value=/^vayasya-site-measurement/]", message: CONSENT_KEYS },
  { selector: "TemplateElement[value.raw=/^vayasya-site-measurement/]", message: CONSENT_KEYS },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx,js,jsx,mjs}"],
    ignores: ["src/lib/measurement/**"],
    rules: {
      "no-restricted-imports": ["error", measurementOnly],
      "no-restricted-syntax": ["error", ...measurementSyntax],
    },
  },
  {
    files: [
      "src/app/\\[locale\\]/(jobs)/**",
      "src/app/\\[locale\\]/(reference)/**",
      "src/app/\\[locale\\]/(locations)/**",
      "src/components/jobs/**",
      "src/components/layout/header.tsx",
      "src/components/layout/footer.tsx",
      "src/components/layout/nav-links.ts",
      "src/components/pages/{jobs,job-role,job-hub,job-cluster,quick-apply,fees-and-fraud,minimum-wages,guide,location}.tsx",
      "src/components/sections/paused-notice.tsx",
      "src/content/pages/{jobs,job-roles,job-hubs,job-clusters,quick-apply,fees-and-fraud,minimum-wages,minimum-wages.hi}.ts",
      "src/content/guides/**",
      "src/content/wages/**",
      "src/app/(picker)/**",
    ],
    rules: {
      // Both lists: a later config's options replace an earlier one's for the same rule.
      "no-restricted-imports": [
        "error",
        { paths: [...businessOnly.paths, ...measurementOnly.paths], patterns: [...businessOnly.patterns, ...measurementOnly.patterns] },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated Windmill scripts (integrations/windmill/build.mts): plain JS bundles.
    "integrations/windmill/f/**",
  ]),
]);

export default eslintConfig;
