import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import Database from "../../../src/main/database/sqlite";
import { SCHEMA } from "../../../src/main/database/schema";
import { SkillDB } from "../../../src/main/database/skill";

const SKILL_SCHEMA_MIGRATIONS = `
  ALTER TABLE skills ADD COLUMN source_url TEXT;
  ALTER TABLE skills ADD COLUMN local_repo_path TEXT;
  ALTER TABLE skills ADD COLUMN icon_url TEXT;
  ALTER TABLE skills ADD COLUMN icon_emoji TEXT;
  ALTER TABLE skills ADD COLUMN icon_background TEXT;
  ALTER TABLE skills ADD COLUMN category TEXT DEFAULT 'general';
  ALTER TABLE skills ADD COLUMN is_builtin INTEGER DEFAULT 0;
  ALTER TABLE skills ADD COLUMN registry_slug TEXT;
  ALTER TABLE skills ADD COLUMN content_url TEXT;
  ALTER TABLE skills ADD COLUMN prerequisites TEXT;
  ALTER TABLE skills ADD COLUMN compatibility TEXT;
  ALTER TABLE skills ADD COLUMN original_tags TEXT;
  ALTER TABLE skills ADD COLUMN safety_level TEXT;
  ALTER TABLE skills ADD COLUMN safety_score INTEGER;
  ALTER TABLE skills ADD COLUMN safety_report TEXT;
  ALTER TABLE skills ADD COLUMN safety_scanned_at INTEGER;
`;

describe("SkillDB versioning", () => {
  let tempDir: string;
  let db: Database.Database;
  let skillDb: SkillDB;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "prompthub-skill-db-"));
    db = new Database(path.join(tempDir, "prompthub.db"));
    db.exec(SCHEMA);
    db.exec(SKILL_SCHEMA_MIGRATIONS);
    skillDb = new SkillDB(db);
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("persists currentVersion when creating a snapshot", () => {
    const created = skillDb.create({
      name: "write",
      description: "Write better",
      content: "# Write",
      instructions: "# Write",
      protocol_type: "skill",
      author: "Test",
      tags: ["general"],
      is_favorite: false,
      currentVersion: 0,
      versionTrackingEnabled: true,
    });

    const snapshot = skillDb.createVersion(created.id, "initial snapshot", [
      { relativePath: "SKILL.md", content: "# Write" },
    ]);

    expect(snapshot).toEqual(
      expect.objectContaining({
        skillId: created.id,
        version: 1,
        note: "initial snapshot",
      }),
    );
    expect(skillDb.getById(created.id)?.currentVersion).toBe(1);
    expect(skillDb.getVersions(created.id)).toHaveLength(1);
  });
});
