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

## Version-day enhancement
`currentVersion + createdAt cohort` bump was wrong: it stacks every revision on the original prompt creation date. Use `prompt_versions.created_at` for v2+ snapshots as an actual event day.
- shared DTO/channel `version:getActivity`, preload `getAllActivity`, IPC allowlist and SQL `getAllVersionActivities()` (v>1, minimal prompt/date/version).
- renderer service and prompt-store cache loaded on heatmap mount; filter visible ids, skip v1 (creation is already counted).
- `versionActivityCount`, `activityCount`, `heatStrength`, GitHub visual and tooltip use activity heat.

## List selection scroll fix
Previous selected-target effect used `align:"start"`, so each click moved that row to top. Hook now checks TanStack `range.startIndex/endIndex`: visible target does nothing, out-of-viewport uses `align:"auto"` nearest-edge.

## Verification
- prompt heatmap 21 tests + useVirtualized 4; desktop unit/components 180 files / 1303 tests all passed.
- typecheck and production build 0; apps ESLint 0. Packages/shared/db have no standalone ESLint v9 config, so lint applies desktop.
- runtime visual confirmation remains user-side on packaged/dev app.

## Compatibility
- Pure renderer/view-local. `usage_count` semantics unchanged. No migration or IPC contract change.
- Downgrade safety: unknown `heatmap` persisted mode is guarded by existing `isViewMode` validation and falls back.