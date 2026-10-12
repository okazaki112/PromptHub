# Design: 选择性导出范围与媒体打包口径

## DES-SEXP-001 默认值落点
`DEFAULT_EXPORT_SCOPE`（`renderer/components/settings/data-settings/useBackupExportActions.ts`）是范围默认值的唯一来源：面板用 `useState(DEFAULT_EXPORT_SCOPE)` 持有局部状态，不写 store、不落 settings，因此无迁移与兼容成本。本轮 `versions: false → true` 并新增 `backgroundImage: true`。

`backup-orchestrator.downloadExportFile()`（全量备份、升级前备份共用）同步补 `backgroundImage: true`，保持「全量 = 全范围」语义。

## DES-SEXP-002 媒体打包改为按名取文件
渲染层在 `downloadSelectiveExport()` 内把两类文件名交给主进程：

- `imageFileNames = Object.keys(fullBackup.images ?? {})` —— 已由 `collectImages()` 按 Prompt 引用收集，天然与 JSON payload 一致。
- `backgroundImageFileName` —— 由 `getSettingsStateSnapshot()` 读出的引用，经 `normalizeBackgroundImageFileName()`（`stores/settings/settings-appearance.ts`）规范化；该函数同时剥掉 `local-image://` 前缀并拒绝 `..`、分隔符、URL 形态。

主进程 `data:exportZip` 不再对图片目录做递归，改为 `addNamedAssetFiles()`：逐个名字经 `resolveAssetPath()` 校验（非空、无空字节、必须等于自身 basename、解析结果必须落在目录内），存在且是文件才写入 `images/<name>`；不满足则跳过，不抛错。背景图与媒体列表可能重名，zip 键相同自然去重。

`videos/` 及其余目录保持整目录递归，本轮不扩大改动面。

## DES-SEXP-003 契约与模块边界
- 新增 `packages/shared/types/export-zip.ts`：`ExportZipScope` / `ExportZipResult`，消除主进程内联、preload 实现与 preload 类型声明三处重复；preload 与主进程改用 `IPC_CHANNELS.DATA_EXPORT_ZIP` 常量（此前两处硬编码字符串）。
- 新增 `apps/desktop/src/main/ipc/data-export.ipc.ts`：`registerDataExportIPC()` 承载 handler 与打包辅助函数。原 `main/index.ts` 内联块（约 98 行）删除，5 个随之不再使用的 runtime-path 导入移除。
- 注册时机：在 `main/index.ts` 模块顶层 `registerAppRuntimeIPC()` 之后调用一次。不得放进 `registerAllIPC()` —— 该函数在数据库重绑定时会被再次执行，而 `data:exportZip` 不在 `REBINDABLE_DB_CHANNELS` 移除列表内，二次 `ipcMain.handle` 会抛错。

## 恢复语义核查（本轮改动的前提）
`.zip` 恢复只有两个入口：桌面 `readBackupFileText() → unzipExportToText()` 与 Web `apps/web/src/routes/import-export.ts`，两者都只取 `import-with-prompthub.json` 条目；`envelope.scope` 在 `parseEnvelope()` 中被忽略，恢复范围由此前已裁剪好的 payload 决定。媒体文件由 payload 内 base64 经 `image:saveBase64` / `video:saveBase64` 落盘。因此 zip 的 `images/` 目录仅供人查看，裁剪它不改变任何可恢复数据。

## 验证（TEST-SEXP-*）
- TEST-SEXP-001 默认可见状态：渲染 `DataSettings activeSubsection="backup"`，「版本历史」「背景图」按钮 `aria-pressed="true"`（`data-settings-backup-sync.test.tsx`）。
- TEST-SEXP-002 默认端到端：不改勾选点「导出」，`downloadSelectiveExport` 收到 `versions: true, backgroundImage: true`。
- TEST-SEXP-003 渲染层传参：`imageFileNames` 等于被引用图片集合；背景引用分别覆盖正常名、`../` 越界名、URL 形态；关闭背景开关时不传文件名（`database-backup.test.ts`）。
- TEST-SEXP-004 主进程打包口径：`data-export-ipc.test.ts` 覆盖「只打包被点名文件、未引用文件不进包」「背景开关开/关」「无背景引用」「非法名与磁盘缺失跳过」「其余目录仍递归、videos 保持整目录」「三个 json 条目按提供才写」「对话框取消不建包」「写盘失败返回结构化 error」。
- TEST-SEXP-005 回归：`backup-orchestrator.test.ts` 全量范围断言更新为含 `backgroundImage: true`；桌面全量单测与基线失败集合对照。

## 遗留缺口
- 稳定文档 `spec/knowledge/structure/data-layout-v0.5.5-zh.md` §4「zip 内布局 = `data/` 布局」与 §4.1（`assets/images/` + `manifest.json`/`README.txt`）已与实现分叉：实现为顶层 `images/` + `import-with-prompthub.json`，且本轮后 `images/` 不再等于磁盘目录内容。§10 决策 4「AI 配置/设置默认不导出」与实现默认 `true` 相反。该分叉需独立 change 收敛，本轮不静默择一。
- `videos/` 仍是整目录拷贝，未被引用的视频仍会进备份；与 FR-SEXP-004 同类，留待后续对称处理。
