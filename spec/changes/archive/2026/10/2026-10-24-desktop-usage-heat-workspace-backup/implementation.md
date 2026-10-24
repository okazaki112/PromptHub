# Implementation

## Shipped

- `apps/desktop/src/main/services/prompt-workspace.ts`
  - `promptFrontmatter()` 新增 `usageCount: prompt.usageCount ?? 0`，位置紧随 `currentVersion`，与 Web 端字段顺序一致。
  - `parsePromptFile()` 由硬编码 `usageCount: 0` 改为 `normalizeUsageCount(metadata.usageCount)`。
  - 新增 `normalizeUsageCount()`：非数字、非有限值、非正数 → 0，正小数向下取整。
- `apps/web/src/services/prompt-workspace.ts`：文件头的两端差异说明改为只有 `lastAiResponse` 是 Web 独有，`usageCount` 已两端一致。
- `CHANGELOG.md` 0.6.6 段新增「热度跟着备份走」条目。

无 schema、无 IPC/preload/共享类型、无备份 payload 结构变化；未新增设置项或界面展示。

## 行为口径

- 工作区与数据库同 id 冲突继续由 `updatedAt` 新者胜，热度不做取大值特例：另一台设备文件较新而计数较小时，同步后计数会向下修正。这是本次采用的 last-writer-wins 语义的直接结果，不是缺陷。
- 兼容性双向成立：旧文件缺 `usageCount` 键 → 0（与修复前一致）；新文件被旧版本读取时未知键被忽略 → 0。无需迁移脚本。
- 不增加写盘次数：热度自增走 `prompt:update`，该 handler 成功后本来就调用 `syncWorkspace()` 重写工作区文件。

## Verification

| 项 | 命令 | 结果 |
| --- | --- | --- |
| 回归用例（先红后绿） | `vitest run tests/unit/main/prompt-workspace.test.ts` | 改前 2 failed（导出无 usageCount、小数用例）；改后 19 passed |
| 基线对照 | `vitest run tests/unit/main tests/integration/services` 在 HEAD 与 HEAD~1 各跑一轮 | 两轮均 `30 failed / 71 passed (101)`，失败文件集合 `diff` 完全一致，本轮 0 新增回归（均为本机既有失败：symlink EPERM、tray、data path 等） |
| 类型检查 | desktop `tsc --noEmit` / web `tsc --noEmit` | exit 0 |
| ESLint | 改动的 3 个文件 `--max-warnings 0` | exit 0 |
| 文件行数门禁 | `node scripts/check-file-line-limits.mjs` | passed |
| 生产构建 | `pnpm build` | exit 0 |

## Follow-up

- `lastAiResponse` 在桌面端仍不落盘（Web 端落盘），属同类两端分歧，本轮未处理。
- 未跑 Electron 实机的换机/整目录恢复演练；工作区文件读写由真实临时目录 + 真实 SQLite 用例覆盖。

## Publication

随 `fork-v0.6.6` 于 2026-10-24 发布（Draft 出包后 promote 为 Latest），产物已按 `latest*.yml` 的 sha512 逐包校验。
