import {
  CheckIcon,
  CheckSquareIcon,
  CopyPlusIcon,
  DownloadIcon,
  FileTextIcon,
  PackageIcon,
  FolderOpenIcon,
  GithubIcon,
  LinkIcon,
  Loader2Icon,
  SquareIcon,
  ChevronRightIcon,
} from "lucide-react";
import type { TFunction } from "i18next";
import type { Skill } from "@prompthub/shared/types";
import type { SkillPlatform } from "@prompthub/shared/constants/platforms";
import { PlatformIcon } from "../ui/PlatformIcon";
import { getProtocolDisplayLabel, getSkillSourceMeta } from "./detail-utils";
import { getRuntimeCapabilities } from "../../runtime";

interface SkillPlatformPanelProps {
  availablePlatforms: SkillPlatform[];
  handleExport: (format: "skillmd" | "zip") => void;
  installMode: "copy" | "symlink";
  installProgress: { current: number; total: number } | null;
  isBatchInstalling: boolean;
  selectedPlatforms: Set<string>;
  selectedSkill: Skill;
  selectAllPlatforms: () => void;
  deselectAllPlatforms: () => void;
  setInstallMode: (mode: "copy" | "symlink") => void;
  skillMdInstallStatus: Record<string, boolean>;
  t: TFunction;
  togglePlatformSelection: (platformId: string) => void;
  uninstallFromPlatform: (platformId: string) => void;
  uninstalledPlatforms: SkillPlatform[];
  onBatchInstall: () => void;
}

export function SkillPlatformPanel({
  availablePlatforms,
  handleExport,
  installMode,
  installProgress,
  isBatchInstalling,
  selectedPlatforms,
  selectedSkill,
  selectAllPlatforms,
  deselectAllPlatforms,
  setInstallMode,
  skillMdInstallStatus,
  t,
  togglePlatformSelection,
  uninstallFromPlatform,
  uninstalledPlatforms,
  onBatchInstall,
}: SkillPlatformPanelProps) {
  const sourceMeta = getSkillSourceMeta(selectedSkill, t);
  const runtimeCapabilities = getRuntimeCapabilities();
  const showPlatformIntegration = runtimeCapabilities.skillPlatformIntegration;
  const showLocalSourceShortcut =
    runtimeCapabilities.desktopWindowControls && sourceMeta?.kind === "local";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-6">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center justify-between">
          <span>
            {showPlatformIntegration
              ? t("skill.platformIntegration", "Platform Integration")
              : t("skill.webSkillLibrary", "Skill Workspace")}
          </span>
          <span className="text-[10px]">SKILL.md</span>
        </h3>

        {showPlatformIntegration && availablePlatforms.length > 0 && (
          <section className="app-wallpaper-panel rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-1 p-1 bg-accent/50 rounded-lg">
            <button
              onClick={() => setInstallMode("copy")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-medium transition-colors ${
                installMode === "copy"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CopyPlusIcon className="w-3 h-3" />
              {t("skill.copyMode", "Copy")}
            </button>
            <button
              onClick={() => setInstallMode("symlink")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-medium transition-colors ${
                installMode === "symlink"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LinkIcon className="w-3 h-3" />
              {t("skill.symlink", "Symlink")}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {installMode === "copy"
              ? t(
                  "skill.copyModeDesc",
                  "Copy: Copies the SKILL.md file to each platform directory. Each copy is independent — edits in PromptHub won't sync automatically.",
                )
              : t(
                  "skill.symlinkDesc",
                  "Symlink: Creates a symbolic link pointing to the source file. All platforms share the same source — edits sync instantly, but requires filesystem support.",
                )}
          </p>

          {uninstalledPlatforms.length > 0 && (
            <div className="flex flex-col gap-2 p-3 bg-accent/30 rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <button
                  onClick={
                    selectedPlatforms.size === uninstalledPlatforms.length
                      ? deselectAllPlatforms
                      : selectAllPlatforms
                  }
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                  disabled={isBatchInstalling}
                >
                  {selectedPlatforms.size === uninstalledPlatforms.length ? (
                    <>
                      <CheckSquareIcon className="w-4 h-4" />
                      {t("skill.deselectAll")}
                    </>
                  ) : (
                    <>
                      <SquareIcon className="w-4 h-4" />
                      {t("skill.selectAll")}
                    </>
                  )}
                </button>
                {selectedPlatforms.size > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {selectedPlatforms.size} {t("skill.selected")}
                  </span>
                )}
              </div>
              <button
                onClick={onBatchInstall}
                disabled={selectedPlatforms.size === 0 || isBatchInstalling}
                className="w-full px-3 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {isBatchInstalling ? (
                  <>
                    <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
                    {installProgress
                      ? `${installProgress.current}/${installProgress.total}`
                      : t("skill.installing")}
                  </>
                ) : (
                  <>
                    <DownloadIcon className="w-3.5 h-3.5" />
                    {t("skill.batchInstall")}
                  </>
                )}
              </button>
            </div>
          )}

          <div className="space-y-2">
            {availablePlatforms.map((platform) => {
              const isInstalled = skillMdInstallStatus[platform.id];
              const isSelected = selectedPlatforms.has(platform.id);

              return (
                <div
                  key={platform.id}
                  onClick={() => {
                    if (isInstalled || isBatchInstalling) return;
                    togglePlatformSelection(platform.id);
                  }}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                    isInstalled
                      ? "bg-primary/5 border-primary cursor-default"
                      : isSelected
                        ? "bg-primary/10 border-primary cursor-pointer"
                        : "bg-accent/30 border-border hover:bg-accent/50 cursor-pointer"
                  } ${isBatchInstalling && !isInstalled ? "opacity-70 cursor-wait" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                      <PlatformIcon platformId={platform.id} size={28} />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{platform.name}</h4>
                      <p className="text-[10px] text-muted-foreground">
                        {isInstalled
                          ? t("skill.installed")
                          : isSelected
                            ? t("skill.selectedForInstall")
                            : t("skill.clickToSelect")}
                      </p>
                    </div>
                  </div>
                  {isInstalled ? (
                    <div className="flex items-center gap-2">
                      <CheckIcon className="w-4 h-4 text-primary" />
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          uninstallFromPlatform(platform.id);
                        }}
                        className="text-[10px] text-destructive hover:underline"
                      >
                        {t("skill.uninstall")}
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </section>
        )}

        <section className="app-wallpaper-panel rounded-2xl border border-border p-5 space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
            {t("skill.metadata")}
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex justify-between items-center text-sm gap-4">
              <span className="text-muted-foreground">{t("skill.id")}</span>
              <span className="font-mono text-[10px] bg-accent px-2 py-0.5 rounded truncate max-w-[150px]">
                {selectedSkill.id}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm gap-4">
              <span className="text-muted-foreground">{t("skill.protocol")}</span>
              <span className="font-bold uppercase tracking-tight flex items-center gap-1 text-primary text-xs">
                <ChevronRightIcon className="w-3.5 h-3.5" />
                {getProtocolDisplayLabel(selectedSkill.protocol_type)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm gap-4">
              <span className="text-muted-foreground">{t("skill.createdAt")}</span>
              <span className="text-xs opacity-80">
                {new Date(selectedSkill.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm gap-4">
              <span className="text-muted-foreground">{t("skill.updatedAt")}</span>
              <span className="text-xs opacity-80">
                {new Date(selectedSkill.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </section>

        <section className="app-wallpaper-panel rounded-2xl border border-border p-5 space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
            {t("skill.export")}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleExport("skillmd")}
              className="flex flex-col items-center gap-1 p-3 bg-accent/50 hover:bg-accent border border-border rounded-xl transition-colors"
            >
              <FileTextIcon className="w-5 h-5 text-primary" />
              <span className="font-medium text-xs">SKILL.md</span>
            </button>
            <button
              onClick={() => handleExport("zip")}
              className="flex flex-col items-center gap-1 p-3 bg-accent/50 hover:bg-accent border border-border rounded-xl transition-colors"
            >
              <PackageIcon className="w-5 h-5 text-primary" />
              <span className="font-medium text-xs">ZIP</span>
            </button>
          </div>
        </section>
      </div>

      <div className="pt-6">
        {sourceMeta &&
          (sourceMeta.kind === "local" && showLocalSourceShortcut ? (
            <button
              onClick={() => window.electron?.openPath?.(sourceMeta.value)}
              className="w-full min-h-[148px] flex items-center gap-3 p-5 bg-accent/70 border border-border text-foreground rounded-2xl hover:bg-accent transition-colors text-left"
              title={sourceMeta.displayValue}
            >
              <FolderOpenIcon className="w-5 h-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold break-words">
                  {sourceMeta.sourceLabel}
                </div>
                <div className="mt-1 whitespace-normal break-words text-xs leading-relaxed text-muted-foreground">
                  {sourceMeta.displayValue}
                </div>
              </div>
            </button>
          ) : sourceMeta.kind === "local" ? (
            <div
              className="w-full min-h-[148px] flex items-center gap-3 p-5 bg-accent/70 border border-border text-foreground rounded-2xl text-left"
              title={sourceMeta.displayValue}
            >
              <FolderOpenIcon className="w-5 h-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold break-words">
                  {sourceMeta.sourceLabel}
                </div>
                <div className="mt-1 whitespace-normal break-words text-xs leading-relaxed text-muted-foreground">
                  {sourceMeta.displayValue}
                </div>
              </div>
            </div>
          ) : (
            <a
              href={sourceMeta.value}
              target="_blank"
              rel="noreferrer"
              className={`w-full min-h-[148px] flex items-center gap-3 p-5 text-white rounded-2xl hover:opacity-90 transition-opacity text-left ${
                sourceMeta.kind === "github" ? "bg-[#24292e]" : "bg-slate-700"
              }`}
              title={sourceMeta.displayValue}
            >
              {sourceMeta.kind === "github" ? (
                <GithubIcon className="w-5 h-5 shrink-0" />
              ) : (
                <LinkIcon className="w-5 h-5 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold break-words">
                  {sourceMeta.sourceLabel}
                </div>
                <div className="mt-1 whitespace-normal break-words text-xs leading-relaxed text-white/70">
                  {sourceMeta.displayValue}
                </div>
              </div>
            </a>
          ))}
      </div>
    </div>
  );
}
