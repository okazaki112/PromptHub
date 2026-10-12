# Tasks: desktop-selective-export-defaults

- [x] T1 范围取证：定位默认值唯一来源与两条导出入口差异（`useBackupExportActions.ts` / `backup-orchestrator.ts`）
- [x] T2 测试先行：`data-settings-backup-sync.test.tsx` 新增默认可见状态 + 导出实参用例（先红灯复现 `aria-pressed="false"`）
- [x] T3 实现：`DEFAULT_EXPORT_SCOPE.versions` 翻转为 `true`
- [x] T4 备份媒体口径取证：解析 `doc/prompthub-export-2026-10-11.zip` 与本机 `data/assets/images` 实盘逐文件对照，确认整目录拷贝根因
- [x] T5 分层验证：目标文件 9/9 → 备份导出相关 7 文件 64/64 → 桌面全量 `30 failed | 358 passed (388)`、`106 failed | 3285 passed`，与基线 `task-plan/v063-full2.log`（30/106 失败）失败集合规模一致 ⇒ 零新增回归；eslint 与 `tsc --noEmit` 均 exit 0
- [ ] T6 收敛：把待确认项（媒体目录过滤、旧背景清理）交用户拍板；稳定文档偏差留待后续 change 收敛
