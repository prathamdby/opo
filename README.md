# opo 🚀

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![opo agent](https://github.com/prathamdby/opo/actions/workflows/agent.yml/badge.svg)](https://github.com/prathamdby/opo/actions/workflows/agent.yml)

An async background coding agent 🎨. Give it a task, it edits code, commits, and opens a pull request. Runs inside GitHub Actions. Powered by [OpenCode](https://opencode.ai) and [Big Pickle](https://opencode.ai/docs/zen/) (free model, no payment required).

## Setup ⚙️

### 1. Copy the template files 📂

Copy these files into your repository:

- `.github/workflows/agent.yml` 📄
- `opencode.jsonc` 📋
- `AGENTS.md` 📝

### 2. Get your free OpenCode Zen API key 🔑

1. Go to [opencode.ai/zen](https://opencode.ai/zen)
2. Click **Sign In** and create a free account
3. No payment method or credit card is required
4. Once signed in, navigate to the **API Keys** section
5. Click **Create API Key** and copy the key

### 3. Add the secret to your repository 🔐

1. Go to your repository on GitHub
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Name: `OPENCODE_ZEN_API_KEY`
5. Value: paste your API key from step 2
6. Click **Add secret**

That's it. opo is ready. ✨

## Usage 💻

### Via CLI ⌨️

```bash
gh workflow run agent.yml -f task="Add input validation to the signup form" -f branch="main"
```

### Via GitHub UI 🖥️

1. Go to the **Actions** tab in your repository
2. Select **opo agent** from the left sidebar
3. Click **Run workflow**
4. Enter your task description and optionally specify a branch
5. Click **Run workflow**

### Via issue comment 💬

Comment on any issue or PR:

```
/opo add error handling to the payment module
```

Only repository owners, org members, and collaborators can trigger the agent via comments.

## How it works ⚡

1. You provide a task (via CLI, GitHub UI, or issue comment) 📝
2. A GitHub Actions runner spins up and checks out your repository 🔄
3. OpenCode agent reads your `AGENTS.md` for project context 📖
4. The agent edits code, creates a branch (`opo/descriptive-name`), and commits changes ✏️
5. A pull request is opened for your review 🔀
6. If the primary model (Big Pickle) fails, it automatically retries with MiniMax M2.5 Free 🔁

All changes require human review before merging.

## Customization 🎛️

Edit `AGENTS.md` to tailor the agent for your project:

- Add build commands, test commands, or framework-specific instructions 🛠️
- Adjust file handling rules for your codebase size 📊
- Add project-specific conventions or constraints 📋

The agent reads `AGENTS.md` before every task.

## Known limitations ⚠️

- **Context window** 📏: Big Pickle's effective context is ~50-70K tokens (despite a 200K window). Keep tasks focused.
- **Rate limiting** 🚦: The free tier has rate limits. If you hit them, the agent automatically falls back to MiniMax M2.5 Free.
- **Hanging** 🐛: OpenCode's GitHub Action has known hanging bugs. The 60-minute timeout is a safeguard.
- **Privacy** 🔒: Big Pickle's free tier data may be used for model training. Switch to a paid model in `opencode.jsonc` if this matters.
- **CI triggers** ⚡: PRs created by `GITHUB_TOKEN` don't automatically trigger other workflows. CI runs when a human interacts with the PR.

## License 📜

[MIT](LICENSE)
