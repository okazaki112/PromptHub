import type {
  ScannedSkill,
  Skill,
  SkillFileSnapshot,
  SkillLocalFileEntry,
  SkillVersion,
} from "@prompthub/shared/types";
import type { SkillPlatform } from "@prompthub/shared/constants/platforms";

export function createSkillFixture(overrides: Partial<Skill> = {}): Skill {
  return {
    id: "skill-write",
    name: "write",
    description: "Write better",
    instructions: "# Write\n\nHelp the user write better.",
    content: "# Write\n\nHelp the user write better.",
    protocol_type: "skill",
    author: "Local",
    local_repo_path: "/Users/demo/skills/write",
    tags: ["general"],
    is_favorite: false,
    currentVersion: 0,
    created_at: 1,
    updated_at: 1,
    ...overrides,
  };
}

export function createSkillVersionFixture(
  overrides: Partial<SkillVersion> = {},
): SkillVersion {
  return {
    id: "version-1",
    skillId: "skill-write",
    version: 1,
    content: "# Write\n\nSnapshot",
    filesSnapshot: [],
    note: "Initial snapshot",
    createdAt: new Date("2026-03-14T10:00:00.000Z").toISOString(),
    ...overrides,
  };
}

export function createSkillFileSnapshotFixture(
  overrides: Partial<SkillFileSnapshot> = {},
): SkillFileSnapshot {
  return {
    relativePath: "SKILL.md",
    content: "# Write\n\nHelp the user write better.",
    ...overrides,
  };
}

export function createSkillLocalFileEntryFixture(
  overrides: Partial<SkillLocalFileEntry> = {},
): SkillLocalFileEntry {
  return {
    path: "SKILL.md",
    content: "---\ndescription: Write helper\n---\n\n# Write",
    isDirectory: false,
    ...overrides,
  };
}

export function createScannedSkillFixture(
  overrides: Partial<ScannedSkill> = {},
): ScannedSkill {
  return {
    name: "write",
    description: "Write better",
    version: "1.0.0",
    author: "Local",
    tags: ["general"],
    instructions: "# Write\n\nHelp the user write better.",
    filePath: "/Users/demo/skills/write/SKILL.md",
    localPath: "/Users/demo/skills/write",
    platforms: [],
    ...overrides,
  };
}

export function createSkillPlatformFixture(
  overrides: Partial<SkillPlatform> = {},
): SkillPlatform {
  return {
    id: "claude",
    name: "Claude Code",
    icon: "Sparkles",
    rootDir: {
      darwin: "~/.claude",
      win32: "%USERPROFILE%\\.claude",
      linux: "~/.claude",
    },
    skillsRelativePath: "skills",
    globalRuleFile: "CLAUDE.md",
    ...overrides,
  };
}
