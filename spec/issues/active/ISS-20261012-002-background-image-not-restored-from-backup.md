# ISS-20261012-002: 备份恢复不回写桌面背景图文件本体

## Status

- State: local_done（代码与测试已落地，未发布；按 GitHub Issue State Rule 保持本地记录）
- Created: 2026-10-12
- Resolved in change: `spec/changes/active/desktop-selective-export-defaults`（DES-SEXP-004 / FR-SEXP-005 / TEST-SEXP-006）
- Severity: 中（换设备/重装后用户外观设置静默失效）
- Owner surface: `apps/desktop/src/renderer/services/database-backup.ts`

## Fix Summary

采用「背景本体进 payload」：`exportDatabase()` 把规范化后的当前背景文件名并入 `collectImages()` 的待收集集合，因此 `payload.images` 含背景 base64；恢复侧沿用既有 `payload.images → saveImageBase64` 循环，无需新增字段或迁移。选择性导出的「媒体 / 背景图」两个开关各自独立裁剪 payload 与 zip 名单。

## Confirmed Gap

备份恢复只回写「引用」，不回写「文件」：

- 导出侧：`collectImages()`（`database-backup.ts:147-209`）只遍历 `prompt.images` 引用，桌面背景图不在其中；背景文件仅被写入 zip 的 `images/` 目录。
- 恢复侧：`.zip` 只被读取 `import-with-prompthub.json` 一个条目（`unzipExportToText()`，`database-backup.ts:624-635`；web 侧 `apps/web/src/routes/import-export.ts:127` 同口径），zip 内的 `images/` 目录从不参与恢复。媒体落盘只遍历 `payload.images` 的 base64（`importDatabase()` 内 `saveImageBase64` 循环）。
- 结果：`payload.settings.state.backgroundImageFileName` 被 `restoreSettingsStateSnapshot()` 写回，引用恢复；但目标机器图片目录没有该文件时，`applyBackgroundImageVars()` 生成指向不存在路径的 `local-image://` 引用，`local-image` 协议对缺失文件返回空路径 ⇒ 背景静默消失，无提示。

## Evidence（探针实测，2026-10-12）

构造 `payload.folders=[1 项]`、`payload.images` 缺失、`payload.settings.state.backgroundImageFileName="background.png"` 的备份并调用 `importDatabase()`：

```text
PROBE saveImageBase64 calls: []
PROBE settings restore calls: [[{"state":{"backgroundImageFileName":"background.png"}}]]
```

即：引用写回发生，文件写回 0 次。探针文件为临时取证用，未保留在仓库。

## 影响范围

- 选择性导出与全量备份共用 `downloadSelectiveExport()`，两条路径同样缺失。
- 同机恢复通常不可见（图片目录里文件本来就在）；换设备、重装、清理数据目录或恢复到一个新 Profile 时必然发生。
- 未被任何 Prompt 引用的历史背景文件不进 `payload.images`，因此也不该被恢复——只有当前背景需要保证可恢复。

## Candidate fixes（待用户拍板）

1. 在导出 payload 增加独立字段（如 `backgroundImage: { fileName, base64 }`），恢复时与 `payload.images` 走同一 `saveImageBase64` 通道。改动面最小，与既有「引用+本体」恢复模型一致；代价是 JSON 增大（3.5MB 图约 +4.7MB base64，zip 已含同一份二进制，压缩后包体积增幅有限）。
2. 恢复时改为同时消费 zip 的 `images/` 目录（主进程解压落盘）。zip 成为媒体真源之一，但与 web 导入路径不对称，改动与测试面更大。
3. 仅在恢复后检测 `backgroundImageFileName` 指向文件缺失并提示用户重选。只治症状。

## Verification 要求

任一修复必须先写失败用例：恢复含背景引用但 `payload.images` 无该文件时，断言 `saveImageBase64` 以背景文件名被调用，且真实文件系统侧文件存在；同时覆盖「背景开关关闭 / 未选背景」两条边界。
