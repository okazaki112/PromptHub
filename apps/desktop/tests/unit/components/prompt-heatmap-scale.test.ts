import { describe, expect, it } from "vitest";
import {
  HEAT_CREATED_LEVEL_CLASSES,
  HEAT_USAGE_BAR_CLASSES,
  HEAT_USAGE_LEVEL_CLASSES,
  getCreatedHeatLevel,
  getUsageBarLevel,
  getUsageHeatLevel,
} from "../../../src/renderer/components/prompt/prompt-heatmap-scale";

describe("prompt-heatmap-scale", () => {
  it("maps empty values to level 0", () => {
    expect(getCreatedHeatLevel(0, 10)).toBe(0);
    expect(getUsageHeatLevel(0, 10)).toBe(0);
    expect(getUsageBarLevel(0, 10)).toBe(0);
    expect(getCreatedHeatLevel(5, 0)).toBe(0);
  });

  it("keeps a single value at the top visual level", () => {
    expect(getCreatedHeatLevel(1, 1)).toBe(5);
    expect(getUsageHeatLevel(17, 17)).toBe(5);
    expect(getUsageBarLevel(3, 3)).toBe(4);
  });

  it("is monotonic across non-zero values against the same max", () => {
    const samples = [1, 2, 5, 20, 50];
    const levels = samples.map((value) => getCreatedHeatLevel(value, 50));
    for (let index = 1; index < levels.length; index += 1) {
      expect(levels[index]).toBeGreaterThanOrEqual(levels[index - 1]);
    }
    expect(levels[levels.length - 1]).toBe(5);
  });

  it("exposes complete static class tables", () => {
    expect(HEAT_CREATED_LEVEL_CLASSES).toHaveLength(6);
    expect(HEAT_USAGE_LEVEL_CLASSES).toHaveLength(6);
    expect(HEAT_USAGE_BAR_CLASSES).toHaveLength(5);
    expect(HEAT_USAGE_BAR_CLASSES[1]).toBe("w-1/4");
    expect(HEAT_USAGE_BAR_CLASSES[4]).toBe("w-full");
  });

  it("returns usage bar buckets for a normal year range", () => {
    expect(getUsageBarLevel(1, 10)).toBe(1);
    expect(getUsageBarLevel(10, 10)).toBe(4);
  });
});
