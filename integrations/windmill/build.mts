/**
 * Generates the Windmill scripts in f/<folder>/ from <folder>/scripts/*.ts
 * (talent, leads, platform, notify).
 * Windmill runs each script as one Bun file and resolves npm imports
 * itself, but cannot reach files outside the workspace (talent/lib, the
 * contracts package, packages/contracts/src/rules.ts). So each entry is compiled
 * with TypeScript and its relative imports are inlined, each module in its
 * own scope; npm and node: imports stay as imports at the top.
 *
 *   pnpm windmill:build            write f/talent/*.ts and *.script.yaml
 *   pnpm windmill:build --check    fail if they are out of date (CI)
 *
 * The .script.yaml files are JSON (valid YAML), in the wmill CLI's layout,
 * so `wmill sync` could read the folder too; deploy.mts uses the API.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, relative, resolve } from "node:path";
import ts from "typescript";
import { FOLDER, SCRIPTS, specPath } from "./scripts.mts";

const here = dirname(new URL(import.meta.url).pathname);
const repoRoot = resolve(here, "../..");

interface CompiledModule {
  code: string;
  exports: string[];
  deps: string[];
  /** npm / node: imports, verbatim. */
  external: string[];
}

const cache = new Map<string, CompiledModule>();

/** Schema files inlined where a setup script names their placeholder (<folder>/scripts/globals.d.ts). */
const SCHEMAS: Record<string, string> = {
  __TALENT_SCHEMA__: "talent/schema.sql",
  __LEADS_SCHEMA__: "leads/schema.sql",
  __NOTIFY_SCHEMA__: "notify/schema.sql",
};

function compile(path: string, isEntry = false): CompiledModule {
  // Keyed by role too: an entry keeps its `export`s, a helper loses them inside its scope.
  const key = `${isEntry ? "entry" : "helper"}:${path}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const output = ts.transpileModule(readFileSync(path, "utf8"), {
    fileName: path,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, removeComments: true },
  }).outputText;

  const deps: string[] = [];
  const external: string[] = [];
  // A relative JSON import (the contracts' generated schemas) becomes a constant.
  let code = output.replace(/^import\s+(\w+)\s+from\s+"(\.[^"]+\.json)"\s+with\s*\{\s*type:\s*"json"\s*\};?\s*$/gm, (_line, name: string, spec: string) => {
    const json = JSON.stringify(JSON.parse(readFileSync(resolve(dirname(path), spec), "utf8")));
    return `const ${name} = ${json};`;
  });
  code = code.replace(/^import\s+([^;]*?)\s+from\s+"([^"]+)";?\s*$/gm, (line, _bindings: string, spec: string) => {
    if (spec.startsWith(".")) {
      const dep = resolve(dirname(path), spec);
      // A script inlined into another brings its own main and preprocessor (f/talent/whatsapp, 19 Oct 2026): share through lib/.
      if (basename(dirname(dep)) === "scripts") throw new Error(`${relative(repoRoot, path)}: imports the script ${relative(repoRoot, dep)}; move what it shares to lib/`);
      deps.push(dep);
      return "";
    }
    external.push(line.trim().replace(/;?$/, ";"));
    return "";
  });
  if (/^\s*import[\s"(]/m.test(code)) throw new Error(`${relative(repoRoot, path)}: unsupported import form`);
  if (/^\s*export\s*\{/m.test(code)) throw new Error(`${relative(repoRoot, path)}: use \`export function|const\`, not \`export { }\``);

  const exports: string[] = [];
  if (!isEntry) code = code.replace(/^export\s+(?!default)((?:async\s+)?function\*?|const|let|class)\s+(\w+)/gm, (_m, kind: string, name: string) => {
    exports.push(name);
    return `${kind} ${name}`;
  });
  const compiled = { code: code.trim(), exports, deps, external };
  cache.set(key, compiled);
  return compiled;
}

/** One self-contained Bun script: hoisted npm imports, then each helper module in its own scope, then the entry. */
export function bundle(entry: string): string {
  const ordered: string[] = [];
  const visit = (path: string, stack: string[]) => {
    if (stack.includes(path)) throw new Error(`import cycle: ${[...stack, path].map((p) => relative(repoRoot, p)).join(" -> ")}`);
    for (const dep of compile(path, path === entry).deps) visit(dep, [...stack, path]);
    if (path !== entry && !ordered.includes(path)) ordered.push(path);
  };
  visit(entry, []);

  const imports = new Map<string, string>();
  const bound = new Map<string, string>();
  const seen = new Map<string, string>();
  for (const path of [...ordered, entry]) {
    for (const statement of compile(path, path === entry).external) {
      imports.set(statement, statement);
      for (const name of localNames(statement)) {
        const other = bound.get(name);
        if (other && other !== statement) throw new Error(`"${name}" is imported two ways: ${other} / ${statement}`);
        bound.set(name, statement);
      }
    }
  }
  const helpers = ordered.map((path) => {
    const mod = compile(path);
    for (const name of mod.exports) {
      const other = seen.get(name);
      if (other) throw new Error(`${relative(repoRoot, entry)}: "${name}" is exported by both ${other} and ${relative(repoRoot, path)}`);
      seen.set(name, relative(repoRoot, path));
    }
    // Not re-indented: an indent would change multi-line template strings
    // (the SQL), so a replace written against the source missed in the
    // bundle (SYNC_CANDIDATE_FOR kept its LIMIT $1, 18 Oct 2026).
    return `// ${relative(repoRoot, path)}\nconst { ${mod.exports.join(", ")} } = (() => {\n${mod.code}\n  return { ${mod.exports.join(", ")} };\n})();`;
  });

  cache.delete(entry);
  const main = compile(entry, true);
  if (!/^export async function main\(/m.test(main.code)) throw new Error(`${relative(repoRoot, entry)}: must \`export async function main(...)\``);
  let out = [
    `// Generated from integrations/windmill/${relative(here, entry)} by integrations/windmill/build.mts. Edit the source, not this.`,
    ...imports.values(),
    ...helpers,
    main.code,
    "",
  ].join("\n\n");
  for (const [placeholder, file] of Object.entries(SCHEMAS)) {
    if (!out.includes(placeholder)) continue;
    // A function replacer: a string one would read "$$" in the SQL as an escaped "$".
    const schemaLiteral = JSON.stringify(readFileSync(resolve(here, file), "utf8"));
    out = out.replaceAll(placeholder, () => schemaLiteral);
  }
  return out;
}

function localNames(statement: string): string[] {
  const m = statement.match(/^import\s+(.+?)\s+from\s+"/s);
  if (!m) return [];
  const bindings = m[1];
  const names: string[] = [];
  const ns = bindings.match(/\*\s+as\s+(\w+)/);
  if (ns) names.push(ns[1]);
  const def = bindings.match(/^(\w+)\s*(,|$)/);
  if (def) names.push(def[1]);
  const named = bindings.match(/\{([^}]*)\}/);
  if (named) {
    for (const part of named[1].split(",")) {
      const local = part.trim().split(/\s+as\s+/).pop();
      if (local) names.push(local);
    }
  }
  return names;
}

export function metadata(spec: (typeof SCRIPTS)[number]) {
  return {
    summary: spec.summary,
    description: spec.description,
    lock: "",
    kind: "script",
    language: "bun",
    schema: spec.schema,
    ...(spec.hasPreprocessor ? { has_preprocessor: true } : {}),
  };
}

export function generated(): Record<string, string> {
  const files: Record<string, string> = {};
  for (const spec of SCRIPTS) {
    const code = bundle(resolve(here, spec.folder ?? FOLDER, "scripts", `${spec.name}.ts`));
    // Syntax check of the output, as Bun will read it (ES module).
    const diag = ts.transpileModule(code, { reportDiagnostics: true, compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).diagnostics;
    if (diag?.length) throw new Error(`${spec.name}: generated code does not parse: ${ts.flattenDiagnosticMessageText(diag[0].messageText, "\n")}`);
    files[`${specPath(spec)}.ts`] = code;
    files[`${specPath(spec)}.script.yaml`] = `${JSON.stringify(metadata(spec), null, 2)}\n`;
  }
  return files;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const check = process.argv.includes("--check");
  let stale = 0;
  for (const [file, content] of Object.entries(generated())) {
    const path = resolve(here, file);
    if (check) {
      let current = "";
      try {
        current = readFileSync(path, "utf8");
      } catch {}
      if (current !== content) {
        console.error(`out of date: ${relative(repoRoot, path)} (run pnpm windmill:build)`);
        stale++;
      }
    } else {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content);
      console.log(`wrote ${relative(repoRoot, path)}`);
    }
  }
  if (stale) process.exit(1);
}
