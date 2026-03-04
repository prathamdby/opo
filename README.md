# opo

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![opo agent](https://github.com/prathamdby/opo/actions/workflows/agent.yml/badge.svg)](https://github.com/prathamdby/opo/actions/workflows/agent.yml)

Tell opo what to change in your code. It edits the files, opens a pull request, and waits. Runs on GitHub Actions — no servers to manage.

---

## Setup

### Step 1 — Add opo to your repo

```bash
curl -fsSL https://raw.githubusercontent.com/prathamdby/opo/main/install.sh | bash
```

### Step 2 — Get a free API key

1. Go to [opencode.ai/zen](https://opencode.ai/zen) and sign in (no credit card needed)
2. Open **API Keys** and click **Create API Key**
3. Copy the key

### Step 3 — Add the key to GitHub

1. In your repository, go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `OPENCODE_ZEN_API_KEY` — Value: your key
4. Click **Add secret**

### Step 4 — Allow Actions to open pull requests

1. In **Settings**, go to **Actions** → **General**
2. Under **Workflow permissions**, select **Read and write permissions**
3. Check **Allow GitHub Actions to create and approve pull requests**
4. Save

---

## Usage

### From a GitHub issue or PR

Comment on any issue or pull request:

```
/opo add error handling to the login form
```

opo reacts with 👀 and opens a pull request when done. Only owners, members, and collaborators can trigger it this way.

### From the Actions tab

Go to **Actions** → **opo agent** → **Run workflow**, enter your task, and run.

### From the GitHub CLI

```bash
gh workflow run agent.yml -f task="add input validation to the signup form"
```

---

## How it works

1. opo reads `AGENTS.md` for context about your project
2. It edits the relevant files
3. It opens a pull request on a new branch (`opo/your-task-name`)
4. You review and merge

Nothing merges automatically.

---

## Customizing

Edit `AGENTS.md` to tell opo about your project — how to run tests, which files to avoid, conventions your team follows. It reads this file before every task.

---

## Things to know

- **Tasks.** Keep them focused and specific. Vague instructions produce vague results.
- **Rate limits.** If the primary model is rate-limited, opo retries with a fallback automatically.
- **Privacy.** The free model may use your code for training. Switch to a paid model in `opencode.jsonc` if needed.
- **CI.** GitHub doesn't trigger CI on PRs opened by Actions tokens. CI runs when you interact with the PR.
- **Trust.** Don't install opo in repos with untrusted collaborators — they can trigger the agent on your runner.

---

## License

[MIT](LICENSE)
