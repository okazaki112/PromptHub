import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BookOpenIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  Loader2Icon,
  RefreshCwIcon,
  DownloadIcon,
  SendIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  SearchIcon,
  FolderIcon,
  CheckCircle2Icon,
} from "lucide-react";

import type { ScannedSkill, Skill, SkillProject } from "@prompthub/shared/types";
import { useSettingsStore } from "../../stores/settings.store";
import { useSkillStore } from "../../stores/skill.store";
import { useToast } from "../ui/Toast";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import { SkillQuickInstall } from "./SkillQuickInstall";
import { filterVisibleScannedSkills } from "../../services/skill-filter";
import { SkillFullDetailPage } from "./SkillFullDetailPage";
import { buildProjectDetailSkill } from "./project-detail-adapter";

const OPEN_CREATE_SKILL_PROJECT_MODAL_EVENT = "open-create-skill-project-modal";
const PROJECT_SECTION_HEADER_CLASS =
  "h-[152px] border-b border-border app-wallpaper-panel-strong";

function normalizePathForComparison(value: string): string {
  return value.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
}

function inferProjectNameFromPath(rootPath: string): string {
  const normalized = rootPath.replace(/\\/g, "/").replace(/\/+$/, "");
  const segments = normalized.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? "";
}

function getProjectInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

function getExtraProjectScanPaths(rootPath: string, scanPaths: string[]): string[] {
  const normalizedRoot = normalizePathForComparison(rootPath);
  return scanPaths.filter(
    (entry) => normalizePathForComparison(entry) !== normalizedRoot,
  );
}

interface ProjectFormModalProps {
  isOpen: boolean;
  project?: SkillProject | null;
  onClose: () => void;
  onSubmit: (input: {
    name: string;
    rootPath: string;
    scanPaths: string[];
  }) => boolean | Promise<boolean>;
}

function ProjectFormModal({
  isOpen,
  project,
  onClose,
  onSubmit,
}: ProjectFormModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [rootPath, setRootPath] = useState("");
  const [scanPathInput, setScanPathInput] = useState("");
  const [scanPaths, setScanPaths] = useState<string[]>([]);
  const [isNameAutoDerived, setIsNameAutoDerived] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName(project?.name ?? "");
    setRootPath(project?.rootPath ?? "");
    setScanPaths(
      project ? getExtraProjectScanPaths(project.rootPath, project.scanPaths ?? []) : [],
    );
    setScanPathInput("");
    setIsNameAutoDerived(!project);
    setError(null);
  }, [isOpen, project]);

  useEffect(() => {
    if (!isOpen || !isNameAutoDerived) {
      return;
    }

    const inferredName = inferProjectNameFromPath(rootPath);
    setName(inferredName);
  }, [isNameAutoDerived, isOpen, rootPath]);

  const addScanPath = (value?: string) => {
    const nextPath = (value ?? scanPathInput).trim();
    if (!nextPath) {
      return;
    }
    setScanPaths((prev) =>
      prev.includes(nextPath) ? prev : [...prev, nextPath],
    );
    setScanPathInput("");
  };

  const removeScanPath = (targetPath: string) => {
    setScanPaths((prev) => prev.filter((path) => path !== targetPath));
  };

  const handlePickFolder = async (target: "root" | "scan") => {
    const selectedPath = await window.electron?.selectFolder?.();
    if (!selectedPath) {
      return;
    }

    if (target === "root") {
      setRootPath(selectedPath);
      return;
    }

    addScanPath(selectedPath);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !rootPath.trim()) {
      setError(
        t(
          "skill.projectFormRequired",
          "Project name and root path are required.",
        ),
      );
      return;
    }

    const didSave = await onSubmit({
      name: name.trim(),
      rootPath: rootPath.trim(),
      scanPaths,
    });
    if (didSave) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        project
          ? t("skill.editProject", "Edit Project")
          : t("skill.addProject", "Add Project")
      }
      size="lg"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            {t("skill.projectRootPath", "Project Root Path")}
          </label>
          <p className="text-xs text-muted-foreground">
            {t(
              "skill.projectRootPathFirstHint",
              "Choose the project root first. PromptHub can infer the project name and start scanning right away.",
            )}
          </p>
          <div className="flex gap-2">
            <Input
              className="flex-1"
              value={rootPath}
              onChange={(event) => {
                setRootPath(event.target.value);
              }}
              placeholder={t(
                "skill.projectRootPathPlaceholder",
                "/path/to/project",
              )}
            />
            <button
              type="button"
              onClick={() => void handlePickFolder("root")}
              className="inline-flex items-center gap-2 rounded-xl border border-border app-wallpaper-surface px-4 text-sm text-foreground transition-colors hover:bg-accent"
            >
              <FolderOpenIcon className="h-4 w-4" />
              {t("skill.browseFolder", "Browse")}
            </button>
          </div>
        </div>

        <Input
          label={t("skill.projectName", "Project Name")}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setIsNameAutoDerived(false);
          }}
          placeholder={t("skill.projectNamePlaceholder", "Workspace Project")}
          error={error ?? undefined}
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            {t("skill.projectScanPaths", "Scan Paths")}
          </label>
          <div className="flex gap-2">
            <Input
              className="flex-1"
              value={scanPathInput}
              onChange={(event) => setScanPathInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addScanPath();
                }
              }}
              placeholder={t(
                "skill.projectScanPathPlaceholder",
                "Optional extra directories to scan",
              )}
            />
            <button
              type="button"
              onClick={() => addScanPath()}
              className="inline-flex items-center gap-2 rounded-xl border border-border app-wallpaper-surface px-4 text-sm text-foreground transition-colors hover:bg-accent"
            >
              <PlusIcon className="h-4 w-4" />
              {t("common.add", "Add")}
            </button>
            <button
              type="button"
              onClick={() => void handlePickFolder("scan")}
              className="inline-flex items-center gap-2 rounded-xl border border-border app-wallpaper-surface px-4 text-sm text-foreground transition-colors hover:bg-accent"
            >
              <FolderOpenIcon className="h-4 w-4" />
              {t("skill.browseFolder", "Browse")}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t(
              "skill.projectScanPathsHint",
              "PromptHub always scans the project root plus default skill folders like .claude/skills, .agents/skills, skills, and .gemini. Add extra scan paths here only if your project uses custom locations.",
            )}
          </p>
          <div className="space-y-2">
            {scanPaths.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-3 py-3 text-xs text-muted-foreground">
                {t(
                  "skill.projectScanPathsEmpty",
                  "No extra scan paths configured yet. PromptHub will still scan the project root automatically.",
                )}
              </div>
            ) : (
              scanPaths.map((scanPath) => (
                <div
                  key={scanPath}
                  className="flex items-center gap-2 rounded-xl border border-border app-wallpaper-surface px-3 py-2"
                >
                  <FolderIcon className="h-4 w-4 text-primary" />
                  <span className="flex-1 truncate font-mono text-xs text-foreground">
                    {scanPath}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeScanPath(scanPath)}
                    className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border app-wallpaper-surface px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
          >
            {t("common.cancel", "Cancel")}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            {project
              ? t("common.save", "Save")
              : t("skill.addProject", "Add Project")}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function buildInstalledProjectPathSet(skills: Skill[]): Set<string> {
  return new Set(
    skills.flatMap((skill) =>
      [skill.local_repo_path, skill.source_url].filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      ),
    ),
  );
}

function inferDisplayPath(localPath: string): string {
  const parts = localPath.replace(/\\/g, "/").split("/").filter(Boolean);
  if (parts.length < 2) {
    return localPath;
  }

  return `.../${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
}

export function SkillProjectsView() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const skills = useSkillStore((state) => state.skills);
  const searchQuery = useSkillStore((state) => state.searchQuery);
  const scanProjectSkills = useSkillStore((state) => state.scanProjectSkills);
  const projectScanState = useSkillStore((state) => state.projectScanState);
  const selectedProjectId = useSkillStore((state) => state.selectedProjectId);
  const selectProject = useSkillStore((state) => state.selectProject);
  const selectSkill = useSkillStore((state) => state.selectSkill);
  const importScannedSkills = useSkillStore((state) => state.importScannedSkills);
  const loadDeployedStatus = useSkillStore((state) => state.loadDeployedStatus);
  const setStoreView = useSkillStore((state) => state.setStoreView);
  const skillProjects = useSettingsStore((state) => state.skillProjects);
  const addSkillProject = useSettingsStore((state) => state.addSkillProject);
  const updateSkillProject = useSettingsStore((state) => state.updateSkillProject);

  const [editingProject, setEditingProject] = useState<SkillProject | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [quickInstallSkill, setQuickInstallSkill] = useState<Skill | null>(null);
  const [isImportingPath, setIsImportingPath] = useState<string | null>(null);
  const [selectedProjectSkillPath, setSelectedProjectSkillPath] = useState<string | null>(null);
  const autoScannedProjectIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (skillProjects.length === 0) {
      if (selectedProjectId !== null) {
        selectProject(null);
      }
      return;
    }

    const hasSelectedProject = skillProjects.some(
      (project) => project.id === selectedProjectId,
    );
    if (!hasSelectedProject) {
      selectProject(skillProjects[0].id);
    }
  }, [selectProject, selectedProjectId, skillProjects]);

  const selectedProject = useMemo(() => {
    if (!selectedProjectId) {
      return skillProjects[0] ?? null;
    }
    return skillProjects.find((project) => project.id === selectedProjectId) ?? null;
  }, [selectedProjectId, skillProjects]);

  const currentProjectState =
    (selectedProject && projectScanState[selectedProject.id]) || null;
  const installedProjectPaths = useMemo(
    () => buildInstalledProjectPathSet(skills),
    [skills],
  );

  const visibleProjectSkills = useMemo(() => {
    return filterVisibleScannedSkills(
      currentProjectState?.scannedSkills || [],
      searchQuery,
    );
  }, [currentProjectState?.scannedSkills, searchQuery]);

  useEffect(() => {
    if (!visibleProjectSkills.length && selectedProjectSkillPath !== null) {
      setSelectedProjectSkillPath(null);
      return;
    }

    if (!selectedProjectSkillPath) {
      return;
    }

    const stillExists = visibleProjectSkills.some(
      (skill) => skill.localPath === selectedProjectSkillPath,
    );
    if (!stillExists) {
      setSelectedProjectSkillPath(null);
    }
  }, [selectedProjectSkillPath, visibleProjectSkills]);

  useEffect(() => {
    setSelectedProjectSkillPath(null);
  }, [selectedProjectId]);

  const handleOpenCreate = useCallback(() => {
    setEditingProject(null);
    setIsProjectModalOpen(true);
  }, []);

  useEffect(() => {
    const handleOpenProjectModal = () => {
      handleOpenCreate();
    };

    document.addEventListener(
      OPEN_CREATE_SKILL_PROJECT_MODAL_EVENT,
      handleOpenProjectModal,
    );

    return () => {
      document.removeEventListener(
        OPEN_CREATE_SKILL_PROJECT_MODAL_EVENT,
        handleOpenProjectModal,
      );
    };
  }, [handleOpenCreate]);

  const handleSaveProject = async (input: {
    name: string;
    rootPath: string;
    scanPaths: string[];
  }): Promise<boolean> => {
    try {
      if (editingProject) {
        updateSkillProject(editingProject.id, input);
        showToast(t("skill.projectUpdated", "Project updated"), "success");
      } else {
        const createdProject = addSkillProject(input);
        selectProject(createdProject.id);
        showToast(
          t("skill.projectCreatedAndScanning", "Project added. Scanning now..."),
          "success",
        );
        await handleScanProject(createdProject, { suppressToast: true });
      }
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showToast(
        errorMessage === "Skill project name and rootPath are required"
          ? t(
              "skill.projectFormRequired",
              "Project name and root path are required.",
            )
          : errorMessage === "Skill project root path already exists"
            ? t(
                "skill.projectRootPathExists",
                "This project root path is already registered.",
              )
            : errorMessage ||
                t("skill.projectSaveFailed", "Failed to save project"),
        "error",
      );
      return false;
    }
  };

  const handleScanProject = useCallback(
    async (project: SkillProject, options?: { suppressToast?: boolean }) => {
      try {
        const scanned = await scanProjectSkills(project);
        updateSkillProject(project.id, { lastScannedAt: Date.now() });
        if (!options?.suppressToast) {
          showToast(
            t("skill.projectScanComplete", {
              count: scanned.length,
              defaultValue: `Scanned ${scanned.length} skills`,
            }),
            "success",
          );
        }
        return scanned;
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : t("skill.projectScanFailed", "Failed to scan project skills"),
          "error",
        );
        throw error;
      }
    },
    [scanProjectSkills, showToast, t, updateSkillProject],
  );

  const handleImportProjectSkill = async (scannedSkill: ScannedSkill) => {
    setIsImportingPath(scannedSkill.localPath);
    try {
      let repoSkillMd: { content?: string } | null = null;
      if (!scannedSkill.instructions.trim()) {
        try {
          repoSkillMd =
            (await window.api.skill.readLocalFileByPath?.(
              scannedSkill.localPath,
              "SKILL.md",
            )) ?? null;
        } catch {
          repoSkillMd = null;
        }
      }
      const hydratedScannedSkill =
        repoSkillMd?.content && repoSkillMd.content.trim().length > 0
          ? {
              ...scannedSkill,
              instructions: repoSkillMd.content,
            }
          : scannedSkill;
      const result = await importScannedSkills([hydratedScannedSkill]);
      if (result.importedCount === 0) {
        throw new Error(
          result.failed[0]?.reason ||
            result.skipped[0]?.reason ||
            t("skill.importFailed", "Failed to import skills"),
        );
      }

      showToast(t("skill.projectImportSuccess", "Imported to My Skills"), "success");
      await loadDeployedStatus();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : t("skill.importFailed", "Failed to import skills"),
        "error",
      );
    } finally {
      setIsImportingPath(null);
    }
  };

  useEffect(() => {
    if (!selectedProject) {
      return;
    }

    const scanState = projectScanState[selectedProject.id];
    if (scanState?.isScanning || scanState?.scannedAt || scanState?.error) {
      return;
    }

    if (autoScannedProjectIdsRef.current.has(selectedProject.id)) {
      return;
    }

    autoScannedProjectIdsRef.current.add(selectedProject.id);
    void handleScanProject(selectedProject, { suppressToast: true }).catch(() => {
      return undefined;
    });
  }, [handleScanProject, projectScanState, selectedProject]);

  const importedLibrarySkillByPath = useMemo(() => {
    const pathMap = new Map<string, Skill>();
    for (const skill of skills) {
      if (skill.local_repo_path) {
        pathMap.set(skill.local_repo_path, skill);
      }
      if (skill.source_url) {
        pathMap.set(skill.source_url, skill);
      }
    }
    return pathMap;
  }, [skills]);

  const selectedScannedSkill = useMemo(
    () =>
      visibleProjectSkills.find(
        (skill) => skill.localPath === selectedProjectSkillPath,
      ) ?? null,
    [selectedProjectSkillPath, visibleProjectSkills],
  );

  const selectedImportedSkill = useMemo(
    () =>
      selectedScannedSkill
        ? importedLibrarySkillByPath.get(selectedScannedSkill.localPath) ?? null
        : null,
    [importedLibrarySkillByPath, selectedScannedSkill],
  );

  const selectedDetailSkill = useMemo(() => {
    if (!selectedProject || !selectedScannedSkill) {
      return null;
    }
    return buildProjectDetailSkill({
      scannedSkill: selectedScannedSkill,
      importedSkill: selectedImportedSkill,
      projectName: selectedProject.name,
    });
  }, [selectedImportedSkill, selectedProject, selectedScannedSkill]);

  const isShowingProjectDetail = Boolean(selectedScannedSkill && selectedDetailSkill);

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {isShowingProjectDetail ? (
        <SkillFullDetailPage
          overrideSkill={selectedDetailSkill ?? undefined}
          projectContext={
            selectedScannedSkill && selectedProject
              ? {
                  scannedSkill: selectedScannedSkill,
                  importedSkill: selectedImportedSkill,
                  projectName: selectedProject.name,
                }
              : null
          }
          projectActions={
            selectedScannedSkill && !selectedImportedSkill
              ? {
                  isImporting: isImportingPath === selectedScannedSkill.localPath,
                  onImport: () => handleImportProjectSkill(selectedScannedSkill),
                }
              : null
          }
          onBack={() => setSelectedProjectSkillPath(null)}
        />
      ) : (
        <>
      <div className="w-80 shrink-0 border-r border-border app-wallpaper-panel-strong">
        <div className={PROJECT_SECTION_HEADER_CLASS}>
          <div className="flex h-full items-start justify-between gap-4 px-4 py-5">
            <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">
              {t("nav.projects", "Projects")}
            </h2>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {t(
                "skill.projectsSidebarHint",
                "Register project directories and manage their local skills.",
              )}
            </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary/90"
              title={t("skill.addProject", "Add Project")}
            >
              <FolderPlusIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2 overflow-y-auto p-3">
          {skillProjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              <FolderIcon className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <div className="font-medium text-foreground">
                {t("skill.noProjects", "No projects yet")}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t(
                  "skill.noProjectsHint",
                  "Add a project root to scan and manage project-local skills.",
                )}
              </div>
            </div>
          ) : (
            skillProjects.map((project) => {
              const isActive = selectedProject?.id === project.id;
              const scanState = projectScanState[project.id];
              return (
                 <button
                   key={project.id}
                   type="button"
                   onClick={() => selectProject(project.id)}
                   className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                     isActive
                       ? "border-primary/40 bg-primary/5"
                       : "border-border app-wallpaper-surface hover:bg-accent"
                   }`}
                 >
                   <div className="flex items-start justify-between gap-3">
                     <div className="flex min-w-0 flex-1 items-start gap-3">
                       <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                         {getProjectInitial(project.name)}
                       </div>
                       <div className="min-w-0 flex-1">
                         <div className="truncate font-medium text-foreground">
                           {project.name}
                         </div>
                         <div className="mt-1 truncate text-[11px] text-muted-foreground">
                           {project.rootPath}
                         </div>
                       </div>
                     </div>
                     {scanState?.isScanning ? (
                      <Loader2Icon className="h-4 w-4 shrink-0 animate-spin text-primary" />
                    ) : null}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      {t("skill.projectSkillCount", {
                        count: scanState?.scannedSkills.length || 0,
                        defaultValue: `${scanState?.scannedSkills.length || 0} skills`,
                      })}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 overflow-hidden">
        {selectedProject ? (
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex h-full min-h-0 flex-col overflow-hidden">
              <div className={PROJECT_SECTION_HEADER_CLASS}>
                <div className="flex h-full items-start justify-between gap-4 px-6 py-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-base font-semibold text-primary">
                        {getProjectInitial(selectedProject.name)}
                      </div>
                      <h2 className="truncate text-xl font-semibold text-foreground">
                        {selectedProject.name}
                      </h2>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <div className="line-clamp-2 break-all">{selectedProject.rootPath}</div>
                      <div>
                        {t("skill.projectSkillCount", {
                          count: currentProjectState?.scannedSkills.length || 0,
                          defaultValue: `${currentProjectState?.scannedSkills.length || 0} skills`,
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 self-end">
                    <button
                      type="button"
                      onClick={() => void handleScanProject(selectedProject)}
                      disabled={currentProjectState?.isScanning}
                      className="inline-flex items-center gap-2 rounded-xl border border-border app-wallpaper-surface px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent disabled:opacity-60"
                    >
                      {currentProjectState?.isScanning ? (
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCwIcon className="h-4 w-4" />
                      )}
                      {t("common.refresh", "Refresh")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProject(selectedProject);
                        setIsProjectModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-border app-wallpaper-surface px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                    >
                      <PencilIcon className="h-4 w-4" />
                      {t("common.edit", "Edit")}
                    </button>
                  </div>
                </div>
              </div>

              {currentProjectState?.error ? (
                <div className="mx-6 mt-4 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {currentProjectState.error}
                </div>
              ) : null}

              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                {(currentProjectState?.scannedSkills.length || 0) === 0 ? (
                  <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-accent/10 px-6 text-center text-muted-foreground">
                    <SearchIcon className="mb-4 h-10 w-10 opacity-30" />
                    <div className="text-base font-semibold text-foreground">
                      {t("skill.projectNoScanResults", "No scanned skills yet")}
                    </div>
                    <div className="mt-2 max-w-xl text-sm text-muted-foreground">
                      {t(
                        "skill.projectNoScanResultsHint",
                        "Run a scan to discover SKILL.md files inside this project, then choose whether to import them into PromptHub or just manage the source paths directly.",
                      )}
                    </div>
                  </div>
                ) : visibleProjectSkills.length === 0 ? (
                  <div className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-accent/10 px-6 text-center text-muted-foreground">
                    <SearchIcon className="mb-4 h-10 w-10 opacity-30" />
                    <div className="text-base font-semibold text-foreground">
                      {t("skill.noResults", "No skills found")}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                    {visibleProjectSkills.map((scannedSkill) => {
                      const importedSkill = importedLibrarySkillByPath.get(
                        scannedSkill.localPath,
                      );
                      const isImported = installedProjectPaths.has(scannedSkill.localPath);

                      return (
                        <article
                          key={scannedSkill.filePath}
                          className="flex h-full flex-col rounded-3xl border border-border app-wallpaper-surface p-5 transition-colors hover:bg-accent/40"
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedProjectSkillPath(scannedSkill.localPath)}
                            className="block w-full flex-1 text-left"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="truncate text-base font-semibold text-foreground">
                                    {scannedSkill.name}
                                  </div>
                                  {scannedSkill.version ? (
                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                      v{scannedSkill.version}
                                    </span>
                                  ) : null}
                                  {isImported ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-300">
                                      <CheckCircle2Icon className="h-3 w-3" />
                                      {t("skill.importedBadge", "Already Imported")}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                                  {scannedSkill.description || scannedSkill.author}
                                </div>
                                <div className="mt-3 truncate font-mono text-[11px] text-muted-foreground">
                                  {inferDisplayPath(scannedSkill.localPath)}
                                </div>
                              </div>
                            </div>
                          </button>

                          <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-4">
                            <button
                              type="button"
                              onClick={() => void window.electron?.openPath?.(scannedSkill.localPath)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
                            >
                              <FolderOpenIcon className="h-3.5 w-3.5" />
                              {t("skill.openSkillFolder", "Open Folder")}
                            </button>
                            {isImported && importedSkill ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStoreView("my-skills");
                                    selectSkill(importedSkill.id);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
                                >
                                  <BookOpenIcon className="h-3.5 w-3.5" />
                                  {t("skill.openInMySkills", "Open in My Skills")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setQuickInstallSkill(importedSkill)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90"
                                >
                                  <SendIcon className="h-3.5 w-3.5" />
                                  {t("skill.importAndDistribute", "Distribute")}
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => void handleImportProjectSkill(scannedSkill)}
                                disabled={isImportingPath === scannedSkill.localPath}
                                className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                              >
                                {isImportingPath === scannedSkill.localPath ? (
                                  <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <DownloadIcon className="h-3.5 w-3.5" />
                                )}
                                {t("skill.addToLibrary", "Import to My Skills")}
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-muted-foreground">
            <div>
              <FolderIcon className="mx-auto mb-4 h-12 w-12 opacity-30" />
              <div className="text-lg font-semibold text-foreground">
                {t("skill.selectProject", "Select a Project")}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {t(
                  "skill.selectProjectHint",
                  "Choose a registered project on the left or add a new one to start scanning project-local skills.",
                )}
              </div>
            </div>
          </div>
        )}
      </div>
        </>
      )}

      <ProjectFormModal
        isOpen={isProjectModalOpen}
        project={editingProject}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleSaveProject}
      />

      {quickInstallSkill ? (
        <SkillQuickInstall
          skill={quickInstallSkill}
          onClose={() => setQuickInstallSkill(null)}
        />
      ) : null}
    </div>
  );
}
