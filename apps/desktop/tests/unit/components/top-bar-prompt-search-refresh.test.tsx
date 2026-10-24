import { act, fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Prompt } from "@prompthub/shared/types";
import { TopBar } from "../../../src/renderer/components/layout/TopBar";
import { useFolderStore } from "../../../src/renderer/stores/folder.store";
import { usePromptStore } from "../../../src/renderer/stores/prompt.store";
import { useRulesStore } from "../../../src/renderer/stores/rules.store";
import { useSettingsStore } from "../../../src/renderer/stores/settings.store";
import { useSkillStore } from "../../../src/renderer/stores/skill.store";
import { useUIStore } from "../../../src/renderer/stores/ui.store";
import { renderWithI18n } from "../../helpers/i18n";
import { installWindowMocks } from "../../helpers/window";

function createPrompt(id: string, title: string): Prompt {
  return {
    id,
    title,
    description: "",
    promptType: "text",
    systemPrompt: "",
    userPrompt: "",
    variables: [],
    tags: [],
    isFavorite: false,
    isPinned: false,
    version: 1,
    currentVersion: 1,
    usageCount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("TopBar prompt search refresh", () => {
  beforeEach(() => {
    installWindowMocks();
    usePromptStore.setState({
      prompts: [createPrompt("prompt-1", "Alpha one"), createPrompt("prompt-2", "Alpha two")],
      searchQuery: "alpha",
      selectedId: null,
    } as Partial<ReturnType<typeof usePromptStore.getState>>);
    useFolderStore.setState({
      folders: [],
      selectedFolderId: null,
    } as Partial<ReturnType<typeof useFolderStore.getState>>);
    useRulesStore.setState({
      files: [],
      searchQuery: "",
    } as Partial<ReturnType<typeof useRulesStore.getState>>);
    useSettingsStore.setState({
      aiApiKey: "",
      aiModels: [],
      creationMode: "manual",
      isDarkMode: false,
    } as Partial<ReturnType<typeof useSettingsStore.getState>>);
    useSkillStore.setState({
      deployedSkillNames: new Set<string>(),
      filterTags: [],
      filterType: "all",
      projectScanState: {},
      searchQuery: "",
      selectedProjectId: null,
      storeView: "library",
      skills: [],
    } as Partial<ReturnType<typeof useSkillStore.getState>>);
    useUIStore.setState({
      appModule: "prompt",
      isSidebarCollapsed: false,
    } as Partial<ReturnType<typeof useUIStore.getState>>);
  });

  it("keeps the navigated result when prompt data refreshes without a query change", async () => {
    const selectPrompt = vi.fn();
    usePromptStore.setState({
      selectPrompt,
    } as Partial<ReturnType<typeof usePromptStore.getState>>);

    await act(async () => {
      await renderWithI18n(
        <TopBar onOpenSettings={vi.fn()} updateAvailable={null} />,
        { language: "en" },
      );
    });

    expect(selectPrompt).toHaveBeenCalledWith("prompt-1");

    const searchInput = screen.getByPlaceholderText(/Search prompts/i);
    selectPrompt.mockClear();
    fireEvent.keyDown(searchInput, { key: "Tab" });
    expect(selectPrompt).toHaveBeenCalledWith("prompt-2");

    selectPrompt.mockClear();
    await act(async () => {
      usePromptStore.setState({
        prompts: [
          createPrompt("prompt-1", "Alpha one"),
          createPrompt("prompt-2", "Alpha two"),
        ],
      } as Partial<ReturnType<typeof usePromptStore.getState>>);
    });

    expect(selectPrompt).not.toHaveBeenCalled();
  });
});
