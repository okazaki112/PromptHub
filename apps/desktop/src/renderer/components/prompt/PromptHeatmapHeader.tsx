import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FlameIcon,
} from "lucide-react";
import type { TFunction } from "i18next";
import clsx from "clsx";
import type { PromptHeatmapMetric } from "./prompt-heatmap-types";

interface PromptHeatmapHeaderProps {
  availableYears: number[];
  metric: PromptHeatmapMetric;
  t: TFunction;
  year: number;
  onMetricChange: (metric: PromptHeatmapMetric) => void;
  onNextYear: () => void;
  onPreviousYear: () => void;
  onYearChange: (year: number) => void;
}

const METRICS: readonly PromptHeatmapMetric[] = ["combined", "created", "usage"];

export function PromptHeatmapHeader({
  availableYears,
  metric,
  onNextYear,
  onMetricChange,
  onPreviousYear,
  onYearChange,
  t,
  year,
}: PromptHeatmapHeaderProps) {
  const visibleYears = [...new Set([...availableYears, year])].sort((a, b) => b - a);
  const hasPrevious = availableYears.some((candidate) => candidate < year);
  const hasNext = availableYears.some((candidate) => candidate > year);
  const labels: Record<PromptHeatmapMetric, string> = {
    combined: t("prompt.heatmap.metric.combined", "Combined"),
    created: t("prompt.heatmap.metric.created", "New prompts"),
    usage: t("prompt.heatmap.metric.usage", "Current usage heat"),
  };

  return (
    <header className="border-b border-border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FlameIcon aria-hidden="true" className="h-4 w-4 text-amber-500" />
          <h2 className="text-base font-semibold leading-6 text-foreground">
            {t("prompt.heatmap.title", "Usage heatmap")}
          </h2>
          <span className="hidden max-w-md truncate text-xs text-muted-foreground md:inline">
            {t(
              "prompt.heatmap.description",
              "Cohort view: a day’s color is prompts created then; its bar is those prompts’ current usage counters.",
            )}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <nav
            aria-label={t("prompt.heatmap.year.navigation", "Year navigation")}
            className="flex items-center rounded-full bg-background/70 p-1 shadow-sm ring-1 ring-border dark:bg-white/[.05]"
          >
            <button
              type="button"
              onClick={onPreviousYear}
              disabled={!hasPrevious}
              aria-label={t("prompt.heatmap.year.previous", "Previous year")}
              className="rounded-full p-1 leading-none text-muted-foreground hover:bg-accent disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronLeftIcon aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
            <div className="relative">
              <select
                value={year}
                aria-label={t("prompt.heatmap.year.select", "Select year")}
                onChange={(event) => onYearChange(Number(event.currentTarget.value))}
                className="mx-0.5 min-w-16 cursor-pointer appearance-none rounded bg-transparent py-1 pl-2 pr-5 text-sm font-semibold tabular-nums text-foreground outline-none motion-safe:focus:ring-2 motion-safe:focus:ring-[#0969da] dark:motion-safe:focus:ring-[#58a6ff]"
              >
                {visibleYears.map((candidate) => (
                  <option key={candidate} value={candidate}>
                    {candidate}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                aria-hidden="true"
                className="pointer-events-none absolute right-0.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
              />
            </div>
            <button
              type="button"
              onClick={onNextYear}
              disabled={!hasNext}
              aria-label={t("prompt.heatmap.year.next", "Next year")}
              className="rounded-full p-1 leading-none text-muted-foreground hover:bg-accent disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronRightIcon aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </nav>

          <div
            className="inline-flex gap-1 rounded-full app-wallpaper-surface p-1 ring-1 ring-border"
            role="group"
            aria-label={t("prompt.heatmap.metric.group", "Heatmap metric")}
          >
            {METRICS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onMetricChange(value)}
                aria-pressed={metric === value}
                title={labels[value]}
                className={clsx(
                  "rounded-full leading-6 px-2.5",
                  metric === value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {labels[value]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
