# Implementation: 关系图谱价值增强 (v0.6.5)

## 实际达成
三档全部落地，纯 renderer 视图层增量，未触碰 packages/db / shared 契约 / IPC / preload。

### 第一档 数据上屏
- `prompt-graph-layout.ts` `PromptGraphNode` 增 `folderId/tags/usageCount/isFavorite`，`buildPromptGraphData` 透传；`getNodeVal` 叠加 usageCount（bounded bonus，usage=0 时与旧值一致，既有测试不破）。
- 新增 `prompt-graph-semantics.ts`（纯函数视觉编码）：`semanticEdgeVisual` 按 kind 给色/箭头/dash/方向；`folderColor` 按根文件夹稳定序号映射调色板；`suggestionEdgeVisual` 点线样式；`PROMPT_TYPE_META`。
- 新增 `prompt-graph-theme.ts`：把原 PromptGraphView 内联的 GRAPH_THEME/ZOOM_STEP 拆出，控制单文件行数。
- 新增 `graph-overlays.tsx`：GraphLegend 图例、NodeHoverCard hover 卡片、GraphFilterBar 过滤/focus/孤岛工具条、GraphControls 缩放控件（含 legend toggle）。全部 DOM、可 jsdom 测试。
- 主视图 `PromptGraphView.tsx` 接入底色/尺寸/kind 分色箭头/图例/hover 卡片。

### 第二档 自动浮现关联
- 新增 `prompt-graph-tools.ts` `buildSuggestionLinks`：仅对 hover+selected 节点，复用 `buildRelationSuggestions`，dedup（已连/父子/自身/互反/过滤隐藏），`maxPerNode=6`。
- 视图把候选边并入 graphData，点线 distinct 样式渲染；`onLinkClick` 命中候选边→ `createRelation({kind:'related_to'})`，落库后候选边被真实边取代。其余节点不常亮。

### 第三档 focus/过滤/孤岛
- `focusSubgraph`（一阶邻域裁剪，端点已解析为对象也可算）、`applyNodeFilters`（tag ∪ folder）、`pruneLinksToVisibleNodes`、`countIsolated`。
- 视图：点击已选中节点 = 切换焦点子图（react-force-graph-2d 无 onNodeDoubleClick 回调，故用同点复选切换，规避不存在的 API）；GraphFilterBar 提供 Exit focus、tag、folder（根）切换、清除、`{{count}} unlinked` 孤岛 badge。

## 新增/变更 i18n
7 个 locale 的 `prompt.graph` 补齐 30 键：`legend.*`(title/hierarchy/related/variant/depends/next/suggestion/folder/size/toggle)、`card.usage`、`card.suggested`、`iso.badge`、`focus.exit`、`filter.clear`、`typeText/typeImage/typeVideo`，复用同命名空间，英文 fallback + i18next 插值，避免硬编码中文。

## 测试
- 新增单测：`prompt-graph-semantics.test.ts`(10)、`prompt-graph-tools.test.ts`(17)。
- 扩展 `prompt-graph-view.test.tsx`：mock 增 onMouseEnter/mouseLeave/double/onLinkClick + prompt.store createRelation 打桩；新增 8 用例（候选出边+落库、无焦点不出候选、usage hover 显示/消失、focus 子图进/出、legend toggle、2 unlinked badge、tag filter 缩小、颜色/箭头断言）。
- 验证证据：`prompt-graph-view.tsx`(7)、semantics(10)、tools(17) = 42 tests passed；i18n 回归 34 passed；typecheck(0.6.5) passed；eslint 改动文件 0 warning；production build succeeded，`PromptGraphView` chunk 213.55 kB。
- 基线对照：临时 stash 10 改动文件→4 失败测试文件，基线 `35 failed|95 passed`，还原后 `35 failed|95 passed` → 数字一致，确认 Windows agent 环境符号链接/macOS/DB 不可用的 35 failed 为既有失败，非本轮引入。

## 文件行数核查
PromptGraphView.tsx ~500、graph-overlays.tsx ~300、prompt-graph-tools.ts ~180、prompt-graph-semantics.ts ~180、prompt-graph-layout.ts ~240、prompt-graph-theme.ts ~35 行。无单文件超 1000，符合新文件 ≤2000/默认 <1000。

## 遗留与待确认（已记录，未阻塞）
- 候选边点击命中：jsdom mock 验证了数据契约与回调链，真实 canvas 端 `onLinkClick` 的可点面积需在你安装包真实数据上目视（交付报告列出验收步骤）。
- folder 过滤目前只对根文件夹，子文件夹归属到根；prompt 数量极大时可做候选边惰性计算（当前已用 6/节点上限）。
- 关系语义 label 真源仍散在 PromptRelationshipPanel，本次在图谱侧复用同一 `prompt.relationships.*` i18n key 但未把面板的 DIRECTIONAL_RELATION_LABELS 抽到 semantics.ts（留作后续 issue，避免牵动面板回归）。

## 稳定性边界声明
无 DB schema / migration / IPC / preload / shared public type 的行为变更；旧数据零迁移成本；无破坏性变更。列表/看板/画廊/卡片视图不受影响。
