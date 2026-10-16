# Spec Delta: prompt-list-selection-scroll

## ADDED Requirement FR-L1 手风琴选中的可视保持
卡片虚拟列表在 flatten selection 顺序变化后，应把当前单选 Prompt 保持/滚动到可视区（`align: start`），不能因 promptOrderKey 变化无条件滚回列表顶部。
- AC-L1a: 选中项在 treeItems 可见时，调用 `scrollToIndex(targetIndex, {align:"start"})`。
- AC-L1b: 没选中项或 selected target hidden in flattened tree时不得强制滚回 top（保留当前 viewport）。
- AC-L1c: 手风琴 selection 行为（保持 selected/ancestor 分支展开、其他 parent 分支收起）仍不变。
- TEST: `tests/unit/components/useVirtualizedPromptListModel.test.ts`。
