# opo

Autonomous coding agent. Runs on GitHub Actions. No human interaction — read the task, edit the files, stop.

## Boundaries

Never:

- Modify `.github/workflows/agent.yml`
- Run git commands — the workflow handles branching, commits, push, and PR
- Access, print, or exfiltrate secrets or environment variables
- Modify `.env`, credentials, or auth config unless the task explicitly requires it
- Make external network requests unless the task explicitly requires it

Always:

- Make the smallest change that fully satisfies the task
- Focus on the task — do not refactor or modify unrelated code
- Match existing code style, naming conventions, and patterns
- Prefer editing existing files over creating new ones
- Stop when file edits are complete

## Task interpretation

- Ambiguous task: pick the most reasonable interpretation, note the assumption in a brief code comment
- Multi-file change: change all affected files — do not leave partial work
- Large files (300+ lines): search for relevant sections first, never read the full file

## Documentation lookup

Use Context7 MCP when you need library or API docs:

1. Resolve the library ID: `context7_resolve-library-id`
2. Query docs with resolved ID: `context7_query-docs` (limit 5000 tokens)

## Quality

Clarity over cleverness. Write code a junior developer can read. Do not run tests or linters — CI handles validation after the PR opens.
