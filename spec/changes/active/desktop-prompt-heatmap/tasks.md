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

## Verification
- [x] `vitest tests/unit/components/prompt-heatmap-* --run`: 19 passed
- [x] `tests/unit/components --reporter=dot`: 180 files / 1300 tests passed
- [x] `typecheck`: 0
- [x] eslint touched files
- [x] desktop build: 0
- [ ] User runtime visual pass (dev/package)
- [x] update implementation + doc/v0.6.5

## Follow-ups (not v1)
- global date filter, 12M rolling, export PNG/CSV, usage events table.
