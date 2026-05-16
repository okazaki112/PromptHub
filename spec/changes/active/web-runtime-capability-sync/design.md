# Design

## Approach

- 把 `apps/web/src/client/desktop/install-bridge.ts` 当成 Web runtime 的 preload contract 适配层，优先补齐 desktop renderer 已真实调用的方法，而不是去修改 desktop renderer 做 Web 特判。
- 缺失能力分三类处理：
  - 已有 Web 路由但 bridge 没接：直接补 bridge
  - desktop 使用但 Web 后端没有等价路由：新增最小 Web 路由
  - 明确 desktop-only：提供显式降级或 no-op，但保证不会让 renderer 因 `undefined is not a function` 崩溃
- 这轮优先级：
  - `prompt.getAllTags / renameTag / deleteTag`
  - `rules.*`
  - `skill` 的关键 by-path / version / zip export / 平台状态兼容能力
  - `window.electron` 中 desktop renderer 已直接依赖的缺失能力

## Tradeoffs

- 继续复用 desktop renderer 能最大化共享功能，但代价是 Web bridge 必须持续跟进 preload contract。
- 不在这轮引入自动 contract 生成；先用最小代码修复和测试覆盖恢复功能，再决定后续是否需要自动化对齐。
