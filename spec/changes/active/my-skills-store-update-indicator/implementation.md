# Implementation

## Shipped

- 新增 `apps/desktop/src/renderer/components/skill/store-remote-sync.ts`，把远端商店目录加载、缓存和自动同步逻辑抽成共享 hook。
- `SkillStore` 改为复用共享 hook，并继续保持只预加载当前选中远端源的行为，避免无关远端源在首次打开时被全部拉取。
- `SkillManager` 在“我的 Skills”视图接入共享 hook，基于 `remoteStoreEntries` 为商店安装 Skill 计算 `skillsWithStoreUpdates`。
- 更新提示仅对带 `registry_slug` 的 Skill 生效；本地导入/手工创建 Skill 不显示提示。
- `SkillListView` 和 `SkillGalleryCard` 增加轻量 `Update available` 呼吸灯提示，保持列表与画廊视图一致。
- 更新版本判定统一为优先使用 `installed_version`，缺失时回退到 `version`，与现有商店更新语义对齐。
- 修复了实现过程引入的 `SkillManager` hook 顺序回归，并补强相关测试 mock。
- 收紧 `skill-installer` 的默认平台扫描测试，使其默认目录覆盖到临时目录，避免全量测试时扫描真实家目录导致偶发超时。

## Verification

- `pnpm --filter @prompthub/desktop test -- --run tests/unit/components/skill-i18n-smoke.test.tsx`
- `pnpm --filter @prompthub/desktop test -- --run tests/unit/components/skill-store-remote.test.tsx`
- `pnpm --filter @prompthub/desktop test -- --run tests/integration/components/skill-manager-large-dataset.integration.test.tsx`
- `pnpm --filter @prompthub/desktop lint`
- `pnpm --filter @prompthub/desktop typecheck`
- `pnpm --filter @prompthub/desktop build`
- `pnpm --filter @prompthub/desktop test -- --run`
