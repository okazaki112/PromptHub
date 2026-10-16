import { useMemo } from "react";
import {
  BookOpenIcon,
  FolderIcon,
  Maximize2Icon,
  MinusIcon,
  PlusIcon,
  RotateCcwIcon,
  SparklesIcon,
  StarIcon,
  TrendingUpIcon,
  XIcon,
} from "lucide-react";
import type { TFunction } from "i18next";
import type { PromptGraphNode } from "./prompt-graph-layout";
import {
  FOLDER_PALETTE,
  PROMPT_TYPE_META,
  type GraphColorMode,
} from "./prompt-graph-semantics";

/**
 * Presentational overlays for the v0.6.5 graph: a static-legend chip, a hover
 * detail card, and a filter/focus toolbar. Pure DOM (no canvas), so they are
 * directly testable under jsdom. All user-facing text flows through i18n.
 */

const LEGEND_EDGE_KINDS = [
  { key: "hierarchy", color: "#94a3b8", arrow: false, dash: false },
  { key: "related", color: "#38bdf8", arrow: false, dash: true },
  { key: "variant", color: "#a78bfa", arrow: true, dash: true },
  { key: "depends", color: "#f59e0b", arrow: true, dash: true },
  { key: "next", color: "#10b981", arrow: true, dash: true },
  { key: "suggestion", color: "#9d7bd8", arrow: false, dash: true },
] as const;

export function GraphLegend({
  mode,
  t,
  expanded,
}: {
  mode: GraphColorMode;
  t: TFunction;
  expanded: boolean;
}) {
  if (!expanded) {
    return null;
  }

  return (
    <div className="pointer-events-auto absolute left-4 top-4 z-10 max-w-[16rem] rounded-lg p-3 text-xs shadow-lg backdrop-blur app-wallpaper-surface ring-1">
      <h4 className="mb-2 font-semibold text-foreground">
        {t("prompt.graph.legend.title", "Legend")}
      </h4>
      <ul className="space-y-1.5">
        {LEGEND_EDGE_KINDS.map((edge) => (
          <li key={edge.key} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-0.5 w-5 shrink-0 rounded"
              style={{
                backgroundColor: edge.color,
                backgroundImage: edge.dash
                  ? `repeating-linear-gradient(90deg, ${edge.color} 0 3px, transparent 3px 5px)`
                  : undefined,
              }}
            />
            {edge.arrow && (
              <span
                aria-hidden="true"
                className="-ml-2 text-[10px]"
                style={{ color: edge.color }}
              >
                ▶
              </span>
            )}
            <span className="text-muted-foreground">
              {t(
                `prompt.graph.legend.${edge.key}`,
                edge.key.charAt(0).toUpperCase() + edge.key.slice(1),
              )}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
        <span className="flex items-center gap-1">
          {FOLDER_PALETTE[mode]
            .slice(0, 4)
            .map((color) => (
              <span
                key={color}
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
            ))}
        </span>
        <span className="text-muted-foreground">
          {t("prompt.graph.legend.folder", "Root folder color")}
        </span>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">
        {t("prompt.graph.legend.size", "Bigger = used more often")}
      </p>
    </div>
  );
}

export interface HoverCardData {
  title: string;
  tags: string[];
  usageCount: number;
  folderName: string | null;
  isFavorite: boolean;
  promptType: PromptGraphNode["promptType"];
  suggestedCount: number;
}

export function NodeHoverCard({
  data,
  t,
}: {
  data: HoverCardData | null;
  t: TFunction;
}) {
  if (!data) {
    return null;
  }
  const typeMeta = PROMPT_TYPE_META[data.promptType ?? "text"];

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-10 w-64 rounded-xl p-3 text-xs shadow-xl backdrop-blur app-wallpaper-surface ring-1 ring-border">
      <div className="mb-1 flex items-start gap-1.5">
        {data.isFavorite && (
          <StarIcon
            aria-hidden="true"
            className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400"
          />
        )}
        <span className="min-w-0 break-words font-semibold text-foreground">
          {data.title}
        </span>
      </div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {t(typeMeta.key, typeMeta.fallback)}
      </p>

      <div className="mt-2 flex items-center gap-1.5 text-muted-foreground">
        <TrendingUpIcon aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
        {t("prompt.graph.card.usage", "{{count}} uses", {
          count: data.usageCount,
        })}
      </div>

      {data.folderName && (
        <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
          <FolderIcon
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 text-primary"
          />
          <span className="truncate">{data.folderName}</span>
        </div>
      )}

      {data.suggestedCount > 0 && (
        <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
          <SparklesIcon
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 text-primary"
          />
          {t("prompt.graph.card.suggested", "{{count}} suggested links", {
            count: data.suggestedCount,
          })}
        </div>
      )}

      {data.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {data.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export interface GraphFilterBarProps {
  t: TFunction;
  availableTags: string[];
  selectedTags: string[];
  folderOptions: { id: string; name: string }[];
  selectedFolderIds: string[];
  focusActive: boolean;
  isolatedCount: number;
  onToggleTag: (tag: string) => void;
  onToggleFolder: (id: string) => void;
  onClearFilters: () => void;
  onExitFocus: () => void;
}

export function GraphFilterBar({
  t,
  availableTags,
  selectedTags,
  folderOptions,
  selectedFolderIds,
  focusActive,
  isolatedCount,
  onToggleTag,
  onToggleFolder,
  onClearFilters,
  onExitFocus,
}: GraphFilterBarProps) {
  const hasActiveFilter = selectedTags.length > 0 || selectedFolderIds.length > 0;
  const topTags = useMemo(
    () =>
      [...availableTags]
        .sort((a, b) => a.localeCompare(b))
        .slice(0, 12),
    [availableTags],
  );

  if (isolatedCount === 0 && focusActive === false && !hasActiveFilter && topTags.length === 0 && folderOptions.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-auto absolute bottom-4 left-4 right-24 z-10 flex flex-wrap items-center gap-1.5 rounded-lg p-2 text-xs shadow-lg backdrop-blur app-wallpaper-surface ring-1 ring-border">
      {isolatedCount > 0 && (
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-medium text-amber-600 dark:text-amber-400">
          {t("prompt.graph.iso.badge", "{{count}} unlinked", {
            count: isolatedCount,
          })}
        </span>
      )}

      {focusActive && (
        <button
          type="button"
          onClick={onExitFocus}
          className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 font-medium text-primary hover:bg-primary/25"
        >
          <XIcon aria-hidden="true" className="h-3 w-3" />
          {t("prompt.graph.focus.exit", "Exit focus")}
        </button>
      )}

      {topTags.map((tag) => {
        const active = selectedTags.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onToggleTag(tag)}
            aria-pressed={active}
            className={`rounded-full px-2 py-0.5 transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            #{tag}
          </button>
        );
      })}

      {folderOptions.map((folder) => {
        const active = selectedFolderIds.includes(folder.id);
        return (
          <button
            key={folder.id}
            type="button"
            onClick={() => onToggleFolder(folder.id)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            <FolderIcon aria-hidden="true" className="h-3 w-3" />
            <span className="max-w-24 truncate">{folder.name}</span>
          </button>
        );
      })}

      {hasActiveFilter && (
        <button
          type="button"
          onClick={onClearFilters}
          className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <XIcon aria-hidden="true" className="h-3 w-3" />
          {t("prompt.graph.filter.clear", "Clear")}
        </button>
      )}
    </div>
  );
}

export function GraphControlButton({
  label,
  children,
  isDarkMode,
  onClick,
  active = false,
}: {
  label: string;
  children: React.ReactNode;
  isDarkMode: boolean;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${
        active
          ? "bg-primary/20 text-primary"
          : isDarkMode
            ? "text-zinc-400 hover:bg-white/10 hover:text-zinc-100"
            : "text-zinc-500 hover:bg-black/5 hover:text-zinc-900"
      }`}
    >
      {children}
    </button>
  );
}

export interface GraphControlsProps {
  zoomPercent: string;
  t: TFunction;
  isDarkMode: boolean;
  legendOpen: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onReset: () => void;
  onToggleLegend: () => void;
}

export function GraphControls({
  zoomPercent,
  t,
  isDarkMode,
  legendOpen,
  onZoomIn,
  onZoomOut,
  onFit,
  onReset,
  onToggleLegend,
}: GraphControlsProps) {
  return (
    <div
      className={`absolute bottom-16 right-4 z-10 flex flex-col items-center gap-1 rounded-lg p-1 text-xs shadow-lg backdrop-blur ${
        isDarkMode
          ? "bg-[#242424]/80 text-zinc-400 shadow-black/30 ring-1 ring-white/5"
          : "bg-white/85 text-zinc-500 shadow-black/10 ring-1 ring-black/5"
      }`}
    >
      <GraphControlButton
        label={t("prompt.graph.fitView", "Fit graph to screen")}
        isDarkMode={isDarkMode}
        onClick={onFit}
      >
        <Maximize2Icon aria-hidden="true" className="h-3.5 w-3.5" />
      </GraphControlButton>
      <GraphControlButton
        label={t("prompt.graph.zoomOut", "Zoom out graph")}
        isDarkMode={isDarkMode}
        onClick={onZoomOut}
      >
        <MinusIcon aria-hidden="true" className="h-3.5 w-3.5" />
      </GraphControlButton>
      <span
        className={`min-w-10 rounded-md px-1 py-0.5 text-center font-medium tabular-nums ${
          isDarkMode ? "text-zinc-500" : "text-zinc-400"
        }`}
      >
        {zoomPercent}
      </span>
      <GraphControlButton
        label={t("prompt.graph.zoomIn", "Zoom in graph")}
        isDarkMode={isDarkMode}
        onClick={onZoomIn}
      >
        <PlusIcon aria-hidden="true" className="h-3.5 w-3.5" />
      </GraphControlButton>
      <GraphControlButton
        label={t("prompt.graph.resetView", "Reset graph view")}
        isDarkMode={isDarkMode}
        onClick={onReset}
      >
        <RotateCcwIcon aria-hidden="true" className="h-3.5 w-3.5" />
      </GraphControlButton>
      <GraphControlButton
        label={t("prompt.graph.legend.toggle", "Toggle legend")}
        isDarkMode={isDarkMode}
        onClick={onToggleLegend}
        active={legendOpen}
      >
        <BookOpenIcon aria-hidden="true" className="h-3.5 w-3.5" />
      </GraphControlButton>
    </div>
  );
}
