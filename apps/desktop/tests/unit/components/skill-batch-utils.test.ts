import { describe, expect, it } from "vitest";
import {
  collectSkillTags,
  normalizeSkillTag,
  updateSkillTags,
} from "../../../src/renderer/components/skill/batch-utils";

describe("skill batch utils", () => {
  it("normalizes tags to lowercase and trims whitespace", () => {
    expect(normalizeSkillTag("  Team-Docs  ")).toBe("team-docs");
  });

  it("adds missing tags and avoids duplicates", () => {
    expect(updateSkillTags(["docs"], "Docs", "add")).toEqual(["docs"]);
    expect(updateSkillTags(["docs"], "ops", "add")).toEqual(["docs", "ops"]);
  });

  it("removes existing tags", () => {
    expect(updateSkillTags(["docs", "ops"], "ops", "remove")).toEqual([
      "docs",
    ]);
  });

  it("collects unique tags from multiple skills", () => {
    expect(
      collectSkillTags([
        { tags: ["ops", "docs"] },
        { tags: ["docs", "release"] },
      ] as any),
    ).toEqual(["docs", "ops", "release"]);
  });
});
