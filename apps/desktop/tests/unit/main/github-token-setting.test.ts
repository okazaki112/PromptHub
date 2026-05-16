/**
 * Tests for getGithubTokenSetting (issue #108).
 *
 * The skill store calls GitHub API endpoints, which limit anonymous users
 * to 60 req/h. Configuring a personal access token raises this to 5000
 * req/h. The token lives in the SQLite settings table and must be read by
 * the main process when attaching Authorization headers to GitHub requests.
 *
 * Security surface area tested:
 *   - Empty / whitespace-only tokens are treated as "no token".
 *   - Wrong types (numbers, booleans, null) never become an Authorization
 *     header.
 *   - Tokens containing control characters (CR/LF) are rejected — defence
 *     against HTTP header injection.
 *   - Legacy plain-string rows still work for forward compatibility.
 *   - Malformed JSON does not throw.
 */

import {
  SCHEMA_TABLES,
  SCHEMA_INDEXES,
} from "../../../src/main/database/schema";
import DatabaseAdapter from "../../../src/main/database/sqlite";
import { readGithubTokenSetting } from "../../../src/main/settings/settings-readers";

describe("readGithubTokenSetting (issue #108)", () => {
  let rawDb: DatabaseAdapter.Database;

  beforeEach(() => {
    rawDb = new DatabaseAdapter(":memory:");
    rawDb.pragma("journal_mode = WAL");
    rawDb.pragma("foreign_keys = ON");
    rawDb.exec(SCHEMA_TABLES);
    rawDb.exec(SCHEMA_INDEXES);
  });

  afterEach(() => {
    rawDb.close();
  });

  const writeJson = (key: string, value: unknown) => {
    rawDb
      .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
      .run(key, JSON.stringify(value));
  };

  const writeRaw = (key: string, rawValue: string) => {
    rawDb
      .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
      .run(key, rawValue);
  };

  it("returns null when no token has been persisted", () => {
    expect(readGithubTokenSetting(rawDb)).toBeNull();
  });

  it("returns the token when the user has saved a valid PAT", () => {
    writeJson("githubToken", "ghp_ExampleTokenAAAAAAAAAAAAAAAAAAAAAAAA");
    expect(readGithubTokenSetting(rawDb)).toBe(
      "ghp_ExampleTokenAAAAAAAAAAAAAAAAAAAAAAAA",
    );
  });

  it("trims surrounding whitespace before returning the token", () => {
    writeJson("githubToken", "  ghp_Spaces_Trimmed  ");
    expect(readGithubTokenSetting(rawDb)).toBe("ghp_Spaces_Trimmed");
  });

  it("returns null for an empty or whitespace-only token", () => {
    writeJson("githubToken", "");
    expect(readGithubTokenSetting(rawDb)).toBeNull();

    writeJson("githubToken", "   ");
    expect(readGithubTokenSetting(rawDb)).toBeNull();
  });

  it.each([
    ["number", 12345],
    ["boolean", true],
    ["object", { token: "ghp_inside_object" }],
    ["array", ["ghp_inside_array"]],
    ["null", null],
  ])(
    "rejects non-string persisted values: %s",
    (_label, value) => {
      writeJson("githubToken", value);
      expect(readGithubTokenSetting(rawDb)).toBeNull();
    },
  );

  it.each([
    "ghp_with_newline\n",
    "ghp_with_\r\nreturn",
    "ghp_\x00nullbyte",
    "ghp_\x01control",
    "ghp_\x7fdel",
  ])(
    "rejects tokens with control characters: %#",
    (dangerous) => {
      writeJson("githubToken", dangerous);
      // Must be null to prevent header injection via `Authorization: Bearer`.
      expect(readGithubTokenSetting(rawDb)).toBeNull();
    },
  );

  it("tolerates malformed JSON rows without throwing", () => {
    writeRaw("githubToken", "{not-json");
    expect(() => readGithubTokenSetting(rawDb)).not.toThrow();
    // A bare "{not-json" still looks like a printable string — but the
    // current semantics fall back to treating it as a plain string. Assert
    // it returns something non-null in that case (the raw text) so the
    // caller can at least decide what to do; it is NOT equal to null.
    // Implementation detail: we accept the raw value as a last-ditch
    // compatibility option.
    expect(readGithubTokenSetting(rawDb)).toBe("{not-json");
  });

  it("treats a legacy plain-string row as the token for back-compat", () => {
    // Earlier builds wrote string values without JSON.stringify wrapping.
    // We still want those users to work without data migration.
    writeRaw("githubToken", "ghp_LegacyPlainValue");
    expect(readGithubTokenSetting(rawDb)).toBe("ghp_LegacyPlainValue");
  });

  it("is independent from other setting keys", () => {
    writeJson("minimizeOnLaunch", true);
    writeJson("autoSave", false);
    writeJson("githubToken", "ghp_IsolatedLookup");
    expect(readGithubTokenSetting(rawDb)).toBe("ghp_IsolatedLookup");
  });

  it("handles long tokens (fine-grained PATs are ~93 chars)", () => {
    const longToken = "github_pat_" + "A".repeat(82);
    writeJson("githubToken", longToken);
    expect(readGithubTokenSetting(rawDb)).toBe(longToken);
  });
});
