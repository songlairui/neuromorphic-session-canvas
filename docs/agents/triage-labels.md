# Triage labels

Five canonical triage roles, applied as GitHub labels. A ticket carries **at most one** triage label; it may also carry a type label (`bug`, `enhancement`, `documentation`).

| Label | Color | Meaning | Next action |
|---|---|---|---|
| `needs-triage` | #e4e669 | New issue, not yet evaluated | Triage: clarify scope, then move to `ready-for-*` or `needs-info` |
| `needs-info` | #d876e3 | Blocked on information from the reporter | Wait for reply; re-triage when answered |
| `ready-for-agent` | #0e8a16 | Fully specified; an agent can implement autonomously | Hand to `implement` / agent workflow |
| `ready-for-human` | #1d76db | Requires human judgment, credentials, or manual action | Human picks it up |
| `wontfix` | #ffffff | Will not be worked on | Close with explanation |

All five labels exist on the repo (created 2026-11-21; `wontfix` is a GitHub default).
