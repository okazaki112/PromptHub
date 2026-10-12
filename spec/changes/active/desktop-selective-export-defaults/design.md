# Design: 选择性导出默认范围

## DES-SEXP-001 默认值落点
`DEFAULT_EXPORT_SCOPE`（`apps/desktop/src/renderer/components/settings/data-settings/useBackupExportActions.ts:11-21`）是导出范围的唯一默认来源：面板用 `useState(DEFAULT_EXPORT_SCOPE)` 持有局部状态，不写 store、不落 settings、不做跨会话持久化。因此 `versions: false → true` 即完成默认值变更，无需迁移与兼容处理。

不改动项及理由：
- `backup-orchestrator.downloadExportFile()`（`backup-orchestrator.ts:75-87`）已硬编码全范围 `true`，与「全量备份」语义一致，保持独立。
- `BackupPanel.tsx:76-119` 的交互保持原样：`images` 与 `videos` 仍由单个「媒体」项联动切换，因此默认 `videos` 也保持 `true`。
- `downloadSelectiveExport()`（`database-backup.ts:1278-1368`）的规范化与裁剪逻辑不变，IPC `data:exportZip` 契约不变。

## DES-SEXP-002 媒体目录打包口径（记录，不改）
主进程 `data:exportZip`（`apps/desktop/src/main/index.ts:1096-1193`）用 `collectDirFiles(srcDir, zipPrefix)` 做无过滤递归拷贝，`scope.images` 为真时打包 `getImagesDir()` 全目录。桌面背景经 `IMAGE_SAVE`（`image.ipc.ts:359-394`）以 uuid 名落在同一目录（`runtime-paths.ts:180-185`），`settings.backgroundImageFileName` 只保留文件名引用，因此背景图随「媒体」勾选进入备份。

与稳定文档的偏差（需后续收敛，本轮只记录）：
- `spec/knowledge/structure/data-layout-v0.5.5-zh.md` §4.1 描述 zip 布局为 `assets/images/`、元数据为 `manifest.json` + `README.txt`；实现为顶层 `images/` 与 `import-with-prompthub.json`。
- 同文档 §10 决策 4「AI 配置 / 设置默认导出：否（安全优先）」与实现的 `aiConfig/settings` 默认 `true` 相反。

## 验证（TEST-SEXP-*）
- TEST-SEXP-001 可见状态：渲染 `DataSettings activeSubsection="backup"`，「版本历史」按钮 `aria-pressed="true"`。
- TEST-SEXP-002 端到端默认：直接点击「导出」，断言 `downloadSelectiveExport` 收到 `versions: true`。
- 反向路径由既有 `database-backup.test.ts` 的显式 scope 用例覆盖（传入 `versions: false` 时 `payload.versions` 为空）。
- 回归基线：既有 fixture 中的 `versions: false`（`database-backup-format.test.ts:62`、`database-backup.test.ts:1166`）属于构造导入文件的 scope，与本默认值无关，不得改动。
