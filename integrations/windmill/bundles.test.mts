// The generated f/ scripts as Windmill receives them: each must parse as one
// module. The other tests import the sources, so a bundle broken by build.mts
// (an `export` left inside a helper's scope, f/talent/whatsapp on 19 Oct
// 2026) only showed as a failed dependency lock after deploying.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { bundle } from "./build.mts";
import { FOLDER, SCRIPTS, specPath } from "./scripts.mts";

const here = import.meta.dirname;

test("every generated script parses as a module", () => {
  const dir = mkdtempSync(join(tmpdir(), "windmill-bundles-"));
  try {
    for (const spec of SCRIPTS) {
      const file = join(dir, `${specPath(spec).replaceAll("/", "_")}.mjs`);
      // `node --check` skips .ts files, so the bundle is checked as .mjs.
      writeFileSync(file, bundle(join(here, spec.folder ?? FOLDER, "scripts", `${spec.name}.ts`)));
      assert.doesNotThrow(() => execFileSync(process.execPath, ["--check", file], { stdio: "pipe" }), specPath(spec));
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a script that imports another script is refused", () => {
  const dir = mkdtempSync(join(here, ".bundle-test-"));
  try {
    writeFileSync(join(dir, "a.ts"), 'import { b } from "./scripts/b.ts";\nexport async function main() { return b; }\n');
    mkdirSync(join(dir, "scripts"));
    writeFileSync(join(dir, "scripts", "b.ts"), "export const b = 1;\nexport async function main() {}\n");
    assert.throws(() => bundle(join(dir, "a.ts")), /imports the script/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
