import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreatePromptModal } from "../../../src/renderer/components/prompt/CreatePromptModal";
import { EditPromptModal } from "../../../src/renderer/components/prompt/EditPromptModal";
import { ToastProvider } from "../../../src/renderer/components/ui/Toast";
import { useFolderStore } from "../../../src/renderer/stores/folder.store";
import { usePromptStore } from "../../../src/renderer/stores/prompt.store";
import { useSettingsStore } from "../../../src/renderer/stores/settings.store";
import { renderWithI18n } from "../../helpers/i18n";
import { installWindowMocks } from "../../helpers/window";
import type { Prompt } from "@prompthub/shared/types";

const basePrompt: Prompt = {
  id: "prompt-1",
  title: "Prompt draft",
  description: "Draft description",
  promptType: "text",
  systemPrompt: "You are a helpful assistant.",
  userPrompt: "Draft the final answer.",
  variables: [],
  tags: ["demo"],
  isFavorite: false,
  isPinned: false,
  version: 1,
  currentVersion: 1,
  usageCount: 0,
  createdAt: new Date("2026-05-01T00:00:00.000Z").toISOString(),
  updatedAt: new Date("2026-05-01T00:00:00.000Z").toISOString(),
};

describe("Prompt modal structure", () => {
  beforeEach(() => {
    installWindowMocks();

    usePromptStore.setState({
      prompts: [basePrompt],
      selectedId: null,
      selectedIds: [],
      isLoading: false,
      searchQuery: "",
      filterTags: [],
      promptTypeFilter: "all",
      sortBy: "updatedAt",
      sortOrder: "desc",
      viewMode: "card",
      galleryImageSize: "medium",
      kanbanColumns: 3,
    });

    useFolderStore.setState({
      folders: [
        {
          id: "folder-1",
          name: "Examples",
          createdAt: new Date("2026-05-01T00:00:00.000Z").toISOString(),
          updatedAt: new Date("2026-05-01T00:00:00.000Z").toISOString(),
          order: 0,
          icon: "folder",
        },
      ],
      selectedFolderId: null,
      expandedIds: new Set(),
      unlockedFolderIds: new Set(),
    } as Partial<ReturnType<typeof useFolderStore.getState>>);

    useSettingsStore.setState({
      sourceHistory: ["https://example.com/reference"],
      aiModels: [],
      scenarioModelDefaults: {},
    } as Partial<ReturnType<typeof useSettingsStore.getState>>);
  });

  it("keeps create modal first screen focused on type and prompt content", async () => {
    const user = userEvent.setup();

    await renderWithI18n(
      <ToastProvider>
        <CreatePromptModal
          isOpen
          onClose={vi.fn()}
          onCreate={vi.fn()}
          defaultPromptType="image"
        />
      </ToastProvider>,
      { language: "en" },
    );

    expect(screen.getByText("Prompt Type")).toBeInTheDocument();
    expect(screen.getByText("User Prompt")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Use {{variableName}} or {{variableName:exampleValue}} to define variables, e.g., {{language}} or {{courseName:Computer Science}}",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Basic Info")).not.toBeInTheDocument();
    expect(screen.queryByText("Description (Optional)")).not.toBeInTheDocument();
    expect(screen.queryByText("Reference Media")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Test with image models (e.g., DALL-E). Generated images will be saved to preview."),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /More Settings/i }));

    expect(screen.getByText("Description (Optional)")).toBeInTheDocument();
    expect(screen.getByText("System Prompt (Optional)")).toBeInTheDocument();
    expect(screen.getByText("Reference Media")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More Settings" })).toBeInTheDocument();
  });

  it("keeps text prompt reference media inside more settings when editing", async () => {
    const user = userEvent.setup();

    await renderWithI18n(
      <ToastProvider>
        <EditPromptModal
          isOpen
          onClose={vi.fn()}
          prompt={{
            ...basePrompt,
            images: ["reference.png"],
          }}
        />
      </ToastProvider>,
      { language: "en" },
    );

    expect(screen.getByText("Basic Info")).toBeInTheDocument();
    expect(screen.getByText("Description (Optional)")).toBeInTheDocument();
    expect(screen.queryByText("Reference Media")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /More Settings/i }));

    expect(screen.getByText("Reference Media")).toBeInTheDocument();
  });

  it("keeps image prompt reference media in basic info when editing", async () => {
    await renderWithI18n(
      <ToastProvider>
        <EditPromptModal
          isOpen
          onClose={vi.fn()}
          prompt={{
            ...basePrompt,
            promptType: "image",
            images: ["reference.png"],
          }}
        />
      </ToastProvider>,
      { language: "en" },
    );

    expect(screen.getByText("Basic Info")).toBeInTheDocument();
    expect(screen.getByText("Description (Optional)")).toBeInTheDocument();
    expect(screen.getByText("Reference Media")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /More Settings/i }),
    ).toBeInTheDocument();
  });
});
