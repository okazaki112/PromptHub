# Implementation: desktop-selective-export-defaults

## 第一阶段：默认含版本历史
- `renderer/components/settings/data-settings/useBackupExportActions.ts`：`DEFAULT_EXPORT_SCOPE.versions` `false → true`。
- `tests/unit/components/data-settings-backup-sync.test.tsx`：新增用例断言真实渲染面板中「版本历史」`aria-pressed="true"`，且点「导出」时 `downloadSelectiveExport` 收到 `versions: true`。改动前先红灯（实测 `aria-pressed="false"`）。
- 提交：`7317d0f3 feat(desktop): include version history in selective export defaults`。

## 第二阶段：背景图独立开关 + 媒体按引用打包
### 落地清单
- 新增 `packages/shared/types/export-zip.ts`：`ExportZipScope`（含 `imageFileNames`、`backgroundImage`、`backgroundImageFileName`）与 `ExportZipResult`，经 `types/index.ts` 导出。
- 新增 `apps/desktop/src/main/ipc/data-export.ipc.ts`：`registerDataExportIPC()`。图片目录不再整目录递归，改由 `addNamedAssetFiles()` 按名取文件；`resolveAssetPath()` 要求裸 basename、拒绝空字节/`..`/嵌套/绝对路径，且解析结果必须落在资源目录内；文件缺失静默跳过。其余目录（prompts/versions/skills/rules/videos/config）保持 `collectDirFiles` 递归。
- `apps/desktop/src/main/index.ts`：删除内联 `data:exportZip` handler（98 行）与 5 个失效的 runtime-path 导入，在 `registerAppRuntimeIPC()` 之后调用 `registerDataExportIPC()`（模块顶层一次，避免 DB 重绑定二次注册）。
- `apps/desktop/src/preload/index.ts`：`exportZip` 实现与 `window.electron` 类型声明改用共享类型，通道名改用 `IPC_CHANNELS.DATA_EXPORT_ZIP`。
- 渲染层：`data-settings-controller-utils.ts` 的 `ExportScopeKey` 增 `backgroundImage`；`useBackupExportActions.ts` 默认 `true` 并在清单中「媒体」之后插入 `settings.exportBackgroundImage`；`database-backup-format.ts` 的 `ExportScope` 增可选 `backgroundImage`；`database-backup.ts` 的 `downloadSelectiveExport()` 归一化该键、传 `imageFileNames = Object.keys(fullBackup.images ?? {})`，并在开启时用 `normalizeBackgroundImageFileName()` 规范化设置快照里的背景引用后传 `backgroundImageFileName`；`backup-orchestrator.ts` 的全量范围补 `backgroundImage: true`。
- i18n：`settings.exportBackgroundImage` ×7 locale（en/zh/zh-TW/ja/fr/de/es）。

### 行为变化
- 勾选「媒体」不再带走未被 Prompt 引用的图片；实测样例中 8.62MB 的 3 张图片里，只有当前背景（3.5MB）会因「背景图」开关保留，`96abfc4a-...png`(4.9MB) 与 `453df50b-...jpg`(215KB) 这类历史残留不再进包。
- 「背景图」可单独关闭，用于交付纯净的 Prompt 内容包。
- 恢复链路不受影响：`.zip` 恢复只读 `import-with-prompthub.json`（桌面 `unzipExportToText`、Web `routes/import-export.ts` 同口径），媒体经 payload base64 落盘，背景引用随 `payload.settings.state` 恢复。

### 测试
- 新增 `tests/unit/main/data-export-ipc.test.ts` 8 例：按名打包且排除未引用文件、背景开关开/关、无背景引用、非法名与缺失文件跳过、其余目录递归与 videos 整目录、三个 JSON 条目按提供才写、对话框取消不建包、写盘失败返回结构化 error。
- `tests/unit/services/database-backup.test.ts`：既有 ZIP 用例补 `imageFileNames` / `backgroundImage` 断言；新增 `it.each` 3 例覆盖正常名、`../` 越界名、URL 形态；新增「关闭背景开关不传文件名」1 例。
- `tests/unit/components/data-settings-backup-sync.test.tsx`：默认态断言扩展到「背景图」。
- `tests/unit/services/backup-orchestrator.test.ts`：全量范围断言补 `backgroundImage: true`（2 处）。

## 验证（第二阶段）
- `tests/unit/main/data-export-ipc.test.ts` 8 例：新增文件，全绿。
- 备份导出相关 8 个文件（含新主进程测试）：`Test Files 8 passed`、`Tests 76 passed`。
- `pnpm` 桌面 eslint 全量（`--max-warnings 0`）：exit 0；`node scripts/check-file-line-limits.mjs`：通过（新文件 ≤1500、遗留文件未增长）。
- 类型检查：`apps/desktop` / `apps/web` / `apps/cli` 三处 `tsc --noEmit` 均 exit 0（共享类型新增导出无命名冲突）。
- 桌面全量单测两轮：
  - 第一轮 `task-plan/v064-bgexport-full.log`：`31 failed | 358 passed (389)`、`107 failed | 3296 passed | 1 skipped (3404)`。
  - 第二轮 `task-plan/v064-bgexport-full2.log`：`30 failed | 359 passed (389)`、`107 failed | 3296 passed | 1 skipped (3404)`。
  - 基线 `task-plan/v063-full2.log`：`30 failed | 356 passed (386)`、`106 failed | 3266 passed (3373)`。
  - 第二轮失败**文件集合**与基线逐文件一致（`comm` 差集为空）；两轮各多出的 1 条失败用例经单独复跑均通过，定性为负载敏感偶发，已登记 `spec/issues/active/ISS-20261012-001-desktop-suite-load-sensitive-tests.md`。本轮改动不含 `packages/core`，与该路径无因果关系。
- 未做：Electron 实机点击导出并解压核对 zip。若要该层证据，需起 `pnpm electron:dev` 走一次真实导出。

## 偏差与遗留
- 稳定文档 `spec/knowledge/structure/data-layout-v0.5.5-zh.md` §4.1（`assets/images/`、`manifest.json`/`README.txt`）与 §10 决策 4（AI 配置/设置默认不导出）本已与实现分叉；本轮后 zip 的 `images/` 也不再等于磁盘目录内容。未静默择一，留待独立 change 收敛。
- `videos/` 仍为整目录拷贝，未被引用的视频依然进包；与本轮媒体口径同类，未扩大改动面。
- 更换桌面背景时旧文件仍不清理（`main/ipc/image.ipc.ts` 无单文件删除通道，仅 `IMAGE_CLEAR` 清目录）。磁盘死数据未消除，只是不再进备份。
