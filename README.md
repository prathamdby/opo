# opo

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![opo agent](https://github.com/prathamdby/opo/actions/workflows/agent.yml/badge.svg)](https://github.com/prathamdby/opo/actions/workflows/agent.yml)

Tell opo what to change in your code. It edits the files, opens a pull request, and waits. Runs on GitHub Actions. No servers to manage.

---

## Setup

### Step 1: Add opo to your repo

```bash
curl -fsSL https://raw.githubusercontent.com/prathamdby/opo/main/install.sh | bash
```

### Step 2: Get a free API key

1. Go to [opencode.ai/zen](https://opencode.ai/zen) and sign in (no credit card needed)
2. Open **API Keys** and click **Create API Key**
3. Copy the key

### Step 3: Add the key to GitHub

1. In your repository, go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `OPENCODE_ZEN_API_KEY`. Value: your key
4. Click **Add secret**

### Step 4: Allow Actions to open pull requests

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

On an existing opo PR, comment with a follow-up task:

```
/opo also add a loading spinner while the form submits
```

opo detects the opo branch and pushes to the same PR. No new PR opened.

### From the Actions tab

Go to **Actions** → **opo agent** → **Run workflow**, enter your task, and run.

### From the GitHub CLI

```bash
gh workflow run agent.yml -f task="add input validation to the signup form"
```

---

## Writing effective tasks

Tasks that specify what, where, and why produce better PRs.

```
/opo add rate limiting to POST /api/users, max 100 req/min per IP
```

```
/opo fix the unhandled promise rejection in src/lib/auth.ts handleLogin
```

```
/opo replace moment.js with date-fns in the dashboard date formatting utils
```

Vague tasks like "fix the bug" or "make it better" force opo to guess; guessing means worse PRs.

---

## How it works

1. opo reads `AGENTS.md` for context about your project
2. It edits the relevant files
3. It opens a pull request on a new branch (`opo/your-task-name`)
4. You review and merge

Nothing merges automatically.

---

## Customizing

Edit `AGENTS.md` to tell opo about your project. It reads this file before every task. Effective additions:

- **Commands**: exact commands with flags: `npm test`, `npm run lint -- path/to/file.ts`
- **Code style**: show a real example of your preferred patterns rather than describing them
- **Boundaries**: files or directories opo should never touch
- **Project structure**: where key code lives and how it's organized
- **Testing**: how to run tests and what framework you use

Keep it short. A focused 30–50 line file outperforms a 300 line wall of text. Large instruction files waste tokens and cause the agent to miss rules.

---

## Reference

- **Tasks.** Be specific. Say what to change and where. See [Writing effective tasks](#writing-effective-tasks) for examples.
- **Rate limits.** If the primary model is rate-limited, opo retries with a fallback automatically.
- **Privacy.** The free model may use your code for training. Switch to a paid model in `opencode.jsonc` if needed.
- **CI.** GitHub doesn't trigger CI on PRs opened by Actions tokens. CI runs when you interact with the PR.
- **Trust.** Don't install opo in repos with untrusted collaborators; they can trigger the agent on your runner.

---

## License

[MIT](LICENSE)
