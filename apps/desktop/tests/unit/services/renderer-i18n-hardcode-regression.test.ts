import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const COMPONENTS_DIR = path.resolve(process.cwd(), "src/renderer/components");

const ALLOWED_LINE_PATTERNS = [
  /[\u4E00-\u9FFF].*TODO/i,
  /TODO.*[\u4E00-\u9FFF]/i,
  /FIXME.*[\u4E00-\u9FFF]/i,
];

const DANGEROUS_LINE_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  {
    pattern: /\b(?:title|placeholder)\s*=\s*["'`][^"'`]*[\u4E00-\u9FFF][^"'`]*["'`]/,
    label: "hardcoded attribute text",
  },
  {
    pattern: /\b(?:showToast|confirm|alert)\(\s*["'`][^"'`]*[\u4E00-\u9FFF][^"'`]*["'`]/,
    label: "hardcoded message literal",
  },
  {
    pattern: />\s*[^<{]*[\u4E00-\u9FFF][^<{]*\s*</,
    label: "hardcoded jsx text",
  },
];

function listSourceFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listSourceFiles(fullPath);
    }
    if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      return [fullPath];
    }
    return [];
  });
}

function stripBlockComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, (match) =>
    match.replace(/[^\n]/g, " "),
  );
}

function normalizeLine(line: string): string {
  return line.replace(/\/\/.*$/, "").trim();
}

describe("renderer i18n hardcode regression", () => {
  it("does not add new visible hardcoded chinese ui text in renderer components", () => {
    const offenders: string[] = [];

    for (const filePath of listSourceFiles(COMPONENTS_DIR)) {
      const relativePath = path.relative(process.cwd(), filePath);
      const source = stripBlockComments(fs.readFileSync(filePath, "utf8"));
      const lines = source.split("\n");

      lines.forEach((line, index) => {
        const normalized = normalizeLine(line);
        if (!normalized || !/[\u4E00-\u9FFF]/.test(normalized)) {
          return;
        }
        if (ALLOWED_LINE_PATTERNS.some((pattern) => pattern.test(normalized))) {
          return;
        }

        for (const { pattern, label } of DANGEROUS_LINE_PATTERNS) {
          if (pattern.test(normalized)) {
            offenders.push(
              `${relativePath}:${index + 1} [${label}] ${normalized}`,
            );
            break;
          }
        }
      });
    }

    expect(offenders).toEqual([]);
  });
});
