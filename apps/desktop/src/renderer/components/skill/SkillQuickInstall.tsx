import { useTranslation } from "react-i18next";
import {
  XIcon,
  CheckIcon,
  DownloadIcon,
  Loader2Icon,
  CuboidIcon,
} from "lucide-react";
import { useState } from "react";
import { useSettingsStore } from "../../stores/settings.store";
import { useToast } from "../ui/Toast";
import type { Skill } from "@prompthub/shared/types";
import { PlatformIcon } from "../ui/PlatformIcon";
import { getErrorMessage } from "./detail-utils";
import { useSkillPlatform } from "./use-skill-platform";

interface SkillQuickInstallProps {
  skill: Skill;
  onClose: () => void;
}

/**
 * Quick Install Modal for Skills
 * 技能快速安装弹窗
 */
export function SkillQuickInstall({ skill, onClose }: SkillQuickInstallProps) {
  const { t } = useTranslation();
  const skillInstallMethod = useSettingsStore(
    (state) => state.skillInstallMethod,
  );
  const { showToast } = useToast();
  const [isClosingSoon, setIsClosingSoon] = useState(false);
  const {
    availablePlatforms,
    batchInstall,
    installProgress,
    installStatus,
    isBatchInstalling,
    selectedPlatforms,
    selectAllPlatforms,
    togglePlatformSelection,
    uninstalledPlatforms,
  } = useSkillPlatform(skill, skillInstallMethod);

  const handleInstall = async () => {
    if (selectedPlatforms.size === 0 || isClosingSoon) return;

    try {
      const result = await batchInstall();
      if (result.successCount > 0) {
        showToast(
          `${t("skill.installSuccess", "Operation successful")} ${result.successCount}/${result.totalCount}`,
          "success",
        );
      }
      // Surface per-platform failures even if some platforms succeeded.
      // Previously a partial failure looked like a silent success because
      // this handler closed the modal after the success toast without ever
      // reading `result.failures` (review feedback on #124).
      if (result.failures.length > 0) {
        const details = result.failures
          .map((failure) => {
            const platform = availablePlatforms.find(
              (entry) => entry.id === failure.platformId,
            );
            const label = platform?.name ?? failure.platformId;
            return t("skill.installFailureRow", {
              platform: label,
              reason: failure.reason,
              defaultValue: "{{platform}}: {{reason}}",
            });
          })
          .join("\n");
        showToast(
          t("skill.installPartialFailure", {
            details,
            defaultValue:
              "Some platforms could not be installed\n{{details}}",
          }),
          "error",
        );
      }
      // Only auto-close when every selected platform succeeded. Otherwise
      // keep the modal open so the user can retry or inspect the failures.
      if (
        result.successCount > 0 &&
        result.failures.length === 0
      ) {
        setIsClosingSoon(true);
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.error("Install failed:", error);
      showToast(
        `${t("skill.updateFailed")}: ${getErrorMessage(error)}`,
        "error",
      );
    }
  };

  // All platforms installed
  const allInstalled =
    availablePlatforms.length > 0 && uninstalledPlatforms.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="app-wallpaper-panel-strong border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <CuboidIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">
                {t("skill.quickInstall", "Install to Platforms")}
              </h3>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                {skill.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 min-h-0 scrollbar-hide">
          {availablePlatforms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">
                {t("skill.noPlatformsDetected", "No platforms detected")}
              </p>
            </div>
          ) : allInstalled ? (
            <div className="text-center py-8">
              <CheckIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-foreground font-medium">
                {t("skill.allPlatformsInstalled", "Installed on all platforms")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t(
                  "skill.alreadyInstalled",
                  "This skill is already installed on all detected platforms",
                )}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {t("skill.selectPlatforms", "Select platforms to install")}
                </p>
                <button
                  onClick={selectAllPlatforms}
                  className="text-xs text-primary hover:underline"
                  disabled={isBatchInstalling}
                >
                  {t("skill.selectAll")}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {availablePlatforms.map((platform) => {
                  const isInstalled = installStatus[platform.id];
                  const isSelected = selectedPlatforms.has(platform.id);

                  return (
                    <div
                      key={platform.id}
                      onClick={() => {
                        if (!isInstalled && !isBatchInstalling) {
                          togglePlatformSelection(platform.id);
                        }
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isInstalled
                          ? "bg-green-500/5 border-green-500/20 cursor-default"
                          : isSelected
                            ? "bg-primary/10 border-primary cursor-pointer"
                            : "bg-accent/30 border-border hover:bg-accent/50 cursor-pointer"
                      } ${isBatchInstalling && !isInstalled ? "opacity-60 cursor-wait" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                          <PlatformIcon platformId={platform.id} size={26} />
                        </div>
                        <span className="font-medium text-sm">
                          {platform.name}
                        </span>
                      </div>
                      {isInstalled ? (
                        <div className="flex items-center gap-1 text-green-500">
                          <CheckIcon className="w-4 h-4" />
                          <span className="text-xs">
                            {t("skill.installed")}
                          </span>
                        </div>
                      ) : (
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-primary border-primary"
                              : "border-muted-foreground/30"
                          }`}
                        >
                          {isSelected && (
                            <CheckIcon className="w-3 h-3 text-white" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!allInstalled && availablePlatforms.length > 0 && (
          <div className="p-5 border-t border-border shrink-0">
            <button
              onClick={handleInstall}
              disabled={selectedPlatforms.size === 0 || isBatchInstalling}
              className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors hover:bg-primary/90"
            >
              {isBatchInstalling ? (
                <>
                  <Loader2Icon className="w-4 h-4 animate-spin" />
                  {installProgress
                    ? `${installProgress.current}/${installProgress.total}`
                    : t("skill.installing")}
                </>
              ) : (
                <>
                  <DownloadIcon className="w-4 h-4" />
                  {t("skill.installSelected", "Install Selected")}{" "}
                  {selectedPlatforms.size > 0 && `(${selectedPlatforms.size})`}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
