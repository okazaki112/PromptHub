import { useTranslation } from "react-i18next";
import {
  CuboidIcon,
  StarIcon,
  TrashIcon,
  DownloadIcon,
  BellDotIcon,
  CheckSquareIcon,
  SquareIcon,
  ShieldCheckIcon,
  ShieldAlertIcon,
  ShieldIcon,
} from "lucide-react";
import { SkillIcon } from "./SkillIcon";
import { useState, useEffect, useMemo } from "react";
import { useSkillStore } from "../../stores/skill.store";
import { PlatformIcon } from "../ui/PlatformIcon";
import type { Skill, SkillSafetyLevel } from "@prompthub/shared/types";
import type { SkillPlatform } from "@prompthub/shared/constants/platforms";
import { getRuntimeCapabilities } from "../../runtime";

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

const MAX_STAGGERED_ROWS = 12;

function getSafetyIconProps(level: SkillSafetyLevel): {
  Icon: typeof ShieldCheckIcon;
  className: string;
  label: string;
} {
  switch (level) {
    case "safe":
      return {
        Icon: ShieldCheckIcon,
        className: "text-emerald-500",
        label: "Safe",
      };
    case "warn":
      return {
        Icon: ShieldAlertIcon,
        className: "text-yellow-500",
        label: "Needs review",
      };
    case "high-risk":
      return {
        Icon: ShieldAlertIcon,
        className: "text-orange-500",
        label: "High risk",
      };
    case "blocked":
      return {
        Icon: ShieldAlertIcon,
        className: "text-destructive",
        label: "Blocked",
      };
  }
}

function normalizePlatformStatusMap(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, boolean] => {
      const [, installed] = entry;
      return typeof installed === "boolean";
    }),
  );
}

interface SkillListViewProps {
  skills: Skill[];
  skillsWithStoreUpdates?: Set<string>;
  onQuickInstall: (skill: Skill) => void;
  onRequestDelete?: (skillId: string, skillName: string) => void;
  selectionMode?: boolean;
  selectedSkillIds?: Set<string>;
  onToggleSelection?: (skillId: string) => void;
}

const skillPlatformStatusCache = new Map<string, Record<string, boolean>>();

/**
 * Compact List View for Skills
 * 技能紧凑列表视图
 */
export function SkillListView({
  skills,
  skillsWithStoreUpdates = new Set<string>(),
  onQuickInstall,
  onRequestDelete,
  selectionMode = false,
  selectedSkillIds = new Set<string>(),
  onToggleSelection,
}: SkillListViewProps) {
  const { t } = useTranslation();
  const selectedSkillId = useSkillStore((state) => state.selectedSkillId);
  const selectSkill = useSkillStore((state) => state.selectSkill);
  const toggleFavorite = useSkillStore((state) => state.toggleFavorite);
  const filterType = useSkillStore((state) => state.filterType);
  const storeView = useSkillStore((state) => state.storeView);
  const runtimeCapabilities = getRuntimeCapabilities();

  // Platform status cache
  const [platformStatuses, setPlatformStatuses] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [supportedPlatforms, setSupportedPlatforms] = useState<SkillPlatform[]>(
    [],
  );
  const [detectedPlatforms, setDetectedPlatforms] = useState<string[]>([]);

  // Load platforms on mount
  useEffect(() => {
    if (!runtimeCapabilities.skillPlatformIntegration) {
      setSupportedPlatforms([]);
      setDetectedPlatforms([]);
      return;
    }

    const loadPlatforms = async () => {
      try {
        const platforms = await window.api.skill.getSupportedPlatforms();
        setSupportedPlatforms(platforms);
        const detected = await window.api.skill.detectPlatforms();
        setDetectedPlatforms(detected);
      } catch (e) {
        console.error("Failed to load platforms:", e);
      }
    };
    loadPlatforms();
  }, [runtimeCapabilities.skillPlatformIntegration]);

  // Load install status for all skills
  useEffect(() => {
    if (!runtimeCapabilities.skillPlatformIntegration) {
      setPlatformStatuses({});
      return;
    }

    const loadStatuses = async () => {
      const nextStatuses = Object.fromEntries(
        skills.map((skill) => [
          skill.id,
          skillPlatformStatusCache.get(skill.name) ?? {},
        ]),
      );
      setPlatformStatuses(nextStatuses);

      const missingNames = Array.from(
        new Set(
          skills
            .map((skill) => skill.name)
            .filter((name) => !skillPlatformStatusCache.has(name)),
        ),
      );

      if (missingNames.length === 0) {
        return;
      }

      try {
        const statusByName = (await window.api.skill.getMdInstallStatusBatch(
          missingNames,
        )) as Record<string, unknown>;

        for (const [name, status] of Object.entries(statusByName)) {
          skillPlatformStatusCache.set(
            name,
            normalizePlatformStatusMap(status),
          );
        }

        setPlatformStatuses(
          Object.fromEntries(
            skills.map((skill) => [
              skill.id,
              skillPlatformStatusCache.get(skill.name) ?? {},
            ]),
          ),
        );
      } catch (error) {
        console.error("Failed to load install status batch:", error);
      }
    };
    if (skills.length > 0) {
      void loadStatuses();
    } else {
      setPlatformStatuses({});
    }
  }, [runtimeCapabilities.skillPlatformIntegration, skills]);

  const availablePlatforms = useMemo(() => {
    return supportedPlatforms.filter((p) => detectedPlatforms.includes(p.id));
  }, [supportedPlatforms, detectedPlatforms]);

  // Get install count for a skill
  const getInstallCount = (skillId: string) => {
    const status = platformStatuses[skillId];
    if (!status) return 0;
    return Object.values(status).filter(Boolean).length;
  };

  if (skills.length === 0) {
    const isDistributionView = storeView === "distribution";
    const webSkillLibraryMode =
      !runtimeCapabilities.skillDistribution && !runtimeCapabilities.skillStore;
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground animate-in fade-in zoom-in-95 duration-500 py-20">
        <div className="p-8 bg-accent/30 rounded-full mb-6 relative">
          <CuboidIcon className="w-20 h-20 opacity-20" />
          <div className="absolute inset-0 border-4 border-primary/10 rounded-full animate-pulse" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {isDistributionView
            ? t("skill.noSkills", "暂无技能")
            : filterType === "favorites"
              ? t("skill.noFavorites", "暂无收藏技能")
              : t("skill.noSkills", "暂无技能")}
        </h3>
        <p className="text-sm opacity-70 mb-8 max-w-sm text-center">
          {webSkillLibraryMode
            ? t(
                "skill.webLibraryHint",
                "Create or import your own skills here. Platform distribution and skill marketplaces are desktop-only.",
              )
            : isDistributionView
            ? t(
                "skill.noDistributionSkillsHint",
                "先导入 skill，再在这里安装、同步或卸载到 Claude、Cursor 等平台。",
              )
            : filterType === "favorites"
              ? t("skill.noFavoritesHint", "点击技能卡片上的星标添加收藏")
              : t(
                  "skill.noSkillsHint",
                  "从 Skill 商店添加、扫描本地环境或手动创建技能开始使用",
                )}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="w-full">
        <div className="divide-y divide-border">
          {skills.map((skill, index) => {
            const isSelected = selectedSkillId === skill.id;
            const isChecked = selectedSkillIds.has(skill.id);
            const installCount = getInstallCount(skill.id);
            const totalPlatforms = availablePlatforms.length;
            const hasStoreUpdate = skillsWithStoreUpdates.has(skill.id);
            const visibleTags = normalizeStringArray(skill.tags).slice(0, 3);

            return (
              <div
                key={skill.id}
                onClick={() => {
                  if (selectionMode) {
                    onToggleSelection?.(skill.id);
                    return;
                  }
                  selectSkill(skill.id);
                }}
                style={{
                  animationDelay: `${Math.min(index, MAX_STAGGERED_ROWS) * 30}ms`,
                  contentVisibility: "auto",
                  containIntrinsicSize: "84px",
                }}
                className={`group flex items-center gap-4 px-6 py-4 cursor-pointer transition-all animate-in fade-in slide-in-from-left-2 ${
                  selectionMode && isChecked
                    ? "bg-primary/8"
                    : isSelected
                      ? "bg-primary/5"
                      : "hover:bg-accent/50"
                }`}
              >
                {selectionMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelection?.(skill.id);
                    }}
                    className={`shrink-0 p-1 rounded-md transition-colors ${
                      isChecked
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                    title={
                      isChecked
                        ? t("common.selected", "已选中")
                        : t("common.select", "选择")
                    }
                  >
                    {isChecked ? (
                      <CheckSquareIcon className="w-4 h-4" />
                    ) : (
                      <SquareIcon className="w-4 h-4" />
                    )}
                  </button>
                )}

                {/* Icon */}
                <div className="shrink-0">
                  <SkillIcon
                    iconUrl={skill.icon_url}
                    iconEmoji={skill.icon_emoji}
                    backgroundColor={skill.icon_background}
                    name={skill.name}
                    size="md"
                    className={
                      isSelected
                        ? "ring-2 ring-primary shadow-lg shadow-primary/20"
                        : ""
                    }
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`font-semibold truncate transition-colors ${isSelected ? "text-primary" : "text-foreground group-hover:text-primary"}`}
                    >
                      {skill.name}
                    </h3>
                    {hasStoreUpdate ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-300"
                        title={t("skill.updateAvailable", "Update available")}
                      >
                        <BellDotIcon className="h-3 w-3 animate-pulse" />
                        {t("skill.updateAvailable", "Update available")}
                      </span>
                    ) : null}
                    {/* Safety shield icon */}
                    {skill.safetyReport ? (
                      (() => {
                        const { Icon, className, label } = getSafetyIconProps(
                          skill.safetyReport.level,
                        );
                        return (
                          <span
                            title={`${t("skill.safetyLevelLabel", "Safety")}: ${label}`}
                          >
                            <Icon
                              className={`w-3.5 h-3.5 shrink-0 ${className}`}
                            />
                          </span>
                        );
                      })()
                    ) : (
                      <span
                        title={t(
                          "skill.safetyAssessmentEmpty",
                          "No safety scan run yet",
                        )}
                      >
                        <ShieldIcon className="w-3.5 h-3.5 shrink-0 text-muted-foreground/30" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {skill.description || t("skill.defaultDescription")}
                  </p>
                  {visibleTags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {visibleTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Platform indicators */}
                {runtimeCapabilities.skillPlatformIntegration && totalPlatforms > 0 && (
                  <div className="flex items-center gap-1 shrink-0">
                    {availablePlatforms.slice(0, 3).map((platform) => {
                      const isInstalled =
                        platformStatuses[skill.id]?.[platform.id];
                      return (
                        <div
                          key={platform.id}
                          className="flex items-center justify-center"
                          title={`${platform.name}: ${isInstalled ? t("skill.installed") : t("skill.notInstalled", "未安装")}`}
                        >
                          <PlatformIcon
                            platformId={platform.id}
                            size={16}
                            className={
                              isInstalled ? "opacity-100" : "opacity-40"
                            }
                          />
                        </div>
                      );
                    })}
                    <span className="text-[10px] text-primary font-medium ml-1">
                      {installCount}/{totalPlatforms}
                    </span>
                  </div>
                )}

                {/* Actions */}
                {!selectionMode && (
                  <div className="flex items-center gap-1 shrink-0">
                    {runtimeCapabilities.skillPlatformIntegration && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickInstall(skill);
                        }}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all active:scale-90"
                        title={t("skill.quickInstall", "快速安装")}
                      >
                        <DownloadIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(skill.id);
                      }}
                      className={`p-2 rounded-lg transition-all active:scale-90 ${
                        skill.is_favorite
                          ? "text-yellow-500 hover:text-yellow-600"
                          : "text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10"
                      }`}
                      title={
                        skill.is_favorite
                          ? t("skill.removeFavorite")
                          : t("skill.addFavorite")
                      }
                    >
                      <StarIcon
                        className={`w-4 h-4 ${skill.is_favorite ? "fill-current" : ""}`}
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onRequestDelete) {
                          onRequestDelete(skill.id, skill.name);
                        }
                      }}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all active:scale-90"
                      title={t("common.delete")}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
