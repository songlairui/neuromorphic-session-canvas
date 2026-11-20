# Issue tracker: GitHub Issues

Issues and specs for this repo live as **GitHub issues** on `songlairui/neuromorphic-session-canvas`, managed via the `gh` CLI. Historical local tickets may still exist under `.scratch/` — new work goes to GitHub.

**Upgraded by `/setup-work-tracer` on 2026-11-21** from the init default (local markdown).

## Conventions

- One feature per **GitHub issue**; break work into sub-issues or task lists inside the issue body when needed.
- Specs that are too large for an issue body live in-repo under `docs/` and are linked from the issue.
- Triage state is a **label**, not a status line. Canonical roles (see `docs/agents/triage-labels.md`):
  - `needs-triage` — new, not yet evaluated
  - `needs-info` — blocked on reporter input
  - `ready-for-agent` — fully specified, an agent can implement it
  - `ready-for-human` — requires human judgment or action
  - `wontfix` — will not be worked on
- `enhancement` / `bug` / `documentation` may be combined with a triage label.

## Commands

```bash
# List open issues
gh issue list --repo songlairui/neuromorphic-session-canvas

# Create an issue
gh issue create --repo songlairui/neuromorphic-session-canvas \
  --title "<title>" --body-file <path> --label needs-triage

# Read an issue (body + comments)
gh issue view <N> --repo songlairui/neuromorphic-session-canvas --comments

# Comment / label / close
gh issue comment <N> --repo songlairui/neuromorphic-session-canvas --body "..."
gh issue edit <N> --repo songlairui/neuromorphic-session-canvas --add-label ready-for-agent
gh issue close <N> --repo songlairui/neuromorphic-session-canvas
```

When a skill says "publish to the issue tracker" → `gh issue create`. When it says "fetch the relevant ticket" → `gh issue view <N> --comments`. The user normally passes the issue number directly.
