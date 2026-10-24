# Design: frontmatter 承载 usageCount

## Affected modules

`apps/desktop/src/main/services/prompt-workspace.ts`（唯一产品代码改动点）：

- `promptFrontmatter()`：字段清单新增 `usageCount: prompt.usageCount ?? 0`，位置紧随 `currentVersion`，与 Web 端同一顺序。
- `parsePromptFile()`：原先硬编码 `usageCount: 0`，改为 `normalizeUsageCount(metadata.usageCount)`。
- 新增 `normalizeUsageCount(value)`：非数字 / 非有限值 / 非正数 → 0，正小数向下取整。

## Data layout impact

- 变更对象：`data/prompts/**/prompt.md` 的 YAML frontmatter，新增可选键 `usageCount`（整数）。
- 无数据库 schema、索引、迁移变化；无新增 JSON 字段。
- 兼容性：旧文件缺键 → 0（与修复前完全一致）；新版本写出的文件被旧版本读取时，未知键被忽略 → 0。两端都不需要迁移脚本。

## Write frequency

不新增写盘次数。热度自增走 `prompt:update`，该 handler 本来就在成功后调用 `syncWorkspace()` 重写工作区文件，因此 `usageCount` 进 frontmatter 只是把已存在的重写带上真实数值。

## Sync semantics

四象限合并与同名冲突裁决继续以 `updatedAt` 唯一取胜者（既有逻辑），热度随胜者文件整体落地，不单独取大值。跨设备同步因此可能把计数向下修正，这是本次采用的 last-writer-wins 语义的直接结果。

## Ownership

- 文件层热度真源：`prompt.md` frontmatter（本次建立）。
- 运行时真源仍是 SQLite `prompts.usage_count`；文件只在数据库重建/合并时作为输入。
- 不在渲染层新增状态或展示。
