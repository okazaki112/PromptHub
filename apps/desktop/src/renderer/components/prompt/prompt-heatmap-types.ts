import type { Prompt } from "@prompthub/shared/types";

/** View-local heatmap types. These are not persistence contracts. */

export type PromptHeatmapMetric = "combined" | "created" | "usage";

export interface PromptHeatmapDay {
  dateKey: string;
  createdCount: number;
  currentUsageHeat: number;
  topPrompts: PromptHeatmapTopPrompt[];
  prompts: Prompt[];
}

export interface PromptHeatmapTopPrompt {
  id: string;
  title: string;
  usageCount: number;
}

export interface PromptHeatmapYearSummary {
  year: number;
  totalCreated: number;
  totalUsageHeat: number;
  activeDayCount: number;
  maxCreatedCount: number;
  maxUsageHeat: number;
}

export interface PromptHeatmapCell {
  type: "day" | "blank";
  dateKey: string;
  month: number;
  dayOfMonth: number;
  inCurrentYear: boolean;
  isFuture: boolean;
  isToday: boolean;
  day?: PromptHeatmapDay;
}

export interface PromptHeatmapWeek {
  column: number;
  monthLabel: number | null;
  cells: PromptHeatmapCell[];
}

export interface PromptHeatmapSelection {
  selectedDateKeys: Set<string>;
  anchorDateKey: string | null;
}
