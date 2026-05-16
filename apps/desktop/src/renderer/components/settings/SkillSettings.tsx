import { useMemo, useState, type DragEvent } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EyeIcon,
  EyeOffIcon,
  ExternalLinkIcon,
  GripVerticalIcon,
  PlusIcon,
  RotateCcwIcon,
  TrashIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  SKILL_PLATFORMS,
  getPlatformGlobalRuleTemplate,
  getPlatformRootTemplate,
  getPlatformSkillsTemplate,
} from "@prompthub/shared/constants/platforms";
import { useSettingsStore } from "../../stores/settings.store";
import { useSkillStore } from "../../stores/skill.store";
import { PlatformIcon } from "../ui/PlatformIcon";
import { SettingSection } from "./shared";
import { useToast } from "../ui/Toast";
import { getSafetyScanAIConfig } from "../skill/detail-utils";
import { sortSkillPlatformsByPreference } from "../skill/use-skill-platform";

function getCurrentPlatformKey(): "darwin" | "win32" | "linux" {
  const platform = navigator.userAgent.toLowerCase();
  if (platform.includes("win")) return "win32";
  if (platform.includes("mac")) return "darwin";
  return "linux";
}

function joinResolvedPlatformPath(rootPath: string, relativePath: string): string {
  const normalizedRoot = rootPath.trim().replace(/[\\/]+$/, "");
  const segments = relativePath.split(/[\\/]+/).filter(Boolean);
  if (segments.length === 0) {
    return normalizedRoot;
  }

  const separator = normalizedRoot.includes("\\") ? "\\" : "/";
  return `${normalizedRoot}${separator}${segments.join(separator)}`;
}

function useOrderedPlatforms() {
  const settings = useSettingsStore();

  return useMemo(() => {
    return sortSkillPlatformsByPreference(
      SKILL_PLATFORMS,
      settings.skillPlatformOrder ?? [],
    );
  }, [settings.skillPlatformOrder]);
}

function reorderPlatformIds(
  currentOrder: string[],
  sourceId: string,
  targetId: string,
): string[] | null {
  if (sourceId === targetId) {
    return null;
  }

  const sourceIndex = currentOrder.indexOf(sourceId);
  const targetIndex = currentOrder.indexOf(targetId);
  if (sourceIndex === -1 || targetIndex === -1) {
    return null;
  }

  const nextOrder = [...currentOrder];
  const [moved] = nextOrder.splice(sourceIndex, 1);
  nextOrder.splice(targetIndex, 0, moved);
  return nextOrder;
}

export function SkillSettings() {
  const { t } = useTranslation();
  const settings = useSettingsStore();
  const orderedPlatforms = useOrderedPlatforms();
  const currentPlatformKey = getCurrentPlatformKey();
  const [newScanPath, setNewScanPath] = useState("");
  const [draggingPlatformId, setDraggingPlatformId] = useState<string | null>(
    null,
  );
  const [dropTargetPlatformId, setDropTargetPlatformId] = useState<string | null>(
    null,
  );
  const [isGithubTokenVisible, setIsGithubTokenVisible] = useState(false);

  const movePlatformOrder = (platformId: string, direction: "up" | "down") => {
    const nextOrder = orderedPlatforms.map((platform) => platform.id);
    const currentIndex = nextOrder.indexOf(platformId);
    if (currentIndex === -1) {
      return;
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= nextOrder.length) {
      return;
    }

    [nextOrder[currentIndex], nextOrder[targetIndex]] = [
      nextOrder[targetIndex],
      nextOrder[currentIndex],
    ];
    settings.setSkillPlatformOrder(nextOrder);
  };

  const applyDraggedPlatformOrder = (sourceId: string, targetId: string) => {
    const nextOrder = reorderPlatformIds(
      orderedPlatforms.map((platform) => platform.id),
      sourceId,
      targetId,
    );
    if (!nextOrder) {
      return;
    }
    settings.setSkillPlatformOrder(nextOrder);
  };

  const handleDragStart =
    (platformId: string) => (event: DragEvent<HTMLDivElement>) => {
      setDraggingPlatformId(platformId);
      setDropTargetPlatformId(platformId);
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", platformId);
    };

  const handleDragOver =
    (platformId: string) => (event: DragEvent<HTMLDivElement>) => {
      if (!draggingPlatformId || draggingPlatformId === platformId) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      setDropTargetPlatformId(platformId);
    };

  const handleDrop =
    (platformId: string) => (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const sourceId =
        event.dataTransfer.getData("text/plain") || draggingPlatformId;
      if (sourceId) {
        applyDraggedPlatformOrder(sourceId, platformId);
      }
      setDraggingPlatformId(null);
      setDropTargetPlatformId(null);
    };

  const handleDragEnd = () => {
    setDraggingPlatformId(null);
    setDropTargetPlatformId(null);
  };

  return (
    <div className="space-y-6">
      <SettingSection
        title={t("settings.githubTokenTitle", "GitHub Access Token")}
      >
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            {t(
              "settings.githubTokenDesc",
              "Optional. Attach a GitHub personal access token (classic or fine-grained) so Skill Store requests use your authenticated rate limit (5 000 req/h) instead of the anonymous 60 req/h limit. The token is only sent to api.github.com and raw.githubusercontent.com.",
            )}
          </p>
          <div className="flex items-center gap-2">
            <input
              type={isGithubTokenVisible ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              value={settings.githubToken}
              onChange={(e) => settings.setGithubToken(e.target.value)}
              placeholder={t(
                "settings.githubTokenPlaceholder",
                "ghp_… or github_pat_…",
              )}
              className="flex-1 h-9 px-3 rounded-lg bg-muted border-0 text-sm font-mono placeholder:text-muted-foreground/50"
              aria-label={t("settings.githubTokenTitle", "GitHub Access Token")}
            />
            <button
              type="button"
              onClick={() => setIsGithubTokenVisible((prev) => !prev)}
              className="h-9 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
              aria-label={
                isGithubTokenVisible
                  ? t("settings.githubTokenHide", "Hide token")
                  : t("settings.githubTokenShow", "Show token")
              }
              title={
                isGithubTokenVisible
                  ? t("settings.githubTokenHide", "Hide token")
                  : t("settings.githubTokenShow", "Show token")
              }
            >
              {isGithubTokenVisible ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
            {settings.githubToken.length > 0 ? (
              <button
                type="button"
                onClick={() => settings.setGithubToken("")}
                className="h-9 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
              >
                {t("common.clear", "Clear")}
              </button>
            ) : null}
          </div>
          <a
            href="https://github.com/settings/tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLinkIcon className="h-3 w-3" />
            {t("settings.githubTokenLearnMore", "Create a personal access token")}
          </a>
          <p className="text-[11px] text-muted-foreground/80">
            {t(
              "settings.githubTokenScopeHint",
              "A read-only token without any scope (public repositories) is enough for the skill store.",
            )}
          </p>
        </div>
      </SettingSection>

      <SettingSection
        title={t("settings.skillInstallMethod", "Skill Install Method")}
      >
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            {t(
              "settings.skillInstallMethodDesc",
              "Choose how to install Skills from PromptHub to AI tool platforms.",
            )}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => settings.setSkillInstallMethod("symlink")}
              className={`flex-1 p-3 rounded-xl border-2 transition-all text-left ${
                settings.skillInstallMethod === "symlink"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div className="text-sm font-semibold">
                {t("settings.skillInstallSymlink", "Symlink")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t(
                  "settings.skillInstallSymlinkDesc",
                  "Create symlinks in platform directories pointing to PromptHub's Skills folder for efficient syncing",
                )}
              </p>
            </button>
            <button
              onClick={() => settings.setSkillInstallMethod("copy")}
              className={`flex-1 p-3 rounded-xl border-2 transition-all text-left ${
                settings.skillInstallMethod === "copy"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div className="text-sm font-semibold">
                {t("settings.skillInstallCopy", "Copy Files")}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t(
                  "settings.skillInstallCopyDesc",
                  "Copy SKILL.md files directly to platform directories, independent of PromptHub",
                )}
              </p>
            </button>
          </div>
        </div>
      </SettingSection>

      <SettingSection
        title={t("settings.platformDisplayOrder", "Platform Display Order")}
      >
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {t(
                "settings.platformDisplayOrderDesc",
                "Control the platform order shown in Skill detail and batch deployment panels.",
              )}
            </p>
            <button
              onClick={() => settings.resetSkillPlatformOrder()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <RotateCcwIcon className="h-3.5 w-3.5" />
              {t("settings.resetPlatformDisplayOrder", "Reset")}
            </button>
          </div>
          <div
            role="list"
            aria-label={t("settings.platformDisplayOrder", "Platform Display Order")}
            className="space-y-2 rounded-xl border border-border/70 app-wallpaper-surface p-3"
          >
            {orderedPlatforms.map((platform, index) => (
              <div
                key={platform.id}
                role="listitem"
                data-platform-id={platform.id}
                draggable
                onDragStart={handleDragStart(platform.id)}
                onDragOver={handleDragOver(platform.id)}
                onDrop={handleDrop(platform.id)}
                onDragEnd={handleDragEnd}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 app-wallpaper-surface-strong transition-colors cursor-grab active:cursor-grabbing ${
                  draggingPlatformId === platform.id
                    ? "border-primary/40 opacity-60"
                    : dropTargetPlatformId === platform.id
                      ? "border-primary/60 ring-1 ring-primary/30"
                      : "border-border/60"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <GripVerticalIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <PlatformIcon platformId={platform.id} size={20} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">
                      {platform.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {settings.customPlatformRootPaths[platform.id] ||
                        getPlatformRootTemplate(platform, currentPlatformKey)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => movePlatformOrder(platform.id, "up")}
                    disabled={index === 0}
                    className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    title={t("settings.movePlatformUp", "Move Up")}
                  >
                    <ArrowUpIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => movePlatformOrder(platform.id, "down")}
                    disabled={index === orderedPlatforms.length - 1}
                    className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    title={t("settings.movePlatformDown", "Move Down")}
                  >
                    <ArrowDownIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SettingSection>

      <SettingSection
        title={t("settings.platformRootPaths", "Platform Root Directories")}
      >
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            {t(
              "settings.platformRootPathsDesc",
              "Override the root directory for each AI tool platform. PromptHub will derive internal paths like skills and global rules from this root.",
            )}
          </p>
          <div className="rounded-lg border border-border overflow-hidden">
            {orderedPlatforms.map((platform) => {
              const overridePath = settings.customPlatformRootPaths[platform.id] || "";
              const defaultRootPath = getPlatformRootTemplate(
                platform,
                currentPlatformKey,
              );
              const effectiveRootPath = overridePath || defaultRootPath;
              const derivedSkillsPath = joinResolvedPlatformPath(
                effectiveRootPath,
                platform.skillsRelativePath,
              );
              const defaultRulePath = getPlatformGlobalRuleTemplate(
                platform,
                currentPlatformKey,
              );
              const derivedRulePath =
                platform.globalRuleFile && defaultRulePath
                  ? joinResolvedPlatformPath(
                      effectiveRootPath,
                      platform.globalRuleFile,
                    )
                  : null;

              return (
                <div
                  key={platform.id}
                  className="px-3 py-3 border-b border-border/70 last:border-0 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <PlatformIcon platformId={platform.id} size={16} />
                    <span className="text-sm font-medium text-foreground">
                      {platform.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {t("settings.defaultPathLabel", "Default path")}:
                    <span className="ml-1 font-mono">
                      {defaultRootPath}
                    </span>
                  </div>
                  <div className="grid gap-2 rounded-lg bg-muted/30 p-3 text-[11px] text-muted-foreground">
                    <div>
                      {t("settings.platformDerivedSkillPath", "Derived skills path")}
                      :
                      <span className="ml-1 font-mono">{derivedSkillsPath}</span>
                    </div>
                    {derivedRulePath ? (
                      <div>
                        {t("settings.platformDerivedRulesPath", "Derived rules path")}
                        :
                        <span className="ml-1 font-mono">{derivedRulePath}</span>
                      </div>
                    ) : null}
                    {platform.configFiles?.length ? (
                      <div>
                        {t("settings.platformDerivedConfigPath", "Derived config files")}
                        :
                        <span className="ml-1 font-mono">
                          {platform.configFiles
                            .map((configFile) =>
                              joinResolvedPlatformPath(effectiveRootPath, configFile),
                            )
                            .join(", ")}
                        </span>
                      </div>
                    ) : null}
                    <div className="text-[10px] text-muted-foreground/80">
                      {t(
                        "settings.platformDerivedPathHint",
                        "Skills, Rules, and related config files are derived from the platform root directory.",
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={overridePath}
                      onChange={(e) =>
                        settings.setCustomPlatformRootPath(platform.id, e.target.value)
                      }
                      placeholder={t(
                        "settings.platformRootPathPlaceholder",
                        "Leave empty to use the default root, e.g. ~/.trae-cn",
                      )}
                      className="flex-1 h-9 px-3 rounded-lg bg-muted border-0 text-sm placeholder:text-muted-foreground/50"
                    />
                    <button
                      onClick={() => settings.resetCustomPlatformRootPath(platform.id)}
                      disabled={!overridePath}
                      className="h-9 px-3 rounded-lg border border-border text-sm text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-50 disabled:hover:border-border disabled:hover:text-muted-foreground transition-colors"
                    >
                      {t("settings.resetPlatformRootPath", "Reset")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SettingSection>

      <SettingSection
        title={t("settings.extraSkillScanPaths", "Extra Scan Directories")}
      >
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            {t(
              "settings.extraSkillScanPathsDesc",
              "Add extra Skill directories for import and discovery. These do not replace the platform default directories.",
            )}
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newScanPath}
              onChange={(e) => setNewScanPath(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newScanPath.trim()) {
                  settings.addCustomSkillScanPath(newScanPath.trim());
                  setNewScanPath("");
                }
              }}
              placeholder={t(
                "settings.customSkillScanPathPlaceholder",
                "Enter path, e.g. ~/myskills",
              )}
              className="flex-1 h-9 px-3 rounded-lg bg-muted border-0 text-sm placeholder:text-muted-foreground/50"
            />
            <button
              onClick={() => {
                if (newScanPath.trim()) {
                  settings.addCustomSkillScanPath(newScanPath.trim());
                  setNewScanPath("");
                }
              }}
              className="h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5"
            >
              <PlusIcon className="w-4 h-4" />
              {t("common.add", "Add")}
            </button>
          </div>
          {settings.customSkillScanPaths.length > 0 ? (
            <div className="rounded-lg border border-border overflow-hidden">
              {settings.customSkillScanPaths.map((path, idx) => (
                <div
                  key={`${path}-${idx}`}
                  className="flex items-center justify-between px-3 py-2.5 border-b border-border/70 last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <span className="text-sm font-mono text-foreground truncate flex-1 mr-3">
                    {path}
                  </span>
                  <button
                    onClick={() => settings.removeCustomSkillScanPath(path)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                    title={t("common.delete", "Delete")}
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/60 italic">
              {t("settings.noCustomPaths", "No custom paths added yet")}
            </p>
          )}
        </div>
      </SettingSection>
    </div>
  );
}

export function SkillSafetySettingsSection() {
  const { t } = useTranslation();
  const settings = useSettingsStore();
  const scanInstalledSkillSafety = useSkillStore(
    (state) => state.scanInstalledSkillSafety,
  );
  const aiModels = settings.aiModels;
  const { showToast } = useToast();
  const [isBatchScanning, setIsBatchScanning] = useState(false);

  return (
    <SettingSection
      title={t("settings.skillSafetyChecks", "Skill Safety Checks")}
    >
      <div className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground">
          {t(
            "settings.skillSafetyChecksDesc",
            "Control automatic safety scans for installed Skills and pre-install checks from the store.",
          )}
        </p>
        <button
          onClick={() =>
            settings.setAutoScanInstalledSkills(!settings.autoScanInstalledSkills)
          }
          className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
            settings.autoScanInstalledSkills
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/30"
          }`}
        >
          <div className="text-sm font-semibold">
            {t("settings.autoScanInstalledSkills", "Auto-scan Installed Skills")}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t(
              "settings.autoScanInstalledSkillsDesc",
              "Automatically run a safety scan when opening a Skill detail page to detect high-risk changes.",
            )}
          </p>
        </button>
        <button
          onClick={() =>
            settings.setAutoScanStoreSkillsBeforeInstall(
              !settings.autoScanStoreSkillsBeforeInstall,
            )
          }
          className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
            settings.autoScanStoreSkillsBeforeInstall
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/30"
          }`}
        >
          <div className="text-sm font-semibold">
            {t(
              "settings.autoScanStoreSkillsBeforeInstall",
              "Pre-install Safety Scan",
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t(
              "settings.autoScanStoreSkillsBeforeInstallDesc",
              "Off by default. When enabled, a safety scan runs before adding a Skill from the store, blocking obviously dangerous entries.",
            )}
          </p>
        </button>
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">
                {t(
                  "settings.batchScanInstalledSkills",
                  "Scan All Installed Skills Now",
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t(
                  "settings.batchScanInstalledSkillsDesc",
                  "Manually run a safety scan on all Skills in your library to quickly find high-risk content.",
                )}
              </p>
            </div>
            <button
              onClick={() => {
                const run = async () => {
                  setIsBatchScanning(true);
                  try {
                    const summary = await scanInstalledSkillSafety(
                      undefined,
                      getSafetyScanAIConfig(aiModels),
                    );
                    showToast(
                      t("settings.batchScanInstalledSkillsResult", {
                        total: summary.total,
                        blocked: summary.blocked,
                        highRisk: summary.highRisk,
                        warn: summary.warn,
                        defaultValue: `Checked ${summary.total} skills · blocked ${summary.blocked} · high risk ${summary.highRisk} · warn ${summary.warn}`,
                      }),
                      summary.blocked > 0 || summary.highRisk > 0
                        ? "error"
                        : summary.warn > 0
                          ? "warning"
                          : "success",
                    );
                  } catch (error) {
                    showToast(String(error), "error");
                  } finally {
                    setIsBatchScanning(false);
                  }
                };
                void run();
              }}
              disabled={isBatchScanning}
              className="shrink-0 h-9 px-4 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isBatchScanning
                ? t("skill.safetyScanning", "Scanning...")
                : t("skill.runSafetyAssessment", "Run Scan")}
            </button>
          </div>
        </div>
      </div>
    </SettingSection>
  );
}
