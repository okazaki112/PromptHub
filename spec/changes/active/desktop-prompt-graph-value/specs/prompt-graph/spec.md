# Spec Delta: prompt-graph（关系图谱行为）

本 change 修改/新增「关系图谱」视图的行为需求。domain = prompt-graph。

## ADDED Requirements

### FR-G1 数据可见性提升
图谱节点必须可视化以下已在数据层存在、原被丢弃的维度：所属根文件夹（底色）、使用热度 usageCount（尺寸叠加）、关系类型 kind（边色+方向箭头+标签）、标签/收藏（hover 卡片）。
- AC-G1a：同属一个根文件夹的 prompt 节点共享同一稳定底色；无文件夹者用中性色；底色在数据不变时跨渲染稳定不跳变。
- AC-G1b：`variant_of`/`depends_on`/`next_step` 边各自颜色且带方向箭头，`related_to` 无箭头；`grouped_under` 层级边保持无箭头实线。
- AC-G1c：hover/选中节点浮出卡片显示标题、tags、usageCount、所属文件夹名、是否收藏。
- TEST：见 prompt-graph-semantics.test.ts（palette 确定性、kind 视觉映射、半径单调）+ prompt-graph-view.test.tsx（字段透传、卡片出现）。

### FR-G2 自动浮现候选关联
仅对**已选中/焦点节点**显示候选关联边（淡色、distinct 样式），候选来源为既有推荐引擎;鼠标 hover 浏览**不得**改变 graphData（否则每帧重热模拟导致整图抖动、节点难点击，v0.6.5 修）。
- AC-G2a：候选边由 `buildRelationSuggestions`(same_tag/same_folder/similar_title) 产生，排除已相连/父子/自身，取 Top-N。
- AC-G2b：候选边 dedup 真实边与彼此；两端须为当前可见节点;候选边 force-strength=0，仅视觉不拉扯布局。
- AC-G2c：点击候选边调用 `createRelation({kind:'related_to'})`，落库后候选边由真实边替代。
- AC-G2d：布局能自动冷却冻结（有限 cooldownTicks + d3AlphaMin + 提高 velocityDecay);拖拽落点钉住(`fx/fy`)，"Reset graph view" 解钉重排。
- TEST：prompt-graph-tools.test.ts（dedup/边界/Top-N）+ 视图 mock（hover-only 无候选边、选中出候选、点击提交、drag+reset 钉/解钉）。

### FR-G3 局部探索与筛选
提供 focus 局部邻域子图、tag/folder/关系类型过滤、孤岛 prompt 健康度提示。
- AC-G3a：双击节点进入以该节点为核心的邻域子图，提供返回全图；进入/退出不改持久态。
- AC-G3b：过滤器裁剪可见节点/边集合，作用于底色/候选/统计保持一致的可见来源。
- AC-G3c：显示 degree=0 的孤岛 prompt 数量，可引导聚焦。
- TEST：prompt-graph-tools.test.ts（focusSubgraph 保边、applyGraphFilters、countIsolated）。

## MODIFIED Requirements

### FR-G4 节点尺寸语义扩展（原: 仅 degree）
`getNodeVal` 由「仅 degree」改为「degree 与 usageCount 叠加」，但 usage 为 0 时行为与旧一致，保持单调与既有测试兼容。
- TEST：既有 prompt-graph-view.test.tsx `counts node degree so hubs render larger` 必须仍通过。

## REMOVED Requirements
- 无。层级边（grouped_under）不删除，避免破坏既有树形语义与测试。

## 兼容性
- 不改 DB schema / migration / IPC / shared 契约。候选边/focus/过滤为视图局部派生态。
- 列表/看板/卡片/画廊视图不受影响。
