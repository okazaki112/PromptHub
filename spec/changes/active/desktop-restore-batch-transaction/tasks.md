# Tasks: desktop-restore-batch-transaction

- [x] T1 耗时取证：真实 SQLite + 真实工作区探针实测（单次重建 234ms / 当前清空阶段 9507ms / 批量清空 1.3ms），定位 (N+F) 次全量重建为根因
- [x] T2 语义核对：`PromptDB.delete` 与 `FolderDB.delete` 均为单行 SQL 无文件副作用；外键级联与 SET NULL 语义确认
- [x] T3 契约：通道常量 + `PromptRestoreBatchPayload` / `PromptRestoreBatchResult` 共享类型
- [x] T4 测试先行：主进程服务单测（等价性 / 乱序 / 回滚 / 边界）先红灯（实现前 4 例失败）
- [x] T5 实现：`prompt-restore-batch.ts` 单事务 + 父先子后排序 + 结构化失败
- [x] T6 接线：IPC handler 注册并在成功后只重建一次工作区；preload 暴露 `restoreBatch`
- [x] T7 渲染层：`restorePromptGraph` 优先批量、无通道时保留逐条分支（Web bridge 约束），批量失败抛错
- [x] T8 断言：IPC 层 mock 断言工作区重建恰一次；父先子后覆盖批量 / 逐条 / IndexedDB 三条路径
- [x] T9 前后对比：旧清空阶段 9507ms → 新路径端到端 255ms（同机同规模）
- [ ] T10 分层验证：目标测试 → 全量差集 → lint / tsc / 行数门禁 → web+cli 类型 → 分批提交
