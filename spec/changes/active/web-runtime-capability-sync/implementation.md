# Implementation

## Status

In progress.

## Shipped

- `apps/web/src/client/desktop/install-bridge.ts` 已补齐 Prompt 标签桥接方法：`getAllTags()`、`renameTag()`、`deleteTag()`。
- `apps/web/src/client/desktop/install-bridge.ts` 已补齐 `window.api.rules` 的 Web bridge，实现 `list` / `scan` / `read` / `save` / `rewrite` / `addProject` / `removeProject` / `importRecords` / `deleteVersion` 的最小调用面。
- `apps/web/src/routes/rules.ts`、`apps/web/src/services/rule.service.ts`、`apps/web/src/services/rule-workspace.ts` 已补充 project rule 创建/删除接口，打通 Web Rules 主工作台的最小项目规则管理链路。
- `apps/desktop/src/renderer/components/layout/Sidebar.tsx` 已在 Web runtime 隐藏 `Add Project Directory`，避免暴露依赖本地目录选择的 desktop-only Rules 操作。

## Verification

- Pending.

## Synced Docs

- Pending.

## Follow-ups

- Pending.
