# Spec: 工作区文件承载使用热度

## Modified Requirements

### FR-UH-001 热度随 Prompt 文件持久化

`data/prompts` 下的 Prompt 文件 frontmatter 必须记录 `usageCount`，并且从文件导入数据库时按文件值恢复，使热度不依赖数据库文件本身。

**Scenario: 导出后换库恢复**
- Given 一条 Prompt 的 `usageCount` 为 7
- When 数据库同步到工作区，随后用同一批文件导入到一个空数据库
- Then 文件 frontmatter 含 `usageCount: 7`
- And 导入后的 Prompt `usageCount` 为 7

**Scenario: 旧文件没有该字段**
- Given Prompt 文件由旧版本写出，不含 `usageCount`
- When 导入该文件
- Then `usageCount` 为 0（与修复前一致）

### FR-UH-002 非法热度值归一

手工编辑或损坏的 `usageCount` 不得写入负数、小数、非数字或非有限数值。

| 输入 | 结果 |
| --- | --- |
| `-3` | 0 |
| `2.7` | 2 |
| `"seven"` | 0 |
| `null` / 缺省 | 0 |

### FR-UH-003 合并语义

工作区与数据库同一 id 冲突时，热度与其他字段一样由更新时间较新的一方决定；不做取大值特例。默认行为，不提供开关，不在界面显示。

## Unchanged

- SQLite schema、`usage_count` 列与自增逻辑不变。
- 备份 JSON payload 结构不变（已含 `usageCount`）。
- 选择性导出开关集合不变。
