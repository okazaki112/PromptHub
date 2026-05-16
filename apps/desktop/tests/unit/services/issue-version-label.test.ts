import { describe, expect, it } from "vitest";

import {
  extractIssueFormValue,
  getVersionLabelFromIssueBody,
  normalizeVersionLabel,
} from "../../../../../.github/scripts/issue-version-label.js";

describe("issue version label helpers", () => {
  it("extracts the Version field from a GitHub issue form body", () => {
    const body = `### Area
Desktop app

### Platform
macOS Apple Silicon

### Version
0.5.5-beta.3

### What happened?
Something broke.`;

    expect(extractIssueFormValue(body, "Version")).toBe("0.5.5-beta.3");
  });

  it("normalizes the extracted version into a version label", () => {
    expect(normalizeVersionLabel("  `0.5.5-beta.3`  ")).toBe(
      "version: 0.5.5-beta.3",
    );
  });

  it("ignores empty or placeholder Version fields", () => {
    const body = `### Version
_No response_

### What happened?
Something broke.`;

    expect(getVersionLabelFromIssueBody(body)).toBeNull();
    expect(normalizeVersionLabel("   ")).toBeNull();
  });

  it("keeps human-entered web tags and commit references", () => {
    const body = `### Version
web-v0.5.5 main@abc1234

### What happened?
Something broke.`;

    expect(getVersionLabelFromIssueBody(body)).toBe(
      "version: web-v0.5.5 main@abc1234",
    );
  });

  it("supports the feature form Target version heading", () => {
    const body = `### Target version
0.5.6-beta.1

### Problem to solve
Something is missing.`;

    expect(getVersionLabelFromIssueBody(body)).toBe(
      "version: 0.5.6-beta.1",
    );
  });
});
