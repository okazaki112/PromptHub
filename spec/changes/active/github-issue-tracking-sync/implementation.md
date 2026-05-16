# Implementation

## Shipped

- 为 `spec/issues/` 增加了专门的导航入口 `spec/issues/README.md`，明确 active / archive 双层结构。
- 新增 `spec/issues/active/github-open.md`，记录当前 `legeling/PromptHub` 仓库的 open GitHub issues 快照。
- 新增 `spec/issues/archive/github-closed.md`，记录当前 `legeling/PromptHub` 仓库的 closed GitHub issues 快照。
- 更新 `spec/README.md`，把 `spec/issues/archive/` 和 `spec/issues/README.md` 纳入目录地图与职责说明。
- 更新 `spec/domains/system/spec.md`，把 `spec/issues/archive/` 纳入稳定结构约束，并补充贡献者查看 issue 上下文的场景。

## Verification

- `gh repo view --json nameWithOwner,url`
- `gh issue list --state open --limit 200 --json number,title,state,labels,assignees,updatedAt,createdAt,closedAt,url`
- `gh issue list --state closed --limit 200 --json number,title,state,labels,assignees,updatedAt,createdAt,closedAt,url`

## Synced Docs

- `spec/issues/README.md`
- `spec/issues/active/github-open.md`
- `spec/issues/archive/github-closed.md`
- `spec/README.md`
- `spec/domains/system/spec.md`

## Follow-ups

- 后续如果 issue 刷新频率变高，可以考虑引入脚本自动生成 open/closed snapshot，减少手工维护成本。
- 当前 issue snapshot 只记录列表级元数据；如果后续需要 triage 深度，可以再补“高优先级 issue 明细”文档。
