# Design: Prompt Heatmap

## Modules (responsibility split)
- `prompt-heatmap-types.ts` shared view-local types
- `prompt-heatmap-data.ts` pure date aggregation + top/summary + year grid
- `prompt-heatmap-scale.ts` pure heat level mapping and static class lists
- `prompt-heatmap-selection.ts` pure click selection state transitions (normal/ctrl/shift/range)
- `PromptHeatmapView.tsx` composition + local state + card selection actions
- `PromptViewContainers.tsx` lazy heatmap branch
- `prompt.store.ts` ViewMode include `heatmap`
- sidebar `openHeatmap` + nav Flame; active `heatmap && currentPage home`
- all 7 locales

## Data source
`PromptViewContainers` gets `sortedPrompts` (current filtered list) and passes to heatmap only.
Do not create store filter state.

## Date rules
Use user's local calendar day via `createdAt`, fallback `updatedAt` when invalid.
`dateKey = YYYY-MM-DD` local.

## Aggregations
day:
- createdCount
- currentUsageHeat = sum usageCount
- topPrompts max2
year:
- created total
- heat total
- active day count

## Heat scale
log-normalized robust levels to avoid one hot day washing out year:
created levels 0-5
usage bars 0-4
static Tailwind classes no inline heat color.

## Selection
local Set<string>.
Rules:
- click = replace single / deselect if already only selected
- ctrl/meta toggle
- shift range from anchor, union/replace current? v1 replace range to target while anchor remains.
- chips and clear.
Panel prompts sorted usage desc title asc, limit 50 display.

## Accessibility
role grid, buttons, roving focus/tabindex container arrows +/-1 +/-7.
aria-label date + created/heat. Tooltip via state. Respect motion preference: reduced = no animation.

## Compatibility
Unknown `heatmap` persisted before upgrade: `isViewMode` includes it. Downgrade unknown falls safe default via existing persistence guard.

## Tests
pure data/scale/selection + PromptHeatmapView component + container/store + i18n.
