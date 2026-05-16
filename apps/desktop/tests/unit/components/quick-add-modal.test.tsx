import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QuickAddModal } from "../../../src/renderer/components/prompt/QuickAddModal";
import { ToastProvider } from "../../../src/renderer/components/ui/Toast";
import { useFolderStore } from "../../../src/renderer/stores/folder.store";
import { usePromptStore } from "../../../src/renderer/stores/prompt.store";
import { useSettingsStore } from "../../../src/renderer/stores/settings.store";
import { renderWithI18n } from "../../helpers/i18n";
import { installWindowMocks } from "../../helpers/window";

describe("QuickAddModal", () => {
  beforeEach(() => {
    installWindowMocks();

    useFolderStore.setState({
      folders: [
        {
          id: "folder-1",
          name: "Marketing",
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

    usePromptStore.setState({
      prompts: [],
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

    useSettingsStore.setState({
      aiProvider: "openai",
      aiApiProtocol: "openai",
      aiApiKey: "test-key",
      aiApiUrl: "https://example.com/v1",
      aiModel: "gpt-4o-mini",
      aiModels: [],
      scenarioModelDefaults: {},
      enableNotifications: false,
    } as Partial<ReturnType<typeof useSettingsStore.getState>>);
  });

  it("switches to AI generate mode and updates the prompt request copy", async () => {
    const user = userEvent.setup();

    await renderWithI18n(
      <ToastProvider>
        <QuickAddModal
          isOpen
          onClose={vi.fn()}
          onCreate={vi.fn()}
          defaultPromptType="text"
        />
      </ToastProvider>,
      { language: "zh" },
    );

    expect(screen.getByText("分析已有内容")).toBeInTheDocument();
    expect(screen.getByText("AI 生成 Prompt")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "粘贴你的 Prompt" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /AI 生成 Prompt/i }));

    expect(screen.getByText("描述你想要的 Prompt")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        "例如：帮我生成一个用于写小红书标题的 Prompt，语气年轻、有网感，输出 10 个备选标题。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "文本" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "绘图" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /AI 智能自动分类/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "生成并创建" })).toBeInTheDocument();
  });
});
