/**
 * Pure, static visual encodings for heatmap cells. Colors follow GitHub's
 * contribution calendar, in dark/light token-neutral classes so renderer stays
 * free of scattered inline styles.
 */

export type PromptHeatmapCreatedLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type PromptHeatmapUsageLevel = 0 | 1 | 2 | 3 | 4;

/** GitHub-light: #ebedf0, #9be9a8, #40c463, #30a14e, #216e39. Dark: #161b22... */
export const HEAT_CREATED_LEVEL_CLASSES: readonly string[] = [
  "bg-[#ebedf0] border border-black/[.06] dark:border-white/[.06] dark:bg-[#161b22]",
  "bg-[#9be9a8] border border-black/[.06] dark:border-white/[.06] dark:bg-[#0e4429]",
  "bg-[#40c463] border border-black/[.06] dark:border-white/[.06] dark:bg-[#006d32]",
  "bg-[#216e39] border border-black/[.06] dark:border-white/[.06] dark:bg-[#006d32]",
  "bg-[#176422] border border-black/[.04] dark:border-white/[.04] dark:bg-[#26a641]",
  "bg-[#155d1f] border border-black/[.04] dark:border-white/[.04] dark:bg-[#39d353]",
];

export const HEAT_USAGE_LEVEL_CLASSES: readonly string[] = [
  "bg-[#ebedf0] border border-black/[.06] dark:border-white/[.06] dark:bg-[#161b22]",
  "bg-[#9be9a8] border border-black/[.06] dark:border-white/[.06] dark:bg-[#0e4429]",
  "bg-[#40c463] border border-black/[.06] dark:border-white/[.06] dark:bg-[#006d32]",
  "bg-[#216e39] border border-black/[.06] dark:border-white/[.06] dark:bg-[#006d32]",
  "bg-[#176422] border border-black/[.04] dark:border-white/[.04] dark:bg-[#26a641]",
  "bg-[#155d1f] border border-black/[.04] dark:border-white/[.04] dark:bg-[#39d353]",
];

export const HEAT_USAGE_BAR_CLASSES: readonly string[] = [
  "",
  "w-1/4",
  "w-2/4",
  "w-3/4",
  "w-full",
];

function normalizeHeat(value: number, maxValue: number): number {
  if (value <= 0 || maxValue <= 0) {
    return 0;
  }
  if (maxValue <= 1) {
    return value > 0 ? 1 : 0;
  }
  const ratio = Math.log1p(value) / Math.log1p(maxValue);
  return Math.max(0, Math.min(1, ratio));
}

function levelFromRatio(ratio: number, thresholds: readonly number[]): number {
  const bucket = thresholds.filter((threshold) => ratio >= threshold).length;
  return Math.min(bucket, thresholds.length);
}

export function getCreatedHeatLevel(
  value: number,
  maxValue = value,
): PromptHeatmapCreatedLevel {
  const ratio = normalizeHeat(value, maxValue);
  if (ratio === 0 || value <= 0) {
    return 0;
  }
  return Math.min(
    5,
    1 + levelFromRatio(ratio, [0.18, 0.38, 0.58, 0.8]),
  ) as PromptHeatmapCreatedLevel;
}

export function getUsageHeatLevel(
  value: number,
  maxValue = value,
): PromptHeatmapCreatedLevel {
  const ratio = normalizeHeat(value, maxValue);
  if (ratio === 0 || value <= 0) {
    return 0;
  }
  return Math.min(
    5,
    1 + levelFromRatio(ratio, [0.18, 0.38, 0.58, 0.8]),
  ) as PromptHeatmapCreatedLevel;
}

export function getUsageBarLevel(
  value: number,
  maxValue = value,
): PromptHeatmapUsageLevel {
  const ratio = normalizeHeat(value, maxValue);
  if (ratio === 0 || value <= 0) {
    return 0;
  }
  return Math.min(
    4,
    levelFromRatio(ratio, [0.3, 0.6, 0.85]) + 1,
  ) as PromptHeatmapUsageLevel;
}
