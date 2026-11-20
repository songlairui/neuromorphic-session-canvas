# neuromorphic-session-canvas — Agent 必读

## Work system

- **status: ready** — 工作面已升级为 GitHub issues（2026-11-21，`/setup-work-tracer`）
- **查询 / 行动 / 取证**落点：
  - issue tracker → [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md)（GitHub issues，`gh` CLI；triage labels 见 [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md)）
  - domain docs → [`docs/agents/domain.md`](docs/agents/domain.md) · 根 [`CONTEXT.md`](CONTEXT.md) · [`docs/adr/`](docs/adr/)
- **升级**（换 GitLab/GitHub issues、改 triage labels、multi-context）：跑 `/setup-work-tracer`（或 `/setup-matt-pocock-skills`）。只填空，不推倒已有内容，除非用户明确改 tracker。
- **若 status 被标成 `pending`**：只允许 kickoff / setup-work-tracer / 写 START；禁止 `to-tickets` / `implement` / 大改代码。默认新建项目**不是** pending。

## 缘起

- [`docs/kickoff/START.md`](docs/kickoff/START.md)

## Agent skills

### Issue tracker

GitHub issues via `gh` CLI on `songlairui/neuromorphic-session-canvas`. Triage state = labels (`needs-triage` / `needs-info` / `ready-for-agent` / `ready-for-human` / `wontfix`). Historical local tickets may remain under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.
