# Proposal: Prompt 使用热力图全视图 (heatmap)

## Why
用户需要直观查看 Prompt 在时间维度上的新建/使用热度。当前只有列表、看板、图谱，没有按日历聚合能力。

## Scope
新增 ViewMode `heatmap`：全视图 GitHub 风格年历，显示：
- 当前筛选可见 prompts 按本地日期新建数量
- 同日新建 prompts 的当前 `usageCount` 总和（“当前使用热度”，不是每日真实运行次数）
- combined / created-only / usage-only metric
- previous/next year、hover/focus tooltip、多选日期局部面板、选择日 prompts summary
- folder/tag/search 过滤继续作为数据源（不另建一套过滤真源）

## Non-goals
- 不新增 SQLite usage events / 不迁移 schema
- 不做全局 date range filter across all views (v1局部panel)
- 不改 copy/run IPC/business logic
- 不新增 icon library, only lucide

## User outcome
进入“使用热度”后，可看全年创建频率、热点日、某日新建哪些 Prompt，并点击选中日期查看/选择/详情 prompts。

## Risks
- 用户可能误解 usage heat 为当天次数：命名统一“当前使用热度”并在 header说明.
- year 53 columns desktop窄横向滚动.
- filter changes selected stale dates：selection ignores hidden days and clear button.

## Rollback
revert view modules + store/sidebar/container/i18n keys；不影响 prompts store actions.
