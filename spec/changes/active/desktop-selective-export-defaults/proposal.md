# Proposal: 选择性导出默认范围与媒体打包口径

## Change Key
`desktop-selective-export-defaults`（v0.6.4，体验 + 备份边界收敛）

## Why
两个问题同源于「选择性导出」这一条用户流程：

1. 9 个范围项里只有「版本历史」默认关闭（`useBackupExportActions.ts`），而「全量备份」路径硬编码含版本。两条导出入口口径不一致，用户必须手动补勾才能拿到 Prompt 版本链。
2. 勾选「媒体」时，zip 的 `images/` 是磁盘图片目录的整目录无过滤拷贝，因此桌面背景图、以及换背景时永不删除的历史残留都会进包。实测一份 9.4MB 备份里 8.6MB 是图片，其中只有 1 张是当前背景、0 张被任何 Prompt 引用。

## Scope
- 默认值：`versions` 由 `false` 改为 `true`。
- 新增「背景图」独立导出开关（`backgroundImage`，默认勾选，i18n ×7）。
- 媒体口径收敛：zip 的 `images/` 只打包被导出 Prompt 引用的图片文件名 +（开关开启时）当前背景图文件；不再扫描目录。
- 背景可恢复：把当前背景图本体作为媒体写进 `payload.images`，恢复时走既有 `saveImageBase64` 通道落盘（修复 `ISS-20261012-002`：此前只有引用回写，异机恢复后背景静默失效）。
- 契约与结构：`data:exportZip` 的 scope 类型上移到 `packages/shared/types/export-zip.ts`；主进程 handler 从 `main/index.ts` 抽出为 `main/ipc/data-export.ipc.ts` 并补主进程测试。
- 不改：`videos/`、`prompts/`、`versions/`、`skills/`、`rules/`、`config/` 的整目录递归口径；JSON 侧 `collectImages()` 收集逻辑；恢复语义。

## Risks
- 默认含版本使导出体积增大（实测样例 361 个版本文件、643KB，远小于原先被裁掉的 8.6MB 图片）。
- 「媒体」不再带走未被引用的图片：换设备迁移时，用户手工放进图片目录但未关联 Prompt 的文件不再随包出发。恢复侧不受影响——桌面恢复链路只读 `import-with-prompthub.json`，zip 内的 `images/` 从来不是恢复输入（`database-backup.ts` 解压只取该条目，媒体经 payload base64 落盘；`apps/web/src/routes/import-export.ts` 同理）。
- 抽出主进程 handler 属结构改动：注册时机保持模块顶层一次（不进 `registerAllIPC`，避免 DB 重绑定时二次注册抛错）。

## Rollback
默认值与新增字段回退即恢复原行为；主进程模块抽取可整体还原为 `main/index.ts` 内联 handler，无数据迁移。

## Traceability
FR-SEXP-001..005 → DES-SEXP-001..004 → TEST-SEXP-001..006
