# Implementation

## Status

In progress.

## Goal

把 PromptHub 的顶层信息架构从 `Prompt / Skill` 双模式切换，升级为可持续扩展的“最左侧一级功能栏 + 第二列模块导航 + 主内容区”应用壳。

## Current Decision

- 采用最左侧一级功能栏结构
- 不照抄对方视觉，仅借鉴导航层级
- Prompt / Skill / Rules / Agent / MCP 作为未来并列一级模块
- Skill 下保留 `Projects` 等二级导航
- 本轮只新增一个真实模块：`Rules`

## Planned Phases

### Phase 1

- 引入新的全局一级功能栏
- 先迁移 Prompt / Skill / Rules 到新壳下
- Settings 继续保留稳定入口

## Shipped In This Iteration

- `ui.store.ts`
  - 引入 `appModule`，用于表达一级功能栏当前模块
  - 保留 `viewMode` 兼容 Prompt / Skill 既有逻辑
- `Sidebar.tsx`
  - 将原来的 Prompt / Skill 顶部切换改为最左侧一级功能栏
  - 一级功能栏当前接入：`Prompt`、`Skill`、`Rules`
  - `Settings` 固定保留在最左栏底部
  - 右侧模块栏继续承载 Prompt / Skill 原有二级导航
  - 新增 `Rules` 模块侧栏
  - `Rules` 左侧结构后续调整为“全局规则 / 项目规则”两组，移除低价值的“已识别/未识别”提示
  - 项目规则后续支持手动添加目录，并以虚线卡片作为空态和新增入口
- `MainContent.tsx`
  - 新增 `RulesManager` 分流入口
- `rules.ipc.ts` / `preload/api/rules.ts`
  - 新增已知规则文件的白名单读取与保存能力
  - 增加规则 AI 改写与本地版本快照链路
  - `claude` / `opencode` 规则文件路径改为从 Skills 平台配置推导，避免平台路径重复维护
- `RulesManager.tsx` / `rules.store.ts`
  - 提供按平台聚焦的规则工作区、文本编辑、保存、打开位置能力
  - 增加 AI 改写输入区与版本快照展示
  - `Rules` 平台名称与图标复用 Skills 平台元数据；`workspace` 继续保留工作区文件夹语义图标
- 平台路径模型
  - Skills / Rules / Config 的平台路径模型改为“平台根目录中心”，由共享平台元数据派生 `skillsRelativePath`、`globalRuleFile`、`configFiles`
  - 设置页从“每个平台 skills 目录”迁移为“每个平台根目录 + 派生路径预览”
  - desktop renderer/store、main settings IPC、self-hosted sync、web settings/sync/import-export schema 已统一接受 `customPlatformRootPaths`
  - 保留 `customSkillPlatformPaths` 作为兼容输入；desktop main 读取旧值时会自动按平台 `skillsRelativePath` 折算回 root，避免出现 `.../skills/skills`
- `TopBar.tsx`
  - `rules` 模式下搜索框改为只读提示态，不再误写 Prompt / Skill 搜索状态
  - 新增固定的侧栏显隐按钮，不再依赖中缝悬浮把手
- `App.tsx`
  - 壳层重构为 `一级 rail + 顶部横条 + 下方二级菜单与主内容`
  - 顶部横条现在包住下方的二级菜单与主内容区域
- `Sidebar.tsx`
  - 新增 `layout` 变体，支持单独渲染一级 rail 或二级 panel
  - 收起时只保留一级 rail，二级菜单整体隐藏，主内容区真正扩展
- 测试
  - 新增 `top-bar.test.tsx` 的 `rules` 回归用例
  - 新增 `rules-manager.test.tsx` 与 `rules.store.test.ts`
  - 壳层组件测试覆盖顶部按钮切换与收起态仅保留一级 rail
  - 本轮补齐 `Rules` 平台菜单、检测状态、当前规则工作区的断言
  - 补充 `skill-installer-utils.test.ts` 对 root 优先、legacy skills 路径回折 root 的断言
  - 补充 self-hosted sync / web settings / web sync / import-export 测试，覆盖 `customPlatformRootPaths` 的上传、下载和 round-trip
- 第一版受管规则文件：
  - 工作区 `AGENTS.md`
  - `~/.claude/CLAUDE.md`
  - `~/.codex/AGENTS.md`
  - `~/.gemini/GEMINI.md`
  - `~/.config/opencode/AGENTS.md`
  - `~/.codeium/windsurf/memories/global_rules.md`
- `Rules` 平台白名单改为共享平台注册表驱动：
  - 新增 `packages/shared/constants/rules.ts` 统一声明已知规则文件、平台顺序、平台名称/图标/描述
  - `packages/shared/types/rules.ts` 的 `RulePlatformId` / `RuleFileId` 改为从注册表常量派生
  - `apps/desktop/src/main/ipc/rules.ipc.ts` 改为从注册表生成 descriptor，避免继续硬编码平台分支
  - `apps/desktop/src/renderer/stores/rules.store.ts` 改为从平台注册表生成 Rules 二级菜单

## Verification

- `pnpm --filter @prompthub/desktop typecheck`
- `pnpm --filter @prompthub/web typecheck`
- `pnpm --filter @prompthub/desktop lint`
- `pnpm --filter @prompthub/web lint`
- `pnpm --filter @prompthub/desktop test -- --run tests/unit/components/skill-settings.test.tsx tests/unit/main/skill-installer-utils.test.ts tests/unit/services/self-hosted-sync.test.ts tests/unit/components/rules-manager.test.tsx tests/unit/stores/rules.store.test.ts`
- `pnpm --filter @prompthub/web test -- src/routes/settings.test.ts src/routes/sync.test.ts src/routes/import-export.test.ts`

### Phase 2

- 重构全局导航状态
- 建立模块顺序 / 显隐可配置能力

### Phase 3

- 接入 Agent 与 MCP 模块壳
- 再逐步接入真实业务页面
