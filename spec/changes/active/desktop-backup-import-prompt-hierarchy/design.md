# Design

## `DES-BACKUP-001`: prompts 父优先拓扑排序

复刻既有 `sortFoldersForRestore` 的排序算法，新增 `sortPromptsForRestore(prompts)`，
在备份恢复时保证父 prompt 先于其子 prompt 写入 SQLite。

算法（与 folders 版本完全对称）：
1. 维护 remaining Map 与 restored Set
2. 循环扫描：`parentId` 为空、或父已 restored、或父不在 remaining（孤儿，理论上 sanitize 已处理）的项先出队
3. 一轮无进展（循环引用）时，剩余项保持原序追加并退出

应用点（`importDatabase`）：
- `importDatabaseViaMainProcess`（主进程 IPC 路径，FK 实际生效处）：prompts 循环插入前先 `sortPromptsForRestore`
- IndexedDB 回退路径（非 Electron）：同样排序，保持两路径行为一致

## Affected Areas

- Data model: 无变更（SQLite schema 与备份格式不变）
- IPC / API: 无变更（仍走 PROMPT_INSERT_DIRECT 逐条插入）
- Filesystem / sync: 无变更
- UI / UX: 无变更（错误提示文案不变；错误不再出现）

## Tradeoffs

- 选择 renderer 服务层排序而非 db 层排序：与 `sortFoldersForRestore` 同级，改动面最小，
  不触碰 `packages/db` 权威实现与 IPC 契约
- 不将排序下沉到 main 侧 `insertPromptDirect`：该函数同时服务于迁移路径，改其行为影响面过大

## Failure And Rollback

- External boundary: SQLite 外键（`prompts.parent_id`）；排序后父项必先插入，FK 不再失败
- Partial failure behavior: 排序是纯函数，无副作用；任一 insertDirect 失败仍按原逻辑整体抛错
- Recovery/rollback: 用户数据未被破坏（导入失败不落半成品——既有语义）。代码回滚即恢复原行为

## Analyze Result

- Requirement links: `FR-BACKUP-001` -> `DES-BACKUP-001` -> `TEST-BACKUP-001` -> `T-BACKUP-004`
- Verification links: 见 tasks.md 与 implementation.md
- Blocking conflicts: 无（已核对 `database-backup-format.ts` sanitize 逻辑：孤儿 parentId 会先置 null）
- Unresolved `[待确认]`: 无

## Traceability

| Requirement       | Design             | Verification        | Task             |
| ----------------- | ------------------ | ------------------- | ---------------- |
| `FR-BACKUP-001` | `DES-BACKUP-001` | `TEST-BACKUP-001` | `T-BACKUP-004` |
