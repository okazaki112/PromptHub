# Proposal: 使用热度随工作区文件持久化

## Why

`usageCount`（复制/运行一次的计数，驱动热度排序、图谱节点大小与热力图强度）此前只存在于 SQLite：

- 桌面端工作区写侧的 frontmatter 字段清单不含 `usageCount`，读侧固定回填 `0`。
- 恢复入库走 `INSERT OR REPLACE`，会把 `usage_count` 一并写成 `0`。

后果：

1. 数据库为空、只有 `data/prompts` 目录时（换机、数据目录迁移、整目录恢复），全库热度归零。
2. 四象限合并里工作区文件比数据库新时，该条热度被清零。
3. Web 端同一份文件布局已持久化 `usageCount`，桌面端与自部署口径不一致。

备份包内的 `import-with-prompthub.json` 本身已携带 `usageCount`，因此本次不是「备份完全没有热度」，而是「文件层与数据库重建路径没有热度」。

## Scope

- `apps/desktop` 主进程工作区读写：frontmatter 增加并读回 `usageCount`。
- 非法值归一化（非数字、`NaN`、`Infinity`、负数、小数）。
- Web 端差异说明同步。

不在范围内：不新增设置项、不改前端展示、不改 SQLite schema、不改 IPC/preload 契约、不改备份 payload 结构。

## Risks

- 热度改成「文件新者胜」：B 设备文件更新时间更晚而计数更小时，同步后本地计数会向下回落。已按用户决策接受，与标题/正文同一语义。
- 旧版本读取带 `usageCount` 的 frontmatter 时忽略未知键，行为等同于现状（读回 0），不产生崩溃。
- 手工编辑文件可写入任意计数；归一化把非法值收敛为 0 或向下取整。

## Rollback

revert 单提交（写侧字段 + 读侧归一化 + 用例 + Web 注释），无数据迁移需要回退；已写入的 `usageCount` 字段对旧版本是未知键，可直接忽略。
