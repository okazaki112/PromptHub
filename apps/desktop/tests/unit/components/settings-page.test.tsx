import { act, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SettingsPage } from "../../../src/renderer/components/settings/SettingsPage";
import { renderWithI18n } from "../../helpers/i18n";

const useSettingsStoreMock = vi.fn();

vi.mock("../../../src/renderer/stores/settings.store", () => ({
  useSettingsStore: (selector?: (state: unknown) => unknown) => {
    const state = useSettingsStoreMock();
    return typeof selector === "function" ? selector(state) : state;
  },
}));

vi.mock("../../../src/renderer/runtime", () => ({
  isWebRuntime: () => false,
}));

vi.mock("../../../src/renderer/components/settings/GeneralSettings", () => ({
  GeneralSettings: () => <div>general-content</div>,
}));
vi.mock("../../../src/renderer/components/settings/AppearanceSettings", () => ({
  AppearanceSettings: () => <div>appearance-content</div>,
}));
vi.mock("../../../src/renderer/components/settings/LanguageSettings", () => ({
  LanguageSettings: () => <div>language-content</div>,
}));
vi.mock("../../../src/renderer/components/settings/NotificationsSettings", () => ({
  NotificationsSettings: () => <div>notifications-content</div>,
}));
vi.mock("../../../src/renderer/components/settings/SecuritySettings", () => ({
  SecuritySettings: () => <div>security-content</div>,
}));
vi.mock("../../../src/renderer/components/settings/ShortcutsSettings", () => ({
  ShortcutsSettings: () => <div>shortcuts-content</div>,
}));
vi.mock("../../../src/renderer/components/settings/AboutSettings", () => ({
  AboutSettings: () => <div>about-content</div>,
}));
vi.mock("../../../src/renderer/components/settings/CLISettings", () => ({
  CLISettings: () => <div>cli-content</div>,
}));
vi.mock("../../../src/renderer/components/settings/DataSettings", () => ({
  DataSettings: () => <div>data-content</div>,
}));
vi.mock("../../../src/renderer/components/settings/SkillSettings", () => ({
  SkillSettings: () => <div>skill-content</div>,
}));
vi.mock("../../../src/renderer/components/settings/AISettingsPrototype", () => ({
  AISettingsPrototype: () => <div>ai-content</div>,
}));
vi.mock("../../../src/renderer/components/settings/WebDeviceSettings", () => ({
  WebDeviceSettings: () => <div>web-device-content</div>,
}));
vi.mock("../../../src/renderer/components/settings/WebWorkspaceSettings", () => ({
  WebWorkspaceSettings: () => <div>web-workspace-content</div>,
}));

describe("SettingsPage", () => {
  it("shows enabled badge on active cloud backup targets in the data submenu", async () => {
    useSettingsStoreMock.mockReturnValue({
      syncProvider: "webdav",
      webdavEnabled: true,
      selfHostedSyncEnabled: false,
      s3StorageEnabled: true,
      desktopHomeModules: ["prompt", "skill", "rules"],
    });

    await act(async () => {
      await renderWithI18n(<SettingsPage onBack={vi.fn()} />, {
        language: "en",
      });
    });

    await act(async () => {
      screen.getByRole("button", { name: "Data & Sync" }).click();
    });

    expect(screen.getByRole("button", { name: /WebDAV Enabled/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /S3 Compatible Storage Enabled/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Self-Hosted PromptHub Enabled/ }),
    ).not.toBeInTheDocument();
  });

  it("shows a standalone agent management entry in the desktop settings navigation", async () => {
    useSettingsStoreMock.mockReturnValue({
      syncProvider: "manual",
      webdavEnabled: false,
      selfHostedSyncEnabled: false,
      s3StorageEnabled: false,
      desktopHomeModules: ["prompt", "skill", "rules"],
    });

    await act(async () => {
      await renderWithI18n(<SettingsPage onBack={vi.fn()} />, {
        language: "en",
      });
    });

    const nav = screen.getByRole("navigation");
    expect(screen.getByText("general-content")).toBeInTheDocument();
    expect(nav).toHaveTextContent("App Settings");
    expect(nav).toHaveTextContent("Data & Sync");
    expect(nav).toHaveTextContent("Agent Management");
    expect(nav).not.toHaveTextContent("Platform Preview");
    expect(nav).toHaveTextContent("Security");
    expect(nav).toHaveTextContent("PromptHub CLI");
    expect(nav.parentElement).not.toHaveClass("app-left-rail-glass");

    await act(async () => {
      screen.getByRole("button", { name: "Agent Management" }).click();
    });

    expect(screen.getByText("skill-content")).toBeInTheDocument();
  });

  it("keeps appearance as the place where desktop workspace controls live", async () => {
    useSettingsStoreMock.mockReturnValue({
      syncProvider: "manual",
      webdavEnabled: false,
      selfHostedSyncEnabled: false,
      s3StorageEnabled: false,
      desktopHomeModules: ["skill"],
    });

    await act(async () => {
      await renderWithI18n(<SettingsPage onBack={vi.fn()} />, {
        language: "en",
      });
    });

    await act(async () => {
      screen.getByRole("button", { name: "Appearance" }).click();
    });

    expect(screen.getByText("appearance-content")).toBeInTheDocument();
  });

  it("opens the dedicated CLI settings page from the desktop navigation", async () => {
    useSettingsStoreMock.mockReturnValue({
      syncProvider: "manual",
      webdavEnabled: false,
      selfHostedSyncEnabled: false,
      s3StorageEnabled: false,
      desktopHomeModules: ["skill"],
    });

    await act(async () => {
      await renderWithI18n(<SettingsPage onBack={vi.fn()} />, {
        language: "en",
      });
    });

    await act(async () => {
      screen.getByRole("button", { name: "PromptHub CLI" }).click();
    });

    expect(screen.getByText("cli-content")).toBeInTheDocument();
  });
});
