# Proposal

## Phase And Status

- Phase: analyze
- Status: in-progress
- Primary requirement: `FR-BACKUP-001`
- Exit condition: 导入含 parent-child 层级 prompt 的备份不再报"引用关系不完整"，且回归测试通过

## Why

用户导入带有子项（parent-child 层级）的备份时，桌面端报错：
"备份中的文件夹或 Prompt 引用关系不完整，PromptHub 无法安全导入。建议重新导出一份新备份后再试。"

该文案由 `database-backup.ts:1388-1390` 的 `formatBackupImportError` 对底层
`FOREIGN KEY constraint failed`（SQLite 外键约束失败）错误映射而来。

调查结论（详见 `design.md`）：备份文件本身完整，问题在导入侧。`importDatabaseViaMainProcess`
恢复 prompts 时未按 `parent_id` 做拓扑排序，子 prompt 先于父 prompt 插入，违反
`prompts.parent_id REFERENCES prompts(id)` 外键。folders 已有 `sortFoldersForRestore`
保护，prompts 缺失等价逻辑。

## Scope

- In scope:
  - `apps/desktop/src/renderer/services/database-backup.ts`：新增 prompts 父优先排序，应用于主进程导入路径与 IndexedDB 回退路径
  - 回归测试：`apps/desktop/tests/unit/services/database-backup.test.ts`
- Out of scope:
  - 不改 `packages/db` schema / 外键 / IPC 契约
  - 不改备份导出格式
  - 不处理恶意构造的循环引用（与 folders 现有行为一致：无法排序时保持原序）

## Risks

- 排序逻辑改变插入顺序，但不改变最终数据集合（仍是同一批 prompts，仅顺序不同）
- 循环 parent 引用（备份被手工篡改时）会维持原序插入，与现有 `sortFoldersForRestore` 行为一致，不作为新风险引入
- sanitize 已把 parentId 指向不存在 prompt 的孤儿引用置 null，故排序后不应再出现 FK 失败

## Rollback Thinking

- 排序仅影响 restore 时 insertDirect 的调用顺序，不改数据源、不改 DB、不改文件系统布局
- 回滚 = 移除排序调用，行为回到现状（仅顺序恢复原备份序）

## Related Records

- Issue: 无（用户本地反馈）
- ADR: 无
- Stable workflow/knowledge docs: `spec/rules/bug-fix-rules.md`、`spec/rules/testing-standards.md`
