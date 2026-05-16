import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const showToastMock = vi.fn();

vi.mock("../../../src/renderer/services/webdav-save-sync", () => ({
  scheduleAllSaveSync: vi.fn(),
}));

import { SkillFileEditor } from "../../../src/renderer/components/skill/SkillFileEditor";
import { scheduleAllSaveSync } from "../../../src/renderer/services/webdav-save-sync";
import { renderWithI18n } from "../../helpers/i18n";
import { installWindowMocks } from "../../helpers/window";

vi.mock("../../../src/renderer/components/ui/Toast", () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

describe("SkillFileEditor", () => {
  beforeEach(() => {
    showToastMock.mockReset();
    installWindowMocks({
      api: {
        skill: {
          listLocalFiles: vi.fn().mockResolvedValue([
            { path: "SKILL.md", isDirectory: false, size: 128 },
            { path: ".git", isDirectory: true },
            { path: ".prompthub", isDirectory: true },
            {
              path: ".prompthub/translations/zh-CN/full/SKILL.md",
              isDirectory: false,
              size: 256,
            },
          ]),
          readLocalFile: vi.fn().mockResolvedValue({
            path: "SKILL.md",
            isDirectory: false,
            content: "# Skill\n\nBody",
          }),
        },
      },
    });
  });

  it("hides internal repo directories from the visible file tree", async () => {
    const { container } = await renderWithI18n(
      <SkillFileEditor
        skillId="skill-1"
        skillName="writer"
        isOpen={true}
        mode="inline"
      />,
      { language: "en" },
    );

    const treeList = container.querySelector(".skill-file-editor__tree-list");
    expect(treeList).not.toBeNull();

    await waitFor(() => {
      expect(within(treeList as HTMLElement).getByText("SKILL.md")).toBeInTheDocument();
    });

    expect(within(treeList as HTMLElement).queryByText(".git")).not.toBeInTheDocument();
    expect(within(treeList as HTMLElement).queryByText(".prompthub")).not.toBeInTheDocument();
    expect(within(treeList as HTMLElement).queryByText("translations")).not.toBeInTheDocument();
  });

  it("schedules WebDAV save-sync after saving a skill file", async () => {
    const writeLocalFile = vi.fn().mockResolvedValue(undefined);
    installWindowMocks({
      api: {
        skill: {
          listLocalFiles: vi.fn().mockResolvedValue([
            { path: "SKILL.md", isDirectory: false, size: 128 },
          ]),
          readLocalFile: vi.fn().mockResolvedValue({
            path: "SKILL.md",
            isDirectory: false,
            content: "# Skill\n\nBody",
          }),
          writeLocalFile,
        },
      },
    });

    await renderWithI18n(
      <SkillFileEditor
        skillId="skill-1"
        skillName="writer"
        isOpen={true}
        mode="inline"
      />,
      { language: "en" },
    );

    await waitFor(() => {
      expect(screen.getByRole("textbox")).toHaveValue("# Skill\n\nBody");
    }, { timeout: 5000 });

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "# Skill\n\nUpdated" },
    });

    await waitFor(() => {
      expect(screen.getByRole("textbox")).toHaveValue("# Skill\n\nUpdated");
    }, { timeout: 5000 });

    const getSaveButton = () => {
      const saveButtons = screen.getAllByRole("button");
      return saveButtons.find(
        (button) => button.getAttribute("title") === "Cmd/Ctrl+S",
      );
    };

    await waitFor(() => {
      expect(getSaveButton()).toBeDefined();
      expect(getSaveButton()).not.toBeDisabled();
    }, { timeout: 5000 });

    fireEvent.click(getSaveButton()!);

    await waitFor(() => {
      expect(writeLocalFile).toHaveBeenCalledWith("skill-1", "SKILL.md", "# Skill\n\nUpdated");
    }, { timeout: 5000 });
    expect(scheduleAllSaveSync).toHaveBeenCalledWith("skill:file-save");
  });
});
