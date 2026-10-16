# Tasks: 关系图谱价值增强

追踪 FR -> DES -> TEST -> T。验证：prompt-graph 测试 42 passed；i18n 回归 34；typecheck 0；eslint 0 warning。

## T 第一档 数据上屏
- [x] T1.1 新增 `prompt-graph-semantics.ts`：kind→视觉{color,hasArrow,dash,labelKey}、候选点线样式、根文件夹稳定调色板、size 叠加 usage。
- [x] T1.2 扩展 `prompt-graph-layout.ts`：节点带 folderId/tags/usageCount/isFavorite；getNodeVal 叠加 usage；Suggestion link 类型。
- [x] T1.3 单测 `prompt-graph-semantics.test.ts` 10 绿（palette 确定性、kind 映射、hover 样式、类型元数据）。
- [x] T1.4 更新既有 prompt-graph-view.test.tsx：mock 加事件 + 候选/焦点/legend/filter/hover 8 新用例；既有 7 仍绿（共 15）。
- [x] T1.5 新增 `graph-overlays.tsx`：GraphLegend、NodeHoverCard、GraphFilterBar（含 exit focus / tag chips / folder chips / clear / unlinked badge）。`prompt-graph-theme.ts` GRAPH_THEME/ZOOM_STEP。
- [x] T1.6 `PromptGraphView.tsx` 接入底色/尺寸/箭头/图例/hover。

## T 第二档 自动浮现关联
- [x] T2.1 `prompt-graph-tools.ts` buildSuggestionLinks(focusId only, dedup connected + parent/child + reverse + visible, maxPerNode6)。
- [x] T2.2 单测 17 绿（含 dedup、visible 过滤、max cap）。
- [x] T2.3 mock 候选边 onLinkClick 提交 → prompt.store.createRelation {related_to}；非 focus 节点不出候选边（测试覆盖）。
- [x] T2.4 视图候选边样式点线 + 仅 hover/selected 节点。

## T 第三档 focus/过滤/孤岛
- [x] T3.1 tools：focusSubgraph 一阶邻域（端点为对象也可算），applyNodeFilters（tag ∪ folder），countIsolated。
- [x] T3.2 单测：对象边、focus、filter、isolated。
- [x] T3.3 Filter bar：exit focus/legend toggle/2 unlinked badge。

## 收口
- [x] T4.1 7 locale 补 30 i18n keys。
- [x] T4.2 无新增硬编码中文（i18n 回归通过）。
- [x] T4.3 prompt-graph 3 文件 42 tests、既有 7 仍绿。
- [x] T4.4 typecheck + eslint。
- [x] T4.5 implementation.md + proposal/spec/design/tasks。
- [x] T4.6 version bump 0.6.5 + commit（见 git log）。
- [x] T4.7 doc/v0.6.5.md 迭代成果报告（本地目录）。

## Verification status
DONE。42 graph tests + 34 i18n + typecheck + eslint + build ✓。
