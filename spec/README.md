# PromptHub Spec System

`spec/` 是 PromptHub 内部 SSD / spec 系统的唯一归属。所有内部需求、稳定领域文档、delta specs、架构约束、稳定逻辑、固定资产、问题追踪、历史变更与模板都放在这里；`docs/` 只保留对外说明文档。

## 为什么参考 OpenSpec

PromptHub 这套结构明确对齐 OpenSpec 的几个核心能力：

- **stable domains**：长期稳定的当前行为放在 `spec/domains/`
- **delta specs**：正在进行的变更放在 `spec/changes/active/<change-key>/specs/<domain>/spec.md`
- **changes archive**：完成或终止的变更进入 `spec/changes/archive/`
- **iterative workflow**：按 `proposal -> spec -> design -> tasks -> implementation -> sync -> archive` 迭代推进，而不是把需求只留在聊天记录或 PR diff 里

选择这套结构的原因很直接：PromptHub 同时有 desktop、web、skills、数据布局、同步与发布流程，内部知识如果只散落在 `docs/` 或 issue 里，很快就会失去稳定真相源，也不利于后续变更做 delta 对照。

## 比上一版更完整在哪里

这次的小写 `spec/` 方案，不只是把旧内部文档从 `docs/` 挪过来，而是把缺失的 OpenSpec 核心层级补齐了：

- 补齐了稳定领域层：`spec/domains/`
- 补齐了稳定逻辑层：`spec/logic/`
- 补齐了固定资产层：`spec/assets/`
- 补齐了更多稳定领域：`system`、`desktop`、`web`、`skills`、`sync`、`data-recovery`、`release`、`prompt-workspace`
- 补齐了增量层：`spec/changes/active/<change-key>/specs/<domain>/spec.md`
- 补齐了架构层：`spec/architecture/`
- 补齐了问题层：`spec/issues/active/`
- 补齐了历史层：`spec/changes/archive/` 与 `spec/changes/legacy/`
- 补齐了工作流模板：`spec/changes/_templates/`
- 把关键历史主题整理成了更标准的 archive change 目录，而不只是平铺 legacy 文件
- 从 `HEAD` 恢复了先前已删的内部文档原文，避免内容丢失

## 目录地图

```text
spec/
├── README.md
├── domains/
│   ├── system/spec.md
│   ├── desktop/spec.md
│   ├── sync/spec.md
│   ├── data-recovery/spec.md
│   ├── release/spec.md
│   ├── prompt-workspace/spec.md
│   ├── web/spec.md
│   └── skills/spec.md
├── architecture/
├── logic/
├── assets/
├── issues/
│   ├── README.md
│   ├── active/
│   └── archive/
├── changes/
│   ├── _templates/
│   ├── active/
│   ├── archive/
│   └── legacy/
```

## 目录职责

- `spec/domains/`：当前系统行为的稳定 source of truth，按领域组织
- `spec/architecture/`：长期有效的内部架构约束、设计事实与工程规则
- `spec/logic/`：长期稳定、需要反复查阅的业务逻辑语义与推导规则
- `spec/assets/`：平台矩阵、canonical 文件约定、资源清单等固定资产
- `spec/issues/active/`：尚未收敛为具体实现变更的问题、质量风险、当前 open issue 快照
- `spec/issues/archive/`：已关闭 issue 与历史问题记录归档
- `spec/changes/active/`：正在实施的提案、delta specs、设计、任务与实施记录
- `spec/changes/archive/`：已完成或已放弃的变更归档
- `spec/changes/legacy/`：历史平铺内部文档保留区；内容已从旧 `docs/` 原文恢复
- `spec/changes/_templates/`：新变更目录的模板

## 工作流

建议的内部 SSD 闭环：

`requirements -> proposal -> spec -> design -> tasks -> implementation -> sync -> archive`

执行约束：

- 非 trivial 的功能、迁移、重构、跨模块 bug 修复，先建 `spec/changes/active/<change-key>/`
- 行为变化先写 delta spec，再实施代码
- 实施完成后，把稳定结果同步回 `spec/domains/`、`spec/logic/`、`spec/assets/` 或 `spec/architecture/`
- 历史旧文档不删除；若不再作为当前真相源，则归入 `spec/changes/legacy/` 或 `spec/changes/archive/`

## 当前稳定入口

- 系统总规范：`spec/domains/system/spec.md`
- 桌面端边界：`spec/domains/desktop/spec.md`
- Web 自部署与服务边界：`spec/domains/web/spec.md`
- Skill 体系规范：`spec/domains/skills/spec.md`
- 同步语义：`spec/domains/sync/spec.md`
- 数据恢复与迁移安全：`spec/domains/data-recovery/spec.md`
- 发布与文档同步：`spec/domains/release/spec.md`
- Prompt 工作区：`spec/domains/prompt-workspace/spec.md`
- Agent 平台固定资产：`spec/assets/agent-platforms.md`
- Rules 稳定逻辑：`spec/logic/rules-workspace.md`
- Issue 跟踪入口：`spec/issues/README.md`
- 当前这次恢复工作：`spec/changes/active/restore-spec-lowercase/`

## 内容恢复说明

以下内部文档已从 `HEAD` 原文恢复，而不是以“已迁移请看 git 历史”占位：

- 原 `docs/architecture/*` -> `spec/architecture/*`
- 原 `docs/08-TODO/*` -> `spec/changes/legacy/docs-08-todo/*`
- 原 `docs/09-问题追踪/active/*` -> `spec/issues/active/*`
