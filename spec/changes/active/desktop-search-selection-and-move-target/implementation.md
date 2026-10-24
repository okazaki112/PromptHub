# Implementation

## Shipped

- `TopBar` 自动选中改为查询身份守卫（`view:query`）。只有搜索词或 Prompt/Skill 视图真正变化时才重置结果游标并选中首条；窗口聚焦触发的 `fetchPrompts`/`fetchFolders` 刷新不再改写当前选中项。
- 「移动到节点」候选改为当前文件夹/收藏范围下的完整集合（`movablePrompts`），不再受搜索、标签、类型筛选裁剪，同时继续排除锁定私密文件夹、自身与后代；菜单参数中删除已无用途的 `visiblePrompts`。
- 版本 0.6.6：root + `apps/{cli,desktop,mobile,web,web-cloudflare}/package.json`，并新增 CHANGELOG 0.6.6 段。

## Traceability

- FR-S1 -> DES-S1 -> TEST-S1 -> T1/T3
- FR-S2 -> DES-S2 -> TEST-S2 -> T2/T4

## Verification

| 项 | 命令 | 结果 |
| --- | --- | --- |
| 回归用例（先红后绿） | `vitest run tests/unit/components/top-bar-prompt-search-refresh.test.tsx tests/integration/components/main-content-context-move.integration.test.tsx` | 修复前 2 failed；修复后 9 passed |
| 关联用例 | `vitest run top-bar-agent-search + top-bar-prompt-search-refresh + main-content-context-move` | 3 files / 10 tests passed |
| 集成回归 | `vitest run tests/integration/components` | 6 files / 41 tests passed |
| 生产构建 | `pnpm build` | exit 0 |
| 类型检查 | `pnpm --filter @prompthub/desktop exec tsc --noEmit` | exit 0 |
| ESLint（改动文件） | `eslint ... --max-warnings 0` | exit 0 |
| 文件行数门禁 | `node scripts/check-file-line-limits.mjs` | passed |

## Intentionally Skipped

- 官网/多语言 README 未同步：本 fork 的 0.6.x 迭代沿用既有做法，官网与 README 仍指向已发布的上游稳定版 0.5.9；本次为本地版本号迭代，未生成发布标签与安装包。
- 未修改 DB / IPC / preload / shared 类型，无迁移与回滚数据操作。
