# Proposal: 选择性导出默认范围与媒体目录打包口径

## Change Key
`desktop-selective-export-defaults`（v0.6.4，体验 + 备份边界澄清）

## Why
「选择性导出」勾选清单里 9 个范围项只有「版本历史」默认关闭（`useBackupExportActions.ts:11-21`），而「全量备份」路径硬编码含版本（`backup-orchestrator.ts:75-87`）。两条导出入口对同一份数据给出不同默认，用户需手动补勾才拿到版本历史，否则恢复后丢失 Prompt 版本链。

同时实测暴露第二个问题：勾选「媒体」时，备份 zip 的 `images/` 是磁盘图片目录的整目录拷贝，而非被导出内容引用的图片集合，导致桌面背景图（含已弃用的历史背景）进入备份。需把这一打包口径写清并留待决策。

## Scope
- 默认值：`versions` 由 `false` 改为 `true`，其余 8 项不变。
- 文档：记录 zip 目录打包口径与 `spec/knowledge/structure/data-layout-v0.5.5-zh.md` 的实现偏差。
- 不改：JSON 侧 `collectImages()` 收集口径、zip 目录结构、恢复语义、i18n 文案。

## Risks
- 默认含版本会让选择性导出体积增大（实测样例：`versions/` 361 个 md 文件，远小于同包内 8.6MB 图片）。
- 用户若期望「轻量导出」需手动取消勾选；无持久化记忆（局部 `useState`，重开面板回到默认）。

## Rollback
单行默认值回退 + 删除新增用例，无数据迁移、无契约变更。

## 待确认（需用户拍板，本轮不动代码）
1. `images/` 是否改为「只打包被引用文件 + 当前背景引用文件」。影响恢复：未被引用的历史背景图将不再随备份回来。
2. 更换桌面背景时是否清理旧文件（当前 `image.ipc.ts` 只有整目录 `IMAGE_CLEAR`，无单文件删除通道，历史背景会永久累积）。

## Traceability
FR-SEXP-001..002 → DES-SEXP-001..002 → TEST-SEXP-001..002
