import React, { useEffect, useMemo, lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CuboidIcon,
  RefreshCwIcon,
  TrashIcon,
  StarIcon,
  SendIcon,
  LayoutGridIcon,
  ListIcon,
  FolderInputIcon,
  CheckSquareIcon,
  SquareIcon,
  XIcon,
  TagsIcon,
} from "lucide-react";
import { SkillGalleryCard } from "./SkillGalleryCard";
import { SkillRenderBoundary } from "./SkillRenderBoundary";
import { useSkillStore } from "../../stores/skill.store";
import { useSettingsStore } from "../../stores/settings.store";
import { SkillQuickInstall } from "./SkillQuickInstall";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { useToast } from "../ui/Toast";
import type { Skill, ScannedSkill } from "@prompthub/shared/types";
import { updateSkillTags, type SkillBatchTagMode } from "./batch-utils";
import { filterVisibleSkills } from "../../services/skill-filter";
import { getRuntimeCapabilities } from "../../runtime";
import { useSkillStoreRemoteSync } from "./store-remote-sync";

const MAX_STAGGERED_CARDS = 10;
const CARD_STAGGER_MS = 50;
const LARGE_SKILL_LIST_THRESHOLD = 120;
const INITIAL_SKILL_RENDER_COUNT = 120;
const SKILL_RENDER_CHUNK_SIZE = 120;
const SKILL_RENDER_CHUNK_DELAY_MS = 24;

// Lazy load list view for better performance
// 懒加载列表视图以提升性能
const SkillListView = lazy(() =>
  import("./SkillListView").then((m) => ({ default: m.SkillListView })),
);
const SkillFullDetailPage = lazy(() =>
  import("./SkillFullDetailPage").then((m) => ({
    default: m.SkillFullDetailPage,
  })),
);
const SkillStore = lazy(() =>
  import("./SkillStore").then((m) => ({ default: m.SkillStore })),
);
const SkillProjectsView = lazy(() =>
  import("./SkillProjectsView").then((m) => ({ default: m.SkillProjectsView })),
);
const SkillScanPreview = lazy(() =>
  import("./SkillScanPreview").then((m) => ({ default: m.SkillScanPreview })),
);
const SkillBatchDeployDialog = lazy(() =>
  import("./SkillBatchDeployDialog").then((m) => ({
    default: m.SkillBatchDeployDialog,
  })),
);
const SkillBatchTagDialog = lazy(() =>
  import("./SkillBatchTagDialog").then((m) => ({
    default: m.SkillBatchTagDialog,
  })),
);

export function SkillManager() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const skills = useSkillStore((state) => state.skills);
  const loadSkills = useSkillStore((state) => state.loadSkills);
  const deleteSkill = useSkillStore((state) => state.deleteSkill);
  const toggleFavorite = useSkillStore((state) => state.toggleFavorite);
  const updateSkill = useSkillStore((state) => state.updateSkill);
  const isLoading = useSkillStore((state) => state.isLoading);
  const selectedSkillId = useSkillStore((state) => state.selectedSkillId);
  const selectSkill = useSkillStore((state) => state.selectSkill);
  const filterType = useSkillStore((state) => state.filterType);
  const searchQuery = useSkillStore((state) => state.searchQuery);
  const viewMode = useSkillStore((state) => state.viewMode);
  const setViewMode = useSkillStore((state) => state.setViewMode);
  const storeView = useSkillStore((state) => state.storeView);
  const setStoreView = useSkillStore((state) => state.setStoreView);
  const setFilterType = useSkillStore((state) => state.setFilterType);
  const deployedSkillNames = useSkillStore((state) => state.deployedSkillNames);
  const loadDeployedStatus = useSkillStore((state) => state.loadDeployedStatus);
  const skillFilterTags = useSkillStore((state) => state.filterTags);
  const customSkillScanPaths = useSettingsStore(
    (state) => state.customSkillScanPaths,
  );
  const runtimeCapabilities = getRuntimeCapabilities();
  const webSkillLibraryMode =
    !runtimeCapabilities.skillDistribution && !runtimeCapabilities.skillStore;
  const effectiveStoreView = webSkillLibraryMode ? "my-skills" : storeView;
  const effectiveFilterType =
    webSkillLibraryMode &&
    (filterType === "installed" ||
      filterType === "deployed" ||
      filterType === "pending")
      ? "all"
      : filterType;
  const isDistributionView = effectiveStoreView === "distribution";

  // Get filtered skills - filter directly in useMemo instead of using store function
  // 直接在 useMemo 中过滤，而不是使用 store 函数（避免函数引用作为依赖）
  const filteredSkills = useMemo(() => {
    return filterVisibleSkills({
      deployedSkillNames,
      filterTags: skillFilterTags,
      filterType: effectiveFilterType,
      searchQuery,
      skills,
      storeView: effectiveStoreView,
    });
  }, [
    deployedSkillNames,
    effectiveFilterType,
    effectiveStoreView,
    skillFilterTags,
    searchQuery,
    skills,
  ]);

  // Quick install state
  // 快速安装状态
  const [quickInstallSkill, setQuickInstallSkill] = useState<Skill | null>(
    null,
  );

  // Scan preview state
  // 扫描预览状态
  const [showScanPreview, setShowScanPreview] = useState(false);
  const [showBatchDeployDialog, setShowBatchDeployDialog] = useState(false);
  const [showBatchTagDialog, setShowBatchTagDialog] = useState(false);
  const [scannedSkills, setScannedSkills] = useState<ScannedSkill[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [renderedSkillCount, setRenderedSkillCount] = useState(() =>
    filteredSkills.length <= LARGE_SKILL_LIST_THRESHOLD
      ? filteredSkills.length
      : Math.min(INITIAL_SKILL_RENDER_COUNT, filteredSkills.length),
  );
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<string>>(
    new Set(),
  );
  const { remoteStoreEntries } = useSkillStoreRemoteSync({
    eagerRemoteSources: "all",
  });

  const scanLocalPreview = useSkillStore((state) => state.scanLocalPreview);
  const importScannedSkills = useSkillStore(
    (state) => state.importScannedSkills,
  );
  const skillsWithStoreUpdates = useMemo(() => {
    const registrySkillBySlug = new Map(
      Object.values(remoteStoreEntries)
        .flatMap((entry) => entry.skills)
        .map((skill) => [skill.slug, skill]),
    );

    return new Set(
      skills
        .filter((skill) => {
          if (!skill.registry_slug) {
            return false;
          }

          const registrySkill = registrySkillBySlug.get(skill.registry_slug);
          if (!registrySkill) {
            return false;
          }

          if (skill.installed_content_hash) {
            return skill.installed_version !== registrySkill.version;
          }

          const installedVersion = skill.installed_version ?? skill.version;
          return Boolean(
            installedVersion && installedVersion !== registrySkill.version,
          );
        })
        .map((skill) => skill.id),
    );
  }, [remoteStoreEntries, skills]);

  // Delete confirmation dialog state
  // 删除确认对话框状态
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    skillIds: string[];
    skillNames: string[];
  }>({ isOpen: false, skillIds: [], skillNames: [] });

  const handleScanLocal = async (customPaths?: string[]) => {
    if (!runtimeCapabilities.skillLocalScan) {
      return;
    }

    setIsScanning(true);
    try {
      const result = await scanLocalPreview(customPaths);
      setScannedSkills(result);
      setShowScanPreview(true);
    } catch (err) {
      console.error("Failed to scan local skills:", err);
    } finally {
      setIsScanning(false);
    }
  };

  // Re-scan handler passed down to the preview modal
  // 传给预览弹窗的重新扫描回调
  const handleRescan = async (customPaths: string[]) => {
    if (!runtimeCapabilities.skillLocalScan) {
      return;
    }

    const result = await scanLocalPreview(customPaths);
    setScannedSkills(result);
  };

  const handleImportScanned = async (
    skillsToImport: ScannedSkill[],
    userTagsByPath?: Record<string, string[]>,
  ) => {
    const result = await importScannedSkills(skillsToImport, userTagsByPath);
    // Refresh deployed status after import
    if (runtimeCapabilities.skillDistribution) {
      await loadDeployedStatus();
    }
    return result.importedCount;
  };

  const visibleSkills = useMemo(() => {
    if (filteredSkills.length <= LARGE_SKILL_LIST_THRESHOLD) {
      return filteredSkills;
    }

    return filteredSkills.slice(0, renderedSkillCount);
  }, [filteredSkills, renderedSkillCount]);
  const selectedSkills = useMemo(
    () => filteredSkills.filter((skill) => selectedSkillIds.has(skill.id)),
    [filteredSkills, selectedSkillIds],
  );
  const allVisibleSelected = useMemo(
    () =>
      filteredSkills.length > 0 &&
      filteredSkills.every((skill) => selectedSkillIds.has(skill.id)),
    [filteredSkills, selectedSkillIds],
  );

  // Load skills on mount, then defer deployed status to idle time
  useEffect(() => {
    if (!webSkillLibraryMode) {
      return;
    }

    if (storeView !== "my-skills") {
      setStoreView("my-skills");
    }

    if (
      filterType === "installed" ||
      filterType === "deployed" ||
      filterType === "pending"
    ) {
      setFilterType("all");
    }
  }, [filterType, setFilterType, setStoreView, storeView, webSkillLibraryMode]);

  useEffect(() => {
    let disposed = false;
    let idleId: number | undefined;
    let timeoutId: number | undefined;
    const browserWindow = window as Window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    void loadSkills().then(() => {
      if (disposed) return;

      if (!runtimeCapabilities.skillDistribution) {
        return;
      }

      const run = () => {
        if (!disposed) {
          void loadDeployedStatus();
        }
      };

      if (typeof browserWindow.requestIdleCallback === "function") {
        idleId = browserWindow.requestIdleCallback(run, { timeout: 800 });
      } else {
        timeoutId = window.setTimeout(run, 80);
      }
    });

    return () => {
      disposed = true;
      if (
        idleId !== undefined &&
        typeof browserWindow.cancelIdleCallback === "function"
      ) {
        browserWindow.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [loadSkills, loadDeployedStatus, runtimeCapabilities.skillDistribution]);

  useEffect(() => {
    const targetCount =
      filteredSkills.length <= LARGE_SKILL_LIST_THRESHOLD
        ? filteredSkills.length
        : Math.min(INITIAL_SKILL_RENDER_COUNT, filteredSkills.length);

    if (filteredSkills.length <= LARGE_SKILL_LIST_THRESHOLD) {
      if (renderedSkillCount !== targetCount) {
        setRenderedSkillCount(targetCount);
      }
      return;
    }

    let disposed = false;
    let timeoutId: number | undefined;

    if (renderedSkillCount !== targetCount) {
      setRenderedSkillCount(targetCount);
    }

    const scheduleNextChunk = () => {
      timeoutId = window.setTimeout(() => {
        if (disposed) return;

        setRenderedSkillCount((current) => {
          const next = Math.min(
            current + SKILL_RENDER_CHUNK_SIZE,
            filteredSkills.length,
          );
          if (next < filteredSkills.length) {
            scheduleNextChunk();
          }
          return next;
        });
      }, SKILL_RENDER_CHUNK_DELAY_MS);
    };

    if (INITIAL_SKILL_RENDER_COUNT < filteredSkills.length) {
      scheduleNextChunk();
    }

    return () => {
      disposed = true;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [filteredSkills]);

  useEffect(() => {
    if (storeView === "store") {
      setIsSelectionMode((prev) => (prev ? false : prev));
      setSelectedSkillIds((prev) => (prev.size === 0 ? prev : new Set()));
    }
  }, [storeView]);

  // Store view: show the skill store page
  // 商店视图：显示技能商店页面
  if (runtimeCapabilities.skillStore && effectiveStoreView === "store") {
    return (
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <SkillStore />
      </Suspense>
    );
  }

  if (runtimeCapabilities.skillLocalScan && effectiveStoreView === "projects") {
    return (
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <SkillProjectsView />
      </Suspense>
    );
  }

  // If a skill is selected, show full detail page (same behavior for both gallery and list views)
  // 如果选中了技能，显示全宽详情页（画廊和列表视图使用相同交互）
  if (selectedSkillId && !isSelectionMode) {
    return (
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <SkillRenderBoundary
          resetKey={selectedSkillId}
          title={t(
            "skill.detailRenderError",
            "This skill cannot be opened right now",
          )}
          description={t(
            "skill.detailRenderErrorHint",
            "This render error was contained so the page stays usable. You can go back to the list or retry loading the detail view now.",
          )}
          primaryActionLabel={t("common.back", "Back")}
          onPrimaryAction={() => selectSkill(null)}
          secondaryActionLabel={t("common.retry", "Retry")}
          onSecondaryAction={() => {
            void loadSkills().then(() => loadDeployedStatus());
          }}
        >
          <SkillFullDetailPage />
        </SkillRenderBoundary>
      </Suspense>
    );
  }

  const toggleSelectionMode = () => {
    setIsSelectionMode((prev) => !prev);
    setSelectedSkillIds((prev) => (prev.size === 0 ? prev : new Set()));
  };

  const toggleSkillSelection = (skillId: string) => {
    setSelectedSkillIds((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) {
        next.delete(skillId);
      } else {
        next.add(skillId);
      }
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedSkillIds(new Set());
      return;
    }
    setSelectedSkillIds(new Set(filteredSkills.map((skill) => skill.id)));
  };

  const handleBatchFavorite = async () => {
    const shouldFavorite = selectedSkills.some((skill) => !skill.is_favorite);
    for (const skill of selectedSkills) {
      if (skill.is_favorite !== shouldFavorite) {
        await toggleFavorite(skill.id);
      }
    }
    setSelectedSkillIds(new Set());
  };

  const handleBatchDelete = async () => {
    if (selectedSkills.length === 0) return;
    setDeleteConfirm({
      isOpen: true,
      skillIds: selectedSkills.map((s) => s.id),
      skillNames: selectedSkills.map((s) => s.name),
    });
  };

  const handleBatchDeploy = () => {
    if (selectedSkills.length === 0) return;
    setShowBatchDeployDialog(true);
  };

  const handleBatchTags = () => {
    if (selectedSkills.length === 0) return;
    setShowBatchTagDialog(true);
  };

  const handleBatchTagSubmit = async (tag: string, mode: SkillBatchTagMode) => {
    const results = await Promise.allSettled(
      selectedSkills.map(async (skill) => {
        const nextTags = updateSkillTags(skill.tags, tag, mode);
        const previousTags = skill.tags || [];

        if (JSON.stringify(nextTags) === JSON.stringify(previousTags)) {
          return { updated: false, name: skill.name };
        }

        await updateSkill(skill.id, { tags: nextTags });
        return { updated: true, name: skill.name };
      }),
    );

    const updatedCount = results.filter(
      (result) => result.status === "fulfilled" && result.value.updated,
    ).length;
    const failedCount = results.filter(
      (result) => result.status === "rejected",
    ).length;

    showToast(
      failedCount > 0
        ? t("skill.batchTagPartialFailure", {
            updated: updatedCount,
            failed: failedCount,
            defaultValue: `标签批量更新完成，成功 ${updatedCount} 个，失败 ${failedCount} 个`,
          })
        : mode === "add"
          ? t("skill.batchTagAddSuccess", {
              count: updatedCount,
              defaultValue: `已为 ${updatedCount} 个 skill 添加标签`,
            })
          : t("skill.batchTagRemoveSuccess", {
              count: updatedCount,
              defaultValue: `已从 ${updatedCount} 个 skill 移除标签`,
            }),
      failedCount > 0 ? "error" : "success",
    );
    setSelectedSkillIds(new Set());
  };

  const confirmDelete = async () => {
    for (const id of deleteConfirm.skillIds) {
      await deleteSkill(id);
    }
    setDeleteConfirm({ isOpen: false, skillIds: [], skillNames: [] });
    setSelectedSkillIds(new Set());
    setIsSelectionMode(false);
  };

  const headerTitle = isDistributionView
    ? t("nav.distribution", "Distribution")
    : effectiveFilterType === "favorites"
      ? t("nav.favorites", "Favorites")
      : effectiveFilterType === "installed"
        ? t("skill.imported", "Imported")
        : effectiveFilterType === "deployed"
          ? t("skill.deployed", "Distributed")
          : effectiveFilterType === "pending"
            ? t("skill.pendingDeployment", "Pending")
            : t("nav.mySkills", "My Skills");

  const emptyStateTitle = isDistributionView
    ? t("skill.noSkills", "No skills yet")
    : effectiveFilterType === "favorites"
      ? t("skill.noFavorites", "No favorite skills")
      : effectiveFilterType === "installed"
        ? t("skill.noImportedSkills", "No imported skills yet")
        : effectiveFilterType === "deployed"
          ? t("skill.noDeployedSkills", "No distributed skills yet")
          : effectiveFilterType === "pending"
            ? t("skill.noPendingSkills", "No pending skills")
            : t("skill.noSkills", "No skills yet");

  const emptyStateHint = webSkillLibraryMode
    ? t(
        "skill.webLibraryHint",
        "Create or import your own skills here. Platform distribution and skill marketplaces are desktop-only.",
      )
    : isDistributionView
    ? t(
        "skill.noDistributionSkillsHint",
        "Import skills first, then install, sync, or uninstall them to Claude, Cursor, and other platforms here.",
      )
      : effectiveFilterType === "favorites"
      ? t(
          "skill.noFavoritesHint",
          "Click the star on skill cards to add favorites",
        )
      : effectiveFilterType === "installed"
        ? t(
            "skill.noImportedSkillsHint",
            "After importing from Skill Store, local scan, GitHub, or manual creation, they will appear here.",
          )
        : effectiveFilterType === "deployed"
          ? t(
              "skill.noDeployedSkillsHint",
              "After distributing skills to Claude, Cursor, or other platforms, they will show up here.",
            )
          : effectiveFilterType === "pending"
            ? t(
                "skill.noPendingSkillsHint",
                "Skills not yet distributed to any platform will appear here.",
              )
            : t(
                "skill.noSkillsHint",
                "Import skills from Skill Store, scan local environments, or create one manually to get started",
              );

  const headerSubtitle = webSkillLibraryMode
    ? t(
        "skill.webLibrarySubtitle",
        "Manage your personal skill library in the self-hosted web workspace.",
      )
    : isDistributionView
    ? t(
        "skill.distributionHint",
        "Manage install, sync, and uninstall across connected platforms.",
      )
    : t(
        "skill.workspaceHint",
        "Manage all imported skills in one place, regardless of where they came from.",
      );
  const distributionStatsLabel = isDistributionView
    ? t("skill.distributionStats", {
        deployed: deployedSkillNames.size,
        total: skills.length,
        defaultValue: `${deployedSkillNames.size} deployed / ${skills.length} total`,
      })
    : null;

  return (
    <div className="flex-1 flex flex-row h-full app-wallpaper-section overflow-hidden relative">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-border app-wallpaper-panel-strong px-4 py-4 z-10 sm:px-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <CuboidIcon className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">{headerTitle}</h2>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-white/5 bg-accent/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {isDistributionView
                      ? distributionStatsLabel
                      : `${filteredSkills.length}${effectiveFilterType !== "all" ? ` / ${skills.length}` : ""}`}
                  </span>
                  {filteredSkills.length > visibleSkills.length && (
                    <span className="text-[11px] text-muted-foreground">
                      {t("skill.progressiveRendering", {
                        rendered: visibleSkills.length,
                        total: filteredSkills.length,
                        defaultValue: `正在分批渲染 ${visibleSkills.length}/${filteredSkills.length}`,
                      })}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {headerSubtitle}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start lg:self-center lg:justify-end">
                {!isSelectionMode ? (
                  <button
                    onClick={toggleSelectionMode}
                    className="inline-flex items-center gap-2 rounded-xl border border-border app-wallpaper-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/25 hover:bg-accent"
                    title={t("skill.batchManage", "Batch Manage")}
                  >
                    <CheckSquareIcon className="w-4 h-4" />
                    {t("skill.batchManage", "Batch Manage")}
                  </button>
                ) : null}
                <div className="flex items-center bg-muted rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode("gallery")}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === "gallery"
                        ? "app-wallpaper-surface text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title={t("skill.galleryView", "Gallery View")}
                  >
                    <LayoutGridIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === "list"
                        ? "app-wallpaper-surface text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title={t("skill.listView", "List View")}
                  >
                    <ListIcon className="w-4 h-4" />
                  </button>
                </div>
                {runtimeCapabilities.skillLocalScan && (
                  <>
                    <div className="h-4 w-px bg-border" />
                    <button
                      onClick={() => handleScanLocal(customSkillScanPaths)}
                      disabled={isScanning}
                      className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                      title={t("skill.scanLocal", "Scan local skills")}
                    >
                      <FolderInputIcon
                        className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`}
                      />
                    </button>
                  </>
                )}
                <div className="h-4 w-px bg-border" />
                <button
                  onClick={async () => {
                    await loadSkills();
                    if (runtimeCapabilities.skillDistribution) {
                      await loadDeployedStatus();
                    }
                  }}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
                  title={t("settings.refresh")}
                >
                  <RefreshCwIcon
                    className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>

            {isSelectionMode ? (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-primary/15 bg-primary/[0.06] p-2">
                <div className="px-3 py-2">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-primary/80">
                    {t("skill.selectionMode", "Batch Mode")}
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-foreground">
                    {t("skill.selectedCount", {
                      count: selectedSkillIds.size,
                      defaultValue: `${selectedSkillIds.size} selected`,
                    })}
                  </div>
                </div>
                <button
                  onClick={handleSelectAllVisible}
                  className="inline-flex items-center gap-2 rounded-xl border border-border app-wallpaper-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/25 hover:bg-accent"
                  title={
                    allVisibleSelected
                      ? t("common.clear", "Clear")
                      : t("common.selectAll", "Select All")
                  }
                >
                  {allVisibleSelected ? (
                    <CheckSquareIcon className="w-4 h-4 text-primary" />
                  ) : (
                    <SquareIcon className="w-4 h-4 text-muted-foreground" />
                  )}
                  {allVisibleSelected
                    ? t("common.clear", "Clear")
                    : t("common.selectAll", "Select All")}
                </button>
                <button
                  onClick={handleBatchFavorite}
                  disabled={selectedSkillIds.size === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-border app-wallpaper-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/25 hover:bg-accent disabled:opacity-50"
                  title={
                    selectedSkills.every((skill) => skill.is_favorite)
                      ? t("skill.removeFavorite", "Remove Favorite")
                      : t("skill.addFavorite", "Add Favorite")
                  }
                >
                  <StarIcon className="w-4 h-4 text-amber-500" />
                  {selectedSkills.every((skill) => skill.is_favorite)
                    ? t("skill.removeFavorite", "Remove Favorite")
                    : t("skill.addFavorite", "Add Favorite")}
                </button>
                <button
                  onClick={handleBatchTags}
                  disabled={selectedSkillIds.size === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-border app-wallpaper-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/25 hover:bg-accent disabled:opacity-50"
                  title={t("skill.batchTags", "Batch Tags")}
                >
                  <TagsIcon className="w-4 h-4 text-primary" />
                  {t("skill.batchTags", "Batch Tags")}
                </button>
                {runtimeCapabilities.skillDistribution && (
                  <button
                    onClick={handleBatchDeploy}
                    disabled={selectedSkillIds.size === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                    title={t("skill.batchDeploy", "Batch Deploy")}
                  >
                    <SendIcon className="w-4 h-4" />
                    {t("skill.batchDeploy", "Batch Deploy")}
                  </button>
                )}
                <button
                  onClick={handleBatchDelete}
                  disabled={selectedSkillIds.size === 0}
                  className="inline-flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/15 disabled:opacity-50"
                  title={t("common.delete", "Delete")}
                >
                  <TrashIcon className="w-4 h-4" />
                  {t("common.delete", "Delete")}
                </button>
                <button
                  onClick={toggleSelectionMode}
                  className="inline-flex items-center gap-2 rounded-xl border border-border app-wallpaper-surface px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title={t("common.cancel", "Cancel")}
                >
                  <XIcon className="w-4 h-4" />
                  {t("common.cancel", "Cancel")}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {viewMode === "list" ? (
            /* List View */
            /* 列表视图 */
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
              <SkillListView
                skills={visibleSkills}
                skillsWithStoreUpdates={skillsWithStoreUpdates}
                onQuickInstall={setQuickInstallSkill}
                onRequestDelete={(id, name) =>
                  setDeleteConfirm({
                    isOpen: true,
                    skillIds: [id],
                    skillNames: [name],
                  })
                }
                selectionMode={isSelectionMode}
                selectedSkillIds={selectedSkillIds}
                onToggleSelection={toggleSkillSelection}
              />
            </Suspense>
          ) : (
            /* Gallery View */
            /* 画廊视图 */
            <div className="p-6">
              {filteredSkills.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground animate-in fade-in zoom-in-95 duration-500 py-20">
                  <div className="p-8 bg-accent/30 rounded-full mb-6 relative">
                    <CuboidIcon className="w-20 h-20 opacity-20" />
                    <div className="absolute inset-0 border-4 border-primary/10 rounded-full animate-pulse" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {emptyStateTitle}
                  </h3>
                  <p className="text-sm opacity-70 mb-8 max-w-sm text-center">
                    {emptyStateHint}
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {visibleSkills.map((skill, index) => {
                    const isSelected = selectedSkillIds.has(skill.id);

                    return (
                      <SkillGalleryCard
                        key={skill.id}
                        animationDelayMs={
                          filteredSkills.length > LARGE_SKILL_LIST_THRESHOLD
                            ? 0
                            : Math.min(index, MAX_STAGGERED_CARDS) *
                              CARD_STAGGER_MS
                        }
                        hasStoreUpdate={skillsWithStoreUpdates.has(skill.id)}
                        isSelected={isSelected}
                        isSelectionMode={isSelectionMode}
                        onDelete={(selectedSkill) =>
                          setDeleteConfirm({
                            isOpen: true,
                            skillIds: [selectedSkill.id],
                            skillNames: [selectedSkill.name],
                          })
                        }
                        onOpen={selectSkill}
                        onQuickInstall={setQuickInstallSkill}
                        onToggleFavorite={toggleFavorite}
                        onToggleSelection={toggleSkillSelection}
                        skill={skill}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Install Modal */}
      {/* 快速安装弹窗 */}
      {runtimeCapabilities.skillPlatformIntegration && quickInstallSkill && (
        <SkillQuickInstall
          skill={quickInstallSkill}
          onClose={() => setQuickInstallSkill(null)}
        />
      )}

      {/* Scan Preview Modal */}
      {/* 扫描预览弹窗 */}
      {runtimeCapabilities.skillLocalScan && showScanPreview && (
        <Suspense fallback={null}>
          <SkillScanPreview
            scannedSkills={scannedSkills}
            installedPaths={
              new Set(
                skills.flatMap((s) =>
                  [s.local_repo_path, s.source_url].filter(
                    (v): v is string => typeof v === "string" && v.length > 0,
                  ),
                ),
              )
            }
            onImport={handleImportScanned}
            onRescan={handleRescan}
            onClose={() => setShowScanPreview(false)}
          />
        </Suspense>
      )}

      {runtimeCapabilities.skillDistribution && showBatchDeployDialog && (
        <Suspense fallback={null}>
          <SkillBatchDeployDialog
            skills={selectedSkills}
            onClose={() => setShowBatchDeployDialog(false)}
            onComplete={async () => {
              if (runtimeCapabilities.skillDistribution) {
                await loadDeployedStatus();
              }
            }}
          />
        </Suspense>
      )}

      {showBatchTagDialog && (
        <Suspense fallback={null}>
          <SkillBatchTagDialog
            skills={selectedSkills}
            onClose={() => setShowBatchTagDialog(false)}
            onSubmit={handleBatchTagSubmit}
          />
        </Suspense>
      )}
      {/* Delete confirmation dialog */}
      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() =>
          setDeleteConfirm({ isOpen: false, skillIds: [], skillNames: [] })
        }
        onConfirm={confirmDelete}
        variant="destructive"
        title={t("skill.confirmDeleteTitle", "Confirm Delete")}
        message={
          <div className="space-y-2">
            <p>
              {deleteConfirm.skillNames.length === 1
                ? t("skill.confirmDeleteSingle", {
                    name: deleteConfirm.skillNames[0],
                    defaultValue: `Are you sure you want to delete skill "${deleteConfirm.skillNames[0]}"?`,
                  })
                : t("skill.confirmDeleteMultiple", {
                    count: deleteConfirm.skillNames.length,
                    defaultValue: `Are you sure you want to delete ${deleteConfirm.skillNames.length} selected skills?`,
                  })}
            </p>
            <p className="text-xs text-muted-foreground/80">
              {t(
                "skill.deleteHint",
                "This will only remove them from the PromptHub library without deleting the source directory. Any platform distributions will also be uninstalled.",
              )}
            </p>
          </div>
        }
        confirmText={t("common.delete", "Delete")}
        cancelText={t("common.cancel", "Cancel")}
      />
    </div>
  );
}
