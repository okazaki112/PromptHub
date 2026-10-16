import type { PromptHeatmapSelection } from "./prompt-heatmap-types";

export interface HeatmapSelectionModifiers {
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
}

export function createEmptyHeatmapSelection(): PromptHeatmapSelection {
  return { selectedDateKeys: new Set<string>(), anchorDateKey: null };
}

export function isDateKeySelected(selection: PromptHeatmapSelection, dateKey: string): boolean {
  return selection.selectedDateKeys.has(dateKey);
}

function getSortedRangeKeys(
  allDateKeys: string[],
  left: string,
  right: string,
): string[] {
  const available = new Set(allDateKeys);
  const indicesLeft = allDateKeys.indexOf(left);
  const indicesRight = allDateKeys.indexOf(right);
  if (indicesLeft < 0 || indicesRight < 0) {
    return [];
  }
  const start = Math.min(indicesLeft, indicesRight);
  const end = Math.max(indicesLeft, indicesRight);
  return allDateKeys.slice(start, end + 1).filter((key) => available.has(key));
}

export function chooseHeatmapDate(
  selection: PromptHeatmapSelection,
  dateKey: string,
  modifiers: HeatmapSelectionModifiers,
  yearDateKeys: string[],
): PromptHeatmapSelection {
  if (dateKey.length === 0) {
    return selection;
  }

  if (modifiers.shiftKey && selection.anchorDateKey) {
    const range = getSortedRangeKeys(yearDateKeys, selection.anchorDateKey, dateKey);
    return {
      selectedDateKeys: new Set<string>(range.length > 0 ? range : [dateKey]),
      anchorDateKey: selection.anchorDateKey,
    };
  }

  const selected = new Set(selection.selectedDateKeys);
  if (modifiers.ctrlKey || modifiers.metaKey) {
    if (selected.has(dateKey)) {
      selected.delete(dateKey);
    } else {
      selected.add(dateKey);
    }
    return { selectedDateKeys: selected, anchorDateKey: dateKey };
  }

  const onlyThisDateSelected = selected.size === 1 && selected.has(dateKey);
  return onlyThisDateSelected
    ? { selectedDateKeys: new Set<string>(), anchorDateKey: dateKey }
    : { selectedDateKeys: new Set<string>([dateKey]), anchorDateKey: dateKey };
}

export function clearHeatmapSelection(): PromptHeatmapSelection {
  return createEmptyHeatmapSelection();
}
