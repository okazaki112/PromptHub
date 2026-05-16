/**
 * @vitest-environment node
 */
import { describe, expect, it } from "vitest";

import { exportAsSkillMd } from "../../../src/main/services/skill-installer-export";

describe("skill-installer-export", () => {
  it("does not duplicate frontmatter when instructions already contain a full SKILL.md", () => {
    const existingSkillMd = [
      "---",
      "name: docx",
      'description: "Existing description"',
      "license: Proprietary",
      "---",
      "",
      "# Skill Instructions",
      "",
      "Use this skill for docx editing.",
    ].join("\n");

    const exported = exportAsSkillMd({
      name: "docx",
      description: "Existing description",
      version: "1.0.0",
      author: "Anthropic",
      compatibility: ["claude", "cursor"],
      instructions: existingSkillMd,
    });

    expect(exported.match(/^---$/gm)).toHaveLength(2);
    expect(exported).toContain("version: 1.0.0");
    expect(exported).toContain("author: Anthropic");
    expect(exported).toContain("# Skill Instructions");
    expect(exported).toContain("Use this skill for docx editing.");
    expect(exported).not.toContain("license: Proprietary\n---\n---");
  });

  it("keeps an empty body empty when instructions only contain frontmatter", () => {
    const exported = exportAsSkillMd({
      name: "docx",
      description: "Existing description",
      instructions: [
        "---",
        "name: docx",
        "description: Existing description",
        "---",
        "",
      ].join("\n"),
    });

    expect(exported).toMatch(/^---[\s\S]*---\n$/);
    expect(exported.match(/^---$/gm)).toHaveLength(2);
    expect(exported).not.toContain("description: Existing description\n---\n\n---");
  });
});
