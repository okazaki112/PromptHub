# Tasks

- [ ] `T-BACKUP-001` 明确 `FR / DES / TEST / T` 变更边界（根因=prompts 未按 parent_id 排序）
- [ ] `T-BACKUP-002` 完成 `specs/backup-restore/spec.md` delta spec
- [ ] `T-BACKUP-003` 完成 Analyze：无冲突、孤立 ID、阻塞性 `[待确认]`
- [ ] `T-BACKUP-004` 先补失败测试（prompts 父优先顺序断言），再实施 `sortPromptsForRestore`
- [ ] `T-BACKUP-005` 完成验证：跑 database-backup 相关单测 + 相关套件，记录命令与结果
- [ ] `T-BACKUP-006` 更新 `implementation.md`，同步稳定 docs（如需）
- [ ] `T-BACKUP-007` 完成 Converge 并更新 issues/releases/ADRs/索引
- [ ] `T-BACKUP-008` 将已完成 change 移出 `active/` 并更新引用路径（随版本发布后归档）
