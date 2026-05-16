import { LinkIcon, Loader2Icon, PowerIcon, TrashIcon } from "lucide-react";
import type { TFunction } from "i18next";
import type { SkillStoreSource } from "@prompthub/shared/types";

interface SkillStoreCustomSourcesProps {
  customStoreSources: SkillStoreSource[];
  loadStoreSource: (sourceId: string, forceRefresh?: boolean) => Promise<void>;
  loadingSourceId: string | null;
  remoteStoreEntries: Record<
    string,
    { loadedAt: number; error?: string | null; skills: { slug: string }[] }
  >;
  removeCustomStoreSource: (id: string) => void;
  selectStoreSource: (id: string) => void;
  selectedCustomSource: SkillStoreSource | null;
  selectedStoreSourceId: string;
  t: TFunction;
  toggleCustomStoreSource: (id: string) => void;
}

export function SkillStoreCustomSources({
  customStoreSources,
  loadStoreSource,
  loadingSourceId,
  remoteStoreEntries,
  removeCustomStoreSource,
  selectStoreSource,
  selectedCustomSource,
  selectedStoreSourceId,
  t,
  toggleCustomStoreSource,
}: SkillStoreCustomSourcesProps) {
  if (!selectedCustomSource && customStoreSources.length === 0) {
    return (
      <div className="app-wallpaper-panel border border-dashed border-border rounded-2xl p-8 text-center text-muted-foreground">
        <LinkIcon className="mx-auto mb-3 h-10 w-10 opacity-30" />
        <h4 className="mb-1 text-base font-semibold text-foreground">
          {t("skill.noCustomStores", "No custom stores yet")}
        </h4>
        <p className="text-sm">
          {t(
            "skill.noCustomStoresHint",
            "Click the dashed box on the left to add a store and connect your own skill sources.",
          )}
        </p>
      </div>
    );
  }

  if (selectedCustomSource) {
    return null;
  }

  return (
    <div className="grid gap-3">
      {customStoreSources.map((source) => {
        const count = remoteStoreEntries[source.id]?.skills.length || 0;
        const isSelected = selectedStoreSourceId === source.id;
        return (
          <div
            key={source.id}
            onClick={() => selectStoreSource(source.id)}
            className={`app-wallpaper-panel flex items-center gap-4 rounded-2xl border p-4 text-left ${
              isSelected ? "border-primary shadow-sm" : "border-border"
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LinkIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="truncate font-semibold text-foreground">
                  {source.name}
                </h4>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    source.enabled
                      ? "bg-green-500/10 text-green-500"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {source.enabled
                    ? t("common.enabled", "Enabled")
                    : t("common.disabled", "Disabled")}
                </span>
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-muted-foreground">
                  {count} {t("skill.skillsCount", "skills")}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {source.url}
              </p>
            </div>
            <button
              onClick={(event) => {
                event.stopPropagation();
                toggleCustomStoreSource(source.id);
              }}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title={
                source.enabled
                  ? t("common.disable", "Disable")
                  : t("common.enable", "Enable")
              }
            >
              <PowerIcon className="h-4 w-4" />
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                void loadStoreSource(source.id, true);
              }}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title={t("common.refresh", "Refresh")}
            >
              <Loader2Icon
                className={`h-4 w-4 ${loadingSourceId === source.id ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                removeCustomStoreSource(source.id);
              }}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              title={t("common.delete", "Delete")}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
