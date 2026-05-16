# Delta Spec

## Added

- 桌面端首页应固定使用新版双栏侧边栏壳层。
- 桌面端首页应允许用户控制 `Prompts`、`Skills`、`Rules` 三个模块的显示顺序与启用状态。
- 桌面端首页已启用模块的顺序调整应通过直接拖拽完成。
- 桌面端首页至少保留一个可见模块，不能把首页工作区配置为空。

## Modified

- 本地 Skill Source 的 Electron e2e 回归应以“已导入态 + 实际落库”作为导入成功判据，而不是仅依赖瞬时 toast 文案。

## Removed

-

## Scenarios

- 用户禁用当前模块后，首页自动跳转到首个仍可见的模块。
- 用户拖拽已启用模块后，桌面首页左侧 rail 与 panel fallback 都按照新的顺序生效。
