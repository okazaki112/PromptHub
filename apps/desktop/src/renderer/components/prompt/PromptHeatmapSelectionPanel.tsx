import type { TFunction } from "i18next";
import { XIcon } from "lucide-react";
import type { Prompt } from "@prompthub/shared/types";
import clsx from "clsx";

interface PromptHeatmapSelectionPanelProps {
  activePrompt?: Prompt | null;
  activePromptId?: string | null;
  localDateLabel: (dateKey: string) => string;
  promptDateLabel?: (prompt: Prompt) => string;
  t: TFunction;
  selectedDateKeys: string[];
  selectedSummary: {
    selectedDayCount: number;
    totalCreated: number;
    totalUsageHeat: number;
  };
  selectedPrompts: Prompt[];
  displayLimit: number;
  onSelectPrompt: (promptId: string) => void;
  onViewDetail: (prompt: Prompt) => void;
  onRemoveDate: (dateKey: string) => void;
  onClearSelection: () => void;
}

export function PromptHeatmapSelectionPanel({
  activePrompt,
  activePromptId,
  localDateLabel,
  promptDateLabel,
  t,
  selectedDateKeys,
  selectedSummary,
  selectedPrompts,
  displayLimit,
  onSelectPrompt,
  onViewDetail,
  onRemoveDate,
  onClearSelection,
}: PromptHeatmapSelectionPanelProps) {
  if (selectedDateKeys.length === 0) {
    return (
      <p
        className="mb-1 text-xs text-muted-foreground"
        data-testid="prompt-heatmap-selection-panel"
      >
        {t(
          "prompt.heatmap.selection.empty",
          "Click a day to inspect that date's newly created prompts.",
        )}
      </p>
    );
  }

  const shown = selectedPrompts.slice(0, displayLimit);

  return (
    <section
      data-testid="prompt-heatmap-selection-panel"
      aria-labelledby="prompt-heatmap-selected-heading"
      className="rounded-xl app-wallpaper-surface p-2 ring-1 ring-border"
    >
      <div className="flex flex-wrap items-start gap-2 border-b border-border pb-2">
        <h3 id="prompt-heatmap-selected-heading" className="mb-1 text-xs font-semibold">
          {t("prompt.heatmap.selection.title", "Selected days")}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t("prompt.heatmap.selection.summary", {
            dayCount: selectedSummary.selectedDayCount,
            created: selectedSummary.totalCreated,
            usage: selectedSummary.totalUsageHeat,
            defaultValue:
              "{{dayCount}} days · {{created}} new · {{usage}} current heat",
          })}
        </p>
        {selectedDateKeys.length > 0 ? (
          <button
            type="button"
            onClick={onClearSelection}
            className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <XIcon aria-hidden="true" className="w-3 h-3" />
            {t("prompt.heatmap.selection.clear", "Clear")}
          </button>
        ) : null}
      </div>

      <ul className="mt-1 flex flex-wrap gap-1" aria-label={t("prompt.heatmap.selection.chips", "Selected dates")}>
        {selectedDateKeys.map((dateKey) => (
          <li key={dateKey}>
            <button
              type="button"
              onClick={() => onRemoveDate(dateKey)}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs hover:bg-accent"
            >
              <span className="truncate max-w-24">{localDateLabel(dateKey)}</span>
              <XIcon aria-hidden="true" className="h-3 w-3 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>

      {shown.length === 0 ? (
        <p className="py-3 text-xs text-muted-foreground">
          {t(
            "prompt.heatmap.selection.promptsEmpty",
            "No visible prompts on the selected days.",
          )}
        </p>
      ) : (
        <ul className="mt-2 space-y-1">
          {shown.map((prompt) => (
            <li key={prompt.id}>
              <button
                type="button"
                aria-pressed={
                  activePromptId === prompt.id ||
                  activePrompt?.id === prompt.id
                }
                title={t(
                  "prompt.heatmap.selection.rowHint",
                  "Click to select · double-click to open details",
                )}
                onClick={() => onSelectPrompt(prompt.id)}
                onDoubleClick={() => onViewDetail(prompt)}
                className={clsx(
                  "flex w-full items-center justify-between gap-2 rounded-lg p-2 text-left text-xs transition-colors hover:bg-accent",
                  activePromptId === prompt.id ||
                    activePrompt?.id === prompt.id
                    ? "bg-primary/8 ring-1 ring-primary/30"
                    : "bg-transparent",
                )}
              >
                <span className="min-w-0 flex-1 truncate font-medium">
                  {prompt.title}
                </span>
                <span className="text-muted-foreground">
                  {promptDateLabel ? promptDateLabel(prompt) : localDateLabel(prompt.createdAt.slice(0, 10))}
                </span>
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {t("prompt.heatmap.selection.usage", {
                    count: prompt.usageCount ?? 0,
                    defaultValue: "{{count}} uses",
                  })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedPrompts.length > displayLimit ? (
        <p className="mt-1 text-right text-[11px] text-muted-foreground">
          {t("prompt.heatmap.selection.showing", {
            visible: displayLimit,
            total: selectedPrompts.length,
            defaultValue: "Showing {{visible}} of {{total}}",
          })}
        </p>
      ) : null}
    </section>
  );
}
