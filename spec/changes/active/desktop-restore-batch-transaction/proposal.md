# Proposal: 备份恢复改为单事务批量写入

## Change Key
`desktop-restore-batch-transaction`（v0.6.4，性能 + 数据边界原子性）

## Why
恢复一份备份要等几十秒。实测（本机真实 SQLite + 真实工作区文件，规模 73 Prompt / 20 文件夹 / 362 版本）：

| 场景 | 耗时 |
| --- | --- |
| 单次全量工作区重建 | 234 ms |
| 当前清空阶段（每删一条重建一次） | **9507 ms** |
| 批量清空 + 只重建一次 | 1.3 ms |
| 修好后整条恢复（预测） | ≈ 363 ms |

根因是 O(n²) 的磁盘重写：`importDatabaseViaMainProcess()` 逐条调用 `prompt:delete` / `folder:delete`，而这两个 handler 每次都调 `syncPromptWorkspaceFromDatabase()` 做全量重建（读全部数据、逐条写 `prompt.md` 与所有版本 `.md`、递归扫描目录、孤立文件移回收站、清空目录）。删 N 条 Prompt + F 个文件夹就等于 (N+F) 次全量重建。

同时存在正确性隐患：当前实现「先全删、再逐条插」，中途任何异常都会留下半恢复数据库，而恢复是不可逆操作。

## Scope
- 新增 `prompt:restoreBatch` IPC：单事务内清空 prompt 图（folders / prompts / versions / relations / output formats）并按父先子后写入，成功后只重建一次工作区。
- 渲染层 `restorePromptGraph()` 优先使用一次批量调用取代逐条 delete/insert；无批量通道时（Web bridge）保留逐条分支，避免跨运行时行为回归。批量失败向上抛错，不再出现部分写入。
- 契约进入 `packages/shared`（通道常量 + payload / result 类型）。
- 不改：媒体 base64 落盘、rules / skills / mcp / plugin 恢复分支、恢复前置校验与 `hasMeaningfulBackupContent`、恢复后的界面刷新方式。

## Risks
- 写入路径合并为一次事务：若事务内抛出，本地数据保持恢复前状态（优于现状），但用户会看到整次恢复失败而非部分成功。
- 逐条 `insertDirect` 通道保留给其他调用方，本变更只替换恢复路径，不动它们的语义。
- 工作区重建仍是一次全量重写（约 234ms / 当前规模），不做增量重写，避免引入文件与数据库不一致的新风险。

## Rollback
恢复路径回退为逐条调用即可；新增通道与类型不影响既有数据布局，无需迁移。

## Traceability
FR-RSTO-001..005 → DES-RSTO-001..004 → TEST-RSTO-001..006
