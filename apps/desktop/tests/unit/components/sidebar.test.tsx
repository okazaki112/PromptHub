import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Sidebar } from "../../../src/renderer/components/layout/Sidebar";
import { useFolderStore } from "../../../src/renderer/stores/folder.store";
import { usePromptStore } from "../../../src/renderer/stores/prompt.store";
import { useRulesStore } from "../../../src/renderer/stores/rules.store";
import { useSettingsStore } from "../../../src/renderer/stores/settings.store";
import { useSkillStore } from "../../../src/renderer/stores/skill.store";
import { useUIStore } from "../../../src/renderer/stores/ui.store";
import { renderWithI18n } from "../../helpers/i18n";
import { installWindowMocks } from "../../helpers/window";

vi.mock("../../../src/renderer/components/resources/ResourcesModal", () => ({
  ResourcesModal: () => null,
}));

vi.mock("../../../src/renderer/components/folder", () => ({
  FolderModal: () => null,
  PrivateFolderUnlockModal: () => null,
}));

vi.mock("../../../src/renderer/components/layout/tree/SortableTree", () => ({
  SortableTree: () => null,
}));

vi.mock("../../../src/renderer/components/ui/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    installWindowMocks();
    delete (window as Window & { __PROMPTHUB_WEB__?: boolean }).__PROMPTHUB_WEB__;

    useUIStore.setState({
      appModule: "skill",
      viewMode: "skill",
      isSidebarCollapsed: false,
    });

    usePromptStore.setState({
      prompts: [],
      filterTags: [],
      promptTypeFilter: "all",
    } as Partial<ReturnType<typeof usePromptStore.getState>>);

    useFolderStore.setState({
      folders: [],
      selectedFolderId: null,
      expandedIds: new Set<string>(),
      unlockedFolderIds: new Set<string>(),
    } as Partial<ReturnType<typeof useFolderStore.getState>>);

    useSettingsStore.setState({
      tagsSectionHeight: 140,
      isTagsSectionCollapsed: false,
      skillTagsSectionHeight: 140,
      isSkillTagsSectionCollapsed: false,
      desktopHomeModules: ["prompt", "skill", "rules"],
      skillProjects: [
        {
          id: "project-1",
          name: "Workspace",
          rootPath: "/tmp/workspace",
          scanPaths: [],
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    } as Partial<ReturnType<typeof useSettingsStore.getState>>);

    useRulesStore.setState({
      files: [
        {
          id: "project:rule-project-1",
          platformId: "workspace",
          platformName: "Docs Site",
          platformIcon: "FolderRoot",
          platformDescription: "Project rules",
          name: "AGENTS.md",
          description: "Project rule file",
          path: "/tmp/docs-site/AGENTS.md",
          exists: false,
          group: "workspace",
        },
        {
          id: "claude-global",
          platformId: "claude",
          platformName: "Claude Code",
          platformIcon: "claude",
          platformDescription: "Claude rules",
          name: "CLAUDE.md",
          description: "Claude global rule file",
          path: "/Users/test/.claude/CLAUDE.md",
          exists: true,
          group: "assistant",
        },
        {
          id: "codex-global",
          platformId: "codex",
          platformName: "Codex CLI",
          platformIcon: "codex",
          platformDescription: "Codex rules",
          name: "AGENTS.md",
          description: "Codex global rule file",
          path: "/Users/test/.codex/AGENTS.md",
          exists: true,
          group: "assistant",
        },
        {
          id: "gemini-global",
          platformId: "gemini",
          platformName: "Gemini CLI",
          platformIcon: "gemini",
          platformDescription: "Gemini rules",
          name: "GEMINI.md",
          description: "Gemini global rule file",
          path: "/Users/test/.gemini/GEMINI.md",
          exists: true,
          group: "assistant",
        },
        {
          id: "opencode-global",
          platformId: "opencode",
          platformName: "OpenCode",
          platformIcon: "opencode",
          platformDescription: "OpenCode rules",
          name: "AGENTS.md",
          description: "OpenCode global rule file",
          path: "/Users/test/.config/opencode/AGENTS.md",
          exists: true,
          group: "tooling",
        },
        {
          id: "windsurf-global",
          platformId: "windsurf",
          platformName: "Windsurf",
          platformIcon: "windsurf",
          platformDescription: "Windsurf rules",
          name: "global_rules.md",
          description: "Windsurf global rule file",
          path: "/Users/test/.codeium/windsurf/memories/global_rules.md",
          exists: true,
          group: "tooling",
        },
      ],
      selectedRuleId: "claude-global",
      searchQuery: "",
    } as Partial<ReturnType<typeof useRulesStore.getState>>);

    useSkillStore.setState({
      skills: [],
      filterType: "all",
      filterTags: [],
      deployedSkillNames: new Set<string>(),
      storeView: "my-skills",
      selectedSkillId: null,
      registrySkills: [],
      selectedStoreSourceId: "official",
      customStoreSources: [],
      remoteStoreEntries: {},
    } as Partial<ReturnType<typeof useSkillStore.getState>>);
  });

  afterEach(() => {
    delete (window as Window & { __PROMPTHUB_WEB__?: boolean }).__PROMPTHUB_WEB__;
  });

  it("shows Project Skills as a first-level skill navigation entry on desktop", async () => {
    await act(async () => {
      await renderWithI18n(
        <Sidebar currentPage="home" onNavigate={vi.fn()} />,
        { language: "en" },
      );
    });

    fireEvent.click(screen.getByRole("button", { name: /Project Skills/i }));

    expect(useSkillStore.getState().storeView).toBe("projects");
    expect(screen.getByText("Project Skills")).toBeInTheDocument();
  });

  it("clears the selected skill when returning to my skills", async () => {
    useSkillStore.setState({
      selectedSkillId: "skill-1",
      storeView: "projects",
    } as Partial<ReturnType<typeof useSkillStore.getState>>);

    await act(async () => {
      await renderWithI18n(
        <Sidebar currentPage="home" onNavigate={vi.fn()} />,
        { language: "en" },
      );
    });

    fireEvent.click(screen.getByRole("button", { name: /My Skills/i }));

    expect(useSkillStore.getState().storeView).toBe("my-skills");
    expect(useSkillStore.getState().selectedSkillId).toBeNull();
  });

  it("hides Projects in web runtime where local skill scanning is unavailable", async () => {
    (window as Window & { __PROMPTHUB_WEB__?: boolean }).__PROMPTHUB_WEB__ = true;

    await act(async () => {
      await renderWithI18n(
        <Sidebar currentPage="home" onNavigate={vi.fn()} />,
        { language: "en" },
      );
    });

    expect(screen.queryByText("Projects")).not.toBeInTheDocument();
  });

  it("switches to the Rules module from the new left rail", async () => {
    await act(async () => {
      await renderWithI18n(
        <Sidebar currentPage="home" onNavigate={vi.fn()} />,
        { language: "en" },
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Rules/i }));
    });

    expect(useUIStore.getState().appModule).toBe("rules");
    expect(screen.getByText("Global Rules")).toBeInTheDocument();
    expect(screen.getByText("Project Rules")).toBeInTheDocument();
    expect(screen.getByText("Docs Site")).toBeInTheDocument();
    expect(screen.getByText("Codex CLI")).toBeInTheDocument();
    expect(screen.getByText("Gemini CLI")).toBeInTheDocument();
    expect(screen.getByText("Windsurf")).toBeInTheDocument();
    expect(screen.getByText("Add Project Directory")).toBeInTheDocument();

    const claudeButton = screen.getByRole("button", { name: /Claude Code/i });
    expect(within(claudeButton).getByAltText("claude icon")).toBeInTheDocument();

    const codexButton = screen.getByRole("button", { name: /Codex CLI/i });
    expect(within(codexButton).getByAltText("codex icon")).toBeInTheDocument();

    const geminiButton = screen.getByRole("button", { name: /Gemini CLI/i });
    expect(within(geminiButton).getByAltText("gemini icon")).toBeInTheDocument();

    const opencodeButton = screen.getByRole("button", { name: /OpenCode/i });
    expect(within(opencodeButton).getByAltText("opencode icon")).toBeInTheDocument();

    const windsurfButton = screen.getByRole("button", { name: /Windsurf/i });
    expect(within(windsurfButton).getByAltText("windsurf icon")).toBeInTheDocument();
  });

  it("keeps Rules visible but hides project-directory actions in web runtime", async () => {
    (window as Window & { __PROMPTHUB_WEB__?: boolean }).__PROMPTHUB_WEB__ = true;

    await act(async () => {
      await renderWithI18n(
        <Sidebar currentPage="home" onNavigate={vi.fn()} />,
        { language: "en" },
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Rules/i }));
    });

    expect(screen.getByText("Global Rules")).toBeInTheDocument();
    expect(screen.getByText("Project Rules")).toBeInTheDocument();
    expect(screen.queryByText("Add Project Directory")).not.toBeInTheDocument();
  });

  it("updates the selected rule when clicking a project rule item", async () => {
    useUIStore.setState({
      appModule: "rules",
      viewMode: "prompt",
      isSidebarCollapsed: false,
    });

    const selectRuleMock = vi.fn(async (ruleId: string) => {
      useRulesStore.setState({ selectedRuleId: ruleId as never });
    });
    useRulesStore.setState({
      selectedRuleId: "claude-global",
      selectRule: selectRuleMock,
    } as Partial<ReturnType<typeof useRulesStore.getState>>);

    await act(async () => {
      await renderWithI18n(
        <Sidebar currentPage="home" onNavigate={vi.fn()} />,
        { language: "en" },
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Docs Site/i }));
    });

    expect(selectRuleMock).toHaveBeenCalledWith("project:rule-project-1");
    expect(useRulesStore.getState().selectedRuleId).toBe("project:rule-project-1");
  });

  it("filters the rules sidebar using the shared rules search query", async () => {
    useUIStore.setState({
      appModule: "rules",
      viewMode: "prompt",
      isSidebarCollapsed: false,
    });
    useRulesStore.setState({
      searchQuery: "codex",
    } as Partial<ReturnType<typeof useRulesStore.getState>>);

    await act(async () => {
      await renderWithI18n(
        <Sidebar currentPage="home" onNavigate={vi.fn()} />,
        { language: "en" },
      );
    });

    expect(screen.getByText("Codex CLI")).toBeInTheDocument();
    expect(screen.queryByText("Claude Code")).not.toBeInTheDocument();
    expect(screen.queryByText("Gemini CLI")).not.toBeInTheDocument();
    expect(screen.queryByText("Docs Site")).not.toBeInTheDocument();
  });

  it("does not let a stale initial rules read override a later user selection", async () => {
    useUIStore.setState({
      appModule: "rules",
      viewMode: "prompt",
      isSidebarCollapsed: false,
    });
    useRulesStore.setState({
      files: [],
      selectedRuleId: null,
      currentFile: null,
      draftContent: "",
      hasLoadedFiles: false,
    } as Partial<ReturnType<typeof useRulesStore.getState>>);

    let resolveClaudeRead:
      | ((value: {
          id: "claude-global";
          platformId: "claude";
          platformName: "Claude Code";
          platformIcon: "claude";
          platformDescription: "Claude rules";
          name: "CLAUDE.md";
          description: "Claude global rule file";
          path: "/Users/test/.claude/CLAUDE.md";
          exists: true;
          group: "assistant";
          content: "# Claude rules";
          versions: [];
        }) => void)
      | null = null;

    installWindowMocks({
      api: {
        rules: {
          list: vi.fn().mockResolvedValue([
            {
              id: "claude-global",
              platformId: "claude",
              platformName: "Claude Code",
              platformIcon: "claude",
              platformDescription: "Claude rules",
              name: "CLAUDE.md",
              description: "Claude global rule file",
              path: "/Users/test/.claude/CLAUDE.md",
              exists: true,
              group: "assistant",
            },
            {
              id: "gemini-global",
              platformId: "gemini",
              platformName: "Gemini CLI",
              platformIcon: "gemini",
              platformDescription: "Gemini rules",
              name: "GEMINI.md",
              description: "Gemini global rule file",
              path: "/Users/test/.gemini/GEMINI.md",
              exists: true,
              group: "assistant",
            },
          ]),
          read: vi.fn((ruleId: string) => {
            if (ruleId === "claude-global") {
              return new Promise((resolve) => {
                resolveClaudeRead = resolve as typeof resolveClaudeRead;
              });
            }

            return Promise.resolve({
              id: "gemini-global",
              platformId: "gemini",
              platformName: "Gemini CLI",
              platformIcon: "gemini",
              platformDescription: "Gemini rules",
              name: "GEMINI.md",
              description: "Gemini global rule file",
              path: "/Users/test/.gemini/GEMINI.md",
              exists: true,
              group: "assistant",
              content: "# Gemini rules",
              versions: [],
            });
          }),
        },
      },
    });

    await act(async () => {
      await renderWithI18n(
        <Sidebar currentPage="home" onNavigate={vi.fn()} />,
        { language: "en" },
      );
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Gemini CLI/i }));
    });

    await act(async () => {
      resolveClaudeRead?.({
        id: "claude-global",
        platformId: "claude",
        platformName: "Claude Code",
        platformIcon: "claude",
        platformDescription: "Claude rules",
        name: "CLAUDE.md",
        description: "Claude global rule file",
        path: "/Users/test/.claude/CLAUDE.md",
        exists: true,
        group: "assistant",
        content: "# Claude rules",
        versions: [],
      });
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(useRulesStore.getState().selectedRuleId).toBe("gemini-global");
    });
  });

  it("hides the secondary module menu when the shell is collapsed", async () => {
    useUIStore.setState({
      appModule: "prompt",
      viewMode: "prompt",
      isSidebarCollapsed: true,
    });

    const { container } = await renderWithI18n(
      <Sidebar currentPage="home" onNavigate={vi.fn()} />,
      { language: "en" },
    );

    expect(screen.queryByText("Favorites")).not.toBeInTheDocument();
    expect(screen.queryByText("Folders")).not.toBeInTheDocument();
    expect(container.querySelector("aside")).toHaveClass("w-20");
    expect(screen.getByText("Prompts")).toBeInTheDocument();
    expect(screen.getByText("Skills")).toBeInTheDocument();
    expect(screen.getByText("Rules")).toBeInTheDocument();
    expect(screen.queryByText("Resources")).not.toBeInTheDocument();
    expect(screen.queryByText("Account")).not.toBeInTheDocument();
    expect(screen.queryByText("PH")).not.toBeInTheDocument();
  });

  it("hides disabled home modules from the rail", async () => {
    useSettingsStore.setState({
      desktopHomeModules: ["skill"],
    } as Partial<ReturnType<typeof useSettingsStore.getState>>);
    useUIStore.setState({
      appModule: "prompt",
      viewMode: "prompt",
      isSidebarCollapsed: false,
    });

    await act(async () => {
      await renderWithI18n(
        <Sidebar currentPage="home" onNavigate={vi.fn()} layout="rail" />,
        { language: "en" },
      );
    });

    expect(screen.queryByText("Prompts")).not.toBeInTheDocument();
    expect(screen.getByText("Skills")).toBeInTheDocument();
    expect(screen.queryByText("Rules")).not.toBeInTheDocument();
    expect(useUIStore.getState().appModule).toBe("skill");
  });

  it("renders rail modules in the customized desktop order", async () => {
    useSettingsStore.setState({
      desktopHomeModules: ["rules", "skill", "prompt"],
    } as Partial<ReturnType<typeof useSettingsStore.getState>>);

    await act(async () => {
      await renderWithI18n(
        <Sidebar currentPage="home" onNavigate={vi.fn()} layout="rail" />,
        { language: "en" },
      );
    });

    const labels = screen
      .getAllByRole("button")
      .map((button) => button.textContent?.trim())
      .filter((text): text is string =>
        text === "Rules" || text === "Skills" || text === "Prompts",
      );

    expect(labels.slice(0, 3)).toEqual(["Rules", "Skills", "Prompts"]);
  });

  it("uses the combined shell width for the classic sidebar layout", async () => {
    const { container } = await renderWithI18n(
      <Sidebar currentPage="home" onNavigate={vi.fn()} layout="combined" />,
      { language: "en" },
    );

    expect(container.querySelector("aside")).toHaveClass("w-[23rem]");
    expect(screen.getByText("Prompts")).toBeInTheDocument();
  });
});
