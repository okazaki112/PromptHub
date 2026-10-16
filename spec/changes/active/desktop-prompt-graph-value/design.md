# Design: 关系图谱价值增强

## Affected modules
- 仅 `apps/desktop/src/renderer/components/prompt/` 图谱相关 + 对应单测 + 7 locale i18n。
- 复用（只读，不改行为）：prompt-relation-suggestions、prompt.store(createRelation/deleteRelation/relations)、folder.store(folders)、settings.store(isDarkMode/motionPreference)。
- 不触碰 packages/db、packages/shared 契约、main/preload/IPC。

## New files（按职责拆分，避免把 PromptGraphView 撑成巨石）
- `prompt-graph-semantics.ts` — 纯视觉编码：关系 kind→{color,hasArrow,dash,labelKey}、候选边样式、folder 根分组调色板、节点半径叠加 usage、suggestion reason→视觉。无副作用、可单测。
- `prompt-graph-tools.ts` — 纯派生：`buildSuggestionLinks(focusNodeIds, prompts, relations, folderMeta)`（对选中/hover 节点算候选点边，dedup 已有边）、`neighborSet`/`focusSubgraph`（邻域裁剪）、`applyGraphFilters`（tag/folder/kind 过滤）、`countIsolated`（孤岛统计）。
- `graph-overlays.tsx` — 图例 + hover 详情卡片 + focus/过滤工具条 展示组件（从视图文件抽出，控制 PromptGraphView <1000 行）。

## Modified files
- `prompt-graph-layout.ts`：`PromptGraphNode` 增 `folderId / tags / usageCount / isFavorite`，`buildPromptGraphData` 透传；`getNodeVal` 叠加 usage（保留 degree 语义）；新增 `PromptGraphSuggestionLink` 派生类型（视图本地，非 shared）。
- `prompt-graph-tools.ts` 依赖 layout 的 endpoint 解析。
- `PromptGraphView.tsx`：接入 folder 底色、kind 分色+箭头、图例、hover 卡片、候选点线（仅 focusId）、双击 focus、过滤、孤岛提示；渲染候选边并入 graphData.links（临时边以 `suggested:` 前缀 id 区分）。

## Data model (view-local, 不入 DB/契约)
- 候选边：`{ id: "suggested:<src>:<tgt>", source, target, kind:'related_to', isSuggestion:true, reason }`，仅在存在 hover/选中节点时并入，点击→`createRelation({sourcePromptId,targetPromptId,kind:'related_to'})`，落库后 relations 变更使该候选边自然被真实边取代。
- folder 底色：`rootFolderId -> palette[index]`，index 取该根文件夹在 folders 排序中的稳定序号；prompt 沿 parentId 归到根文件夹；无 folder→中性色。避免随机/易变色。

## Key algorithms
- 方向箭头：hasArrow = kind!=='related_to' && kind!=='grouped_under'；箭头 source→target；label 依据 sourcePromptId===focus 判定 outgoing/incoming（沿用 Panel 语义）。
- 候选生成：对 focus 节点集合逐个 `buildRelationSuggestions`（excludedIds = 已相连+父+子+自身），只取 top-N 且两端均在过滤后可见节点中。
- focus 子图：以 focus 节点 + neighborIndex.get 一阶邻居裁剪 nodes/links；进入/退出为视图态，不改 store。

## Compatibility / rollback
- 纯渲染层与派生：不改任何存储/进程边界，旧数据无迁移。
- getNodeVal 调整仍单调（usage 0 时与旧 degree 行为一致），保既有测试通过；不改变既有节点/边计数字段语义。
- 分档提交可独立 revert。

## Tradeoffs
- 单一真源：关系语义 label 暂时 graph 直接复用 `prompt.relationships.*` i18n 词条而不迁移 Panel 的映射（最小回归，DRY 略弱），列为后续 issue。
- 候选边限 focus 局部：牺牲"一眼看全潜在关联"换取"不糊图"，符合用户拍板"仅选中/hover 亮起"。

## Verification（分层）
- 纯函数单测：semantics（色/箭头/半径/palette 确定性）、tools（候选dedup、focus裁剪、过滤、孤岛计数）。
- 组件测试：graph 传入扩展节点字段/候选边/图标存在、hover 卡片、focus 按钮（沿用 canvas mock props 断言）。
- 回归：现有 prompt-graph-view.test.tsx 全绿；无硬编码中文回归；7 locale key 全覆盖。
- adhoc：真实数据纯 UI 切图谱视图目视（交付说明列出）。
