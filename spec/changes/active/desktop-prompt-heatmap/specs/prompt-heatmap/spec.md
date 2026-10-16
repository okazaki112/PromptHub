# Spec Delta: prompt-heatmap

## FR-H1 ViewMode
Prompt store should include `heatmap` mode and sidebar provide entry. Persistence validates it.
### ACs
- H1-1 sidebar item opens full heatmap and clears relationship graph/folder selection like graph entry.
- H1-2 `isViewMode("heatmap")===true`, persisted invalid values still fall back.
### TESTS
- prompt store type/isViewMode test (if existing helper)
- PromptViewContainers branch renders heatmap only in mode

## FR-H2 Date heat aggregation
Given current filtered prompts by `createdAt` local day (invalid fallback updatedAt), produce day data for year grid.
### ACs
- createdCount counts prompts.
- usageHeat sums current usageCount, does not imply events in that day.
- no prompts in filtered set → empty state.
- invalid date skipped.

## FR-H3 Scales
### ACs
- value0=level0
- normalized log robust level0-5
- max0 returns level0 for nonpositive.
- heat classes static list.

## FR-H4 Selection
### ACs
- click single select/replace/deselect
- ctrl/meta toggle
- shift selects range from anchor over sorted date keys
- selected panel filters day prompts and sorts by usage desc/title asc, limit50
- clear resets selected/anchor.
- filtered-away dates don't error.

## FR-H5 Visual/a11y/i18n
- metric segmented controls combined/created/usage with i18n in7
- tooltip date/count/heat/top2
- year navigation previous/next/available years only when data.
- reduced motion no animation.
