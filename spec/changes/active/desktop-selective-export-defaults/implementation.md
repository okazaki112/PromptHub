# Implementation: desktop-selective-export-defaults

## 实际落地
- `apps/desktop/src/renderer/components/settings/data-settings/useBackupExportActions.ts`：`DEFAULT_EXPORT_SCOPE.versions` `false → true`（1 行，唯一默认值来源）。
- `apps/desktop/tests/unit/components/data-settings-backup-sync.test.tsx`：新增用例 `selects version history by default in the selective export checklist`，断言真实渲染面板中「版本历史」按钮 `aria-pressed="true"`，并点击「导出」后断言 `downloadSelectiveExport` 收到 `versions: true`（FR-SEXP-001 / FR-SEXP-002）。
- 未新增 i18n 键、未改 IPC/preload 契约、未改存储布局，因此无迁移与回滚成本。

## 备份含背景图的结论（对用户问题的交付）
根因是两套收集口径不一致，而非偶发缺陷：

| 口径 | 实现 | 结果 |
| ---- | ---- | ---- |
| JSON 内媒体 | `database-backup.ts:147-209` `collectImages()` 只遍历 `prompt.images` 引用 | 本次备份 `payload.images` 为空 |
| ZIP 内 `images/` | `main/index.ts:1158-1160` `collectDirFiles(getImagesDir(), "images/")` 无过滤递归 | 整目录拷贝，含桌面背景 |

背景图落盘位置与 Prompt 图片同目录：`AppearanceSettings.tsx:285-312` → `IMAGE_SAVE`（`image.ipc.ts:359-394`）以 uuid 名写入 `getImagesDir()`（`runtime-paths.ts:180-185` = `data/assets/images`），settings 只存文件名。所以勾选「媒体」必然带走背景图。

实测取证（`doc/prompthub-export-2026-10-11.zip`）：

| 顶层 | 文件数 | 字节 | 说明 |
| ---- | ------ | ---- | ---- |
| `images/` | 3 | 8,619,926 | 占包体绝大部分 |
| `versions/` | 361 | 643,085 | |
| `prompts/` | 104 | 228,774 | |
| `rules/` | 22 | 44,380 | |
| 根（3 个 json） | 3 | 1,020,831 | `import-with-prompthub.json` / `settings.json` / `ai-config.json` |

- `settings.json` 中 `backgroundImageFileName = 05c87b6a-0de2-4669-a163-eea107c56dbf.png`，与 `images/` 内同名文件一致 ⇒ 当前背景确在包内。
- 本机 `%APPDATA%/PromptHub/data/assets/images` 实盘只有这 3 个文件，与 zip 逐一对应 ⇒ 证实「整目录拷贝」。
- 其中 `96abfc4a-...png`(4.9MB) 与 `453df50b-...jpg`(215KB) 未被任何 Prompt 引用、也不是当前背景 ⇒ 历史背景残留。更换背景只替换引用，旧文件不删除（`image.ipc.ts` 无单文件删除通道，仅 `IMAGE_CLEAR` 清目录），因此每次备份都会带上死数据。

## 偏差与记录
- 稳定文档 `spec/knowledge/structure/data-layout-v0.5.5-zh.md` §4.1 规定 zip 布局为 `assets/images/` + `manifest.json`/`README.txt`，实现为顶层 `images/` + `import-with-prompthub.json`；§10 决策 4 规定「AI 配置/设置默认不导出」，实现默认 `true`。本轮不改代码、不改文档结论，只在 design.md 记录偏差，留待独立 change 收敛（实现与文档分歧不得静默择一）。
- 验证替代说明：zip 实际写出发生在主进程 `main/index.ts` 的 `data:exportZip` 处理器内（未导出、无测试挂载点），因此 FR-SEXP-002 的持久层证据由「渲染层传给 IPC 的 scope」+ 用户实包解压对照提供；主进程目录打包口径缺少回归网，已记为后续补测项。

## 验证
- `npx vitest run tests/unit/components/data-settings-backup-sync.test.tsx`：9/9 通过；改动前先红灯（`aria-pressed="false"`）。
- 备份导出相关 7 个测试文件（`data-settings-backup-sync` / `backup-guidance-card` / `backup-drop-restore-layer` / `backup-orchestrator` / `database-backup` / `database-backup-format` / `database-backup-filesystem.integration`）：64/64 通过。
- `npx eslint <两个变更文件> --max-warnings 0`：exit 0。
- `npx tsc --noEmit`（apps/desktop）：exit 0。
- 桌面全量单测：`Test Files 30 failed | 358 passed (388)`，`Tests 106 failed | 3285 passed | 1 skipped (3392)`。与基线 `task-plan/v063-full2.log`（`30 failed | 356 passed (386)`，`106 failed | 3266 passed`）失败文件数与失败用例数完全一致，通过数按新增用例增加 ⇒ 零新增回归。基线失败全部集中在 `tests/unit/main/*`，主因是本机无创建符号链接权限（`EPERM: operation not permitted, symlink`，基线日志内 80 次），与本轮渲染进程改动无关。
- 未做：Electron 实机点击验证（本次改动为单行默认值，可见状态已由组件渲染层用例覆盖）。
