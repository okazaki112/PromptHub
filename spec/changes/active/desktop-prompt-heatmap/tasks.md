# Tasks: Prompt Heatmap
## Phase A store/sidebar/container
- [x] ViewMode + VIEW_MODES add heatmap
- [x] openHeatmap controller + sidebar nav Flame + active state
- [x] PromptViewContainers lazy heatmap branch

## Phase B pure helpers
- [x] `prompt-heatmap-types.ts`
- [x] `prompt-heatmap-data.test.ts`: 6 passed
- [x] `prompt-heatmap-scale.test.ts`: 5 passed (GitHub scale)
- [x] `prompt-heatmap-selection.test.ts`: 5 passed
- [x] implement data/scale/selection

## Phase C integration + i18n
- [x] PromptHeatmapView + overlay/cell/header/selection panel (3 view tests passed)
- [x] locales 7 keys + legendMore + no BOM; i18n 34 passed
- [x] keyboard roving and aria labels
## Phase D 版本活动真实日期
- [x] shared `PromptVersionActivity` (只读投影) + `version:getActivity` channel/allowlist/handler/preload
- [x] SQLite DB method: v2+ records from `prompt_versions.created_at`, no content fields
- [x] renderer service + Zustand cache `versionActivity` (heatmap force refreshes)
- [x] aggregation `buildPromptHeatmapDays(prompts, versionActivity)`:
  - date event = creation date OR actual v2+ snapshot date (NOT `currentVersion` total)
  - v1 skip (same as creation) and filter to visible prompt ids
- [x] visual/activity/heatStrength fields and current-heat tooltip
- [x] heatmap data/view 15 tests passed; all desktop components 180 files / 1303 tests passed; typecheck 0; eslint apps 0; build 0
- [ ] User runtime confirm (dev/package)

## Phase E 列表点击滚动修复
- [x] root cause: previous `scrollToIndex({align:"start"})` + selected target dep made every click/selection snap target row to list top
- [x] virtual range visibility check; selected visible => no scroll
- [x] out-of-viewport target => `align:"auto"` nearest-edge scroll
- [x] hook behavior 4 tests passed
- [ ] package/shared/db no independent ESLint config; desktop lint only (accepted)
- [x] docs/implementation + report synced

## Follow-ups (not v1)
- global date filter, 12M rolling, export PNG/CSV, usage events table.
