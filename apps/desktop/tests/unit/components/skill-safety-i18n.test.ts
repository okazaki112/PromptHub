import { describe, expect, it } from "vitest";

import zh from "../../../src/renderer/i18n/locales/zh.json";
import {
  getSkillSafetyFindingTitle,
  getSkillSafetyLevelLabel,
  getSkillSafetySummary,
} from "../../../src/renderer/components/skill/safety-i18n";
import type { SkillSafetyReport } from "@prompthub/shared/types";

type TranslationTree = Record<string, unknown>;

function getPathValue(source: TranslationTree, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    return (current as TranslationTree)[segment];
  }, source);
}

function interpolate(template: string, values: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(values[key] ?? ""));
}

function t(
  key: string,
  defaultValueOrOptions?: string | Record<string, unknown>,
  maybeOptions?: Record<string, unknown>,
): string {
  const options =
    typeof defaultValueOrOptions === "object" && defaultValueOrOptions !== null
      ? defaultValueOrOptions
      : maybeOptions || {};
  const defaultValue =
    typeof defaultValueOrOptions === "string"
      ? defaultValueOrOptions
      : typeof options.defaultValue === "string"
        ? options.defaultValue
        : key;
  const value = getPathValue(zh as TranslationTree, key);
  const template = typeof value === "string" ? value : defaultValue;
  return interpolate(template, options);
}

describe("skill safety i18n", () => {
  it("renders safe summary in chinese instead of backend english", () => {
    const report: SkillSafetyReport = {
      level: "safe",
      summary: "No obvious malicious patterns were detected across 1 scanned files.",
      findings: [],
      recommendedAction: "allow",
      scannedAt: Date.now(),
      checkedFileCount: 1,
      scanMethod: "ai",
    };

    expect(getSkillSafetySummary(t, report)).toBe(
      "未发现明显恶意模式，共检查 1 个文件。",
    );
    expect(getSkillSafetyLevelLabel(t, report.level)).toBe("安全");
  });

  it("localizes finding titles from codes", () => {
    expect(
      getSkillSafetyFindingTitle(t, {
        code: "shell-pipe-exec",
        severity: "high",
        title: "Detected pipe-to-shell execution",
        detail: "x",
      }),
    ).toBe("检测到远程下载后直接管道执行");
  });
});
