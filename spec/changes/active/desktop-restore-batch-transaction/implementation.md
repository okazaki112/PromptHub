# Implementation: desktop-restore-batch-transaction

## 实测数据（本机 Windows，真实 SQLite + 真实工作区文件）

| 场景 | 规模 | 耗时 |
| --- | --- | --- |
| 单次全量工作区重建 | 73 prompts / 20 folders / 362 versions | 234 ms |
| **旧实现清空阶段（逐条删除，每次删完重建一遍）** | 同上 | **9507 ms** |
| 批量清空 + 只重建一次 | 同上 | 1.3 ms |
| **新实现端到端（批量事务 + 单次重建）** | 104 prompts / 20 folders / 312 versions | **255 ms** |

探针为临时脚本，取数后已删除；旧路径的 9507ms 与新路径的 255ms 均为直接计时结果。

## 落地清单
- `packages/shared/constants/ipc-channels.ts`：新增 `PROMPT_RESTORE_BATCH: "prompt:restoreBatch"`。
- `packages/shared/types/restore-batch.ts`（新）：`PromptRestoreBatchPayload` / `PromptRestoreBatchResult`，经 `types/index.ts` 导出。
- `apps/desktop/src/main/services/prompt-restore-batch.ts`（新）：`restorePromptSnapshotBatch()`。入参校验 → 单事务内按子表先删（output formats → relations → versions → prompts → folders）→  folders 与 prompts 各自父先子后插入 → versions → relations → output formats；异常整轮回滚并返回结构化 `error`。
- `apps/desktop/src/main/ipc/prompt.ipc.ts`：注册 `PROMPT_RESTORE_BATCH`，仅当 `restored === true` 时调用一次 `syncWorkspace()`。
- `apps/desktop/src/preload/api/prompt.ts`：暴露 `restoreBatch`。
- `apps/desktop/src/renderer/services/database-restore-graph.ts`（新）：`restorePromptGraph()` 优先走批量通道；并把图恢复的排序与逐条实现从 `database-backup.ts` 迁出（`sortPromptsForRestore` / `sortFoldersForRestore` / `importDatabaseRowByRow`），使 `database-backup.ts` 从 1505 行回落到 1333 行以满足 1500 行门禁。

## 中途发现并纠正的设计冲突
最初计划直接删除逐条恢复循环。取证发现 `apps/web/src/client/desktop/install-bridge.ts:284-396` 为 Web 客户端提供了同名的 `prompt.getAll/delete/insertDirect`、`folder.*`、`version.insertDirect` HTTP bridge：若删掉逐条分支，Web 端恢复会因缺少 `restoreBatch` 而落到 IndexedDB 分支，把「服务端写入」静默改写成「本地浏览器库写入」。因此逐条路径保留为**无批量通道时的分支**（`restorePromptGraph` 先试 `restoreBatch`，否则 `importDatabaseRowByRow`），桌面走批量、Web 维持原语义。Web 侧的批量通道作为后续项，不在本变更内。

## 行为差异（有意保留与新增）
- 悬空引用的关系与输出格式仍在写入边界被跳过（与旧逐条路径同一判据），因此 `payload.promptRelations` 含缺失端点时不会导致整次失败。
- 版本行的悬空 `promptId` 依旧触发外键错误 ⇒ 现在表现为整次回滚并报失败，而旧实现会在已清空数据后中断。这是原子性带来的净改善（不再有半恢复状态）。
- 恢复失败时渲染层抛出带原因的异常（`Backup restore was blocked because ...`），沿用既有导入错误提示链路。

## 验证
- `tests/unit/main/prompt-restore-batch.test.ts` 10 例（真实 SQLite）：图数据全等还原、乱序输入父先子后、约束冲突整轮回滚且原数据完好、悬空端点被跳过、四类非法入参、空集合等于清空。
- `tests/unit/main/prompt-restore-batch-ipc.test.ts` 2 例：批量恢复只触发一次工作区重建；失败时不重建。
- `tests/unit/services/database-backup-parent-order.test.ts` 4 例：无批量通道时 IndexedDB 与逐条路径仍父先子后；有批量通道时只调用一次并携带完整未排序集合。
- `tests/unit/services/database-backup.test.ts`：全链路往返用例改为断言单次 `restoreBatch` 入参；删除已下沉到主进程的逐条文件夹排序用例。
- 备份/恢复相关 9 个测试文件：66/66 通过。
- `eslint`（desktop，--max-warnings 0）exit 0；`tsc --noEmit`（desktop）exit 0；`check-file-line-limits.mjs` 通过。
- 全量单测与基线差集、web/cli 类型检查：见下方验证记录。

## 待补
- Web 端 `restoreBatch` 通道与服务端批量路由（含 `apps/web` 与 `apps/web-cloudflare`），使自托管部署同样获得原子批量恢复。
- 恢复过程的分阶段进度反馈（用户已选择本轮只做性能，不做 UI）。
