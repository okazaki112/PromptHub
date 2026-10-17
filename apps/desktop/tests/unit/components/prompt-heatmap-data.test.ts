import type { Prompt } from "@prompthub/shared/types";
import { describe, expect, it } from "vitest";
import {
  buildAvailableYearDateKeys,
  buildPromptHeatmapDays,
  buildPromptHeatmapYearWeeks,
  getSelectedPromptsByDate,
  localDateKeyFromIso,
  summarizePromptHeatmapYear,
  summarizeSelectedHeatmapDays,
} from "../../../src/renderer/components/prompt/prompt-heatmap-data";

function heatmapPrompt(
  id: string,
  title: string,
  createdAt: string,
  usageCount = 0,
  updatedAt?: string,
): Prompt {
  return {
    id,
    title,
    userPrompt: id,
    variables: [],
    tags: [],
    isFavorite: false,
    isPinned: false,
    version: 1,
    currentVersion: 1,
    usageCount,
    createdAt,
    updatedAt: updatedAt ?? createdAt,
  } as unknown as Prompt;
}

function todayStart(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return new Date(now.getTime()).toISOString();
}

describe("prompt-heatmap-data", () => {
  it("uses local day for ISO datetime", () => {
    // 12:00 stays on the same calendar day.
    const dateKey = localDateKeyFromIso("2026-05-18T12:00:00.000");
    expect(dateKey).toBe("2026-05-18");
  });

  it("groups created prompts and sums current usage heat", () => {
    const days = buildPromptHeatmapDays([
      heatmapPrompt("p1", "B", "2026-05-18T10:00:00.000", 8, todayStart()),
      heatmapPrompt("p2", "A", "2026-05-18T22:00:00.000", 21, todayStart()),
    ]);
    const day = days.get("2026-05-18");
    expect(day?.createdCount).toBe(2);
    expect(day?.currentUsageHeat).toBe(29);
    expect(day?.topPrompts.map((prompt) => prompt.id)).toEqual(["p2", "p1"]);
  });

  it("counts v2+ version snapshots on their actual event date", () => {
    const prompt = heatmapPrompt("old", "Old", "2024-01-01T12:00:00.000");
    const days = buildPromptHeatmapDays([prompt], [
      { promptId: "old", version: 1, createdAt: "2024-01-01T12:00:00.000" },
      { promptId: "old", version: 2, createdAt: "2026-08-01T08:00:00.000" },
      { promptId: "old", version: 3, createdAt: "2026-08-02T08:00:00.000" },
    ]);
    const edited = days.get("2026-08-01");
    const created = days.get("2024-01-01");
    expect(edited?.createdCount).toBe(0);
    expect(edited?.versionActivityCount).toBe(1);
    expect(edited?.activityCount).toBe(1);
    expect(edited?.heatStrength).toBe(1);
    expect(created?.activityCount).toBe(1);
    expect(created?.versionActivityCount).toBe(0);
  });

  it("keeps version activity scoped to the currently visible prompt set", () => {
    const visible = heatmapPrompt("visible", "Visible", "2026-08-01T12:00:00.000");
    const visibleActivity = {
      promptId: "visible",
      version: 2,
      createdAt: "2026-08-01T18:00:00.000",
    };
    const hiddenActivity = {
      promptId: "hidden",
      version: 9,
      createdAt: "2026-08-01T18:00:00.000",
    };

    expect(
      buildPromptHeatmapDays([visible], [visibleActivity, hiddenActivity]).get(
        "2026-08-01",
      )?.versionActivityCount,
    ).toBe(1);
  });

  it("falls back to updatedAt and skips invalid dates", () => {
    const days = buildPromptHeatmapDays([
      heatmapPrompt("fallback", "F", "invalid", 1, "2026-05-19T12:00:00.000"),
      heatmapPrompt("skip", "S", "invalid"),
    ]);
    expect(days.has("2026-05-19")).toBe(true);
    expect(days.size).toBe(1);
  });

  it("summarizes a year", () => {
    const days = buildPromptHeatmapDays([
      heatmapPrompt("p1", "A", "2026-05-18T12:00:00.000", 7, todayStart()),
      heatmapPrompt("p2", "B", "2025-01-02T12:00:00.000", 12, todayStart()),
    ]);
    const year = summarizePromptHeatmapYear(days, 2026);
    expect(year).toMatchObject({ year: 2026, totalCreated: 1, totalUsageHeat: 7, activeDayCount: 1 });
  });

  it("collects selected prompts sorted by usage desc", () => {
    const days = buildPromptHeatmapDays([
      heatmapPrompt("low", "A", "2026-05-18T12:00:00.000", 2, todayStart()),
      heatmapPrompt("high", "B", "2026-05-20T12:00:00.000", 9, todayStart()),
    ]);
    const selected = getSelectedPromptsByDate(days, new Set(["2026-05-18", "2026-05-20"]));
    expect(selected.map((prompt) => prompt.id)).toEqual(["high", "low"]);
    expect(summarizeSelectedHeatmapDays(days, new Set(["2026-05-23"]) )).toMatchObject({ selectedDayCount: 0 });
  });

  it("builds Monday-start year columns without dropping Dec31", () => {
    const year = 2026;
    const days = buildPromptHeatmapDays([
      heatmapPrompt("first", "First", `${year}-01-01T12:00:00.000`, 1, todayStart()),
      heatmapPrompt("last", "Last", `${year}-12-31T12:00:00.000`, 1, todayStart()),
    ]);
    const weeks = buildPromptHeatmapYearWeeks(year, days, "9999-12-31");
    expect(weeks.length).toBeGreaterThanOrEqual(52);
    expect(weeks[0]?.cells.some((cell) => cell.dateKey === `${year}-01-01`)).toBe(true);
    const lastWeekCells = weeks[weeks.length - 1]?.cells ?? [];
    expect(lastWeekCells.some((cell) => cell.dateKey === `${year}-12-31`)).toBe(true);
    expect(lastWeekCells.some((cell) => cell.inCurrentYear && !cell.day)).toBe(true);
    expect(buildAvailableYearDateKeys(year)).toHaveLength(365);
  });
});
