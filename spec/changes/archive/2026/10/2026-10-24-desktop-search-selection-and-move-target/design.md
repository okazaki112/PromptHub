# Design: 查询身份守卫 + 全量移动候选

## DES-S1 搜索自动选中按查询文本触发

`TopBar` 增加 `lastAutoSelectQueryRef`：

- effect 进入时比较当前 `searchQuery` 与 ref。
- 相同：直接返回，不重置 index，不改选中项（后台刷新路径）。
- 不同：写入 ref，`setCurrentResultIndex(0)`；空查询或无结果时结束；Prompt 视图选中首条结果。

这样把 effect 的触发条件从“结果数组引用变化”恢复为注释声明的“查询变化”，不改变单次搜索时的既有行为。

## DES-S2 移动候选忽略搜索/标签/类型筛选

`usePromptWorkspaceDerived` 新增 `movablePrompts`：复用 `filterVisiblePrompts`，但 `searchQuery` 传空、`filterTags` 传空、`promptTypeFilter` 传 `all`，保留当前文件夹/收藏范围与私密文件夹锁定边界。

`createPromptTreeItems` 的树展开源改为 `params.movablePrompts`：

- `getPromptDescendantIds(params.prompts, prompt.id)` 仍基于完整集合排除后代。
- 自身、后代排除逻辑不变。
- 菜单参数中不再使用 `visiblePrompts`，移除该死参数。

## Data / Contract Impact

无 schema、IPC、preload、shared type 变更。仅 renderer 内组件派生逻辑。

## Test Strategy

- TEST-S1（组件）：TopBar 搜索到 2 条结果，Tab 到第 2 条；用 `setState` 注入新的 prompts 数组模拟窗口聚焦刷新；断言不再调用 `selectPrompt`。
- TEST-S2（集成）：搜索词只命中源 Prompt；打开「移动到节点」；断言不命中的目标节点仍渲染，点击后调用 `movePrompt`。
- TEST-S3（安全边界）：锁定私密文件夹中的 Prompt 不出现在移动候选。
