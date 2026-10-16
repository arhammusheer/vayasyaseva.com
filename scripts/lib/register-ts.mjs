// Lets Node import the site's TypeScript modules: resolves the "@/" alias,
// extensionless relative imports and folder index files to .ts files, and
// Next.js entry points ("next/server"). Node
// strips the types itself, so modules must avoid enums and other TS-only
// runtime syntax. Import this before importing any file under src/.
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

registerHooks({
  resolve(specifier, context, next) {
    const base = specifier.startsWith("@/")
      ? resolve(root, "src", specifier.slice(2))
      : specifier.startsWith(".") && context.parentURL?.endsWith(".ts")
        ? resolve(dirname(fileURLToPath(context.parentURL)), specifier)
        : null;
    if (base) {
      for (const file of [`${base}.ts`, resolve(base, "index.ts")]) {
        if (existsSync(file)) return next(pathToFileURL(file).href, context);
      }
    }
    // Next.js entry points such as "next/server" have no exports map, so
    // Node needs their file name ("next/server.js"); the bundler does not.
    if (/^next\/[a-z/-]+$/.test(specifier)) {
      try {
        return next(specifier, context);
      } catch (error) {
        if (error?.code !== "ERR_MODULE_NOT_FOUND") throw error;
        return next(`${specifier}.js`, context);
      }
    }
    return next(specifier, context);
  },
});

/** Imports a module under the repo root, e.g. importTs("src/app/sitemap.ts"). */
export const importTs = (path) => import(pathToFileURL(resolve(root, path)).href);
