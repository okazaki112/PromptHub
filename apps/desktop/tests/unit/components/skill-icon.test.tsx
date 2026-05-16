import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SkillIcon } from "../../../src/renderer/components/skill/SkillIcon";

describe("SkillIcon", () => {
  it("uses computed foreground color for custom pastel backgrounds", () => {
    render(
      <SkillIcon
        name="Skill"
        backgroundColor="#f2d6de"
        size="md"
      />,
    );

    const label = screen.getByText("S");
    const container = label.parentElement;

    expect(container).not.toBeNull();
    expect(container?.className).not.toContain("text-slate-900");
    expect(container?.className).not.toContain("text-slate-700");
    expect(container).toHaveStyle({
      backgroundColor: "rgb(242, 214, 222)",
      color: "rgb(30, 41, 59)",
    });
  });
});
