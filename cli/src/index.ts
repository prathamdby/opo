#!/usr/bin/env node
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { WORKFLOW_YML, OPENCODE_JSONC, AGENTS_MD, GITIGNORE_ENTRY } from "./files.js";

const cwd = process.cwd();

function write(relPath: string, content: string) {
  const abs = join(cwd, relPath);
  writeFileSync(abs, content, "utf8");
  console.log(`  wrote  ${relPath}`);
}

function repoSlug(): string {
  try {
    const raw = execSync("git remote get-url origin", { stdio: ["pipe", "pipe", "pipe"] })
      .toString()
      .trim();
    return raw
      .replace(/^git@github\.com:/, "")
      .replace(/^https:\/\/github\.com\//, "")
      .replace(/\.git$/, "");
  } catch {
    return "<owner>/<repo>";
  }
}

try {
  mkdirSync(join(cwd, ".github", "workflows"), { recursive: true });

  write(".github/workflows/agent.yml", WORKFLOW_YML);
  write("opencode.jsonc", OPENCODE_JSONC);
  write("AGENTS.md", AGENTS_MD);

  const gitignorePath = join(cwd, ".gitignore");
  const existing = existsSync(gitignorePath) ? readFileSync(gitignorePath, "utf8") : "";
  if (!existing.includes(GITIGNORE_ENTRY)) {
    writeFileSync(gitignorePath, existing + (existing.endsWith("\n") ? "" : "\n") + GITIGNORE_ENTRY + "\n", "utf8");
    console.log("  patched .gitignore");
  }

  const slug = repoSlug();

  console.log(`
opo installed. Complete these steps to activate:

  1. Add secret  →  https://github.com/${slug}/settings/secrets/actions/new
                    Name:  OPENCODE_ZEN_API_KEY
                    Value: your key from https://opencode.ai/zen

  2. Allow PRs   →  https://github.com/${slug}/settings/actions
                    Workflow permissions → enable
                    "Allow GitHub Actions to create and approve pull requests"

  3. Commit and push the new files, then trigger via:
                    gh workflow run agent.yml -f task="your task here"
                    or comment /opo <task> on any issue
`);
} catch (err) {
  process.stderr.write(`error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
}
