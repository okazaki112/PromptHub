# Proposal: 搜索结果选中项与移动目标修复

## Why

两个用户可见问题都只在搜索状态下出现：

1. 搜索后切换程序窗口，列表自动跳回第一条结果。窗口重新聚焦会触发本地数据刷新（`fetchPrompts`/`fetchFolders`），每次刷新都会产生新的结果数组引用，顶栏搜索 effect 把它误判为“搜索词变化”，重置游标并选中第一条。
2. 搜索后使用右键「移动到节点」只能看到搜索命中的 Prompt。候选节点取自当前可见列表 `visiblePrompts`，搜索过滤把非命中节点全部裁掉。

## Scope

- `apps/desktop/src/renderer/components/layout/TopBar.tsx`：自动选中只在查询文本变化时触发。
- `apps/desktop/src/renderer/components/layout/usePromptWorkspaceMenuItems.tsx`：移动候选改用完整 Prompt 集合。
- 对应测试与 0.6.6 版本号、CHANGELOG。

不修改 DB / IPC / preload / 共享类型；不新增开关或设置项；不改变搜索排序、过滤与键盘导航语义。

## Risks

- 首次冷启动时若已持久化搜索词，查询未变化期间不会再自动补选首条结果；该场景不影响本次用户路径，且原有行为本身就会在每次后台刷新时打断用户。
- 移动候选改为全量后，目标节点可能不在当前搜索结果中，移动后节点会离开当前筛选视图；这是筛选语义的预期结果。

## Rollback

单文件回退：恢复 `TopBar` effect 依赖行为与 `createPromptTreeItems` 的 `visiblePrompts` 数据源，版本号回退 6 个 `package.json` 与 CHANGELOG 段。
