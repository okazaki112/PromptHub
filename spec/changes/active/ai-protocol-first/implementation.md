# Implementation

## Status

- Implemented and verified in code.

## Executed Work

- 创建 `ai-protocol-first` active change，明确协议优先改造边界。
- 已确认当前问题调用链：
  `AISettingsPrototype / ai-workbench` -> `settings.store` / `ai-defaults` -> `renderer/services/ai.ts` -> `main/services/ai-client.ts`（Safety Scan）-> 报错点在按 provider / host 猜协议时把 `Anthropic` 错误拼成 `/v1/chat/completions`。
- 新增共享 `AIProtocol` 类型，并把 `AIModelConfig`、legacy root AI config、`AIConfig`、`SafetyScanAIConfig`、规则重写请求配置都接入 `apiProtocol`。
- `settings.store` persist 版本升级到 `8`，为旧版 root AI 配置和 `aiModels` 自动推断并迁移 `apiProtocol`。
- snapshot / backup / WebDAV / database 兼容结构已写入 `aiApiProtocol`，保留旧数据恢复兼容性。
- 当前生效的 AI workbench 已支持显式协议选择：模型表单、端点编辑弹窗、端点分组和展示 badge 都会反映 `OpenAI` / `Gemini` / `Anthropic`。
- `custom` provider 文案已改为“自定义”，不再暗示仅支持 OpenAI 兼容。
- renderer transport 已按 `apiProtocol` 分支处理：
  - `openai` -> `POST /v1/chat/completions` / `GET /v1/models`
  - `gemini` -> `POST /v1beta/openai/chat/completions` / `GET /v1beta/models`
  - `anthropic` -> `POST /v1/messages` / `GET /v1/models`
- main process `ai-client.ts` 已同步按协议分支，确保 Safety Scan 和 rules rewrite 与 renderer 行为一致。
- `Anthropic` 本次明确限制为非流式聊天：
  - UI 中禁用流式开关
  - renderer/main transport 在 `anthropic` 协议下强制 `stream = false`
- 已补充并更新协议相关单测断言，覆盖新的 `apiProtocol` 字段传递与 Gemini/Anthropic transport 行为。
- 已修复 AI workbench 协议文案 key 误落在 `skill.*` locale 分组的问题，当前协议下拉与端点卡片改为稳定使用 `settings.protocol*` 翻译。
- 已把 AI workbench provider 分组从混合语言硬编码改为内部 key（`overseas` / `domestic` / `other`），在表单下拉中统一走 `settings.*` 翻译；模型列表里的 `Other` 分类兜底也改为展示层翻译，避免英文界面残留 `International / 国际`、`Other / 其他`。

## Verification

- 已运行：
- `pnpm lint`
- `pnpm build`
- `pnpm test -- apps/desktop/tests/unit/services/ai-transport.test.ts --run`
- `pnpm test -- apps/desktop/tests/unit/services/ai-url-preview.test.ts --run`
- `pnpm test -- apps/desktop/tests/unit/services/ai-defaults.test.ts --run`
- `pnpm test -- apps/desktop/tests/unit/services/settings-snapshot.test.ts --run`
- `pnpm test -- apps/desktop/tests/unit/components/ai-settings-prototype.test.tsx --run`

- 构建仍保留既有 Vite warning：
- `EditPromptModal.tsx` 同时动态/静态导入
- `database-backup.ts` 同时动态/静态导入

## Follow-ups

- 若后续需要 Claude 原生流式体验，补充 `Anthropic` SSE 事件解析并解除 UI 限制。
- 稳定 specs / architecture / docs 仍需在该 change 收尾时同步。
