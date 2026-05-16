import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { SkillIconPicker } from "../../../src/renderer/components/skill/SkillIconPicker";
import { useSettingsStore } from "../../../src/renderer/stores/settings.store";
import { renderWithI18n } from "../../helpers/i18n";

describe("SkillIconPicker", () => {
  beforeEach(() => {
    useSettingsStore.setState({ isDarkMode: false } as never);
  });

  it("uses dark preset palette when dark mode is enabled", async () => {
    useSettingsStore.setState({ isDarkMode: true } as never);

    await renderWithI18n(
      <SkillIconPicker
        name="Skill"
        onChange={() => undefined}
      />,
      { language: "en" },
    );

    const darkBackgroundButton = screen.getByTitle("#4f2d3b");
    expect(darkBackgroundButton).toBeInTheDocument();
    expect(screen.queryByTitle("#f2d6de")).not.toBeInTheDocument();
  });
});
