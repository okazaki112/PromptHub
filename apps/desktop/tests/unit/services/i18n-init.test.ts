import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function setNavigatorLanguage(language: string) {
  Object.defineProperty(window.navigator, "language", {
    configurable: true,
    value: language,
  });
}

describe("i18n initialization", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("prefers persisted language over system language", async () => {
    setNavigatorLanguage("fr-FR");
    localStorage.setItem(
      "prompthub-settings",
      JSON.stringify({ state: { language: "de" } }),
    );

    const module = await import("../../../src/renderer/i18n");

    expect(module.default.language).toBe("de");
  });

  it("maps system language prefixes when no persisted language exists", async () => {
    setNavigatorLanguage("zh-Hant");

    const module = await import("../../../src/renderer/i18n");

    expect(module.default.language).toBe("zh-TW");
  });
});
