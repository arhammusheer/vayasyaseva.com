// Checks, pushes main, waits for the Vercel production deploy of HEAD, then
// runs the SEO check against production. IndexNow submission for changed pages
// follows automatically in GitHub Actions (.github/workflows/indexnow.yml).
// Run: pnpm ship   (needs a clean tree on main and the gh CLI signed in)
import { execSync, spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const run = (cmd) => execSync(cmd, { stdio: "inherit" });
const out = (cmd) => execSync(cmd, { encoding: "utf8" }).trim();
const step = (message) => console.log(`\n▸ ${message}`);

if (out("git rev-parse --abbrev-ref HEAD") !== "main") throw new Error("Ship from main.");
if (out("git status --porcelain")) throw new Error("Working tree is not clean; commit or stash first.");
run("git fetch -q origin main");
if (out("git rev-list --count HEAD..origin/main") !== "0") throw new Error("origin/main has commits you don't; pull first.");
if (out("git rev-list --count origin/main..HEAD") === "0") throw new Error("Nothing to ship: main matches origin.");

step("Slop lint, lint, type check");
run("pnpm -s lint:slop");
run("pnpm -s lint");
run("pnpm -s type-check");

step("Build");
run("pnpm -s build");

step("SEO check on the local build");
const server = spawn("pnpm", ["-s", "start", "-p", "3123"], { stdio: "ignore", detached: true });
try {
  for (let i = 0; i < 30; i++) {
    try {
      await fetch("http://localhost:3123");
      break;
    } catch {
      await sleep(1000);
    }
  }
  run("pnpm -s seo:check http://localhost:3123");
} finally {
  // Killing the process group can be refused (EPERM) inside a sandboxed shell;
  // fall back to the server process itself rather than aborting the ship.
  try {
    process.kill(-server.pid);
  } catch {
    server.kill();
  }
}

const sha = out("git rev-parse HEAD");
step(`Push ${sha.slice(0, 7)}`);
run("git push -q origin main");

step("Waiting for the Vercel production deploy");
const repo = out("gh repo view --json nameWithOwner --jq .nameWithOwner");
let state = "pending";
for (let i = 0; i < 60 && !["success", "failure", "error"].includes(state); i++) {
  await sleep(10_000);
  const id = out(`gh api "repos/${repo}/deployments?sha=${sha}&environment=Production" --jq ".[0].id // empty"`);
  if (id) state = out(`gh api repos/${repo}/deployments/${id}/statuses --jq ".[0].state // \\"pending\\""`);
  process.stdout.write(`  ${state}\r`);
}
if (state !== "success") throw new Error(`Production deploy ended as "${state}".`);
console.log("  live");

step("SEO check on production");
await sleep(30_000);
run("pnpm -s seo:check https://www.vayasyaseva.com");

console.log("\nShipped. IndexNow runs in GitHub Actions: gh run list --workflow indexnow.yml -L 1");
