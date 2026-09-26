/**
 * Copies the jobs form's secrets from where they live into the Vercel
 * project's Production and Preview environments, as sensitive variables.
 *
 *   pnpm talent:sync-secrets
 *
 * Needs: the vayasya-infra repo next to this one (or INFRA_DIR), your SOPS
 * age key, kubectl access (WARP on) and a logged-in, linked Vercel CLI.
 * Values are piped from each source straight into `vercel env add`; they are
 * never printed or written to disk. Re-run after rotating any of them.
 */
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { resolve } from "node:path";

const infra = process.env.INFRA_DIR ?? resolve(homedir(), "Development/arhammusheer/vayasya-infra");
const run = (cmd: string, args: string[], opts: { cwd?: string; input?: string } = {}) =>
  execFileSync(cmd, args, { cwd: opts.cwd, input: opts.input, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });

const sopsValue = (key: string) =>
  run("sops", ["decrypt", "--extract", `["stringData"]["${key}"]`, "vercel/vayasyaseva.com.sops.yaml"], { cwd: infra });

const clusterValue = (namespace: string, secret: string, key: string) =>
  Buffer.from(
    run("kubectl", ["--request-timeout=60s", "-n", namespace, "get", "secret", secret, "-o", `jsonpath={.data.${key}}`]),
    "base64",
  ).toString("utf8");

const tofuOutput = (name: string) =>
  run("cloudflare/run", ["tofu", "-chdir=cloudflare", "output", "-raw", name], { cwd: infra });

const secrets: [name: string, read: () => string][] = [
  ["TALENT_R2_ACCESS_KEY_ID", () => sopsValue("TALENT_R2_ACCESS_KEY_ID")],
  ["TALENT_R2_SECRET_ACCESS_KEY", () => sopsValue("TALENT_R2_SECRET_ACCESS_KEY")],
  ["TALENT_INTAKE_WEBHOOK_SECRET", () => clusterValue("growth", "n8n-env", "TALENT_INTAKE_WEBHOOK_SECRET")],
  ["TURNSTILE_SECRET_KEY", () => tofuOutput("vayasyaseva_jobs_turnstile_secret")],
];

for (const [name, read] of secrets) {
  const value = read().trim();
  if (!value) throw new Error(`${name}: empty value from its source`);
  run("vercel", ["env", "add", name, "production,preview", "--sensitive", "--force", "--yes"], { input: value });
  console.log(`- ${name}: set for production and preview (${value.length} chars)`);
}
console.log("done. New values apply to the next deployment.");
