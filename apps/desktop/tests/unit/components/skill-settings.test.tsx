import { act, fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SkillSettings } from "../../../src/renderer/components/settings/SkillSettings";
import { renderWithI18n } from "../../helpers/i18n";

const useSettingsStoreMock = vi.fn();

vi.mock("../../../src/renderer/stores/settings.store", () => ({
  useSettingsStore: () => useSettingsStoreMock(),
}));

function createSettingsState() {
  return {
    skillInstallMethod: "symlink",
    setSkillInstallMethod: vi.fn(),
    customPlatformRootPaths: {},
    setCustomPlatformRootPath: vi.fn(),
    resetCustomPlatformRootPath: vi.fn(),
    customSkillPlatformPaths: {},
    setCustomSkillPlatformPath: vi.fn(),
    resetCustomSkillPlatformPath: vi.fn(),
    skillPlatformOrder: [],
    setSkillPlatformOrder: vi.fn(),
    resetSkillPlatformOrder: vi.fn(),
    customSkillScanPaths: [],
    addCustomSkillScanPath: vi.fn(),
    removeCustomSkillScanPath: vi.fn(),
    aiModels: [],
    autoScanInstalledSkills: false,
    autoScanStoreSkillsBeforeInstall: false,
    setAutoScanInstalledSkills: vi.fn(),
    setAutoScanStoreSkillsBeforeInstall: vi.fn(),
    githubToken: "",
    setGithubToken: vi.fn(),
  };
}

function createDataTransfer() {
  const data = new Map<string, string>();
  return {
    setData: vi.fn((type: string, value: string) => data.set(type, value)),
    getData: vi.fn((type: string) => data.get(type) ?? ""),
    effectAllowed: "move",
    dropEffect: "move",
  };
}

describe("SkillSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStoreMock.mockReturnValue(createSettingsState());
  });

  it("shows the preferred default platform order", async () => {
    await act(async () => {
      await renderWithI18n(<SkillSettings />, { language: "en" });
    });

    const list = screen.getByRole("list", { name: "Platform Display Order" });
    const platformIds = within(list)
      .getAllByRole("listitem")
      .slice(0, 6)
      .map((item) => item.getAttribute("data-platform-id"));

    expect(platformIds).toEqual([
      "claude",
      "codex",
      "opencode",
      "openclaw",
      "hermes",
      "cursor",
    ]);
  });

  it("reorders platforms through drag and drop", async () => {
    const settingsState = createSettingsState();
    useSettingsStoreMock.mockReturnValue(settingsState);

    await act(async () => {
      await renderWithI18n(<SkillSettings />, { language: "en" });
    });

    const list = screen.getByRole("list", { name: "Platform Display Order" });
    const items = within(list).getAllByRole("listitem");
    const cursorRow = items.find(
      (item) => item.getAttribute("data-platform-id") === "cursor",
    );
    const codexRow = items.find(
      (item) => item.getAttribute("data-platform-id") === "codex",
    );

    expect(cursorRow).toBeTruthy();
    expect(codexRow).toBeTruthy();

    const dataTransfer = createDataTransfer();

    fireEvent.dragStart(cursorRow!, { dataTransfer });
    fireEvent.dragOver(codexRow!, { dataTransfer });
    fireEvent.drop(codexRow!, { dataTransfer });

    expect(settingsState.setSkillPlatformOrder).toHaveBeenCalledTimes(1);
    const nextOrder = settingsState.setSkillPlatformOrder.mock.calls[0][0] as string[];
    expect(nextOrder.indexOf("cursor")).toBeLessThan(nextOrder.indexOf("codex"));
    expect(nextOrder.slice(0, 4)).toEqual([
      "claude",
      "cursor",
      "codex",
      "opencode",
    ]);
  });
});
