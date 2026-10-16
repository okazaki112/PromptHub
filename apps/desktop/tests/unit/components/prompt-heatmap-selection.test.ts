import { describe, expect, it } from "vitest";
import {
  chooseHeatmapDate,
  clearHeatmapSelection,
  createEmptyHeatmapSelection,
} from "../../../src/renderer/components/prompt/prompt-heatmap-selection";

const yearDateKeys = ["2026-05-18", "2026-05-19", "2026-05-20", "2026-05-21"];

describe("prompt-heatmap-selection", () => {
  it("normal click replaces selection and deselects a single active date", () => {
    let state = chooseHeatmapDate(createEmptyHeatmapSelection(), "2026-05-19", {}, yearDateKeys);
    expect(state.selectedDateKeys).toEqual(new Set(["2026-05-19"]));

    state = chooseHeatmapDate(state, "2026-05-20", {}, yearDateKeys);
    expect(state.selectedDateKeys).toEqual(new Set(["2026-05-20"]));

    state = chooseHeatmapDate(state, "2026-05-20", {}, yearDateKeys);
    expect(state.selectedDateKeys.size).toBe(0);
    expect(state.anchorDateKey).toBe("2026-05-20");
  });

  it("ctrl/meta toggles dates without dropping the anchor", () => {
    let state = chooseHeatmapDate(createEmptyHeatmapSelection(), "2026-05-18", {}, yearDateKeys);
    state = chooseHeatmapDate(state, "2026-05-21", { ctrlKey: true }, yearDateKeys);
    state = chooseHeatmapDate(state, "2026-05-19", { metaKey: true }, yearDateKeys);
    expect([...state.selectedDateKeys].sort()).toEqual([
      "2026-05-18",
      "2026-05-19",
      "2026-05-21",
    ]);

    state = chooseHeatmapDate(state, "2026-05-19", { ctrlKey: true }, yearDateKeys);
    expect([...state.selectedDateKeys].sort()).toEqual(["2026-05-18", "2026-05-21"]);
    expect(state.anchorDateKey).toBe("2026-05-19");
  });

  it("shift click selects inclusive date range from the anchor", () => {
    const state = chooseHeatmapDate(
      { selectedDateKeys: new Set<string>(["2026-05-19"]), anchorDateKey: "2026-05-18" },
      "2026-05-21",
      { shiftKey: true },
      yearDateKeys,
    );
    expect([...state.selectedDateKeys].sort()).toEqual(yearDateKeys.slice(0, 4));
    expect(state.anchorDateKey).toBe("2026-05-18");
  });

  it("shift click without anchor behaves like a normal single selection", () => {
    const state = chooseHeatmapDate(
      createEmptyHeatmapSelection(),
      "2026-05-20",
      { shiftKey: true },
      yearDateKeys,
    );
    expect(state.selectedDateKeys).toEqual(new Set(["2026-05-20"]));
  });

  it("clear removes selected keys and anchor", () => {
    const cleared = clearHeatmapSelection();
    expect(cleared).toEqual({ selectedDateKeys: new Set<string>(), anchorDateKey: null });
  });
});
