# ISS-20261012-002: 备份恢复不回写桌面背景图文件本体

## Status

- State: local_done（代码与测试已落地，未发布；按 GitHub Issue State Rule 保持本地记录）
- Created: 2026-10-12
- Resolved in change: `spec/changes/active/desktop-selective-export-defaults`（DES-SEXP-004 / FR-SEXP-005 / TEST-SEXP-006）
- Severity: 中（换设备/重装后用户外观设置静默失效）
- Owner surface: `apps/desktop/src/renderer/services/database-backup.ts`

## Deeper Root Cause Found On Re-test（10-12 二次复测）

按第一版修复重新导出后导入，报错 `Backup restore completed with 1 file errors: image 05c87b6a-...png`。真正根因比「旧备份缺本体」更严重：**大于约 3.5MB（base64 约 4.6MB）的媒体永远无法写回**。

`apps/desktop/src/main/ipc/image.ipc.ts` 与 `apps/web/src/services/media-base64.ts` 的 base64 校验用了嵌套量词正则 `/^(?:[A-Za-z0-9+/]{4})*...$/u`，V8 在 4,667,088 字符的合法 payload 上 `RegExp.test` 直接抛 `RangeError: Maximum call stack size exceeded`（实测 2MB 通过、4.67MB 溢出）。该异常被 handler 的 catch 吞成 `return false`，于是：

- 修复前：静默失败，背景与任何大图/视频在恢复后消失且无提示；
- 「静默失败收口」之后：变成显式报错，用户才看到这条信息。

实测数据（真实 `05c87b6a-...png`，3,500,315 字节 → base64 4,667,088 字符）：旧正则 `THREW RangeError`，线性正则 `true`。

## Fix

把嵌套量词正则换成线性字符集校验 `/^[A-Za-z0-9+/]*={0,2}$/u`，分组合法性仍由既有的 `payload.length % 4 !== 0` 与空值前置检查保证。逐例比对边界串（`""` / `AB` / `AB==` / `ABCD==` / `AAAA` / `AA=` / `=A` / `/A+=` / `a+b=` / `ABCD===` / `AB%C` / `=` / `A===`）：配合长度守卫后，可接受集合与旧实现逐例一致，无语义放宽。桌面与 web 两处同步修改。

## Tests

- `apps/desktop/tests/unit/main/media-save-base64-large.test.ts` 4 例（先红：3.5MB 图与视频写入返回 false；非法 base64 与空 payload 的拒绝保持绿色）。
- `apps/web/src/services/media-base64.test.ts` 新增 1 例（先红 `RangeError`）。
- 桌面全量 `107 failed | 3324 passed`，失败文件集合与基线 `v063-full2.log` 一致，仅多出 1 条 `ISS-20261012-001` 已登记的 `rules-workspace` Windows rename EPERM 偶发；web 全量 `5 failed | 342 passed`，与修复前同口径（均为环境/构建产物依赖类失败）。

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

## Residual Gap Found On Second Machine（10-12 复测）

用户在第二台设备恢复后背景仍未生效。归因：他恢复的是 `exportedAt = 2026-10-11T19:55Z` 的备份，早于本体进 payload 的修复（`43dd2779`，10-12 03:11Z），该备份 `payload.images = {}`，只有引用没有本体 —— 旧备份不可能救回，需要重新导出。

真正被这次复测暴露的缺陷是「全程无提示」：

1. 主进程 `IMAGE_SAVE_BASE64` 写盘失败只 `return false`，渲染层忽略返回值 ⇒ 图片写入失败静默消失。已修复：`false` 计入 `restoreFailures` 并在恢复末尾抛出；`undefined`（无桥接，如 Web）不算失败。
2. 恢复后引用指向缺失文件时，`local-image` 协议返回空路径，界面既无背景也无说明。已修复：`AppearanceSettings` 用 `image:exists` 探测并显示 `settings.backgroundImageMissingFile`（×7 locale），无桥接或探测异常时不提示。

测试：`database-backup-background-media.test.ts` +2 例、`appearance-settings.test.tsx` +3 例（先红后绿）。

## Candidate fixes（历史方案，已按方案 1 落地）

1. 在导出 payload 增加独立字段（如 `backgroundImage: { fileName, base64 }`），恢复时与 `payload.images` 走同一 `saveImageBase64` 通道。改动面最小，与既有「引用+本体」恢复模型一致；代价是 JSON 增大（3.5MB 图约 +4.7MB base64，zip 已含同一份二进制，压缩后包体积增幅有限）。
2. 恢复时改为同时消费 zip 的 `images/` 目录（主进程解压落盘）。zip 成为媒体真源之一，但与 web 导入路径不对称，改动与测试面更大。
3. 仅在恢复后检测 `backgroundImageFileName` 指向文件缺失并提示用户重选。只治症状。

## Verification 要求

任一修复必须先写失败用例：恢复含背景引用但 `payload.images` 无该文件时，断言 `saveImageBase64` 以背景文件名被调用，且真实文件系统侧文件存在；同时覆盖「背景开关关闭 / 未选背景」两条边界。
