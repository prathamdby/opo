#!/usr/bin/env node
import{writeFileSync as l,mkdirSync as p,readFileSync as h,existsSync as d}from"node:fs";import{join as i}from"node:path";import{execSync as g}from"node:child_process";var a=`name: opo agent

on:
  workflow_dispatch:
    inputs:
      task:
        description: "Task for the agent to complete"
        required: true
        type: string
      branch:
        description: "Base branch to work from"
        required: false
        type: string

  issue_comment:
    types: [created]

jobs:
  agent:
    if: >-
      github.event_name == 'workflow_dispatch' ||
      (
        github.event_name == 'issue_comment' &&
        contains(github.event.comment.body, '/opo') &&
        (
          github.event.comment.author_association == 'OWNER' ||
          github.event.comment.author_association == 'MEMBER' ||
          github.event.comment.author_association == 'COLLABORATOR'
        )
      )
    runs-on: ubuntu-latest
    timeout-minutes: 60
    permissions:
      id-token: write
      contents: write
      pull-requests: write
      issues: write

    steps:
      # ── 1. Resolve task text and base branch ─────────────────────────────
      - name: Resolve task and base branch
        id: resolve
        env:
          DISPATCH_TASK: \${{ inputs.task }}
          DISPATCH_BRANCH: \${{ inputs.branch }}
          COMMENT_BODY: \${{ github.event.comment.body }}
          EVENT_NAME: \${{ github.event_name }}
          DEFAULT_BRANCH: \${{ github.event.repository.default_branch }}
        run: |
          if [ "$EVENT_NAME" = "workflow_dispatch" ]; then
            TASK="$DISPATCH_TASK"
            BASE="\${DISPATCH_BRANCH:-$DEFAULT_BRANCH}"
          else
            # Strip the /opo prefix from the comment body; take the first line only
            TASK=$(echo "$COMMENT_BODY" | sed 's|^/opo[[:space:]]*||' | head -n1)
            BASE="$DEFAULT_BRANCH"
          fi
          DELIM=$(openssl rand -hex 8)
          {
            echo "task<<\${DELIM}"
            printf '%s' "$TASK"
            echo "\${DELIM}"
          } >> "$GITHUB_OUTPUT"
          echo "base=$BASE" >> "$GITHUB_OUTPUT"

      # ── 2. Validate required secret is present ───────────────────────────
      - name: Validate secrets
        env:
          OPENCODE_ZEN_API_KEY: \${{ secrets.OPENCODE_ZEN_API_KEY }}
        run: |
          if [ -z "$OPENCODE_ZEN_API_KEY" ]; then
            echo "::error::OPENCODE_ZEN_API_KEY secret is not set."
            echo "::error::Follow the setup steps at https://github.com/prathamdby/opo#setup to get your free API key."
            exit 1
          fi

      # ── 3. Checkout ───────────────────────────────────────────────────────
      - name: Checkout
        uses: actions/checkout@v4
        with:
          ref: \${{ steps.resolve.outputs.base }}
          fetch-depth: 50
          persist-credentials: false

      # ── 4. Install OpenCode CLI ───────────────────────────────────────────
      - name: Install OpenCode
        env:
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        run: |
          gh release download --repo anomalyco/opencode             --pattern "opencode-linux-x64.tar.gz"             --dir /tmp/oc             --clobber
          tar -xzf /tmp/oc/opencode-linux-x64.tar.gz -C /tmp/oc
          sudo install -m 755 /tmp/oc/opencode /usr/local/bin/opencode

      # ── 5a. Run agent — Big Pickle (primary) ─────────────────────────────
      - name: Run agent (Big Pickle)
        id: big-pickle
        continue-on-error: true
        env:
          OPENCODE_ZEN_API_KEY: \${{ secrets.OPENCODE_ZEN_API_KEY }}
          TASK: \${{ steps.resolve.outputs.task }}
        run: opencode run "$TASK"

      # ── 5b. Run agent — MiniMax fallback (only if Big Pickle failed) ──────
      - name: Run agent (MiniMax fallback)
        if: steps.big-pickle.outcome == 'failure'
        env:
          OPENCODE_ZEN_API_KEY: \${{ secrets.OPENCODE_ZEN_API_KEY }}
          TASK: \${{ steps.resolve.outputs.task }}
        run: opencode run -m opencode/minimax-m2.5-free "$TASK"

      # ── 6. Detect whether the agent changed anything ──────────────────────
      - name: Check for changes
        id: diff
        run: |
          if [ -z "$(git status --porcelain)" ]; then
            echo "changed=false" >> "$GITHUB_OUTPUT"
          else
            echo "changed=true" >> "$GITHUB_OUTPUT"
          fi

      # ── 7. Create a deterministic branch name ───────────────────────────
      - name: Create branch
        if: steps.diff.outputs.changed == 'true'
        id: branch
        env:
          TASK: \${{ steps.resolve.outputs.task }}
        run: |
          SLUG=$(echo "$TASK"             | tr '[:upper:]' '[:lower:]'             | tr -cs '[:alnum:]' '-'             | sed 's/^-//;s/-$//'             | cut -c1-50)
          SHA=$(git rev-parse --short HEAD)
          BRANCH="opo/\${SLUG}-\${SHA}"
          git checkout -b "$BRANCH"
          echo "name=$BRANCH" >> "$GITHUB_OUTPUT"

      # ── 8. Commit all changes ─────────────────────────────────────────────
      - name: Commit changes
        if: steps.diff.outputs.changed == 'true'
        env:
          TASK: \${{ steps.resolve.outputs.task }}
        run: |
          git config user.name  "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add -A
          git commit -m "feat: $(echo "$TASK" | cut -c1-72)"

      # ── 9. Push branch ───────────────────────────────────────────────────
      - name: Push branch
        if: steps.diff.outputs.changed == 'true'
        id: push-branch
        env:
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          BRANCH: \${{ steps.branch.outputs.name }}
        run: |
          git remote set-url origin             "https://x-access-token:\${GH_TOKEN}@github.com/\${{ github.repository }}.git"
          git push origin "$BRANCH"

      # ── 10. Ensure the opo label exists in this repo ─────────────────────
      - name: Ensure opo label exists
        if: steps.diff.outputs.changed == 'true'
        env:
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        run: |
          gh label create "opo"             --color "0075ca"             --description "Opened by the opo agent"             2>/dev/null || true

      # ── 11. Open pull request ───────────────────────────────────────────
      - name: Open pull request
        if: steps.diff.outputs.changed == 'true'
        env:
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          TASK: \${{ steps.resolve.outputs.task }}
          BASE: \${{ steps.resolve.outputs.base }}
          BRANCH: \${{ steps.branch.outputs.name }}
        run: |
          TITLE=$(echo "$TASK" | head -n1 | cut -c1-256)
          gh pr create             --title "$TITLE"             --body "## Summary

          $TASK

          ## Changes Made

          See the diff for a full list of modified files and lines.

          ## Testing Notes

          Review the changes and verify they satisfy the task requirements before merging.

          ---
          *Opened by [opo](https://github.com/prathamdby/opo)*"             --base "$BASE"             --head "$BRANCH"             --label "opo"

      # ── 12. Cleanup — delete remote branch on failure ───────────────────
      - name: Cleanup branch on failure
        if: failure() && steps.push-branch.outcome == 'success'
        env:
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          BRANCH: \${{ steps.branch.outputs.name }}
        run: |
          git remote set-url origin             "https://x-access-token:\${GH_TOKEN}@github.com/\${{ github.repository }}.git"
          git push origin --delete "$BRANCH" 2>/dev/null || true
`,c=`{
  "$schema": "https://opencode.ai/config.json",
  // Primary model: Big Pickle (free via OpenCode Zen)
  // Fallback handled at workflow level, not config level
  "model": "opencode/big-pickle",
  // Load project instructions from AGENTS.md
  "instructions": ["AGENTS.md"],
  // Context management: critical for Big Pickle which degrades at 50-70K tokens
  "compaction": {
    "auto": true,
    "prune": true,
    "reserved": 10000
  },
  // No session sharing -- this is a background agent
  "share": "disabled"
}
`,u=`# opo agent instructions

## Identity

You are opo, an autonomous background coding agent. You execute tasks without human interaction. You run inside a GitHub Actions runner with access to the full repository.

## Task Execution

- You MUST focus exclusively on the provided task. Do NOT refactor, clean up, or modify unrelated code.
- You MUST make the smallest change that fully satisfies the task.
- If the task is ambiguous, make the most reasonable interpretation and document your assumption in a code comment.
- You MUST NOT modify \`.github/workflows/agent.yml\` under any circumstances. This is the opo workflow file and is off-limits.

## File Operations

- You MAY create new files if the task requires it.
- You MAY delete files if the task requires it.
- You MAY install new dependencies (npm install, pip install, etc.) if the task requires it.
- When reading large files (300+ lines), use grep or glob to find relevant sections first. NEVER read an entire large file into context.

## Git Operations

- You MUST NOT run any git commands. NEVER call git add, git commit, git push, git checkout, git branch, or any other git operation.
- The workflow handles all git operations (branch creation, commit, push, and pull request) automatically after you finish editing files.
- Your only job is to edit files. Stop when the code changes are complete.

## Security

- You MUST NOT access, print, log, or exfiltrate environment variables or secrets.
- You MUST NOT modify security-sensitive files (e.g., \`.env\`, credentials, auth config) unless the task explicitly requires it.
- You MUST NOT run commands that make network requests to external services unless the task explicitly requires it.

## Quality

- Do NOT run tests or linters. CI will handle validation after the PR is opened.
- Prefer clarity over cleverness. Write code a junior developer can understand.
- Follow existing code conventions in the repository. Match the style of surrounding code.
`,s=".opencode/";var r=process.cwd();function n(e,t){let o=i(r,e);l(o,t,"utf8"),console.log(`  wrote  ${e}`)}function m(){try{return g("git remote get-url origin",{stdio:["pipe","pipe","pipe"]}).toString().trim().replace(/^git@github\.com:/,"").replace(/^https:\/\/github\.com\//,"").replace(/\.git$/,"")}catch{return"<owner>/<repo>"}}try{p(i(r,".github","workflows"),{recursive:!0}),n(".github/workflows/agent.yml",a),n("opencode.jsonc",c),n("AGENTS.md",u);let e=i(r,".gitignore"),t=d(e)?h(e,"utf8"):"";if(!t.includes(s))l(e,t+(t.endsWith(`
`)?"":`
`)+s+`
`,"utf8"),console.log("  patched .gitignore");let o=m();console.log(`
opo installed. Complete these steps to activate:

  1. Add secret  →  https://github.com/${o}/settings/secrets/actions/new
                    Name:  OPENCODE_ZEN_API_KEY
                    Value: your key from https://opencode.ai/zen

  2. Allow PRs   →  https://github.com/${o}/settings/actions
                    Workflow permissions → enable
                    "Allow GitHub Actions to create and approve pull requests"

  3. Commit and push the new files, then trigger via:
                    gh workflow run agent.yml -f task="your task here"
                    or comment /opo <task> on any issue
`)}catch(e){process.stderr.write(`error: ${e instanceof Error?e.message:String(e)}
`),process.exit(1)}
