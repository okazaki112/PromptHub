# Implementation: 修复关系图谱节点"全部变灰"

## 实际落地（A+B+C）
- `folder.store.ts`
  - `FolderState` 新增 `foldersLoaded: boolean`（初值 `false`）。
  - `fetchFolders` 成功 `set({ folders, foldersLoaded: true })`；失败保持 `false` 且保留 `console.error`（不再静默留空 folders 导致图谱永久灰）。
- `PromptGraphView.tsx` — 修A（REQ-GC-1）
  - `visibleIdSet` 上移到 `activeNodeIds` 之前。
  - `activeNodeIds`：当 `highlightedId`（hover/selected）存在但不在可见节点集时返回空集，即"无高亮"，不再把每个可见节点判入 `!has → nodeDimmed`。消除"选中项被过滤/删除/重建后全屏淡灰且无亮点"。
- `PromptGraphView.tsx` — 修B（REQ-GC-2）
  - 读 `foldersLoaded`；在既有空态之后、正常渲染之前，`!foldersLoaded` 时渲染 `Spinner` 遮罩（`data-testid="prompt-graph-loading"`），不铺中性灰点。消除冷启动 prompts/folders 并行竞态的"灰闪"。
- `PromptGraphView.tsx` — 修C（REQ-GC-3）
  - `buildFolderRootIndex` 增 `stableSlot`（全部 folders 按 `order` 再 `id` 的稳定下标）。`resolveRoot` 末行 `rootOrderByFolder.get ?? stableSlot.get ?? -1`，孤儿子树保留稳定调色板色而非塌陷为灰。
- `prompt-graph-view.test.tsx`
  - 补 `folder.store`/`settings.store` mock（`folderState` hoisted，默认 `foldersLoaded=true` 保旧 16 用例渲染路径不变）。
  - 新增 3 用例覆盖 REQ-GC-1/2/3，先红后绿。

## Traceability
| Requirement | Design | Verification | Task |
| ----------- | ------ | ------------ | ---- |
| FR-1 / REQ-GC-1 | 修A | 用例 `does not dim ... filtered out` | T1.2 / T2.2 |
| FR-2 / REQ-GC-2 | 修B | 用例 `loading ... not ready` | T1.3 / T2.1 / T2.4 |
| REQ-GC-3 | 修C | 用例 `orphaned subfolder` | T1.4 / T2.3 |
| NFR: 无 schema/IPC 变更 | design.md | typecheck + 集成回归 | T3 |

## 验证（实际命令与结果）
- `vitest run tests/unit/components/prompt-graph-view.test.tsx`: `19 passed`（新增 3 先 FAIL 后 PASS）。
- 全量 vs stash 基线对照：`Test Files` 基线 `30 failed`＝现状 `30 failed`；`Compare-Object` 失败文件集合净新增=空。`Tests` 基线 `107 failed` / 现状 `106 failed`，差 1 属既有 flaky（现状更少）。30 个既有失败文件 100% 归类 Windows `EPERM symlink`，与本改动无关。
- 定向回归（本轮改动直接关联）：`main-content` 集成 ×3 + `prompt-kanban-view` = `26 passed`。
- `eslint`（3 个改动文件）`--max-warnings 0`: EXIT 0。
- `tsc --noEmit`（desktop 全量）: EXIT 0。
- `vite build`（renderer+main+preload）: 全部 `✓ built`，无 error（chunk 体积/动态导入为既有告警）。

## 未运行 / 待办
- 真机目视：agent 环境无法驱动 GUI，需用户在真实产物/数据按复现序列纯 UI 验证。
- 提交：依 `spec/rules/submission-traceability-rules.md` §1，未获用户明确"提交"指令前不自动 commit，改动留工作区。

## 稳定文档同步
- 本 change 已完整记录退化边界；`spec/knowledge/behavior` 图谱配色边界可在 converge 时指向本 change，暂不新建并行真相源。
