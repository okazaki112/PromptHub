import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PasswordModal } from "../../../src/renderer/components/folder/PasswordModal";
import { PromptGalleryView } from "../../../src/renderer/components/prompt/PromptGalleryView";
import { ResourcesModal } from "../../../src/renderer/components/resources/ResourcesModal";
import { ImagePreviewModal } from "../../../src/renderer/components/ui/ImagePreviewModal";
import type { Prompt } from "@prompthub/shared/types";
import { renderWithI18n } from "../../helpers/i18n";

const useFolderStoreMock = vi.fn();
const usePromptStoreMock = vi.fn();

vi.mock("../../../src/renderer/stores/folder.store", () => ({
  useFolderStore: (selector: (state: Record<string, unknown>) => unknown) =>
    useFolderStoreMock(selector),
}));

vi.mock("../../../src/renderer/stores/prompt.store", () => ({
  usePromptStore: (selector: (state: Record<string, unknown>) => unknown) =>
    usePromptStoreMock(selector),
}));

const promptFixture: Prompt = {
  id: "prompt-1",
  title: "Gallery Prompt",
  description: "Used for i18n smoke tests",
  userPrompt: "Describe the scene",
  systemPrompt: "",
  variables: [],
  tags: [],
  images: ["cover.png"],
  videos: ["preview.mp4"],
  isFavorite: false,
  isPinned: false,
  version: 1,
  currentVersion: 1,
  usageCount: 0,
  createdAt: new Date("2026-04-08T08:00:00.000Z").toISOString(),
  updatedAt: new Date("2026-04-08T09:00:00.000Z").toISOString(),
};

describe("renderer i18n smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFolderStoreMock.mockImplementation((selector) =>
      selector({
        folders: [],
      }),
    );
    usePromptStoreMock.mockImplementation((selector) =>
      selector({
        galleryImageSize: "medium",
      }),
    );
  });

  it("renders critical lightweight components in english without chinese fallback text", async () => {
    await renderWithI18n(
      <>
        <PasswordModal isOpen onClose={vi.fn()} onSubmit={vi.fn()} />
        <ResourcesModal isOpen onClose={vi.fn()} />
        <PromptGalleryView
          prompts={[promptFixture]}
          onSelect={vi.fn()}
          onToggleFavorite={vi.fn()}
          onCopy={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onAiTest={vi.fn()}
          onVersionHistory={vi.fn()}
          onViewDetail={vi.fn()}
          onContextMenu={vi.fn()}
        />
      </>,
      { language: "en" },
    );

    expect(screen.getByText("Unlock / Lock")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter master password"),
    ).toBeInTheDocument();
    expect(screen.getByText("Recommended Resources")).toBeInTheDocument();
    expect(screen.getByText("Prompt Engineering Guides")).toBeInTheDocument();
    expect(screen.getByText("Agent / Skill Best Practices")).toBeInTheDocument();
    expect(screen.getByText("OpenAI Prompting")).toBeInTheDocument();
    expect(
      screen.getByText("Official OpenAI prompting guide"),
    ).toBeInTheDocument();
    expect(screen.getByText("Claude Code Docs")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Single official entry for docs, workflows, hooks, and settings",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("OpenAI Practical Guide to Building Agents"),
    ).toBeInTheDocument();
    expect(screen.getByText("MCP Quickstart")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Claude Code Docs/i }),
    ).toHaveAttribute(
      "href",
      "https://docs.anthropic.com/en/docs/claude-code/overview",
    );
    expect(screen.getByText("Uncategorized")).toBeInTheDocument();

    expect(screen.queryByText("解锁")).not.toBeInTheDocument();
    expect(screen.queryByText("推荐资源")).not.toBeInTheDocument();
    expect(screen.queryByText("未分类")).not.toBeInTheDocument();
    expect(screen.queryByText("视频")).not.toBeInTheDocument();
  });

  it("shows english image preview fallback when image loading fails", async () => {
    await renderWithI18n(
      <ImagePreviewModal
        isOpen
        onClose={vi.fn()}
        imageSrc="broken-image.png"
      />,
      { language: "en" },
    );

    fireEvent.error(screen.getByAltText("Preview"));

    expect(screen.getByText("Image load failed")).toBeInTheDocument();
    expect(screen.queryByText("图片加载失败")).not.toBeInTheDocument();
  });
});
