# Implementation: Prompt Heatmap

## Shipped
- New `heatmap` ViewMode and sidebar “使用热度” entry (`FlameIcon`).
- Full workspace calendar for visible prompts grouped by local creation date.
- Metrics:
  - Combined: fill = number created that day; bottom translucent bar is that day's cohort current usage total.
  - New prompts only.
  - Current usage heat only (GitHub-green intensity).
- Year navigation and select. Empty day cells are present but gray; future cells are invisible.
- Selection:
  - normal click selects one.
  - ctrl/cmd toggle multiple.
  - shift range based on current-year selectable date keys.
  - chips, clear, Esc; local panel lists matching visible prompts, click selects, double-click detail.
- Visual: GitHub contribution palette and geometry (`#ebedf0/#9be9a8/#40c463/#216e39` light, GitHub dark greens for dark; 12px cells, 3px gaps, 2px radii). Hover/selected outlines blue; no scale-jump. Select control transparent, arrow icon added.
- Accessibility: roving tabindex keyboard Home/End/arrows; localized date/count aria labels; aria-selected.
- Data source uses existing current filters in `sortedPrompts`; no store/date filter and no DB event table.

## Files
- `prompt.store.ts`: ViewMode + valid enum.
- sidebar nav/controller and view container.
- components: prompt-heatmap types/data/scale/selection, cell/header/tooltip/selection panel/main view.
- i18n all 7 locales (`nav.heat map`, `prompt.heatmap...`)

## Verification
- prompt-heatmap suite: 19 tests passed
- all unit/components: 180 files / 1300 tests passed
- typecheck and desktop build passed.
- eslint passed.
- Runtime visual confirmation remains on user's Windows package.

## Compatibility
- Pure renderer/view-local. `usage_count` semantics unchanged. No migration or IPC contract change.
- Downgrade safety: unknown `heatmap` persisted mode is guarded by existing `isViewMode` validation and falls back.
