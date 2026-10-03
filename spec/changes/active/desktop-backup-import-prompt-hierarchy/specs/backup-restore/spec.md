# Spec Delta: backup-restore

## Added Requirements

### `FR-BACKUP-001`: 导入含父子的 Prompt 层级备份不触发外键失败

PromptHub MUST 在恢复备份时按"父 prompt 先于子 prompt"的顺序写入 prompts，
使含 parent-child 层级的备份（子项在数组中的原始顺序先于父项）也能成功导入，
不得因 `prompts.parent_id` 外键约束而整包拒绝。

#### Scenario: 备份中子 prompt 排在父 prompt 之前

- **GIVEN** 一份备份，其中子 prompt `B`（`parentId: "A"`）在数组中先于父 prompt `A`
- **WHEN** 用户通过恢复入口导入该备份
- **THEN** 恢复成功，prompts 全部写入
- **AND** `window.api.prompt.insertDirect` 对 `A` 的调用先于对 `B` 的调用
- **AND** 不出现 `FOREIGN KEY constraint failed`

#### Scenario: 无父的顶层 prompt 与子树并存

- **GIVEN** 备份同时含顶层 prompt 与多级子树
- **WHEN** 导入
- **THEN** 所有祖先先于后代插入，数据完整无丢失

## Modified Requirements

- None.

## Removed Requirements

- None.

## Verification

- `TEST-BACKUP-001`: 单元测试断言 `restoreFromBackup` 在 payload 中 prompts 为
  [子, 父] 乱序时，`window.api.prompt.insertDirect` 的调用顺序为父先子后；
  同时覆盖多级链与顶层项混合场景。测试位于
  `apps/desktop/tests/unit/services/database-backup.test.ts`。
