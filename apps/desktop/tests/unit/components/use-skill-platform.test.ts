import { describe, expect, it } from "vitest";

import { sortSkillPlatformsByPreference } from "../../../src/renderer/components/skill/use-skill-platform";

describe("use-skill-platform helpers", () => {
  it("sorts detected platforms by the saved user preference", () => {
    const sorted = sortSkillPlatformsByPreference(
      [
        { id: "cursor", name: "Cursor" },
        { id: "claude", name: "Claude Code" },
        { id: "opencode", name: "OpenCode" },
      ] as any,
      ["opencode", "claude"],
    );

    expect(sorted.map((platform) => platform.id)).toEqual([
      "opencode",
      "claude",
      "cursor",
    ]);
  });

  it("uses the product default priority when no preference is saved", () => {
    const original = [
      { id: "cursor", name: "Cursor" },
      { id: "openclaw", name: "OpenClaw" },
      { id: "codex", name: "Codex CLI" },
      { id: "claude", name: "Claude Code" },
      { id: "hermes", name: "Hermes Agent" },
      { id: "opencode", name: "OpenCode" },
    ] as any;

    const sorted = sortSkillPlatformsByPreference(original, []);

    expect(sorted.map((platform) => platform.id)).toEqual([
      "claude",
      "codex",
      "opencode",
      "openclaw",
      "hermes",
      "cursor",
    ]);
  });

  it("keeps saved user preference ahead of the default priority", () => {
    const original = [
      { id: "cursor", name: "Cursor" },
      { id: "openclaw", name: "OpenClaw" },
      { id: "codex", name: "Codex CLI" },
      { id: "claude", name: "Claude Code" },
      { id: "hermes", name: "Hermes Agent" },
      { id: "opencode", name: "OpenCode" },
    ] as any;

    const sorted = sortSkillPlatformsByPreference(original, ["cursor"]);

    expect(sorted.map((platform) => platform.id)).toEqual([
      "cursor",
      "claude",
      "codex",
      "opencode",
      "openclaw",
      "hermes",
    ]);
  });
});
