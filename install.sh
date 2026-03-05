#!/bin/bash

main() {
    set -euo pipefail

    cd "$(git rev-parse --show-toplevel)"

    remote_url=$(git remote get-url origin)
    repo_slug=$(echo "$remote_url" | sed -E 's|^git@github\.com:||; s|^ssh://git@github\.com/||; s|^https://github\.com/||; s|\.git$||')
    if [[ -z "$repo_slug" ]]; then
        repo_slug="<owner>/<repo>"
    fi

    mkdir -p .github/workflows
    curl -fsSL "https://raw.githubusercontent.com/prathamdby/opo/main/.github/workflows/agent.yml" -o .github/workflows/agent.yml
    curl -fsSL "https://raw.githubusercontent.com/prathamdby/opo/main/opencode.jsonc" -o opencode.jsonc

    if [[ -f "AGENTS.md" ]]; then
        if grep -q "# opo" AGENTS.md && grep -q "## Boundaries" AGENTS.md; then
            echo "already present"
        else
            echo "" >> AGENTS.md
            curl -fsSL "https://raw.githubusercontent.com/prathamdby/opo/main/AGENTS.md" -o /tmp/AGENTS.md
            cat /tmp/AGENTS.md >> AGENTS.md
        fi
    else
        curl -fsSL "https://raw.githubusercontent.com/prathamdby/opo/main/AGENTS.md" -o AGENTS.md
    fi

    if [[ -f ".gitignore" ]]; then
        if ! grep -q "^.opencode/$" .gitignore && ! grep -q "^.opencode$" .gitignore; then
            if [[ -n "$(tail -c 1 .gitignore)" ]]; then
                echo "" >> .gitignore
            fi
            echo ".opencode/" >> .gitignore
        fi
    else
        echo ".opencode/" > .gitignore
    fi

    echo ""
    echo "Installation complete! Next steps:"
    echo "1. Add OPENCODE_ZEN_API_KEY secret:"
    echo "   - Go to: https://github.com/${repo_slug}/settings/secrets/actions/new"
    echo "   - Name: OPENCODE_ZEN_API_KEY"
    echo "   - Get your free API key at https://opencode.ai/zen"
    echo "   - Paste the API key as the secret value"
    echo ""
    echo "2. Enable Actions permissions:"
    echo "   - Go to: https://github.com/${repo_slug}/settings/actions"
    echo "   - Under 'Workflow permissions', select 'Read and write' permissions"
    echo "   - Check 'Allow GitHub Actions to create and approve pull requests'"
    echo ""
    echo "3. Commit and push your changes:"
    echo "   - Run: git add -A && git commit -m 'Set up opo agent'"
    echo "   - Run: git push"
    echo ""
    echo "4. Trigger opo to run:"
    echo "   - Option A: Run 'gh workflow run agent.yml' in your terminal"
    echo "   - Option B: Comment '/opo <task>' on an issue (e.g., '/opo fix the typo in README')"
    echo ""
    echo "For more details, see: https://opencode.ai/zen/docs"
    echo ""
}

main "$@"
