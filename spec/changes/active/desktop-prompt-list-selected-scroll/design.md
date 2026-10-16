# Design: 选中项目定位替代顶部跳转

## Affected modules
`apps/desktop/src/renderer/components/layout` only:
- `PromptWorkspaceCardRoute.tsx`: pass derived selected prompt id to list as `selectedPromptId`
- `prompt-list-types.ts`: optional `selectedPromptId`
- `PromptVirtualizedList.tsx`: forward id to model
- `useVirtualizedPromptListModel.ts`: replace unconditional top scroll with selected target scroll

## Boundary
手风琴 selection 语义保持：selected chain expand / other parents collapse。
虚拟列表不再用 `scrollRef.current.scrollTo(top:0)` after `promptOrderKey`.
It calls `rowVirtualizer.scrollToIndex(selectedIndex, {align:
"start"})` when selected id exists in visible flattened tree.

## Selection identity
Derived single selectedPrompt.id. Store multi-select `selectedPromptIdSet` still used by rows for styling, unaffected.

## Behavior when hidden target
If selected prompt not visible (collapsed hidden branch / filter / tree order race), no scroll call; leave viewport stable rather than force top.
