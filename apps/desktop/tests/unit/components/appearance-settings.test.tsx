import { act, fireEvent, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppearanceSettings } from "../../../src/renderer/components/settings/AppearanceSettings";
import { renderWithI18n } from "../../helpers/i18n";

const useSettingsStoreMock = vi.fn();

vi.mock("../../../src/renderer/runtime", () => ({
  isWebRuntime: () => false,
}));

vi.mock("../../../src/renderer/stores/settings.store", () => ({
  useSettingsStore: () => useSettingsStoreMock(),
  MORANDI_THEMES: [{ id: "blue", hue: 210, saturation: 35, name: "Misty Blue" }],
  FONT_SIZES: [{ id: "medium", value: 16, name: "Medium" }],
  DESKTOP_HOME_MODULES: ["prompt", "skill", "rules"],
  getRenderedBackgroundImageOpacity: (value: number) => value,
  getRenderedBackgroundImageBlur: (value: number) => value,
}));

function createSettingsState(overrides: Record<string, unknown> = {}) {
  return {
    themeMode: "light",
    themeColor: "blue",
    customThemeHex: "#3b82f6",
    fontSize: "medium",
    backgroundImageEnabled: true,
    backgroundImageFileName: undefined,
    backgroundImageOpacity: 0.88,
    backgroundImageBlur: 16,
    desktopHomeModules: ["prompt", "skill", "rules"],
    setThemeMode: vi.fn(),
    setThemeColor: vi.fn(),
    setCustomThemeHex: vi.fn(),
    setFontSize: vi.fn(),
    applyBackgroundImageSelection: vi.fn(),
    setBackgroundImageEnabled: vi.fn(),
    setBackgroundImageFileName: vi.fn(),
    setBackgroundImageOpacity: vi.fn(),
    setBackgroundImageBlur: vi.fn(),
    toggleDesktopHomeModule: vi.fn(),
    reorderDesktopHomeModules: vi.fn(),
    ...overrides,
  };
}

describe("AppearanceSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows an empty-state preview before a background image is selected", async () => {
    useSettingsStoreMock.mockReturnValue(createSettingsState());

    await act(async () => {
      await renderWithI18n(<AppearanceSettings />, { language: "en" });
    });

    expect(screen.getByText("No background image selected")).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Background image preview" }),
    ).not.toBeInTheDocument();
  });

  it("renders the preview with the same wallpaper shell structure used by the live app", async () => {
    useSettingsStoreMock.mockReturnValue(
      createSettingsState({
        backgroundImageEnabled: true,
        backgroundImageFileName: "wallpaper.png",
      }),
    );

    await act(async () => {
      await renderWithI18n(<AppearanceSettings />, { language: "en" });
    });

    const previewStage = document.querySelector(".background-preview-stage");

    expect(previewStage).not.toBeNull();
    expect(previewStage).toHaveClass("app-background-mode-image");
    expect(previewStage?.querySelector("img")).not.toBeNull();
    expect(previewStage?.querySelector(".background-preview-shell")).toHaveClass(
      "app-wallpaper-shell",
    );
    expect(previewStage?.querySelector(".app-left-rail-glass")).not.toBeNull();
    expect(previewStage?.querySelector(".sidebar-tag-section")).toHaveClass(
      "app-wallpaper-panel",
    );
    expect(previewStage?.querySelector(".sidebar-tag-section")).not.toHaveClass(
      "app-wallpaper-panel-strong",
    );
    expect(previewStage?.querySelector(".app-wallpaper-blanket")).not.toBeNull();
    expect(previewStage?.querySelector(".app-wallpaper-toolbar")).not.toBeNull();
    expect(previewStage?.querySelector(".prompt-list-pane")).not.toBeNull();
  });

  it("toggles the saved background image without clearing the file", async () => {
    const settingsState = createSettingsState({
      backgroundImageEnabled: false,
      backgroundImageFileName: "wallpaper.png",
    });
    useSettingsStoreMock.mockReturnValue(settingsState);

    await act(async () => {
      await renderWithI18n(<AppearanceSettings />, { language: "en" });
    });

    expect(
      screen.getByText("Background image is saved but currently disabled."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Enable" }));
    expect(settingsState.setBackgroundImageEnabled).toHaveBeenCalledWith(true);
  });

  it("exposes desktop module controls in desktop runtime", async () => {
    const settingsState = createSettingsState({
      desktopHomeModules: ["skill"],
    });
    useSettingsStoreMock.mockReturnValue(settingsState);

    await act(async () => {
      await renderWithI18n(<AppearanceSettings />, { language: "en" });
    });

    expect(screen.getByText("Desktop workspace")).toBeInTheDocument();
    expect(screen.getByText("Home modules")).toBeInTheDocument();
    expect(
      screen.getByText("Drag enabled modules to reorder the desktop home rail."),
    ).toBeInTheDocument();

    const promptsCard = screen.getByText("Prompts").parentElement?.parentElement;
    expect(promptsCard).not.toBeNull();

    fireEvent.click(within(promptsCard as HTMLElement).getByRole("button", { name: "Disabled" }));
    expect(settingsState.toggleDesktopHomeModule).toHaveBeenCalled();
  });
});
