import { DownloadIcon, FolderOpenIcon, Loader2Icon } from "lucide-react";
import type { TFunction } from "i18next";

interface ProjectSkillPreviewSidebarProps {
  isImporting: boolean;
  isImportAvailable: boolean;
  onImport: () => void | Promise<void>;
  sourcePath: string;
  t: TFunction;
}

export function ProjectSkillPreviewSidebar({
  isImporting,
  isImportAvailable,
  onImport,
  sourcePath,
  t,
}: ProjectSkillPreviewSidebarProps) {
  return (
    <div className="flex h-full min-h-0 flex-col space-y-6">
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
          {t("skill.platformIntegration", "Platform Integration")}
        </h3>
        <div className="app-wallpaper-panel rounded-2xl border border-border p-5 space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t(
              "skill.projectImportHint",
              "Import this project-local skill into My Skills first. After that, you can distribute it just like any normal PromptHub skill.",
            )}
          </p>
          <button
            type="button"
            onClick={() => void onImport()}
            disabled={!isImportAvailable || isImporting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {isImporting ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <DownloadIcon className="h-4 w-4" />
            )}
            {t("skill.addToLibrary", "Import to My Skills")}
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
          {t("skill.source", "Source")}
        </h3>
        <div className="app-wallpaper-panel rounded-2xl border border-border p-5">
          <button
            type="button"
            onClick={() => void window.electron?.openPath?.(sourcePath)}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-accent/60 px-4 py-4 text-left transition-colors hover:bg-accent"
            title={sourcePath}
          >
            <FolderOpenIcon className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">
                {t("skill.openLocalSource", "Open Local Skill Folder")}
              </div>
              <div className="mt-1 break-words text-xs leading-relaxed text-muted-foreground">
                {sourcePath}
              </div>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}
