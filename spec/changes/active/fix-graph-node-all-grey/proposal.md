# Proposal: 修复关系图谱节点"全部变灰"

## 问题（FR）
- FR-1：关系图谱在某些状态下所有节点显示为灰，且无任何可辨识高亮节点，属于用户可见的渲染缺陷。
- FR-2：冷启动 / 切换数据时图谱偶发整片中性灰闪现（folders 尚未就绪那一帧）。

## 根因边界（已取证）
- 路径① dimming 反噬：`PromptGraphView` 的 `activeNodeIds` 只判断"是否存在高亮目标"，不校验高亮目标（hover/selected）是否在当前可见节点集内。当选中的 prompt 被 tag/folder 过滤掉、被删除、或数据重建竞态时，可见节点全部命中 `!activeNodeIds.has → theme.nodeDimmed`，整屏淡灰且无亮点。`selectedPromptId` 来自全局 `promptData.selectedId`，与图谱的 filter/focus 完全解耦，是最主要的触发来源。
- 路径② folder 中性灰：节点底色 = `folderColor(rootIndex)`，`rootIndex<0 → neutralNodeColor`（纯灰）。`App.tsx` 将 `fetchPrompts()` 与 `fetchFolders()` 放入 `Promise.all` 并行，prompts 先就绪的一帧 `folders=[]` → 所有 `folderId` 解析为 -1 → 整片中性灰；且 `folder.store` 缺少加载态、`fetchFolders` 失败仅 `console.error`，使竞态可退化为永久灰。
- 路径② 子项 C 孤儿子树：`buildFolderRootIndex.resolveRoot` 上溯到"父引用缺失"的孤儿文件夹时返回 -1，整棵子树集体变灰。

## 范围
- 仅 `apps/desktop` renderer：`PromptGraphView.tsx`、`folder.store.ts`、对应单测。
- 不改 SQLite schema、IPC 契约、持久化布局、同步逻辑。

## 非目标
- 不改"未分组（folderId=null）"显示中性灰这一既有产品语义（可选增强另议）。
- 不改力导向布局参数（抖动/冻结问题已由前序变更处理，边界见知识记忆 graph-force-layout）。

## 风险与回滚
- 修A：仅收紧高亮分支条件 + 一处 hook 声明上移；回滚=还原两处。
- 修B：`FolderState` 增量字段 `foldersLoaded`，组件加 loading 门控；旧数据兼容（默认 false，fetch 成功后 true）；回滚=字段保留不用即恢复旧渲染。
- 修C：配色解析回退算法，只影响"本已 -1 灰"的孤儿链；回滚=还原 `resolveRoot` 返回值。
- 均不触及数据/user-trust 边界，失败最坏退化为当前灰态，不会更差。

## 交付判据
- 新增 3 条回归用例先红后绿；全量 test / lint / typecheck / build 通过；用户真实安装包按复现序列纯 UI 目视验证不再全灰。
