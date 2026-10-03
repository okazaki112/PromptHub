# Implementation

## Status

- Phase: implement
- Status: needs-convergence（待版本发布后归档）

## Shipped

- `apps/desktop/src/renderer/services/database-backup.ts`：
  - 新增 `sortPromptsForRestore(prompts)`：按 `parent_id` 拓扑排序，父 prompt 恒先于子 prompt
  - `importDatabaseViaMainProcess`：prompts 插入前先排序（修复 SQLite `prompts.parent_id` 外键失败）
  - IndexedDB 回退路径（`importDatabase`）：同步排序，两路径行为一致
- `apps/desktop/tests/unit/services/database-backup-parent-order.test.ts`：
  - 新增回归测试 2 个（简单父子乱序 + 多级链乱序），断言 `window.api.prompt.insertDirect` 调用顺序父先子后

## Verification

- `TEST-BACKUP-001`（简单父子乱序）:
  - Command: `pnpm --dir apps/desktop exec vitest run tests/unit/services/database-backup-parent-order.test.ts`
  - Result: 2 passed（修复前红灯：`expected 1st spy call to have been called with {id:'prompt-parent'}`，实际收到 child；修复后绿）
- `TEST-BACKUP-001`（多级链）:
  - Result: passed
- 相关套件:
  - Command: `pnpm --dir apps/desktop exec vitest run tests/unit/services/database-backup.test.ts tests/unit/services/database-backup-parent-order.test.ts tests/unit/services/database-backup-format.test.ts tests/unit/services/database-backup-skills.test.ts tests/integration/services/database-backup-filesystem.integration.test.ts`
  - Result: 5 files / 37 tests passed
- 诊断证据（临时测试，验证后删除）:
  - 真实 SQLite（`:memory:` + `foreign_keys = ON`）：子 prompt 先于父插入 → `FOREIGN KEY constraint failed`；父先子后 → 成功
- 静态检查:
  - Command: `pnpm --dir apps/desktop lint`、`pnpm --dir apps/desktop typecheck`、`node scripts/check-file-line-limits.mjs`
  - Result: lint 0 警告 / typecheck 通过 / 行数限制通过
- Skipped/warnings:
  - `pnpm verify:release:quick` 未运行（本次为 renderer 逻辑修复，单元+集成+静态检查已覆盖；发布前可补跑）
  - e2e Playwright 未运行（依赖完整 Electron 环境）

## Analyze

- Traceability complete: `FR-BACKUP-001 -> DES-BACKUP-001 -> TEST-BACKUP-001 -> T-BACKUP-004` 已建立
- Conflicts/blockers resolved: 无；与 `database-backup-format.ts` sanitize 逻辑确认无冲突（孤儿 parentId 先被置 null，排序再兜底父先子后）

## Converge

- Stable workflow/knowledge/rules synced: 暂未同步稳定文档（改动为 bug 修复，不改变 schema/契约/用户工作流边界；待版本发布时随 release 记录同步）
- Issues/releases/ADRs/indexes synced: 无关联 GitHub issue（本地反馈）
- Final change destination: `spec/changes/archive/<YYYY>/<MM>/<YYYY-MM-DD>-desktop-backup-import-prompt-hierarchy/`（随版本发布归档）

## Synced Docs

- `task-plan/进度追踪.md`、`task-plan/重要发现.md`、`task-plan/任务日志.md`（本地未跟踪）

## Follow-ups

- 发布 `fork-v0.6.5`（或下一版本）前补跑 `pnpm verify:release:quick`
- 建议在 `spec/knowledge/behavior/` 或备份相关稳定文档补充"prompts 恢复需父先子后"的说明（可选）
