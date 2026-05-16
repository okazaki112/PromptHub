import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const changeLanguageMock = vi.fn();

vi.mock("../../../src/renderer/i18n", () => ({
  __esModule: true,
  default: { language: "en" },
  changeLanguage: changeLanguageMock,
}));

describe("settings language actions", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    changeLanguageMock.mockReset();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("normalizes locale variants before updating settings", async () => {
    const { useSettingsStore } = await import(
      "../../../src/renderer/stores/settings.store"
    );

    useSettingsStore.getState().setLanguage("fr-FR");

    expect(useSettingsStore.getState().language).toBe("fr");
    expect(changeLanguageMock).toHaveBeenCalledWith("fr");
  });

  it("maps traditional chinese locale aliases to zh-TW", async () => {
    const { useSettingsStore } = await import(
      "../../../src/renderer/stores/settings.store"
    );

    useSettingsStore.getState().setLanguage("zh-Hant");

    expect(useSettingsStore.getState().language).toBe("zh-TW");
    expect(changeLanguageMock).toHaveBeenCalledWith("zh-TW");
  });
});
