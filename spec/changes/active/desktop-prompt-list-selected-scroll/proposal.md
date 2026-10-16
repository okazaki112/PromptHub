# Proposal: 卡片列表选中父 Prompt 后不要跳回顶部

## Why
用户在卡片视图点击带子项的 Prompt 后，主列表突然滚回顶部，选中节点可能消失视野，交互难追踪。
现有手风琴选择语义要求：选中 Prompt 时保持所选 Prompt 与祖先展开、折叠其他父分支。该功能不能取消。
问题在列表模型：flatten 顺序变化时无条件 `scrollTo({ top: 0 })`，不是手风琴语义。

## Scope
仅修改卡片虚拟列表滚动行为；保留选择自动 expand/collapse、多选、拖拽、过滤语义。
不修改 DB / IPC / preload / 共享数据结构 / 手风琴算法。

## Risks
- selection id 未出现在当前 flatten tree 时不能强行滚动；当前 hidden 分支选择可能无滚动。
- React Virtualizer index 依赖 measure，需要真机目视验证命中/可视效果。

## Rollback
revert `useVirtualizedPromptListModel` prop/effect and caller chain（4 files）。
