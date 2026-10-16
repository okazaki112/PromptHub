# Proposal: 关系图谱价值增强 (prompt graph value tiers)

## Why
用户反馈：桌面端「关系图谱」视图"除了能显示根节点和子节点，好像没啥用处"。
根因（见 task-plan/重要发现.md）：图谱把已有的 tags/folder/usage/isFavorite/promptType 维度丢弃在数据层，
跨层级语义边（variant_of/depends_on/next_step）画成同一条无向虚线，信息增量≈0，视觉上只是文件夹树的重复投影。

## What（范围内，三档）
1. 数据上屏：节点按根文件夹底色着色；usageCount 叠加节点尺寸；语义边按 kind 分色并加方向箭头+边标签；新增图例；hover 节点浮出详情卡片（标题/标签/使用次数/所属文件夹/收藏）；tag 参与 hover 卡片与筛选。
2. 自动浮现关联：对 hover/选中的节点，用现有 `buildRelationSuggestions` 计算候选邻居，以淡色点线绘制其专属候选边（其余节点不显示候选边）；点击候选边调用 `createRelation` 落库为 `related_to` 真实关系。
3. 探索工具：双击节点进入 Focus 局部一阶邻域子图并可返回全图；顶部按 tag/folder/关系类型过滤；孤岛 prompt（degree=0）健康度计数提示。

## Non-goals
- 不改 SQLite schema / migration / DB class（packages/db）。
- 不改 IPC channel、preload 暴露、shared 公共契约核心语义。
- 不做力布局算法重写、不做整体组件重构（仅按职责新增小模块）。
- 不引入新第三方依赖（复用 d3-force / react-force-graph 既有能力）。

## Impacted user flows
- 视图切换到「关系图谱」时的阅读体验、节点识别、关系发现、局部探索与筛选。
- 详情面板「关系」区与图谱的语义标签共用同一真源（术语一致性）。

## Risks
- 边爆炸（已在设计上规避：候选边仅选中/hover 节点亮起）。
- canvas 层自定义绘制/命中（hover 卡片、候选边点击）需在 react-force-graph props 接口正确接线，回归风险集中在视图层。
- 密集图着色后标签可读性下降（沿用既有 zoom 阈值标签策略 + hover 强化）。
- folder 底色映射不稳定色（用文件夹顺序确定性分配，避免每次渲染跳色）。

## Rollback
- 三档均为 renderer 视图层增量 + 新增小模块；按档提交，出问题可按档 revert，不影响数据与既有列表/看板视图。
- 候选边落库复用既有 createRelation 事务路径，取消只是不写库，无副作用残留。
