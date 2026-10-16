import clsx from "clsx";
import type { TFunction } from "i18next";
import type {
  PromptHeatmapDay,
  PromptHeatmapMetric,
} from "./prompt-heatmap-types";

interface PromptHeatmapTooltipProps {
  dateLabel?: string;
  day: PromptHeatmapDay | undefined;
  isAnimated: boolean;
  metric: PromptHeatmapMetric;
  t: TFunction;
}

export function PromptHeatmapTooltip({
  dateLabel = "",
  day,
  isAnimated,
  metric,
  t,
}: PromptHeatmapTooltipProps) {
  if (!day) {
    return null;
  }

  const averageUsage =
    day.createdCount > 0
      ? Math.round(day.currentUsageHeat / day.createdCount)
      : 0;

  return (
    <aside
      data-testid="prompt-heatmap-tooltip"
      className={clsx(
        "pointer-events-none absolute left-3 top-3 z-10 w-72 rounded-xl p-3 text-left shadow-lg ring-1 ring-border backdrop-blur-sm app-wallpaper-surface",
        isAnimated &&
          "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-150",
      )}
    >
      <strong className="mb-1 block text-xs font-semibold text-foreground">
        {dateLabel}
      </strong>
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">
          {t("prompt.heatmap.tooltip.created", "New:")}
        </span>{" "}
        {t("prompt.heatmap.tooltip.createdValue", {
          count: day.createdCount,
          defaultValue: "{{count}}",
        })}
      </p>
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">
          {t("prompt.heatmap.tooltip.heat", "Current usage heat:")}
        </span>{" "}
        {t("prompt.heatmap.tooltip.heatValue", {
          count: day.currentUsageHeat,
          defaultValue: "{{count}}",
        })}
      </p>
      {metric !== "created" ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            {t("prompt.heatmap.tooltip.average", "Average per prompt:")}
          </span>{" "}
          {t("prompt.heatmap.tooltip.averageValue", {
            count: averageUsage,
            defaultValue: "{{count}}",
          })}
        </p>
      ) : null}
      {day.topPrompts.length > 0 ? (
        <p className="mt-2 whitespace-pre-line text-xs font-medium leading-5 text-muted-foreground">
          {`${t("prompt.heatmap.tooltip.top", "Most used: ")}\n${day.topPrompts
            .map((prompt) => `${prompt.title} · ${prompt.usageCount}`)
            .join("\n")}`}
        </p>
      ) : null}
    </aside>
  );
}
