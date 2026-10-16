import clsx from "clsx";
import type { PromptHeatmapCell as HeatmapCellData } from "./prompt-heatmap-types";
import type { PromptHeatmapMetric } from "./prompt-heatmap-types";
import {
  HEAT_CREATED_LEVEL_CLASSES,
  HEAT_USAGE_BAR_CLASSES,
  HEAT_USAGE_LEVEL_CLASSES,
  type PromptHeatmapCreatedLevel,
  type PromptHeatmapUsageLevel,
} from "./prompt-heatmap-scale";

interface PromptHeatmapCellProps {
  cell: HeatmapCellData;
  createdLevel: PromptHeatmapCreatedLevel;
  isAnimated: boolean;
  usageLevel: PromptHeatmapUsageLevel;
  metric: PromptHeatmapMetric;
  isSelected: boolean;
  isFocused: boolean;
  tabIndex: number;
  ariaLabel: string;
  onSelect: (dateKey: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  onHover: (dateKey: string | null) => void;
  onFocus: (dateKey: string) => void;
}

function cellFillClasses(
  metric: PromptHeatmapMetric,
  createdLevel: PromptHeatmapCreatedLevel,
  usageLevel: PromptHeatmapUsageLevel,
): string {
  if (metric === "usage") {
    return HEAT_USAGE_LEVEL_CLASSES[usageLevel] ?? HEAT_USAGE_LEVEL_CLASSES[0];
  }
  return HEAT_CREATED_LEVEL_CLASSES[createdLevel] ?? HEAT_CREATED_LEVEL_CLASSES[0];
}

export function PromptHeatmapCell({
  cell,
  createdLevel,
  isAnimated,
  usageLevel,
  metric,
  isSelected,
  isFocused,
  tabIndex,
  ariaLabel,
  onSelect,
  onHover,
  onFocus,
}: PromptHeatmapCellProps) {
  if (!cell.inCurrentYear) {
    return <span aria-hidden="true" className="h-3 w-3 shrink-0" />;
  }
  if (cell.isFuture) {
    return (
      <button
        type="button"
        role="gridcell"
        tabIndex={-1}
        aria-label={ariaLabel}
        disabled
        className="h-3 w-3 shrink-0 rounded-[2px]"
        data-heatmap-cell="true"
      />
    );
  }

  return (
    <button
      type="button"
      role="gridcell"
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      aria-selected={isSelected}
      aria-current={cell.isToday ? "date" : undefined}
      data-date-key={cell.dateKey}
      data-heatmap-cell="true"
      onMouseEnter={() => onHover(cell.dateKey)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onFocus(cell.dateKey)}
      onClick={(event) => onSelect(cell.dateKey, event)}
      className={clsx(
        "relative h-3 w-3 shrink-0 rounded-[2px] outline-none transition-[box-shadow]",
        isAnimated
          ? "motion-safe:duration-100 hover:brightness-110"
          : "motion-reduce:brightness-100",
        cellFillClasses(metric, createdLevel, usageLevel),
        cell.isToday
          ? "outline outline-1 -outline-offset-1 outline-white/70 dark:outline-black/50"
          : "",
        "cursor-pointer",
        isSelected &&
          "outline outline-2 -outline-offset-2 outline-[#0969da] dark:outline-[#58a6ff]",
        isFocused && "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0969da]",
      )}
    >
      {metric === "combined" && usageLevel > 0 ? (
        <span
          aria-hidden="true"
          className={clsx(
            "pointer-events-none absolute bottom-0 left-0 h-[2px] rounded-full bg-[#176422] dark:bg-[#39d353]",
            HEAT_USAGE_BAR_CLASSES[usageLevel],
          )}
        />
      ) : null}
    </button>
  );
}
