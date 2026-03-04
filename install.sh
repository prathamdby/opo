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
        if grep -q "# opo agent instructions" AGENTS.md; then
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
    echo "1. Add OPENCODE_ZEN_API_KEY secret: https://github.com/${repo_slug}/settings/secrets/actions/new"
    echo "   Get your free API key at https://opencode.ai/zen"
    echo "2. Enable Actions PR permissions: https://github.com/${repo_slug}/settings/actions"
    echo "3. Commit, push, and trigger opo via 'gh workflow run agent.yml' or by commenting '/opo <task>' on an issue"
    echo ""
}

main "$@"
