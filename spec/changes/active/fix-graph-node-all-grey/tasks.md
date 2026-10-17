# Tasks: 图谱配色退化防护

## T1 测试先行（先红）
- [x] T1.1 mock `folder.store`（`folderState{folders,foldersLoaded}` 可变）+ `settings.store`（isDarkMode=false, motionPreference="full"），默认 loaded=true 保旧用例。
- [x] T1.2 用例 REQ-GC-1：selected 被 tag 过滤出可见集 → `nodeColor(可见节点) !== nodeDimmed`。
- [x] T1.3 用例 REQ-GC-2：`foldersLoaded=false` + 带 folderId 节点 → 存在 `prompt-graph-loading`，无 `force-graph-mock`。
- [x] T1.4 用例 REQ-GC-3：孤儿子树 → `nodeColor === FOLDER_PALETTE.light[0]`。
- [x] T1.5 运行确认新用例失败、旧 16 用例仍通过（基线 19 用例：3 红 + 16 绿）。

## T2 实现
- [x] T2.1 `folder.store`：`FolderState.foldersLoaded` init false；`fetchFolders` 成功置 true、失败保持。
- [x] T2.2 `PromptGraphView`：`visibleIdSet` 上移；`activeNodeIds` 加可见性门控（修A）。
- [x] T2.3 `PromptGraphView`：`buildFolderRootIndex` 加 `stableSlot` 孤儿回退（修C）。
- [x] T2.4 `PromptGraphView`：读 `foldersLoaded`，空态后 loading 门控（修B）。

## T3 验证闭环
- [x] T3.1 `vitest run prompt-graph-view.test.tsx` 全绿（19 用例）。
- [x] T3.2 全量回归 vs stash 基线：失败文件集合 30=30 净新增=空；106/107 差 1 为既有 flaky（symlink EPERM）。
- [x] T3.3 eslint(改动文件) EXIT0 + `tsc --noEmit`(desktop) EXIT0。
- [x] T3.4 `vite build` renderer+main+preload ✓ built。
- [ ] T3.5 复现序列真机目视（待用户，agent 无法驱动 GUI）：列表选中点→进图谱→过滤掉该点→不再全灰；冷启动无灰闪。

## T4 收尾
- [x] T4.1 更新 implementation.md（含 traceability 表与验证结果）。
- [ ] T4.2 提交——依提交规则 §1 待用户明确"提交"指令，未自动 commit。
