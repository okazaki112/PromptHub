# Design: 备份恢复批量事务

## DES-RSTO-001 落点与依赖方向
- 服务：`apps/desktop/src/main/services/prompt-restore-batch.ts`，导出 `restorePromptSnapshotBatch(deps, payload): PromptRestoreBatchResult`。只做「校验 + 排序 + 单事务写入」，不碰 Electron、不碰工作区文件，便于用真实 SQLite 直接单测。
- IPC：`apps/desktop/src/main/ipc/prompt.ipc.ts` 注册 `IPC_CHANNELS.PROMPT_RESTORE_BATCH`，成功返回后调用一次 `syncWorkspace()`。工作区重建留在 IPC 层，保证「数据库写入成功」与「文件重建」的先后关系明确。
- 契约：`packages/shared/constants/ipc-channels.ts` 加通道；`packages/shared/types/restore-batch.ts` 定义 `PromptRestoreBatchPayload` / `PromptRestoreBatchResult`。
- 桥接：`apps/desktop/src/preload/api/prompt.ts` 暴露 `restoreBatch`。

## DES-RSTO-002 清空语义与既有外键保持一致
既有逐条路径的顺序是：删全部 prompts（`prompt_versions` / `prompt_relations` / `prompt_output_formats` 对 prompts 为 `ON DELETE CASCADE`，随之级联）→ 删全部 folders（`prompts.folder_id` 为 `ON DELETE SET NULL`，此时 prompt 已不存在，无影响）。

批量实现保持同样的净效果：事务内先 `DELETE FROM prompts` 再 `DELETE FROM folders`，然后按父先子后重新插入。`PromptDB.delete` / `FolderDB.delete` 本身只是单行 SQL、无文件副作用（`packages/db/src/prompt.ts:329`、`folder.ts:150`），因此整表删除与逐条删除在数据结果上等价，FTS 的逐行 `AFTER DELETE` 触发器同样会被批量删除触发，索引保持一致。

## DES-RSTO-003 插入顺序
`folders.parent_id → folders ON DELETE CASCADE`、`prompts.parent_id → prompts ON DELETE SET NULL` 都要求父行先存在，否则外键约束报错。备份里的数组顺序不保证拓扑序，因此服务内部对 folders 与 prompts 各做一次父先子后排序（沿用 `prompt.ipc.ts:36` 的 `sortFoldersForInsert` 思路，抽成通用 `sortByParentFirst`，遇到环或悬挂引用时按 id 稳定序兜底追加，与既有实现一致）。版本、关系、输出格式在 prompts 之后插入。

## DES-RSTO-004 失败处理
`rawDb.transaction()` 包裹全部删除与插入：任何一步抛出即整轮回滚，服务捕获后返回 `{ restored: false, error }`；IPC 层不再触发工作区重建。渲染层 `importDatabaseViaMainProcess` 在 `restored === false` 时抛出带原因的异常，交由既有 `restoreFromFile` 错误提示链路展示，避免静默半恢复。

## DES-RSTO-004 失败处理
`rawDb.transaction()` 包裹全部删除与插入：任何一步抛出即整轮回滚，服务捕获后返回 `{ restored: false, error }`；IPC 层不再触发工作区重建。渲染层在 `restored === false` 时抛出带原因的异常，交由既有导入错误提示链路展示，避免静默半恢复。

## DES-RSTO-005 保留逐条分支（Web bridge 约束）
`apps/web/src/client/desktop/install-bridge.ts:284-396` 为 Web 客户端提供了同名 `prompt/folder/version` 的 `getAll` / `delete` / `insertDirect` HTTP 实现。因此渲染层 `restorePromptGraph()` 的策略是：有 `prompt:restoreBatch` 走批量通道，否则回落到逐条路径。若直接删除逐条分支，Web 端恢复会因缺少批量通道而落到 IndexedDB 分支，把服务端写入静默改成本地浏览器库写入 —— 属于跨运行时行为回归，必须避免。

配套结构调整：图恢复的排序与逐条实现从 `database-backup.ts` 迁出到 `renderer/services/database-restore-graph.ts`（`sortPromptsForRestore` / `sortFoldersForRestore` / `importDatabaseRowByRow` / `restorePromptGraph`），使前者回落到 1500 行门禁以内。

## 验证（TEST-RSTO-*）
- TEST-RSTO-001 等价性：真实 SQLite 上批量恢复后，prompts / folders / versions / relations / output formats 的 ID 集合与字段与输入一致。
- TEST-RSTO-002 乱序输入：子文件夹与子 Prompt 排在父项之前也必须成功落库且引用正确。
- TEST-RSTO-003 原子性：构造中途失败（重复主键 / 非对象元素），断言数据库保持恢复前数据、返回 `restored: false` 且带 error。
- TEST-RSTO-004 输入边界：null、非对象、缺集合分别返回结构化失败而非抛出。
- TEST-RSTO-005 单次重建：IPC 层用 mock 断言 `syncPromptWorkspaceFromDatabase` 恰被调用一次（取代过去的 N 次）。
- TEST-RSTO-006 渲染层接线：`restoreBatch` 以正确 payload 被调用一次，逐条 `prompt.delete` / `folder.delete` / `insertDirect` 不再被调用；无 `restoreBatch` 时回退旧路径（FR-RSTO-005）。
- 性能：同一探针脚本对比前后耗时，写入 change 的 implementation.md。
