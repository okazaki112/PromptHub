# Web Delta Spec

## Modified Requirements

### Requirement: Web Runtime Must Track Desktop Bridge Contract

- `apps/web` 通过 Web runtime 复用 desktop renderer 时，bridge 层必须为 renderer 已依赖的关键 preload API 提供兼容实现或显式降级。
- Web runtime 不得因为缺失 `window.api.*` / `window.electron.*` 方法而在主要页面上出现功能性崩溃。

#### Scenario: Rules and Tag Management in Web Runtime

- WHEN self-hosted Web 打开与 desktop 共用的 renderer 界面
- THEN Rules 工作台、Prompt 标签管理、Skill 文件编辑等最近已交付的能力应继续可用或明确降级
- AND 不得因为 bridge 缺失方法而在用户交互时抛出运行时错误
