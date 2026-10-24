# Tasks

- [x] T1 TEST-UH-001: 导出写出 `usageCount: 7` 且空库导入恢复为 7（先失败）
- [x] T2 TEST-UH-002: 负数 / 小数 / 字符串 / null 归一（先失败于小数用例）
- [x] T3 DES-UH-001: `promptFrontmatter` 新增 `usageCount`
- [x] T4 DES-UH-002: `parsePromptFile` 改读 `normalizeUsageCount`
- [x] T5 Web 端「桌面不持久化 usageCount」差异说明同步
- [x] T6 定向测试 + typecheck + eslint + 文件行数门禁
- [ ] T7 提交

## Traceability

- FR-UH-001 -> DES-UH-001/002 -> TEST-UH-001 -> T1/T3/T4
- FR-UH-002 -> DES-UH-002 -> TEST-UH-002 -> T2/T4
- FR-UH-003 -> DES-UH-001（合并逻辑未改，仅文档化）-> T5
