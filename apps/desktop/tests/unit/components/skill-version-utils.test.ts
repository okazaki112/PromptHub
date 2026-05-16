import { describe, expect, it } from "vitest";

import type {
  SkillLocalFileEntry,
  SkillVersion,
} from "@prompthub/shared/types";
import {
  buildVersionFileDiffEntries,
  resolveVersionSnapshots,
  snapshotsFromLocalFiles,
} from "../../../src/renderer/components/skill/version-utils";

describe("skill version utils", () => {
  it("falls back to SKILL.md when a legacy version has no files snapshot", () => {
    const version = {
      id: "v1",
      skillId: "skill-1",
      version: 1,
      content: "# Skill",
      createdAt: new Date(0).toISOString(),
    } as SkillVersion;

    expect(resolveVersionSnapshots(version, version.content || "")).toEqual([
      {
        relativePath: "SKILL.md",
        content: "# Skill",
      },
    ]);
  });

  it("builds local snapshots and sorts diff entries with SKILL.md first", () => {
    const localFiles = [
      {
        path: "notes.md",
        content: "notes",
        isDirectory: false,
      },
      {
        path: "nested",
        content: "",
        isDirectory: true,
      },
    ] as SkillLocalFileEntry[];

    const current = snapshotsFromLocalFiles(localFiles, "# Skill");
    const previous = [
      {
        relativePath: "SKILL.md",
        content: "# Skill old",
      },
      {
        relativePath: "config.json",
        content: '{"enabled":true}',
      },
    ];

    expect(current).toEqual([
      {
        relativePath: "SKILL.md",
        content: "# Skill",
      },
      {
        relativePath: "notes.md",
        content: "notes",
      },
    ]);

    expect(buildVersionFileDiffEntries(previous, current)).toEqual([
      {
        path: "SKILL.md",
        oldContent: "# Skill old",
        newContent: "# Skill",
        unchanged: false,
      },
      {
        path: "config.json",
        oldContent: '{"enabled":true}',
        newContent: "",
        unchanged: false,
      },
      {
        path: "notes.md",
        oldContent: "",
        newContent: "notes",
        unchanged: false,
      },
    ]);
  });
});
