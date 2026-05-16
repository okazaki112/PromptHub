# Implementation

## Status

In progress.

项目级 Skill 第一版核心链路已接通，剩余未完成项主要是版本号更新，以及仓库内与本轮改动无关的既有 `typecheck` 问题清理。

## Shipped In This Iteration

- 共享类型与设置持久化
  - 在 `packages/shared/types/skill.ts` 新增 `SkillProject`
  - 在 `packages/shared/types/settings.ts` 增加 `skillProjects`
  - 在 `apps/desktop/src/renderer/stores/settings.store.ts` 增加项目的新增、更新、删除与持久化逻辑
- Skill 视图状态扩展
  - 在 `apps/desktop/src/renderer/stores/skill.store.ts` 增加 `projects` 视图、`selectedProjectId`、`projectScanState`
  - 新增 `selectProject()`、`scanProjectSkills()`、`setProjectScanState()`、`getVisibleProjectScannedSkills()`
- Projects 一级入口与页面接入
  - 在 `apps/desktop/src/renderer/components/layout/Sidebar.tsx` 新增 `Projects` 一级导航入口
  - 在 `apps/desktop/src/renderer/components/skill/SkillManager.tsx` 接入 `SkillProjectsView`
  - 在 `apps/desktop/src/renderer/components/skill/SkillProjectsView.tsx` 实现项目列表、项目内 Skill 卡片列表、导入与分发入口
  - 将 `Projects` 页面结构收敛为“左侧项目卡片 + 右侧项目内 Skill 卡片列表 / 全宽 Skill 详情”两态布局，不再保留中间项目运营信息栏
  - 项目内不再自动默认打开首个 Skill；用户点击某个 Skill 卡片后，右侧整块切换为 `SkillFullDetailPage`
  - 在项目详情返回后恢复到该项目的 Skill 卡片列表，保持项目上下文不丢失
  - 当进入项目内某个 Skill 详情时，整块内容区切为全宽详情页并隐藏项目列表栏，避免项目名、统计、路径、扫描目录等信息继续占据主视线
  - 项目列表态头部进一步减噪，仅保留项目名、Skill 数量与必要操作，不再常驻展示根路径、导入统计、扫描目录清单与打开项目入口
- 顶栏项目模式联动
  - 在 `apps/desktop/src/renderer/components/layout/TopBar.tsx` 中接入项目视图搜索、结果计数与 “Add Project” 主按钮行为
  - 项目模式下隐藏结果上下导航，避免将项目扫描结果误当作库内 Skill 结果导航
- 项目扫描与导入链路
  - 继续复用 `scanLocalPreview(customPaths)` 与 `importScannedSkills()`
  - `importScannedSkills()` 返回 `importedSkills`，并为项目导入 Skill 写入本地路径型 `source_url` 与 `local_repo_path`
  - `scanProjectSkills()` 在扫描失败时保留项目扫描状态并向调用方抛错，避免 UI 将失败误显示为 “扫描到 0 个”
  - `scanProjectSkills()` 现在会自动扩展项目默认技能目录：`rootPath`、`.claude/skills`、`.agents/skills`、`skills`、`.gemini`，而不再只扫描项目根目录或用户手填路径
  - 修复项目 Skill 文件页读取失败：`*ByPath` 本地仓库 API 不再错误要求路径必须位于 PromptHub 自有 `skills` 目录内；项目模式现在以传入的 Skill 根目录为边界，并继续阻止相对路径逃逸根目录
- 搜索与标签语义修正
  - 在 `apps/desktop/src/renderer/services/skill-filter.ts` 新增 `filterVisibleScannedSkills()`，专用于项目扫描结果过滤
  - 在 `apps/desktop/src/renderer/services/skill-stats.ts` 与 `apps/desktop/src/renderer/components/skill/skill-modal-utils.ts` 中，仅将 `http(s)` 型 `source_url` 识别为远程来源，避免本地路径型 `source_url` 污染原始标签/来源判定
- i18n 补齐
  - 为 `en`、`zh`、`zh-TW`、`ja`、`fr`、`de`、`es` 补齐 `Projects` 导航、项目页、顶栏项目搜索所需键

## Verification

- 通过：`pnpm lint`
- 通过：`pnpm --filter @prompthub/desktop exec vitest run tests/unit/components/top-bar.test.tsx tests/unit/components/sidebar.test.tsx tests/unit/components/skill-detail-utils.test.ts tests/unit/components/skill-i18n-smoke.test.tsx tests/unit/stores/skill.store.test.ts`
- 通过：`pnpm --filter @prompthub/desktop exec vitest run tests/unit/components/skill-projects-view.test.tsx tests/unit/components/top-bar.test.tsx tests/unit/components/sidebar.test.tsx tests/unit/components/skill-i18n-smoke.test.tsx`
- 通过：`pnpm --filter @prompthub/desktop build`
- 部分通过但未最终绿灯：`pnpm --filter @prompthub/desktop test:run`
  - 大部分测试已执行通过，但在接近结束时因 Node/Vitest worker OOM 退出，属于仓库级测试资源问题，不是本轮变更的明确功能回归
- 未通过：`pnpm typecheck`
  - 现存仓库问题：`apps/desktop/src/renderer/components/settings/AISettingsPrototype.tsx`
  - 报错与本轮项目级 Skill 改动无直接关联

## Tests Added / Updated

- `apps/desktop/tests/unit/components/sidebar.test.tsx`
  - 覆盖桌面端显示 `Projects` 一级入口
  - 覆盖 Web runtime 隐藏 `Projects`
- `apps/desktop/tests/unit/components/top-bar.test.tsx`
  - 覆盖项目模式搜索 placeholder、结果计数与 “Add Project” 事件触发
- `apps/desktop/tests/unit/stores/skill.store.test.ts`
  - 覆盖 `scanProjectSkills()` 失败时保留扫描状态并抛错
  - 覆盖项目扫描会自动补齐默认技能目录
- `apps/desktop/tests/unit/components/skill-detail-utils.test.ts`
  - 覆盖本地路径型 `source_url` 仍被判定为本地来源
- `apps/desktop/tests/unit/components/skill-i18n-smoke.test.tsx`
  - 补充 `nav.projects`、`header.searchProjectSkills`、`header.resultsCount` 键存在性校验
- `apps/desktop/tests/unit/components/skill-projects-view.test.tsx`
  - 覆盖默认展示项目内 Skill 卡片列表
  - 覆盖点击 Skill 卡片后切换到全宽详情页
  - 覆盖从项目详情返回到项目内 Skill 卡片列表
  - 覆盖进入详情后不再显示项目侧栏与其他 Skill 卡片内容
- `apps/desktop/tests/unit/main/skill-installer.test.ts`
  - 覆盖外部项目 Skill 根目录上的 `list/read/write/create/rename/delete` by-path 文件操作
  - 覆盖外部项目 Skill 根目录仍会拒绝 `../` 相对路径逃逸

## Remaining

- 更新版本号到 `0.5.6`
- 视需要修复仓库内既有 `typecheck` 阻塞：`AISettingsPrototype.tsx`
