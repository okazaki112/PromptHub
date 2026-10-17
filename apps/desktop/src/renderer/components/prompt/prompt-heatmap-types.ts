import type { Prompt, PromptVersionActivity } from "@prompthub/shared/types";

/** View-local heatmap types. These are not persistence contracts. */

export type PromptHeatmapMetric = "combined" | "created" | "usage";

export interface PromptHeatmapDay {
  dateKey: string;
  createdCount: number;
  currentUsageHeat: number;
  /** Actual v2+ version events dated this calendar day, not the prompt's total version. */
  versionActivityCount: number;
  /** Creation events plus real version edits dated this day. */
  activityCount: number;
  /** Usage cohort plus version events, used by the heat visual without changing raw usage semantics. */
  heatStrength: number;
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
  totalActivity: number;
  activeDayCount: number;
  maxCreatedCount: number;
  maxUsageHeat: number;
  maxActivityCount: number;
  maxHeatStrength: number;
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
