# Design: 图谱配色退化防护

## 归属
- 组件：`apps/desktop/src/renderer/components/prompt/PromptGraphView.tsx`（颜色决策 + 可见性门控 + 孤儿回退 + loading 门控）。
- Store：`apps/desktop/src/renderer/stores/folder.store.ts`（新增 `foldersLoaded`）。
- 视觉常量：`prompt-graph-semantics.ts` / `prompt-graph-theme.ts` 不改。

## 修A 高亮可见性门控
- 现 `activeNodeIds`（约 198 行）依赖 `neighborIndex` + `highlightedId`；`visibleIdSet`（约 221 行）当前声明在其后。
- 变更：将 `visibleIdSet` 上移至 `activeNodeIds` 之前；`activeNodeIds` 内当 `highlightedId` 存在但 `!visibleIdSet.has(highlightedId)` 时返回空集，即视为无高亮。
- `nodeColor`/`shouldShowNodeLabel` 继续读取 `activeNodeIds`，语义在门控后自动正确（目标不可见→不 dimming、不强显高亮 label）。
- 依赖顺序：`visibleIdSet` 只依赖 `baseGraph.nodes`，上移后无回环。

## 修B folders 加载门控
- `FolderState` 增加 `foldersLoaded: boolean`（init `false`）；`fetchFolders` 成功 `set({ folders, foldersLoaded: true })`，失败保持 `false` 且 `console.error`。
- `PromptGraphView` 读 `useFolderStore(s=>s.foldersLoaded)`；在既有 `graphData.nodes.length===0` 空态之后、正常渲染之前，`if (!foldersLoaded) return loading`（复用 `components/ui/Spinner`，外层容器带 `data-testid="prompt-graph-loading"`，不新增 i18n 文案）。
- 竞态消除机理：loading 期内不渲染 canvas，故不再有"空 folderRootIndex 铺中性灰"那一帧；`foldersLoaded→true` 后正常上色。

## 修C 孤儿子树稳定回退
- `buildFolderRootIndex` 增加 `stableSlot: Map<string, number>`：对全部 folders 按 `(order ?? 0) asc, id asc` 排序取稳定下标。
- `resolveRoot` 末尾：`rootOrderByFolder.get(current.id) ?? stableSlot.get(current.id) ?? -1`。
- 覆盖：`folderId` 本身在 folders、但上溯停在非 root 的孤儿节点 → 现在命中 stableSlot≥0 → 调色板色。仍为 -1 的情况只剩"folderId 不在 folders 中"（真·stale/损坏），保持中性灰为合理降级。

## 测试策略（AGENTS 7.x）
- 现单测只 mock `prompt.store`，拿不到可控 folders/isDarkMode/loaded → 无法断言颜色。补 `folder.store`+`settings.store` mock（选择器形式），`folderState` hoisted 可变，默认 `foldersLoaded=true` 保旧用例行为。
- 用例1（REQ-GC-1）：selected 被过滤移除可见集 → 对可见节点 `nodeColor !== theme.light.nodeDimmed`。
- 用例2（REQ-GC-2）：`foldersLoaded=false` 且节点带 folderId → 渲染 loading，无 `force-graph-mock`。
- 用例3（REQ-GC-3）：孤儿子树节点 → `nodeColor === FOLDER_PALETTE.light[0]`（非中性灰）。

## analyze 结论
- FR→DES→TEST→T 链路闭合，三条用例各对应 REQ。stableSlot 排序确定性、无 per-render 抖动。无 [待确认] 阻塞项。未触及 schema/IPC/存储契约。
