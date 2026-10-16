import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Prompt } from "@prompthub/shared/types";
import type { TFunction } from "i18next";
import { useSettingsStore } from "../../stores/settings.store";
import { PromptHeatmapHeader } from "./PromptHeatmapHeader";
import { PromptHeatmapCell } from "./PromptHeatmapCell";
import { PromptHeatmapTooltip } from "./PromptHeatmapTooltip";
import { PromptHeatmapSelectionPanel } from "./PromptHeatmapSelectionPanel";
import {
  buildAvailableYearDateKeys,
  buildPromptHeatmapDays,
  buildPromptHeatmapYearWeeks,
  getAvailableHeatmapYears,
  getSelectedPromptsByDate,
  localDateKeyFromDate,
  localDateKeyFromIso,
  summarizePromptHeatmapYear,
  summarizeSelectedHeatmapDays,
} from "./prompt-heatmap-data";
import { chooseHeatmapDate } from "./prompt-heatmap-selection";
import {
  getCreatedHeatLevel,
  getUsageBarLevel,
  getUsageHeatLevel,
  HEAT_CREATED_LEVEL_CLASSES,
  type PromptHeatmapCreatedLevel,
  type PromptHeatmapUsageLevel,
} from "./prompt-heatmap-scale";
import type {
  PromptHeatmapCell as HeatmapCellData,
  PromptHeatmapMetric,
} from "./prompt-heatmap-types";

interface PromptHeatmapViewProps {
  prompts: Prompt[];
  selectedPromptId: string | null;
  onSelectPrompt: (promptId: string) => void;
  onViewDetail: (prompt: Prompt) => void;
}

interface HeatmapVisuals {
  created: PromptHeatmapCreatedLevel;
  bar: PromptHeatmapUsageLevel;
  heat: PromptHeatmapCreatedLevel;
}

const DISPLAY_LIMIT = 50;

function parseDateKey(dateKey: string): Date | null {
  const parsed = new Date(`${dateKey}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function PromptHeatmapView({
  prompts,
  selectedPromptId,
  onSelectPrompt,
  onViewDetail,
}: PromptHeatmapViewProps) {
  const { t, i18n } = useTranslation();
  const settingsMotion = useSettingsStore((state) => state.motionPreference);
  const animationEnabled = settingsMotion === "standard";

  const todayDateKey = useMemo(() => localDateKeyFromDate(new Date()), []);
  const currentYear = parseDateKey(todayDateKey)?.getFullYear() ?? new Date().getFullYear();
  const days = useMemo(() => buildPromptHeatmapDays(prompts), [prompts]);
  const dataYears = useMemo(
    () => (days.size === 0 ? [] : getAvailableHeatmapYears(days.keys())),
    [days],
  );

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [metric, setMetric] = useState<PromptHeatmapMetric>("combined");
  const [selectedDateKeys, setSelectedDateKeys] = useState<Set<string>>(() => new Set());
  const [anchorDateKey, setAnchorDateKey] = useState<string | null>(null);
  const [hoveredDateKey, setHoveredDateKey] = useState<string | null>(null);
  const [focusedDateKey, setFocusedDateKey] = useState<string | null>(null);
  const gridElement = useRef<HTMLDivElement>(null);
  const pendingFocusDate = useRef<string | null>(null);

  useEffect(() => {
    if (dataYears.length > 0 && !dataYears.includes(selectedYear)) {
      setSelectedYear(dataYears[0]);
    }
  }, [dataYears, selectedYear]);

  useEffect(() => {
    setSelectedDateKeys(new Set());
    setAnchorDateKey(null);
    setFocusedDateKey(null);
    setHoveredDateKey(null);
  }, [selectedYear]);

  const selectableDateKeys = useMemo(
    () => buildAvailableYearDateKeys(selectedYear).filter((key) => key <= todayDateKey),
    [selectedYear, todayDateKey],
  );
  const yearSummary = useMemo(
    () => summarizePromptHeatmapYear(days, selectedYear),
    [days, selectedYear],
  );
  const yearWeeks = useMemo(
    () => buildPromptHeatmapYearWeeks(selectedYear, days, todayDateKey),
    [days, selectedYear, todayDateKey],
  );
  const visuals = useMemo(() => {
    const result = new Map<string, HeatmapVisuals>();
    for (const [dateKey, day] of days) {
      result.set(dateKey, {
        created: getCreatedHeatLevel(day.createdCount, yearSummary.maxCreatedCount),
        bar: getUsageBarLevel(day.currentUsageHeat, yearSummary.maxUsageHeat),
        heat: getUsageHeatLevel(day.currentUsageHeat, yearSummary.maxUsageHeat),
      });
    }
    return result;
  }, [days, yearSummary.maxCreatedCount, yearSummary.maxUsageHeat]);

  const selectedKeys = useMemo(
    () => [...selectedDateKeys].sort(),
    [selectedDateKeys],
  );
  const selectedPromptList = useMemo(
    () => getSelectedPromptsByDate(days, selectedDateKeys),
    [days, selectedDateKeys],
  );
  const selectedSummary = useMemo(
    () => summarizeSelectedHeatmapDays(days, selectedDateKeys),
    [days, selectedDateKeys],
  );

  const dateFormatter = useMemo(
    () => safeDateFormatter(i18n.language, undefined),
    [i18n.language],
  );

  function localDateLabel(dateKey: string): string {
    const parsed = parseDateKey(dateKey);
    return parsed ? dateFormatter.format(parsed) : dateKey;
  }

  function promptDateLabel(prompt: Prompt): string {
    const key = localDateKeyFromIso(prompt.createdAt, prompt.updatedAt);
    return key ? localDateLabel(key) : prompt.createdAt;
  }

  const monthFormatter = useMemo(
    () => ({ locale: i18n.language, formatter: safeDateFormatter(i18n.language, { month: "short" }) }),
    [i18n.language],
  );

  function formatWeekMonth(month: number): string {
    return monthFormatter.formatter.format(new Date(selectedYear, month, 1));
  }

  function clearSelection() {
    setSelectedDateKeys(new Set());
    setAnchorDateKey(null);
  }

  function onCellSelect(
    dateKey: string,
    event: { ctrlKey:boolean; metaKey:boolean; shiftKey:boolean },
  ) {
    const next = chooseHeatmapDate(
      { selectedDateKeys, anchorDateKey },
      dateKey,
      event,
      selectableDateKeys,
    );
    setSelectedDateKeys(next.selectedDateKeys);
    setAnchorDateKey(next.anchorDateKey);
    setFocusedDateKey(dateKey);
    pendingFocusDate.current = dateKey;
  }

  function removeDate(dateKey: string) {
    const next = new Set(selectedDateKeys);
    next.delete(dateKey);
    setSelectedDateKeys(next);
    if (anchorDateKey === dateKey) {
      setAnchorDateKey(null);
    }
  }

  function moveFocusDate(offset: number) {
    if (selectableDateKeys.length === 0) {
      return;
    }
    const current = focusedDateKey
      ? selectableDateKeys.indexOf(focusedDateKey)
      : selectableDateKeys.length - 1;
    const target = current < 0 ? selectableDateKeys.length - 1 : (current + offset);
    const nextDateKey =
      selectableDateKeys[
        Math.max(0, Math.min(selectableDateKeys.length -1, target))
      ] ?? null;
    pendingFocusDate.current = nextDateKey;
    setFocusedDateKey(nextDateKey);
  }

  function changeSelectedYear(offset: number) {
    const candidates = dataYears.filter((candidate) =>
      offset < 0 ? candidate < selectedYear : candidate > selectedYear,
    );
    if (offset < 0) {
      setSelectedYear(Math.max(...candidates, selectedYear));
    } else {
      setSelectedYear(Math.min(...candidates, selectedYear));
    }
  }

  useEffect(() => {
    const pending = pendingFocusDate.current;
    if (!pending) {
      return;
    }
    pendingFocusDate.current = null;
    gridElement.current
      ?.querySelector<HTMLButtonElement>(`[data-date-key="${pending}"]`)
      ?.focus({ preventScroll: true });
  }, [focusedDateKey]);

  function cellAria(cell: HeatmapCellData): string {
    const date = localDateLabel(cell.dateKey);
    if (!cell.inCurrentYear || cell.isFuture) {
      return `${date}, ${t("prompt.heatmap.aria.unavailable", "unavailable")}`;
    }
    if (!cell.day) {
      return `${date}, ${t("prompt.heatmap.aria.noCreation", "no new prompts")}`;
    }
    return `${date}, ${t("prompt.heatmap.aria.count", "{{created}} created, {{heat}} heat", {
      created: cell.day.createdCount,
      heat: cell.day.currentUsageHeat,
    })}`;
  }

  const activeDateKey = hoveredDateKey ?? focusedDateKey ?? null;

  return (
    <section
      aria-labelledby="prompt-heatmap-heading"
      data-testid="prompt-heatmap"
      className="absolute inset-0 flex min-h-0 flex-col overflow-hidden bg-card text-foreground"
    >
      <h2 id="prompt-heatmap-heading" className="sr-only">
        {t("prompt.heatmap.title", "Usage heatmap")}
      </h2>
      <PromptHeatmapHeader
        availableYears={dataYears}
        metric={metric}
        year={selectedYear}
        t={t}
        onMetricChange={setMetric}
        onPreviousYear={() => changeSelectedYear(-1)}
        onNextYear={() => changeSelectedYear(1)}
        onYearChange={setSelectedYear}
      />

      {prompts.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
          <p className="max-w-md text-center">
            {t(
              "prompt.heatmap.empty.noData",
              "No prompts to visualize. Create prompts to see new and currently used cohorts here.",
            )}
          </p>
        </div>
      ) : (
        <main className="flex-1 space-y-3 overflow-auto p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <SummaryBadge
              label={t("prompt.heatmap.summary.new", "New")}
              value={yearSummary.totalCreated}
            />
            <SummaryBadge
              label={t("prompt.heatmap.summary.heat", "Usage heat")}
              value={yearSummary.totalUsageHeat}
            />
            <SummaryBadge
              label={t("prompt.heatmap.summary.activeDays", "Active days")}
              value={yearSummary.activeDayCount}
            />
            <p className="ml-auto text-muted-foreground">
              {t(
                "prompt.heatmap.summary.cohort",
                "Heat is cohort current usage, not per-day activity count.",
              )}
            </p>
          </div>

          <div
            ref={gridElement}
            role="grid"
            tabIndex={0}
            aria-roledescription="calendar"
            aria-label={t("prompt.heatmap.grid", "Prompt creation calendar")}
            className="relative overflow-x-auto rounded-xl border border-black/[.08] p-3 app-wallpaper-panel dark:border-white/[.08]"
            onMouseLeave={() => setHoveredDateKey(null)}
            onKeyDown={(event) => {
              switch (event.key) {
                case "ArrowRight":
                  event.preventDefault();
                  moveFocusDate(1);
                  break;
                case "ArrowLeft":
                  event.preventDefault();
                  moveFocusDate(-1);
                  break;
                case "ArrowDown":
                  event.preventDefault();
                  moveFocusDate(7);
                  break;
                case "ArrowUp":
                  event.preventDefault();
                  moveFocusDate(-7);
                  break;
                case "Home":
                  event.preventDefault();
                  pendingFocusDate.current = selectableDateKeys[0] ?? null;
                  setFocusedDateKey(selectableDateKeys[0] ?? null);
                  break;
                case "End":
                  event.preventDefault();
                  pendingFocusDate.current =
                    selectableDateKeys.at(-1) ?? null;
                  setFocusedDateKey(selectableDateKeys.at(-1) ?? null);
                  break;
                case "Escape":
                  clearSelection();
                  break;
              }
            }}
          >
            <div className="flex gap-[3px]">
              {yearWeeks.map((week) => (
                <div key={week.column} className="flex flex-col gap-[3px]">
                  <span className="h-[12px] overflow-hidden leading-[12px] text-[9px] text-muted-foreground">
                    {week.monthLabel === null
                      ? ""
                      : formatWeekMonth(week.monthLabel)}
                  </span>
                  {week.cells.map((cell) => {
                    const visual = visuals.get(cell.dateKey);
                    return (
                      <PromptHeatmapCell
                        ariaLabel={cellAria(cell)}
                        cell={cell}
                        createdLevel={
                          metric === "usage"
                            ? (visual?.heat ?? 0)
                            : (visual?.created ?? 0)
                        }
                        isAnimated={animationEnabled}
                        isSelected={selectedDateKeys.has(cell.dateKey)}
                        isFocused={focusedDateKey === cell.dateKey}
                        key={cell.dateKey}
                        tabIndex={focusedDateKey === cell.dateKey ? 0 : -1}
                        metric={metric}
                        usageLevel={visual?.bar ?? 0}
                        onHover={setHoveredDateKey}
                        onFocus={setFocusedDateKey}
                        onSelect={onCellSelect}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            <PromptHeatmapTooltip
              dateLabel={activeDateKey ? localDateLabel(activeDateKey) : ""}
              day={activeDateKey ? days.get(activeDateKey) : undefined}
              isAnimated={animationEnabled}
              metric={metric}
              t={t}
            />

            <Legend className="mt-2" t={t} />
          </div>

          <PromptHeatmapSelectionPanel
            activePrompt={
              selectedPromptId
                ? prompts.find((prompt) => prompt.id === selectedPromptId) ?? null
                : null
            }
            activePromptId={selectedPromptId}
            displayLimit={DISPLAY_LIMIT}
            localDateLabel={localDateLabel}
            promptDateLabel={promptDateLabel}
            onClearSelection={clearSelection}
            onSelectPrompt={onSelectPrompt}
            onViewDetail={onViewDetail}
            onRemoveDate={removeDate}
            selectedDateKeys={selectedKeys}
            selectedPrompts={selectedPromptList}
            selectedSummary={selectedSummary}
            t={t}
          />
        </main>
      )}
    </section>
  );
}

function SummaryBadge({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-black/[.06] bg-white/60 px-2 py-1 text-xs dark:border-white/[.08] dark:bg-white/[.04]">
      <span className="font-medium text-foreground">{label}</span>
      <span className="tabular-nums text-muted-foreground">{value}</span>
    </span>
  );
}

function Legend({ className, t }: { className?: string; t: TFunction }) {
  return (
    <div
      className={`${className ?? ""} flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground`}
      aria-label={t("prompt.heatmap.legend", "Legend")}
    >
      <span className="font-medium text-foreground">
        {t("prompt.heatmap.legendCreated", "Created")}
      </span>
      {HEAT_CREATED_LEVEL_CLASSES.slice(1).map((cls) => (
        <span
          key={cls}
          aria-hidden="true"
          className={`${cls} h-2.5 w-2.5 rounded-[2px]`}
        />
      ))}
      <span className="text-muted-foreground">
        {t("prompt.heatmap.legendMore", "More")}
      </span>

      <span className="ml-3 font-medium text-foreground">
        {t("prompt.heatmap.legendHeat", "Current heat")}
      </span>
      {[
        "bg-[#9be9a8] dark:bg-[#0e4429]",
        "bg-[#40c463] dark:bg-[#006d32]",
        "bg-[#216e39] dark:bg-[#26a641]",
      ].map((color) => (
        <span
          key={color}
          aria-hidden="true"
          className={`h-[2px] w-3 rounded-full ${color}`}
        />
      ))}
    </div>
  );
}

function safeDateFormatter(
  language: string,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat(language || undefined, options);
  } catch {
    return new Intl.DateTimeFormat(undefined, options);
  }
}
