import type { Prompt, PromptVersionActivity } from "@prompthub/shared/types";
import type {
  PromptHeatmapCell,
  PromptHeatmapDay,
  PromptHeatmapTopPrompt,
  PromptHeatmapWeek,
  PromptHeatmapYearSummary,
} from "./prompt-heatmap-types";

const DAY_IN_MS = 86_400_000;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function localDateKeyFromDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function localDateKeyFromIso(iso: string, fallback?: string): string | null {
  const parsed = new Date(iso);
  if (!Number.isNaN(parsed.getTime())) {
    return localDateKeyFromDate(parsed);
  }
  if (!fallback) {
    return null;
  }
  const fallbackDate = new Date(fallback);
  return Number.isNaN(fallbackDate.getTime()) ? null : localDateKeyFromDate(fallbackDate);
}

export function dateKeyYear(dateKey: string): number {
  const year = Number(dateKey.slice(0, 4));
  return Number.isFinite(year) ? year : 0;
}

export function buildAvailableYearDateKeys(year: number): string[] {
  const first = new Date(year, 0, 1);
  const current = new Date(year, 11, 31);
  const keys: string[] = [];
  for (
    let cursor = new Date(first.getTime());
    cursor <= current;
    cursor = new Date(cursor.getTime() + DAY_IN_MS)
  ) {
    keys.push(localDateKeyFromDate(cursor));
  }
  return keys;
}

function comparePromptByUsageThenTitle(left: Prompt, right: Prompt): number {
  const usageDifference = (right.usageCount ?? 0) - (left.usageCount ?? 0);
  return usageDifference !== 0
    ? usageDifference
    : left.title.localeCompare(right.title);
}

function buildTopPrompts(prompts: readonly Prompt[]): PromptHeatmapTopPrompt[] {
  return prompts
    .slice()
    .sort(comparePromptByUsageThenTitle)
    .slice(0, 2)
    .map((prompt) => ({
      id: prompt.id,
      title: prompt.title,
      usageCount: prompt.usageCount ?? 0,
    }));
}

export function buildPromptHeatmapDays(
  prompts: readonly Prompt[],
  versionActivity: readonly PromptVersionActivity[] = [],
): Map<string, PromptHeatmapDay> {
  type MutableDay = {
    prompts: Prompt[];
    createdCount: number;
    currentUsageHeat: number;
    versionActivityCount: number;
  };
  const days = new Map<string, MutableDay>();
  const visiblePromptIds = new Set(prompts.map((prompt) => prompt.id));
  const ensureDay = (dateKey: string): MutableDay => {
    const existing = days.get(dateKey);
    if (existing) {
      return existing;
    }
    const created: MutableDay = {
      prompts: [],
      createdCount: 0,
      currentUsageHeat: 0,
      versionActivityCount: 0,
    };
    days.set(dateKey, created);
    return created;
  };

  for (const prompt of prompts) {
    const dateKey = localDateKeyFromIso(prompt.createdAt, prompt.updatedAt);
    if (!dateKey) {
      continue;
    }
    const entry = ensureDay(dateKey);
    entry.prompts.push(prompt);
    entry.createdCount += 1;
    entry.currentUsageHeat += prompt.usageCount ?? 0;
  }

  for (const activity of versionActivity) {
    if (activity.version <= 1 || !visiblePromptIds.has(activity.promptId)) {
      continue;
    }
    const activityDateKey = localDateKeyFromIso(activity.createdAt);
    if (!activityDateKey) {
      continue;
    }
    ensureDay(activityDateKey).versionActivityCount += 1;
  }

  const result = new Map<string, PromptHeatmapDay>();
  for (const [dateKey, entry] of days) {
    const orderedPrompts = entry.prompts
      .slice()
      .sort(comparePromptByUsageThenTitle);
    result.set(dateKey, {
      dateKey,
      createdCount: entry.createdCount,
      currentUsageHeat: entry.currentUsageHeat,
      versionActivityCount: entry.versionActivityCount,
      activityCount: entry.createdCount + entry.versionActivityCount,
      heatStrength: entry.currentUsageHeat + entry.versionActivityCount,
      topPrompts: buildTopPrompts(orderedPrompts),
      prompts: orderedPrompts,
    });
  }
  return result;
}

export function summarizePromptHeatmapYear(
  days: Map<string, PromptHeatmapDay>,
  year: number,
): PromptHeatmapYearSummary {
  let totalCreated = 0;
  let totalUsageHeat = 0;
  let totalActivity = 0;
  let activeDayCount = 0;
  let maxCreatedCount = 0;
  let maxUsageHeat = 0;
  let maxActivityCount = 0;
  let maxHeatStrength = 0;
  const prefix = `${year}-`;
  for (const day of days.values()) {
    if (!day.dateKey.startsWith(prefix)) {
      continue;
    }
    totalCreated += day.createdCount;
    totalUsageHeat += day.currentUsageHeat;
    totalActivity += day.activityCount;
    activeDayCount += day.activityCount > 0 ? 1 : 0;
    maxCreatedCount = Math.max(maxCreatedCount, day.createdCount);
    maxUsageHeat = Math.max(maxUsageHeat, day.currentUsageHeat);
    maxActivityCount = Math.max(maxActivityCount, day.activityCount);
    maxHeatStrength = Math.max(maxHeatStrength, day.heatStrength);
  }
  return {
    year,
    totalCreated,
    totalUsageHeat,
    totalActivity,
    activeDayCount,
    maxCreatedCount,
    maxUsageHeat,
    maxActivityCount,
    maxHeatStrength,
  };
}

export function getAvailableHeatmapYears(days: Iterable<string>): number[] {
  const years = new Set<number>();
  for (const dateKey of days) {
    const year = dateKeyYear(dateKey);
    if (year > 0) {
      years.add(year);
    }
  }
  return [...years].sort((left, right) => right - left);
}

export function buildPromptHeatmapYearWeeks(
  year: number,
  days: Map<string, PromptHeatmapDay>,
  todayDateKey: string,
): PromptHeatmapWeek[] {
  const firstDay = new Date(year, 0, 1);
  const firstWeekOffset = (firstDay.getDay() + 6) % 7;
  let weekStart = new Date(firstDay.getTime() - firstWeekOffset * DAY_IN_MS);
  const lastDay = new Date(year, 11, 31);
  const weeks: PromptHeatmapWeek[] = [];

  while (weekStart.getTime() <= lastDay.getTime()) {
    const cells: PromptHeatmapCell[] = [];
    let seenMonthThisWeek: number | null = null;

    for (let row = 0; row < 7; row += 1) {
      const cellDate = new Date(weekStart.getTime() + row * DAY_IN_MS);
      const dateKey = localDateKeyFromDate(cellDate);
      const inCurrentYear = cellDate.getFullYear() === year;
      const day = inCurrentYear ? days.get(dateKey) : undefined;
      cells.push({
        type: inCurrentYear ? "day" : "blank",
        dateKey,
        month: cellDate.getMonth(),
        dayOfMonth: cellDate.getDate(),
        inCurrentYear,
        isFuture: !inCurrentYear || dateKey > todayDateKey,
        isToday: inCurrentYear && dateKey === todayDateKey,
        day,
      });
      if (
        inCurrentYear &&
        cellDate.getDate() === 1 &&
        (seenMonthThisWeek === null || cellDate.getMonth() < seenMonthThisWeek)
      ) {
        seenMonthThisWeek = cellDate.getMonth();
      }
    }

    weeks.push({ column: weeks.length, monthLabel: seenMonthThisWeek, cells });
    weekStart = new Date(weekStart.getTime() + 7 * DAY_IN_MS);
  }

  return weeks;
}

export function getSelectedPromptsByDate(
  days: Map<string, PromptHeatmapDay>,
  selectedDateKeys: Set<string>,
): Prompt[] {
  const selected: Prompt[] = [];
  for (const day of days.values()) {
    if (selectedDateKeys.has(day.dateKey)) {
      selected.push(...day.prompts);
    }
  }
  return selected.sort(comparePromptByUsageThenTitle);
}

export function summarizeSelectedHeatmapDays(
  days: Map<string, PromptHeatmapDay>,
  selectedDateKeys: Set<string>,
): { selectedDayCount: number; totalCreated: number; totalUsageHeat: number } {
  let selectedDayCount = 0;
  let totalCreated = 0;
  let totalUsageHeat = 0;
  for (const dateKey of selectedDateKeys) {
    const entry = days.get(dateKey);
    if (!entry) {
      continue;
    }
    selectedDayCount += 1;
    totalCreated += entry.createdCount;
    totalUsageHeat += entry.currentUsageHeat;
  }
  return { selectedDayCount, totalCreated, totalUsageHeat };
}

export function compareDateKeys(left: string, right: string): number {
  return left.localeCompare(right);
}
